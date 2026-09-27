import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync, promises as fs } from "node:fs";
import path from "node:path";
import test from "node:test";
import { parse as parseYaml } from "yaml";
import { isGenerated, isNpmBump, prPaths, refresh, workspacesOf } from "../scripts/ci/dependabot-refresh.mjs";
import { plan } from "../scripts/ci/select.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const git = (dir, ...args) => execFileSync("git", ["-C", dir, ...args], { encoding: "utf8" }).trim();
const put = async (dir, file, content) => {
  await fs.mkdir(path.dirname(path.join(dir, file)), { recursive: true });
  await fs.writeFile(path.join(dir, file), content);
};

async function fixture(t) {
  const dir = await scratchDir(t, "dependabot-refresh-");
  git(dir, "init", "-q");
  git(dir, "config", "user.email", "tests@example.com");
  git(dir, "config", "user.name", "Tests");
  await put(dir, ".gitignore", "node_modules/\n.cache/\n");
  await put(dir, "package.json", JSON.stringify({ workspaces: ["apps/demo", "packages/ui"] }));
  await put(dir, "package-lock.json", "old\n");
  await put(dir, "packages/ui/dist/old.bin", Buffer.from([0, 1, 2]));
  await put(dir, "packages/ui/dist/orphan.txt", "old output\n");
  await put(dir, "exports/unchanged.txt", "same\n");
  git(dir, "add", "-A");
  git(dir, "commit", "-qm", "base");
  const base = git(dir, "rev-parse", "HEAD");
  await put(dir, "package-lock.json", "new\n");
  git(dir, "add", "package-lock.json");
  git(dir, "commit", "-qm", "bump");
  return { dir, base, head: git(dir, "rev-parse", "HEAD"), patchFile: path.join(dir, ".cache/dependabot-refresh.patch") };
}

test("only root/workspace npm manifests and lockfiles qualify; Actions-only changes do not", async (t) => {
  const { dir, base, head } = await fixture(t);
  assert.deepEqual(prPaths(dir, base, head), ["package-lock.json"]);
  assert.throws(() => prPaths(dir, base, base), /exact PR head/);
  for (const file of ["package.json", "package-lock.json", "apps/demo/package.json", "packages/ui/package.json"]) {
    assert.equal(isNpmBump([file], workspacesOf(dir)), true, file);
  }
  assert.equal(isNpmBump([".github/workflows/ci.yml"], workspacesOf(dir)), false);
  assert.equal(isNpmBump(["apps/other/package.json"], workspacesOf(dir)), false);
  assert.equal(isGenerated("node_modules/surprise"), false);
  assert.equal(isGenerated(".cache/unexpected"), false);
});

test("no generated drift produces no patch", async (t) => {
  const { dir, patchFile } = await fixture(t);
  const commands = [];
  assert.deepEqual(refresh(dir, { patchFile, run: (args) => commands.push(args.join(" ")) }), { changed: [], patch: false });
  assert.deepEqual(commands, ["run generate", "run check"]);
  assert.equal(existsSync(patchFile), false);
});

test("a binary-safe patch includes modified, new and removed generated files and applies at the PR head", async (t) => {
  const { dir, head, patchFile } = await fixture(t);
  const before = git(dir, "ls-files", "--stage");
  const binary = Buffer.from([0, 255, 24, 0, 127]);
  const result = refresh(dir, { patchFile, run: (args) => {
    if (args[1] !== "generate") return;
    writeFileSync(path.join(dir, "exports/unchanged.txt"), "changed\n");
    writeFileSync(path.join(dir, "packages/ui/dist/old.bin"), binary);
    rmSync(path.join(dir, "packages/ui/dist/orphan.txt"));
    mkdirSync(path.join(dir, "schemas/json"), { recursive: true });
    writeFileSync(path.join(dir, "schemas/json/new.schema.json"), "{}\n");
    writeFileSync(path.join(dir, "exports/new.bin"), binary);
    mkdirSync(path.join(dir, "node_modules/test"), { recursive: true });
    writeFileSync(path.join(dir, "node_modules/test/cache"), "ignored");
    mkdirSync(path.join(dir, ".cache"), { recursive: true });
    writeFileSync(path.join(dir, ".cache/generated"), "ignored");
  } });
  assert.equal(result.patch, true);
  assert.deepEqual(result.changed, ["exports/new.bin", "exports/unchanged.txt", "packages/ui/dist/old.bin", "packages/ui/dist/orphan.txt", "schemas/json/new.schema.json"]);
  assert.equal(git(dir, "ls-files", "--stage"), before, "the checkout index remains untouched");
  const patch = await fs.readFile(patchFile, "utf8");
  assert.doesNotMatch(patch, /node_modules|\.cache/);
  assert.match(patch, /deleted file mode/);
  assert.match(patch, /new file mode/);
  assert.match(patch, /GIT binary patch/);
  const clone = path.join(dir, "clone");
  git(dir, "clone", "-q", dir, clone);
  assert.equal(git(clone, "rev-parse", "HEAD"), head);
  execFileSync("git", ["-C", clone, "apply", "--check", patchFile]);
  execFileSync("git", ["-C", clone, "apply", patchFile]);
  assert.equal(await fs.readFile(path.join(clone, "exports/unchanged.txt"), "utf8"), "changed\n");
  assert.deepEqual(await fs.readFile(path.join(clone, "exports/new.bin")), binary);
  assert.deepEqual(await fs.readFile(path.join(clone, "packages/ui/dist/old.bin")), binary);
  assert.equal(existsSync(path.join(clone, "packages/ui/dist/orphan.txt")), false);
  assert.equal(await fs.readFile(path.join(clone, "schemas/json/new.schema.json"), "utf8"), "{}\n");
});

