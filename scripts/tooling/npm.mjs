/* What this repository needs from the npm that launched it. */

import path from "node:path";

/* The absolute path of the npm CLI that runs the current script, which npm
   passes as npm_execpath; null when the script was started some other way. */
export const npmExecPath = (env = process.env) => (env.npm_execpath && path.isAbsolute(env.npm_execpath) ? env.npm_execpath : null);

/* The description of one packed package from `npm pack --json`. npm 11
   prints an array of packed packages; npm 12 prints an object keyed by
   package name. Both describe the same tarball. */
export const packedPackage = (json, name) => {
  const packed = JSON.parse(json);
  const result = Array.isArray(packed) ? packed.find((entry) => entry.name === name) ?? packed[0] : packed[name] ?? Object.values(packed)[0];
  if (!result?.filename) throw new Error(`npm pack --json did not describe the packed ${name} tarball`);
  return result;
};
