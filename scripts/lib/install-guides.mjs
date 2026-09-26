/* The copy-paste commands in the install guides. Every command is pinned to
   theme.json's `release.commit`, so a reader pastes it as it is: no
   placeholder to fill in, and no branch. Until `release` is recorded (after
   the tag exists) each block is one line saying so. */

import { FIRST_INSTALLER_TAG } from "../../schemas/theme.mjs";

export const PENDING = `Install commands appear here once ${FIRST_INSTALLER_TAG} is released.`;
const pending = (name) => (name === "install" ? PENDING : `Commands appear here once ${FIRST_INSTALLER_TAG} is released.`);

const RAW = "https://raw.githubusercontent.com/j3w1/theme";
const CLONE = "https://github.com/j3w1/theme.git";

/* The folder Get-J3w1Orca.ps1 downloads a release into, and a script in it. */
export const orcaFolder = (commit) => `$env:LOCALAPPDATA\\j3w1-theme\\orca\\releases\\${commit}`;
export const orcaScript = (commit, script) => `pwsh -NoProfile -File "${orcaFolder(commit)}\\ports\\orca\\install\\${script}"`;
export const orcaOneLiner = (commit) => `& ([scriptblock]::Create((Invoke-RestMethod ${RAW}/${commit}/ports/orca/install/Get-J3w1Orca.ps1))) -Revision ${commit} -Apply`;
export const devboxLines = (app, commit) => [
  `git pull --ff-only --tags${app === "codex" ? " && npm ci" : ""}`,
  `node ports/${app}/install.mjs apply --revision ${commit}`,
];

const fence = (lang, lines, indent = "") => [`${indent}\`\`\`${lang}`, ...lines.map((l) => `${indent}${l}`), `${indent}\`\`\``];

const cloneNote = `In your clone of this repository (\`~/dev/theme\` on the CE devbox; if you have none, run \`git clone ${CLONE} ~/dev/theme\` and \`cd\` into it), paste:`;

const blocks = {
  "ports/README.md": {
    install: ({ tag, commit }) => [
      `Release ${tag} (commit \`${commit}\`):`,
      "",
      "- **Orca** on Windows. Quit Orca first (tray icon too), then paste into PowerShell 7:",
      "",
      ...fence("powershell", [orcaOneLiner(commit)], "  "),
      "",
      "- **Claude Code**, in your clone of this repository:",
      "",
      ...fence("sh", devboxLines("claude-code", commit), "  "),
      "",
      "- **Codex**, in your clone of this repository:",
      "",
      ...fence("sh", devboxLines("codex", commit), "  "),
    ],
  },
  "ports/orca/README.md": {
    install: ({ tag, commit }) => [
      `Release ${tag} (commit \`${commit}\`).`,
      "",
      "1. Quit Orca, including its tray icon. Then paste this into PowerShell 7 (`pwsh`):",
      "",
      ...fence("powershell", [orcaOneLiner(commit)], "   "),
      "",
      "   It downloads this release, checks it, applies it and runs the checks.",
      "2. Start Orca.",
      "3. Open a terminal in Orca and run the test. It draws the colours and prints PASS or FAIL for each setting:",
      "",
      ...fence("powershell", [orcaScript(commit, "Test-J3w1OrcaTheme.ps1")], "   "),
    ],
    update: ({ tag, commit }) => [
      "When a newer release is out, paste the Install command from that release's copy of this page. It downloads that release and applies it.",
      "",
      `Or move by tag from this release's folder (for example to ${tag}):`,
      "",
      ...fence("powershell", [`${orcaScript(commit, "Update-J3w1OrcaTheme.ps1")} -Version ${tag}`]),
    ],
    restore: ({ commit }) => [
      "Quit Orca (tray icon too), then run:",
      "",
      ...fence("powershell", [orcaScript(commit, "Restore-J3w1OrcaTheme.ps1")]),
    ],
  },
  "ports/claude-code/README.md": {
    install: ({ tag, commit }) => [
      `Release ${tag} (commit \`${commit}\`).`,
      "",
      `1. ${cloneNote}`,
      "",
      ...fence("sh", devboxLines("claude-code", commit), "   "),
      "",
      "2. Restart Claude Code sessions that were already running (new sessions pick the theme up by themselves).",
      "3. Check it:",
      "",
      ...fence("sh", ["node ports/claude-code/install.mjs test"], "   "),
    ],
  },
  "ports/codex/README.md": {
    install: ({ tag, commit }) => [
      `Release ${tag} (commit \`${commit}\`).`,
      "",
      `1. ${cloneNote}`,
      "",
      ...fence("sh", devboxLines("codex", commit), "   "),
      "",
      "   `npm ci` installs the TOML parser the installer uses to check `config.toml` before it writes anything.",
      "2. Start a new Codex session. A running session keeps the theme it started with.",
      "3. Check it:",
      "",
      ...fence("sh", ["node ports/codex/install.mjs test"], "   "),
    ],
  },
};

export const INSTALL_GUIDES = Object.keys(blocks);

/* Marker block name -> body, for one guide. */
export const guideBlocks = (manifest, file) =>
  Object.fromEntries(Object.entries(blocks[file]).map(([name, body]) => [name, manifest.release ? body(manifest.release).join("\n") : pending(name)]));
