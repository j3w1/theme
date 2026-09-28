/* The Android installer, ports/obsidian/install-android.sh, run for real
   against scratch vaults. A stub curl serves fixture files (the committed
   dist artifacts unless a case changes them), so nothing reaches the
   network; a stub mv fails or interrupts on request. Every case runs under
   `sh` (dash on Ubuntu, bash elsewhere), and again under dash and busybox
   when they are installed. No Android device, Termux or storage permission
   is exercised here: this proves the shell contract, not an Android import. */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { readText, repoRoot } from "../scripts/lib/fs.mjs";
import { scratchDir } from "./helpers/scratch.mjs";

const SCRIPT = path.join(repoRoot, "ports/obsidian/install-android.sh");
const BASE = "https://j3w1.github.io/theme/ports/obsidian/";
const NAMES = ["manifest.json", "theme.css"];
// The external commands the script may use; ANDROID.md lists the same set.
const TOOLS = ["mktemp", "cp", "mv", "rm", "mkdir", "rmdir", "chmod"];
const DIST = Object.fromEntries(await Promise.all(NAMES.map(async (name) => [name, await fs.readFile(path.join(repoRoot, "ports/obsidian/dist", name))])));
const VERSION = JSON.parse(DIST["manifest.json"]).version;
const OLD = { "manifest.json": Buffer.from('{"name":"j3w1","version":"0.0.1","minAppVersion":"1.13.4"}\n'), "theme.css": Buffer.from("/* j3w1 theme 0.0.1, default profile, for Obsidian.\n */\n") };

const which = (name) => {
  for (const dir of (process.env.PATH ?? "").split(path.delimiter)) {
    const candidate = path.join(dir, name);
    try { accessSync(candidate, constants.X_OK); return candidate; } catch { /* next */ }
  }
  return null;
};
const REAL = Object.fromEntries(["jq", ...TOOLS].map((name) => [name, which(name)]));
const SHELLS = [
  { label: "sh", command: which("sh"), args: [] },
  { label: "dash", command: which("dash"), args: [] },
  { label: "busybox sh", command: which("busybox"), args: ["sh"] },
];
/* The failure cases need the shell to run the stub mv and rm on PATH. BusyBox
   ash runs its own applets instead, so there those cases cannot inject a
   fault; they are skipped with that reason rather than passed. */
const STUB_FREE = "this shell runs its own mv/rm applets, so PATH fault stubs cannot reach it";
const interposes = async (shell) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "j3w1-probe-"));
  try {
    await fs.writeFile(path.join(dir, "mv"), "#!/bin/sh\nexit 7\n", { mode: 0o755 });
    return spawnSync(shell.command, [...shell.args, "-c", "mv a b"], { cwd: dir, env: { PATH: dir } }).status === 7;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
};
for (const shell of SHELLS) shell.interposes = shell.command ? await interposes(shell) : false;

