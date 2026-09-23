import index from "../../../exports/token-usage.json";
import { withBase } from "./base";
import { blobUrl, usageRevision } from "./revision";
export { usageRevision };
export const usageIndex = index;
export const tokenUrl = (path: string) => withBase(`tokens/${encodeURIComponent(path)}/`);
export const sourceUrl = (source: { file: string; line: number | null }) => blobUrl(source.file, { line: source.line, encode: true });
