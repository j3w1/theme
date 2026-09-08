// Private script/style copies need ordinary Sass and scoped-package names.
// Public task kits keep their narrower filename contract.
export const privateAssetPath = name => typeof name === "string" && name.split("/").every(part =>
  /^[a-zA-Z0-9_@][a-zA-Z0-9._@-]*$/.test(part) && !part.endsWith(".") &&
  !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part));
