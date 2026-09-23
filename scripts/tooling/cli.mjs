/* The shape every command-line entry point under scripts/ shares. Modules in
   scripts/tooling serve local tooling only; nothing here is part of the
   package identity that scripts/lib is hashed into. */

export { parseArgs } from "node:util";

/* Runs `main`. A failure ends the process with the error's message and exit
   code 1, so an operator reads what went wrong rather than a stack trace. */
export const runCli = async (main) => {
  try {
    await main();
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
};

/* A port from the environment: `fallback` when the variable is unset,
   otherwise an integer within [min, max]. */
export const portFromEnv = (name, fallback, { min = 1024, max = 65535 } = {}) => {
  const port = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(port) || port < min || port > max) throw new Error(`${name} must be an integer between ${min} and ${max}`);
  return port;
};
