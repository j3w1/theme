import { spawnSync } from "node:child_process";

export const powershell = process.env.J3W1_PWSH ?? (process.platform === "win32" ? "pwsh.exe" : "pwsh");

export const powershellEnvironment = () => {
  const env = { ...process.env };
  if (process.platform === "win32") {
    for (const key of Object.keys(env)) if (key.toLowerCase() === "psmodulepath") delete env[key];
  }
  return env;
};

export const powershellAvailable = (engine = powershell, env = process.env) =>
  spawnSync(engine, ["-NoProfile", "-NonInteractive", "-Command", "$PSVersionTable.PSVersion.ToString()"], { encoding: "utf8", env }).status === 0;