test("unexpected modifications are refused without a patch", async (t) => {
  const { dir, patchFile } = await fixture(t);
  assert.throws(() => refresh(dir, { patchFile, run: (args) => {
    if (args[1] === "generate") writeFileSync(path.join(dir, "package.json"), "unexpected\n");
  } }), /unexpected paths: package.json/);
  assert.equal(existsSync(patchFile), false);
});

test("generation and check failures never publish a patch", async (t) => {
  for (const failed of ["generate", "check"]) {
    const { dir, patchFile } = await fixture(t);
    assert.throws(() => refresh(dir, { patchFile, run: (args) => {
      if (args[1] === "generate") writeFileSync(path.join(dir, "exports/unchanged.txt"), "changed\n");
      if (args[1] === failed) throw new Error(`${failed} failed`);
    } }), new RegExp(`${failed} failed`));
    assert.equal(existsSync(patchFile), false);
  }
});

test("a dirty checkout is refused before running generation", async (t) => {
  const { dir, patchFile } = await fixture(t);
  await put(dir, "exports/unchanged.txt", "owner edit\n");
  assert.throws(() => refresh(dir, { patchFile, run: () => assert.fail("must not run") }), /not clean/);
});

test("refresh is read-only, runs only for Dependabot PRs and cannot satisfy release-gate", () => {
  const workflow = parseYaml(readFileSync(".github/workflows/ci.yml", "utf8"));
  const job = workflow.jobs["dependabot-refresh"];
  assert.match(job.if, /event_name == 'pull_request'/);
  assert.match(job.if, /user\.login == 'dependabot\[bot\]'/);
  assert.deepEqual(job.permissions, { contents: "read" });
  const checkout = job.steps.find((step) => step.uses?.startsWith("actions/checkout@"));
  assert.equal(checkout.with.ref, "${{ github.event.pull_request.head.sha }}");
  assert.equal(checkout.with["fetch-depth"], 0);
  assert.equal(checkout.with["persist-credentials"], false);
  assert.equal(job.steps.find((step) => step.uses?.startsWith("actions/setup-node@"))?.with["node-version"], 24);
  const install = job.steps.find((step) => step.run?.startsWith("npm ci"));
  assert.equal(install.if, "steps.classify.outputs.eligible == 'true'");
  assert.match(job.steps.find((step) => step.id === "refresh").run, /dependabot-refresh\.mjs --base/);
  const upload = job.steps.find((step) => step.uses?.startsWith("actions/upload-artifact@"));
  assert.equal(upload.if, "steps.refresh.outputs.patch == 'true'");
  assert.equal(upload.with.name, "dependabot-generated-patch");
  assert.equal(upload.with.path, ".cache/dependabot-refresh.patch");
  assert.equal(upload.with["if-no-files-found"], "error");
  assert.ok(!workflow.jobs["release-gate"].needs.includes("dependabot-refresh"));
  assert.ok(workflow.jobs["release-gate"].needs.includes("checks"));
});

test("npm control changes still select the full compatibility suite", () => {
  const registry = JSON.parse(readFileSync("scripts/ci/proofs.json", "utf8"));
  for (const file of ["package.json", "package-lock.json", "apps/demo/package.json", "packages/ui/package.json"]) {
    const result = plan({ registry, event: "pull_request", paths: [file], specExists: () => true, importers: {} });
    assert.equal(result.floor, true, file);
    assert.equal(result.browser, "all", file);
    for (const check of ["sources", "unit", "unit-install", "unit-install-windows", "build", "smoke", "consumers"]) assert.ok(result.proofs.includes(check), `${file}: ${check}`);
  }
});