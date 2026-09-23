/* The resolved default-profile tokens every browser spec compares computed
   styles against. One loader, so a spec never reads the export by hand. */

import { readJson } from "../../scripts/lib/fs.mjs";

export const resolved = await readJson("exports/tokens.resolved.json");

export const token = (path) => resolved.profiles[resolved.defaultProfile].tokens[path].css;