const CURL = `#!/bin/sh
printf '%s\\n' "$*" >>"$STUB_LOG"
out='' url=''
while [ "$#" -gt 0 ]; do
  case $1 in -o) out=$2; shift 2 ;; *) url=$1; shift ;; esac
done
name=\${url##*/}
case " $STUB_FAIL " in *" $name "*) exit 22 ;; esac
[ -f "$STUB_SERVED/$name" ] || exit 22
exec "$REAL_CP" "$STUB_SERVED/$name" "$out"
`;
const MV = `#!/bin/sh
[ "$1" = "--" ] && shift
src=$1 dst=$2
case ",$STUB_MV_FAIL," in *,aside,*) case $dst in */.j3w1-backup-*/j3w1) exit 1 ;; esac ;; esac
# Another app acts during the swap: j3w1 reappears, or the themes folder becomes a link.
case ",$STUB_MV_FAIL," in *,reappear,*) case $dst in */.j3w1-backup-*/j3w1) "$REAL_MV" -- "$src" "$dst" && mkdir -- "$src"; exit ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,relink,*) case $dst in */.j3w1-backup-*/j3w1)
  themes=\${src%/j3w1}
  "$REAL_MV" -- "$src" "$dst" && "$REAL_MV" -- "$themes" "$themes.moved" && exec "$REAL_LN" -s "$themes.moved" "$themes" ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,replace,*) case $dst in */.j3w1-backup-*/j3w1)
  themes=\${src%/j3w1}
  "$REAL_MV" -- "$src" "$dst" && "$REAL_MV" -- "$themes" "$themes.moved" && exec mkdir -- "$themes" ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,term-after,*) case \${src##*/} in .j3w1-install-*) "$REAL_MV" -- "$src" "$dst" && kill -s TERM "$PPID"; exit 0 ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,term-before-aside,*) case $dst in */.j3w1-backup-*/j3w1) kill -s TERM "$PPID"; exit 1 ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,late-swap,*) case \${src##*/} in .j3w1-install-*)
  themes=\${src%/*}
  "$REAL_MV" -- "$themes" "$themes.moved" && mkdir -- "$themes"; exit 1 ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,compete,*) case \${src##*/} in .j3w1-install-*) mkdir -- "$dst" && : >"$dst/keep.txt" ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,recreate,*) case \${src##*/} in .j3w1-install-*) mkdir -- "$dst" ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,staging,*) case \${src##*/} in .j3w1-install-*) exit 1 ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,term,*) case \${src##*/} in .j3w1-install-*) kill -s TERM "$PPID"; exit 1 ;; esac ;; esac
case ",$STUB_MV_FAIL," in *,restore,*) case $src in */.j3w1-backup-*/j3w1) exit 1 ;; esac ;; esac
exec "$REAL_MV" -- "$src" "$dst"
`;
const RM = `#!/bin/sh
for arg; do case $arg in */.j3w1-backup-*) exit 1 ;; esac; done
exec "$REAL_RM" "$@"
`;

const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const snapshot = async (dir) => {
  const out = {};
  const walk = async (rel) => {
    for (const entry of await fs.readdir(path.join(dir, rel), { withFileTypes: true })) {
      const name = rel ? `${rel}/${entry.name}` : entry.name, full = path.join(dir, name);
      if (entry.isSymbolicLink()) out[name] = `link:${await fs.readlink(full)}`;
      else if (entry.isDirectory()) { out[name] = "dir"; await walk(name); }
      else out[name] = sha(await fs.readFile(full));
    }
  };
  await walk("");
  return out;
};
const outside = (tree) => Object.fromEntries(Object.entries(tree).filter(([name]) => !name.startsWith(".obsidian/themes/j3w1") && name !== ".obsidian/themes"));
const pair = async (dir) => Object.fromEntries(await Promise.all(NAMES.map(async (name) => [name, await fs.readFile(path.join(dir, name))])));

/* A vault with notes, a plugin, settings and (optionally) another theme and
   an installed pair; its name has a space so every path must be quoted. */
