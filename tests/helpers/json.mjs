import { readFileSync } from "node:fs";

export const readJsonWithBom = file => JSON.parse(readFileSync(file, "utf8").replace(/^\uFEFF/, ""));
