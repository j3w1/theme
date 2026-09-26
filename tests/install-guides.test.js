/* The install guides print commands pinned to theme.json's `release`
   (tag and commit), so a reader pastes them as they are. Until the release
   is recorded each block is one line saying so. When it is recorded, the
   commit must be the one its tag names. */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { z } from "zod";
import { listFiles, readJson, readText } from "../scripts/lib/fs.mjs";
import { devboxLines, guideBlocks, INSTALL_GUIDES, orcaOneLiner, orcaScript, PENDING } from "../scripts/lib/install-guides.mjs";
import { FIRST_INSTALLER_TAG, themeSchema } from "../schemas/theme.mjs";

const manifest = await readJson("theme.json");
const block = (text, name) => {
  const match = new RegExp(`<!-- ${name}:start -->\\n([\\s\\S]*?)\\n<!-- ${name}:end -->`).exec(text);
  assert.ok(match, `the ${name} block is present`);
  return match[1];
};
const PLACEHOLDERS = /<commit>|<release commit>|<revision>|<sha>|vX\.Y\.Z/;

test("every guide carries the blocks theme.json's release renders, and no placeholder", async () => {
  for (const guide of INSTALL_GUIDES) {
    const text = await readText(guide);
    for (const [name, body] of Object.entries(guideBlocks(manifest, guide))) assert.equal(block(text, name), body, `${guide} ${name}`);
    assert.doesNotMatch(text, PLACEHOLDERS, guide);
  }
  for (const guide of ["README.md", ...(await listFiles("ports", { filter: (f) => f.endsWith(".md") }))]) assert.doesNotMatch(await readText(guide), PLACEHOLDERS, guide);
});

test("without a release every block is one line; with one every command names its commit and nothing to fill in", () => {
  const { release, ...unreleased } = manifest;
  void release;
  for (const guide of INSTALL_GUIDES) {
    for (const [name, body] of Object.entries(guideBlocks(unreleased, guide))) {
      assert.equal(body.split("\n").length, 1, `${guide} ${name}`);
      assert.ok(body.endsWith(`once ${FIRST_INSTALLER_TAG} is released.`), body);
    }
  }
  assert.equal(guideBlocks(unreleased, "ports/orca/README.md").install, PENDING);

  const commit = "0123456789abcdef0123456789abcdef01234567";
  const released = { ...unreleased, release: { tag: FIRST_INSTALLER_TAG, commit } };
  for (const guide of INSTALL_GUIDES) {
    const blocks = guideBlocks(released, guide);
    assert.ok(blocks.install.includes(commit), `${guide} install names the commit`);
    for (const body of Object.values(blocks)) {
      assert.doesNotMatch(body, PLACEHOLDERS);
      assert.doesNotMatch(body, /\/main\/|\blatest\b/, "never a branch");
    }
  }
  const orca = guideBlocks(released, "ports/orca/README.md");
  assert.ok(orca.install.includes(orcaOneLiner(commit)));
  assert.equal(orcaOneLiner(commit), `& ([scriptblock]::Create((Invoke-RestMethod https://raw.githubusercontent.com/j3w1/theme/${commit}/ports/orca/install/Get-J3w1Orca.ps1))) -Revision ${commit} -Apply`);
  assert.ok(orca.install.includes(orcaScript(commit, "Test-J3w1OrcaTheme.ps1")));
  assert.ok(orca.restore.includes(orcaScript(commit, "Restore-J3w1OrcaTheme.ps1")));
  assert.ok(orca.update.includes(`-Version ${FIRST_INSTALLER_TAG}`));
  assert.deepEqual(devboxLines("codex", commit), ["git pull --ff-only --tags && npm ci", `node ports/codex/install.mjs apply --revision ${commit}`]);
  const index = guideBlocks(released, "ports/README.md").install;
  for (const line of [orcaOneLiner(commit), ...devboxLines("claude-code", commit), ...devboxLines("codex", commit)]) assert.ok(index.includes(line), line);
});

test("the paths the guides print exist in this commit's installer", async () => {
  const commit = "0123456789abcdef0123456789abcdef01234567";
  const scripts = [...guideBlocks({ ...manifest, release: { tag: FIRST_INSTALLER_TAG, commit } }, "ports/orca/README.md").install.matchAll(/ports\/orca\/install\/(\S+?\.ps1)|install\\(\S+?\.ps1)/g)].map((m) => m[1] ?? m[2]);
  assert.ok(scripts.length >= 2);
  for (const script of scripts) assert.ok((await listFiles("ports/orca/install")).includes(`ports/orca/install/${script}`), script);
  for (const app of ["claude-code", "codex"]) assert.ok((await listFiles(`ports/${app}`)).includes(`ports/${app}/install.mjs`));
});

test("release.commit is the commit its tag names", (t) => {
  if (!manifest.release) return t.diagnostic(`theme.json records no release yet; the guides say commands appear once ${FIRST_INSTALLER_TAG} is released`);
  const { tag, commit } = manifest.release;
  const named = spawnSync("git", ["rev-list", "-n1", tag], { encoding: "utf8" });
  if (named.status !== 0) return t.skip(`tag ${tag} is not fetched in this clone (git fetch --tags), so its commit cannot be compared`);
  assert.equal(named.stdout.trim(), commit, `theme.json release.commit must be the commit ${tag} names`);
});

test("the release schema takes a tag from v3.0.0 on and a full commit, nothing else", () => {
  const parse = (release) => themeSchema(z).safeParse({ ...manifest, release });
  assert.ok(parse({ tag: FIRST_INSTALLER_TAG, commit: "a".repeat(40) }).success);
  assert.ok(parse({ tag: "v3.10.2", commit: "b".repeat(40) }).success);
  for (const bad of [
    { tag: "v2.0.0", commit: "a".repeat(40) },
    { tag: "3.0.0", commit: "a".repeat(40) },
    { tag: FIRST_INSTALLER_TAG, commit: "a".repeat(12) },
    { tag: FIRST_INSTALLER_TAG, commit: "A".repeat(40) },
    { tag: FIRST_INSTALLER_TAG, commit: "a".repeat(40), branch: "main" },
  ]) assert.equal(parse(bad).success, false, JSON.stringify(bad));
});