const setup = async (t, shell, { served = DIST, themes = true, installed = OLD, fail = "", mvFail = "", rmFail = false, tools = [...TOOLS, "jq"] } = {}) => {
  const root = await scratchDir(t, "j3w1-android-");
  const bin = path.join(root, "bin"), web = path.join(root, "web"), tmp = path.join(root, "tmp"), vault = path.join(root, "My Vault");
  for (const dir of [bin, web, tmp, path.join(vault, ".obsidian/plugins/sample")]) await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(vault, "Note.md"), "# A note\n");
  await fs.writeFile(path.join(vault, ".obsidian/appearance.json"), '{"cssTheme":"j3w1"}\n');
  await fs.writeFile(path.join(vault, ".obsidian/plugins/sample/data.json"), "{}\n");
  if (themes) {
    await fs.mkdir(path.join(vault, ".obsidian/themes/Other"), { recursive: true });
    await fs.writeFile(path.join(vault, ".obsidian/themes/Other/theme.css"), "/* another theme */\n");
  }
  if (themes && installed) {
    await fs.mkdir(path.join(vault, ".obsidian/themes/j3w1"));
    for (const [name, bytes] of Object.entries(installed)) await fs.writeFile(path.join(vault, ".obsidian/themes/j3w1", name), bytes);
  }
  for (const [name, bytes] of Object.entries(served)) await fs.writeFile(path.join(web, name), bytes);
  await fs.writeFile(path.join(bin, "curl"), CURL, { mode: 0o755 });
  if (mvFail) await fs.writeFile(path.join(bin, "mv"), MV, { mode: 0o755 });
  if (rmFail) await fs.writeFile(path.join(bin, "rm"), RM, { mode: 0o755 });
  // PATH holds only the declared tools, so every case also proves the script needs nothing else.
  for (const name of tools) if (!(mvFail && name === "mv") && !(rmFail && name === "rm")) await fs.symlink(REAL[name], path.join(bin, name));
  const env = {
    PATH: bin, HOME: root, TMPDIR: tmp, LC_ALL: "C",
    STUB_LOG: path.join(root, "curl.log"), STUB_SERVED: web, STUB_FAIL: fail, STUB_MV_FAIL: mvFail, REAL_CP: REAL.cp, REAL_MV: REAL.mv, REAL_RM: REAL.rm, REAL_LN: which("ln"),
  };
  const run = (args = ["--vault", vault], cwd = root) => {
    const result = spawnSync(shell.command, [...shell.args, SCRIPT, ...args], { cwd, env, encoding: "utf8" });
    return { ...result, log: () => fs.readFile(env.STUB_LOG, "utf8").catch(() => "") };
  };
  return { root, vault, tmp, run, theme: path.join(vault, ".obsidian/themes/j3w1"), themes: path.join(vault, ".obsidian/themes") };
};
const leftovers = async (v) => {
  const themed = await fs.readdir(v.themes).catch(() => []);
  assert.deepEqual(themed.filter((name) => name.startsWith(".j3w1-")), [], "no staging or backup folder remains");
  assert.deepEqual(await fs.readdir(v.tmp), [], "the download folder is removed");
};
const refused = async (v, pattern, args) => {
  const before = await snapshot(v.vault);
  const result = v.run(args);
  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, pattern);
  assert.deepEqual(await snapshot(v.vault), before, "a refusal leaves the vault byte-identical");
  await leftovers(v);
  return result;
};

test("the installer requires sh, and sh and dash run PATH stubs so no failure case is skipped there", () => {
  assert.ok(SHELLS[0].command, "sh is on PATH");
  for (const shell of SHELLS.slice(0, 2)) if (shell.command) assert.ok(shell.interposes, `${shell.label} honours PATH stubs`);
});

