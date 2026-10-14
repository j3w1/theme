import { readJson } from "../../scripts/lib/fs.mjs";

export const loadTokenExports = () => readJson("exports/tokens.resolved.json");
export const defaultTokens = async () => {
  const exported = await loadTokenExports();
  return exported.profiles[exported.defaultProfile].tokens;
};
