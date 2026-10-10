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

const windowsScript = commit => `& "$env:LOCALAPPDATA\\j3w1-theme\\windows\\releases\\${commit}\\install.ps1"`;
export const firstInstallerTag = file => file === 'ports/windows/README.md' ? 'v4.0.0' : FIRST_INSTALLER_TAG;
const windowsPending = 'Install commands appear here once v4.0.0 is released.';
const windowsReleased = release => Number(release.tag.match(/^v(\d+)/)?.[1] ?? 0) >= 4;
const blocks = {
  "ports/windows/README.md": {
    install: release => !windowsReleased(release) ? [windowsPending] : [
      `Release ${release.tag} (commit \`${release.commit}\`).`, '',
      ...fence('powershell', [
        "$setup = Join-Path $env:TEMP ('j3w1-install-' + [guid]::NewGuid().ToString('N') + '.ps1')",
        `Invoke-WebRequest -UseBasicParsing '${RAW}/${release.commit}/ports/windows/install.ps1' -OutFile $setup -ErrorAction Stop`,
        `& $setup -Revision ${release.commit}`,
      ]),
    ],
    update: release => !windowsReleased(release) ? [windowsPending] : [
      'Run the Install command from the newer release. It prepares that exact revision, applies the changes and runs Test. Repeating the same revision is safe. Updates are never automatic.',
    ],
    restore: release => !windowsReleased(release) ? [windowsPending] : [
      'Choose one recovery action. To undo the last transaction:', '',
      ...fence('powershell',[`${windowsScript(release.commit)} -Action Restore -Latest`]), '',
      'To restore the original baseline across all theme transactions:', '',
      ...fence('powershell',[`${windowsScript(release.commit)} -Action Restore`]), '',
      'To restore the baseline and remove owned theme integration:', '',
      ...fence('powershell',[`${windowsScript(release.commit)} -Action Uninstall`]),
    ],
  },
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
    update: () => [
      "When a newer release is out, open this page on the site's Ports page or on the repository's main branch: its Install command names the newest release. Quit Orca and paste it. It downloads that release, applies it and runs the checks.",
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
  Object.fromEntries(Object.entries(blocks[file]).map(([name, body]) => [name, manifest.release ? body(manifest.release).join("\n") : file === "ports/windows/README.md" ? windowsPending : pending(name)]));