for (const shell of SHELLS) {
  test(`${shell.label}: installs, updates and refuses without touching anything else`, async (t) => {
    if (!shell.command) return t.skip(`${shell.label} is not installed`);
    for (const tool of ["jq", ...TOOLS]) assert.ok(REAL[tool], `${tool} is on PATH`);

    await t.test("a fresh install creates themes/j3w1 with exactly the served pair", async (t) => {
      const v = await setup(t, shell, { themes: false });
      const before = await snapshot(v.vault);
      const result = v.run();
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout, `Installed j3w1 ${VERSION} at ${await fs.realpath(v.theme)}. Restart Obsidian and choose the Dark base scheme.\n`);
      assert.deepEqual(await pair(v.theme), DIST);
      assert.deepEqual((await fs.readdir(v.theme)).sort(), NAMES);
      assert.deepEqual(outside(await snapshot(v.vault)), outside(before));
      await leftovers(v);
      const log = await result.log();
      for (const name of NAMES) assert.ok(log.includes(`--proto =https --proto-redir =https --tlsv1.2 -o `) && log.includes(` ${BASE}${name}\n`), log);
    });

    await t.test("an update replaces the old pair and nothing outside themes/j3w1 changes", async (t) => {
      const v = await setup(t, shell);
      const before = await snapshot(v.vault);
      const result = v.run(["--vault", "My Vault"]);
      assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(await pair(v.theme), DIST);
      assert.deepEqual(outside(await snapshot(v.vault)), outside(before));
      assert.equal(await fs.readFile(path.join(v.themes, "Other/theme.css"), "utf8"), "/* another theme */\n");
      await leftovers(v);
    });

    await t.test("an empty j3w1 folder is replaced by the pair", async (t) => {
      const v = await setup(t, shell, { installed: {} });
      assert.equal(v.run().status, 0);
      assert.deepEqual(await pair(v.theme), DIST);
      await leftovers(v);
    });

    await t.test("a missing jq is refused before anything is downloaded", async (t) => {
      const v = await setup(t, shell, { tools: TOOLS });
      const result = await refused(v, /jq is required but was not found\. In Termux run: pkg install curl jq/);
      assert.equal(await result.log(), "");
    });

    await t.test("usage errors change nothing", async (t) => {
      const v = await setup(t, shell);
      const help = v.run(["--help"]);
      assert.equal(help.status, 0);
      assert.match(help.stdout, /^Usage: sh install-android\.sh --vault PATH$/m);
      await refused(v, /Missing --vault PATH/, []);
      await refused(v, /Unknown argument: --force/, ["--vault", v.vault, "--force"]);
      const last = await refused(v, /The --vault option needs a path/, ["--vault"]);
      assert.equal(await last.log(), "", "nothing was downloaded");
    });

    await t.test("a vault that is missing or has no .obsidian folder is refused", async (t) => {
      const v = await setup(t, shell);
      await refused(v, /Vault folder not found or not readable: .*app storage; see ANDROID\.md/, ["--vault", path.join(v.root, "Absent")]);
      await fs.rm(path.join(v.vault, ".obsidian"), { recursive: true });
      await refused(v, /Not an existing Obsidian vault configuration/);
      await fs.writeFile(path.join(v.vault, ".obsidian"), "not a folder\n");
      await refused(v, /Not an existing Obsidian vault configuration/);
    });

    await t.test("an invalid download is refused before the vault changes", async (t) => {
      const manifest = (value) => ({ ...DIST, "manifest.json": Buffer.from(typeof value === "string" ? value : JSON.stringify(value)) });
      const good = JSON.parse(DIST["manifest.json"]);
      for (const served of [
        manifest({ ...good, name: "other" }), manifest({ ...good, version: "3.1" }), manifest({ ...good, minAppVersion: undefined }),
        manifest({ ...good, version: 3 }), manifest("{"), manifest(`${DIST["manifest.json"]}${DIST["manifest.json"]}`),
      ]) {
        const v = await setup(t, shell, { served });
        await refused(v, /Downloaded manifest has an unexpected name or invalid version\/minAppVersion\./);
      }
      const header = await setup(t, shell, { served: { ...DIST, "theme.css": Buffer.from(String(DIST["theme.css"]).replace(VERSION, "9.9.9")) } });
      await refused(header, /Downloaded CSS header does not match the manifest version\./);
      const empty = await setup(t, shell, { served: { ...DIST, "theme.css": Buffer.alloc(0) } });
      await refused(empty, /Downloaded CSS is empty\./);
      for (const fail of NAMES) {
        const v = await setup(t, shell, { fail, themes: false });
        await refused(v, new RegExp(`Download failed: ${BASE.replaceAll(".", "\\.")}${fail.replace(".", "\\.")}`));
        assert.equal(await fs.stat(v.themes).catch(() => null), null, "no themes folder is created");
      }
    });

    await t.test("an unexpected existing theme folder is refused, not merged", async (t) => {
      const one = await setup(t, shell, { installed: { "manifest.json": OLD["manifest.json"] } });
      await refused(one, /Existing theme has only one of the two files; repair it before updating\./);
      const extra = await setup(t, shell, { installed: { ...OLD, "snippet.css": Buffer.from("/* mine */\n") } });
      await refused(extra, /unexpected entry; move it out of .* first: snippet\.css/);
      const hidden = await setup(t, shell, { installed: { ...OLD, ".keep": Buffer.from("") } });
      await refused(hidden, /unexpected entry; .*: \.keep/);
      const nested = await setup(t, shell, { installed: {} });
      await fs.mkdir(path.join(nested.theme, "theme.css"));
      await fs.writeFile(path.join(nested.theme, "manifest.json"), OLD["manifest.json"]);
      await refused(nested, /Theme artifact is not a file: .*theme\.css/);
      const file = await setup(t, shell, { installed: null });
      await fs.writeFile(file.theme, "not a folder\n");
      await refused(file, /Theme path is not a directory/);
      const link = await setup(t, shell, { installed: null });
      const elsewhere = path.join(link.root, "elsewhere");
      await fs.mkdir(elsewhere);
      for (const [name, bytes] of Object.entries(OLD)) await fs.writeFile(path.join(elsewhere, name), bytes);
      await fs.symlink(elsewhere, link.theme);
      await refused(link, /Theme path is a symbolic link/);
      assert.deepEqual(await pair(elsewhere), OLD, "a symlink target is never written");
      const themes = await setup(t, shell, { themes: false });
      await fs.symlink(elsewhere, themes.themes);
      await refused(themes, /Themes path is a symbolic link/);
    });

    await t.test("a failed swap restores the previous pair", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "staging" });
      await refused(v, /Replacement failed; previous theme pair restored\./);
      assert.deepEqual(await pair(v.theme), OLD);
      const aside = await setup(t, shell, { mvFail: "aside" });
      await refused(aside, /Could not move the existing theme aside; nothing was replaced\./);
      const fresh = await setup(t, shell, { themes: false, mvFail: "staging" });
      await refused(fresh, /Installation failed; no theme was installed\./);
    });

    await t.test("a failed restore keeps both copies and names them", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "staging,restore" });
      const result = v.run();
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Replacement failed and restoration failed\./);
      assert.match(result.stderr, /Keep recovery copies at these paths until you have checked them:/);
      const previous = result.stderr.match(/^j3w1: previous theme: (.*)$/m)?.[1], next = result.stderr.match(/^j3w1: new pair: (.*)$/m)?.[1];
      assert.ok(previous && next, result.stderr);
      assert.deepEqual(await pair(previous), OLD);
      assert.deepEqual(await pair(next), DIST);
      assert.equal(await fs.stat(v.theme).catch(() => null), null);
      assert.deepEqual(await fs.readdir(v.tmp), [], "the download folder is still removed");
    });

    const recovery = (stderr) => ({ previous: stderr.match(/^j3w1: previous theme: (.*)$/m)?.[1], next: stderr.match(/^j3w1: new pair: (.*)$/m)?.[1] });

    await t.test("a j3w1 folder created during the swap is never mistaken for success", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "recreate" });
      const result = v.run();
      assert.notEqual(result.status, 0, result.stdout);
      assert.doesNotMatch(result.stdout, /Installed/);
      assert.match(result.stderr, /The theme folder changed during replacement; nothing was deleted\./);
      assert.match(result.stderr, /Keep recovery copies at these paths until you have checked them:/);
      const { previous, next } = recovery(result.stderr);
      assert.ok(previous && next, result.stderr);
      assert.deepEqual(await pair(previous), OLD, "the previous pair survives");
      assert.deepEqual(await pair(next), DIST);
      assert.equal(path.dirname(next), await fs.realpath(v.theme), "the new pair is reported where mv nested it");
      assert.deepEqual(await fs.readdir(v.tmp), []);

      const fresh = await setup(t, shell, { themes: false, mvFail: "recreate" });
      const second = fresh.run();
      assert.notEqual(second.status, 0);
      assert.match(second.stderr, /The theme folder changed during replacement; nothing was deleted\. The new pair was not installed\./);
      assert.deepEqual(await pair(recovery(second.stderr).next), DIST);

      const back = await setup(t, shell, { mvFail: "reappear" });
      const third = back.run();
      assert.notEqual(third.status, 0);
      assert.match(third.stderr, /The theme folder changed during replacement; nothing was deleted\./);
      assert.deepEqual(await pair(recovery(third.stderr).previous), OLD);
      assert.deepEqual(await pair(recovery(third.stderr).next), DIST);
    });

    await t.test("a themes folder that becomes a link mid-install stops the swap and removes nothing", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "relink" });
      const result = v.run();
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /The vault folders changed during installation; stopping\. Nothing was deleted\./);
      const moved = `${v.themes}.moved`;
      const names = await fs.readdir(moved);
      const backup = names.find((name) => name.startsWith(".j3w1-backup-")), staged = names.find((name) => name.startsWith(".j3w1-install-"));
      assert.ok(backup && staged, names.join());
      assert.deepEqual(await pair(path.join(moved, backup, "j3w1")), OLD);
      assert.deepEqual(await pair(path.join(moved, staged)), DIST);
    });

    await t.test("a themes folder replaced by another real folder mid-install is noticed and no false path is named", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "replace" });
      const result = v.run();
      assert.notEqual(result.status, 0);
      assert.doesNotMatch(result.stdout, /Installed/);
      assert.match(result.stderr, /The vault folders changed during installation; stopping\. Nothing was deleted\./);
      assert.match(result.stderr, /The previous theme is no longer where the helper left it; the themes folder may have been moved or replaced\./);
      assert.doesNotMatch(result.stderr, /previous theme: |Keep recovery copies at /, "no path that no longer exists is offered");
      const moved = `${v.themes}.moved`, names = await fs.readdir(moved);
      const backup = names.find((name) => name.startsWith(".j3w1-backup-")), staged = names.find((name) => name.startsWith(".j3w1-install-"));
      assert.ok(backup && staged, names.join());
      assert.deepEqual(await pair(path.join(moved, backup, "j3w1")), OLD);
      assert.deepEqual(await pair(path.join(moved, staged)), DIST);
      assert.deepEqual(await fs.readdir(v.themes), [], "the replacement folder is left untouched");
    });

    await t.test("recovery never names a path that is gone and never advises deleting unknown content", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      // themes is moved and replaced while the staged folder is being renamed.
      const late = await setup(t, shell, { mvFail: "late-swap" });
      const result = late.run();
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /Replacement failed and restoration failed\./);
      assert.match(result.stderr, /The previous theme is no longer where the helper left it; the themes folder may have been moved or replaced\./);
      for (const line of result.stderr.split("\n")) {
        const named = line.match(/^j3w1: (?:previous theme|new pair): (.*)$/)?.[1];
        if (named) assert.ok(await fs.stat(named).catch(() => null), `named path exists: ${named}`);
      }
      assert.doesNotMatch(result.stderr, /Keep recovery copies at /);
      const moved = `${late.themes}.moved`, names = await fs.readdir(moved);
      assert.deepEqual(await pair(path.join(moved, names.find((name) => name.startsWith(".j3w1-backup-")), "j3w1")), OLD);
      assert.deepEqual(await pair(path.join(moved, names.find((name) => name.startsWith(".j3w1-install-")))), DIST);
      // Another app's file appears in j3w1 during the swap: it is kept, and the advice is to move it aside.
      const other = await setup(t, shell, { mvFail: "compete" });
      const second = other.run();
      assert.notEqual(second.status, 0);
      assert.equal(await fs.readFile(path.join(other.theme, "keep.txt"), "utf8"), "");
      assert.deepEqual(await pair(recovery(second.stderr).previous), OLD);
      assert.match(second.stderr, /move whatever is at j3w1 to a folder outside \.obsidian\/themes and check it/);
      assert.doesNotMatch(second.stderr, /\bdelete what\b/);
    });

    await t.test("a backup that cannot be removed is reported after a successful install", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { rmFail: true });
      const result = v.run();
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /^Installed j3w1 /);
      assert.match(result.stderr, /could not remove .*\.j3w1-backup-[^;]*; delete it after closing Obsidian\./);
      assert.deepEqual(await pair(v.theme), DIST);
    });

    await t.test("an interruption during the swap never deletes the only copy", async (t) => {
      if (!shell.interposes) return t.skip(STUB_FREE);
      const v = await setup(t, shell, { mvFail: "term" });
      const result = v.run();
      assert.equal(result.status, 143, result.stderr);
      const previous = result.stderr.match(/^j3w1: previous theme: (.*)$/m)?.[1];
      assert.ok(previous, result.stderr);
      assert.deepEqual(await pair(previous), OLD);
      assert.match(result.stderr, /move whatever is at j3w1 to a folder outside \.obsidian\/themes and check it, then move the previous theme folder back to j3w1/);
      assert.deepEqual(await fs.readdir(v.tmp), []);
      // Stopped before the old folder moved: nothing to recover, so only the helper's own folders go.
      const early = await setup(t, shell, { mvFail: "term-before-aside" });
      const before = await snapshot(early.vault);
      const stopped = early.run();
      assert.equal(stopped.status, 143, stopped.stderr);
      assert.deepEqual(await snapshot(early.vault), before, "the vault is exactly as it was");
      assert.doesNotMatch(stopped.stderr, /Recovery copies were kept|no longer where/);
      await leftovers(early);
      // Stopped just after the new pair landed: j3w1 is complete, so the advice says keep it.
      const after = await setup(t, shell, { mvFail: "term-after" });
      const late = after.run();
      assert.equal(late.status, 143, late.stderr);
      assert.deepEqual(await pair(after.theme), DIST);
      const kept = late.stderr.match(/^j3w1: previous theme: (.*)$/m)?.[1];
      assert.deepEqual(await pair(kept), OLD);
      assert.match(late.stderr, /j3w1 holds a complete pair; delete the previous copy once Obsidian shows the theme\./);
      assert.doesNotMatch(late.stderr, /move the previous theme folder back/);
    });
  });
}

