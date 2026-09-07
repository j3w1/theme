import index from "../../../exports/token-usage.json";
import { withBase } from "./base";
export const usageIndex = index;
export const usageRevision = /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") ? process.env.GITHUB_SHA! : null;
export const tokenUrl = (path: string) => withBase(`tokens/${encodeURIComponent(path)}/`);
export const sourceUrl = (source: { file: string; line: number | null }) => usageRevision
  ? `https://github.com/j3w1/theme/blob/${usageRevision}/${source.file.split("/").map(encodeURIComponent).join("/")}${source.line ? `#L${source.line}` : ""}` : null;
