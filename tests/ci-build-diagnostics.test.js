import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { parse } from "yaml";
import { scratchDirSync } from "./helpers/scratch.mjs";

const workflow = parse(readFileSync(".github/workflows/ci.yml", "utf8"));
const build = workflow.jobs.build;
const rootExpression = "${{ runner.temp }}/theme-build-npm-diagnostics";
const installCommand = "npm ci --prefer-offline --no-audit --no-fund";
const posixOnly = { skip: process.platform === "win32" ? "POSIX CI shell fixture; never invoke the Windows bash/WSL alias" : false };
const factsStep = () => {
  const step = build.steps.find((step) => step.run?.includes("facts.txt"));
  assert.ok(step, "the build job collects pre-install facts");
  return step;
};

// Execute the workflow's actual shell, using the same bash error flags as
// Actions. Only node/npm are fake; no package installation or build happens.
function fixture(t, options = {}) {
  const scratch = scratchDirSync(t, "j3w1-build-diagnostics-");
  const bin = path.join(scratch, "bin");
  const temp = path.join(scratch, "runner-temp");
  const trace = path.join(scratch, "commands.jsonl");
  const diagnostics = path.join(temp, "theme-build-npm-diagnostics");
  mkdirSync(bin);
  mkdirSync(temp);
  writeFileSync(trace, "");
  const fake = `#!${process.execPath}
    const fs = require('node:fs'), path = require('node:path');
    const command = path.basename(process.argv[1]), args = process.argv.slice(2);
    const logs = process.env.npm_config_logs_dir || path.join(process.env.RUNNER_TEMP, 'default-npm-logs');
    fs.appendFileSync(process.env.TRACE, JSON.stringify({ command, args, logsDir: process.env.npm_config_logs_dir ?? null }) + '\\n');
    if (command === 'npm') {
      // Simulate bounded npm log rotation on every invocation. A later npm
      // command would erase the install log if its directory were shared.
      try {
        fs.mkdirSync(logs, { recursive: true });
        for (const file of fs.readdirSync(logs)) fs.unlinkSync(path.join(logs, file));
        fs.writeFileSync(path.join(logs, 'debug.log'), 'emitted npm ' + args.join(' ') + '\\n');
      } catch { /* A missing log destination does not replace npm's exit. */ }
    }
    const key = command + ' ' + args.join(' ');
    if (JSON.parse(process.env.FAIL_QUERIES).includes(key)) {
      console.log('partial query output');
      console.error('query error');
      process.exit(19);
    }
    if (args[0] === '--version') console.log(command === 'node' ? 'v24.fixture' : '11.fixture');
    else if (command === 'npm' && args[0] === 'config' && args[1] === 'get') {
      const values = { omit: 'dev', include: 'optional', os: '', cpu: 'null', libc: 'null' };
      if (!Object.hasOwn(values, args[2]) || args.length !== 3) process.exit(96);
      console.log(values[args[2]]);
    } else if (command === 'node' && args[0] === '-e' && args.length === 2) {
      require('node:vm').runInNewContext(args[1], {
        process: { version: 'v24.runtime', platform: 'linux', arch: 'arm64', report: {
          getReport: () => ({ header: process.env.NO_GLIBC === '1' ? {} : { glibcVersionRuntime: '2.fixture' }, forbiddenFullReport: 'must not be recorded' })
        } }, console
      });
    } else if (command === 'npm' && args[0] === 'ci') process.exit(Number(process.env.INSTALL_EXIT));
    else if (command === 'npm' && args.join(' ') === 'run build') process.exit(Number(process.env.BUILD_EXIT));
    else process.exit(97);
  `;
  for (const command of ["node", "npm"]) writeFileSync(path.join(bin, command), fake, { mode: 0o755 });
  if (options.unavailable === "directory") writeFileSync(diagnostics, "blocked");
  if (options.unavailable === "file") {
    mkdirSync(diagnostics);
    mkdirSync(path.join(diagnostics, "facts.txt"));
  }
  const env = {
    ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}`, RUNNER_TEMP: temp, TRACE: trace,
    FAIL_QUERIES: JSON.stringify(options.failQueries ?? []), NO_GLIBC: options.noGlibc ? "1" : "0",
    INSTALL_EXIT: String(options.installExit ?? 0), BUILD_EXIT: String(options.buildExit ?? 0),
  };
  // Inherited npm settings must not accidentally supply a test log directory.
  delete env.npm_config_logs_dir;
  const run = (step) => {
    const stepEnv = Object.fromEntries(Object.entries(step.env ?? {}).map(([key, value]) => [key, value.replaceAll("${{ runner.temp }}", temp)]));
    const result = spawnSync("bash", ["-e", "-c", step.run], {
      cwd: scratch, env: { ...env, ...stepEnv }, encoding: "utf8", timeout: 10_000,
    });
    assert.ifError(result.error);
    return result;
  };
  const calls = () => readFileSync(trace, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  const facts = () => readFileSync(path.join(diagnostics, "facts.txt"), "utf8");
  const installLog = () => readFileSync(path.join(diagnostics, "install/debug.log"), "utf8");
  return { run, calls, facts, installLog, diagnostics };
}

test("only the existing build install gets isolated logs; commands, order, gates and artifact policy stay intact", () => {
  const facts = factsStep();
  assert.equal(build.needs, "select");
  assert.equal(build.if, "needs.select.outputs.build == 'true'");
  assert.equal(build["runs-on"], "ubuntu-latest");
  assert.equal(build["timeout-minutes"], 15);
  assert.equal(build["continue-on-error"], undefined);
  assert.equal(build.env, undefined);
  assert.equal(workflow.env.npm_config_logs_dir, undefined);
  assert.equal(facts["continue-on-error"], true);
  assert.equal(facts["timeout-minutes"], 1, "a hung query cannot consume the whole job deadline");
  assert.equal(facts.if, undefined, "facts use normal step ordering");
  const unchanged = structuredClone(build.steps.filter((step) => step !== facts));
  const install = unchanged.find((step) => step.run === installCommand);
  assert.ok(install);
  assert.deepEqual(install.env, { npm_config_logs_dir: `${rootExpression}/install` });
  delete install.env;
  const upload = unchanged.find((step) => step.with?.name === "build-results");
  assert.equal(upload.with.path, `test-results/\nplaywright-report/\n${rootExpression}\n`);
  upload.with.path = "test-results/\nplaywright-report/\n";
  assert.deepEqual(unchanged, [
    { uses: "actions/checkout@v7", with: { "fetch-depth": 0 } },
    { uses: "actions/setup-node@v7", with: { "node-version": 24, cache: "npm" } },
    { run: installCommand },
    { name: "Build the site under /theme/", run: "npm run build", env: { GITHUB_SHA: "${{ github.sha }}" } },
    { name: "Base paths, consistency and private-material gates on dist/", run: "npm run test:dist" },
    { uses: "actions/upload-artifact@v7", with: { name: "site-dist", path: "dist", "retention-days": 7, "include-hidden-files": true } },
    { uses: "./.github/actions/playwright", if: "needs.select.outputs.smoke == 'true'", with: { browsers: "chromium" } },
    { name: "The built site loads, renders from the tokens and takes a keyboard", if: "needs.select.outputs.smoke == 'true'", run: "npm run test:smoke", env: { CI: "1" } },
    { uses: "actions/upload-artifact@v7", if: "failure()", with: { name: "build-results", path: "test-results/\nplaywright-report/\n", "if-no-files-found": "ignore" } },
  ]);
  assert.equal(build.steps.indexOf(facts), 2, "after setup-node and before install");
  assert.ok(Object.keys(workflow.env ?? {}).every((key) => !/^npm_config_/i.test(key)));
  for (const [job, value] of Object.entries(workflow.jobs)) {
    assert.ok(Object.keys(value.env ?? {}).every((key) => !/^npm_config_/i.test(key)), `${job}: no inherited npm overrides`);
    for (const step of value.steps ?? []) {
      if (job === "build" && step.run === installCommand) continue;
      assert.equal(step.env?.npm_config_logs_dir, undefined, `${job}: later npm commands use their default log directory`);
    }
  }
});

test("facts are labelled and allowlisted, with automatic overrides separate from observed runtime", posixOnly, (t) => {
  const f = fixture(t);
  const result = f.run(factsStep());
  assert.equal(result.status, 0, result.stderr);
  const lines = f.facts().trimEnd().split("\n");
  assert.deepEqual(lines.slice(0, 7), [
    "node --version: v24.fixture", "npm --version: 11.fixture", "npm config get omit: dev", "npm config get include: optional",
    "npm config get os: ", "npm config get cpu: null", "npm config get libc: null",
  ]);
  assert.equal(lines.length, 8);
  assert.ok(lines[7].startsWith("runtime: "));
  assert.deepEqual(JSON.parse(lines[7].slice("runtime: ".length)), {
    version: "v24.runtime", platform: "linux", arch: "arm64", glibcVersionRuntime: "2.fixture",
  });
  assert.deepEqual(f.calls().map(({ command, args }) => [command, ...args.slice(0, args[0] === "-e" ? 1 : undefined)]), [
    ["node", "--version"], ["npm", "--version"], ...["omit", "include", "os", "cpu", "libc"].map((key) => ["npm", "config", "get", key]), ["node", "-e"],
  ]);
  assert.ok(f.calls().every((call) => call.logsDir === null));
});

test("failed queries become unknown without recording partial output; absent glibc stays null", posixOnly, (t) => {
  const f = fixture(t, { failQueries: ["node --version", "npm config get os"], noGlibc: true });
  assert.equal(f.run(factsStep()).status, 0);
  assert.match(f.facts(), /^node --version: unknown\n/m);
  assert.match(f.facts(), /^npm config get os: unknown\n/m);
  assert.doesNotMatch(f.facts(), /partial query output|query error|must not be recorded/);
  const runtime = f.facts().trimEnd().split("\n").at(-1);
  assert.equal(JSON.parse(runtime.slice("runtime: ".length)).glibcVersionRuntime, null);
  const runtimeCommand = f.calls().find((call) => call.command === "node" && call.args[0] === "-e");
  const failed = fixture(t, { failQueries: ["node " + runtimeCommand.args.join(" ")] });
  assert.equal(failed.run(factsStep()).status, 0);
  assert.match(failed.facts(), /^runtime: unknown$/m);
});

// Model Actions' default success predicate and continue-on-error on these
// three actual run steps. Inspect each raw shell exit as well as job outcome.
function execute(f) {
  const results = [];
  for (const step of [factsStep(), build.steps.find((step) => step.run === installCommand), build.steps.find((step) => step.run === "npm run build")]) {
    const result = f.run(step);
    results.push(result);
    if (result.status !== 0 && step["continue-on-error"] !== true) return { results, status: result.status };
  }
  return { results, status: 0 };
}

test("unavailable diagnostic directory or facts file never gates the normal install/build", posixOnly, (t) => {
  for (const unavailable of ["directory", "file"]) {
    const f = fixture(t, { unavailable });
    const { results, status } = execute(f);
    assert.notEqual(results[0].status, 0, "the actual diagnostic shell failed");
    assert.equal(status, 0, "continue-on-error keeps collection non-gating");
    assert.deepEqual(results.slice(1).map((r) => r.status), [0, 0]);
    assert.deepEqual(f.calls().filter((call) => ["ci", "run"].includes(call.args[0])).map((call) => call.args), [installCommand.split(" ").slice(1), ["run", "build"]]);
  }
});

test("install failure preserves its original exit and diagnostics and skips build", posixOnly, (t) => {
  const f = fixture(t, { installExit: 37 });
  const { results, status } = execute(f);
  assert.equal(status, 37);
  assert.deepEqual(results.map((r) => r.status), [0, 37]);
  assert.equal(f.installLog(), "emitted npm ci --prefer-offline --no-audit --no-fund\n");
  assert.match(f.facts(), /^runtime: /m);
  assert.equal(f.calls().filter((call) => call.args[0] === "ci").length, 1);
  assert.ok(!f.calls().some((call) => call.args[0] === "run"));
  assert.equal(f.calls().at(-1).logsDir, path.join(f.diagnostics, "install"));
});

test("build failure keeps its exit, successful install logs and facts despite later npm rotation", posixOnly, (t) => {
  const f = fixture(t, { buildExit: 43 });
  const { results, status } = execute(f);
  assert.equal(status, 43);
  assert.deepEqual(results.map((r) => r.status), [0, 0, 43]);
  assert.equal(f.installLog(), "emitted npm ci --prefer-offline --no-audit --no-fund\n");
  assert.match(f.facts(), /^runtime: /m);
  assert.equal(f.calls().at(-1).logsDir, null);
  assert.equal(f.calls().filter((call) => call.args[0] === "ci").length, 1);
  assert.ok(existsSync(path.join(f.diagnostics, "../default-npm-logs/debug.log")));
});