test("the script text keeps the reviewed contract and matches the Windows helper's messages", async () => {
  const script = await readText("ports/obsidian/install-android.sh");
  const windows = await readText("ports/obsidian/install.ps1");
  assert.ok(script.startsWith("#!/bin/sh\n"));
  assert.match(script, /^set -eu$/m);
  assert.match(script, /^base='https:\/\/j3w1\.github\.io\/theme\/ports\/obsidian\/'$/m);
  assert.match(script, /^names='manifest\.json theme\.css'$/m);
  assert.match(script, /curl -fsSL --proto '=https' --proto-redir '=https' --tlsv1\.2 /);
  assert.match(script, /^[\x09\x0a\x20-\x7e]*$/, "ASCII text with LF endings");
  for (const message of [
    "Downloaded manifest has an unexpected name or invalid version/minAppVersion.", "Downloaded CSS is empty.",
    "Downloaded CSS header does not match the manifest version.", "Existing theme has only one of the two files; repair it before updating.",
    "previous theme pair restored", "Keep recovery copies at ", "Not an existing Obsidian vault configuration: ",
    ". Restart Obsidian and choose the Dark base scheme.",
  ]) {
    assert.ok(script.includes(message), message);
    assert.ok(windows.includes(message), `install.ps1: ${message}`);
  }
  // Validation finishes before the first write to the vault.
  const validated = script.indexOf("die 'Downloaded CSS header does not match the manifest version.'");
  for (const write of ['mkdir -- "$themes"', 'mktemp -d "$themes/', 'mv -- "$theme"']) assert.ok(validated < script.indexOf(write), write);
  assert.doesNotMatch(script, /\beval\b|\bsudo\b|\|\s*(?:ba|da)?sh\b|\.obsidian\/plugins|\bsource\b|^\s*\.\s/m);
  const guide = await readText("ports/obsidian/ANDROID.md");
  for (const tool of ["curl", "jq", ...TOOLS]) assert.ok(guide.includes(`\`${tool}\``), `ANDROID.md names ${tool}`);
});
