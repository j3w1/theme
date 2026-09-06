/* Typed access to the manifest and the committed exports. The page renders
   exports, not raw tokens, so what people read is what agents fetch. */

import manifest from "../../../theme.json";
import resolved from "../../../exports/tokens.resolved.json";
import contrast from "../../../exports/contrast.json";
import coverage from "../../../exports/coverage.json";
import catalogue from "../../../references/catalogue.json";
import sources from "../../../references/sources.json";
import families from "../../../spec/families.json";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";

export type ResolvedToken = {
  type: string;
  value: unknown;
  css: string;
  aliasOf: string | null;
  description: string | null;
  status: string;
  deprecated: boolean | string;
};

export const theme = manifest;
export const profiles = resolved.profiles as Record<string, { status: string; default: boolean; overlay: string | null; tokens: Record<string, ResolvedToken> }>;
export const defaultProfileId = resolved.defaultProfile as string;
export const defaultTokens = profiles[defaultProfileId].tokens;
export const contrastReport = contrast;
export const coverageLedger = coverage;
export const referenceCatalogue = catalogue;
export const referenceSources = sources;
export const familyList = [...families].sort((a, b) => a.order - b.order);
export const anchors = anchorFor;

export const tokensInGroup = (prefix: string): [string, ResolvedToken][] =>
  Object.entries(defaultTokens).filter(([path]) => path.startsWith(prefix));

export const cssVar = (path: string): string => `--${path.replaceAll(".", "-")}`;

export const isColor = (token: ResolvedToken): boolean => token.type === "color";

export const hexOf = (path: string): string | null => {
  const token = defaultTokens[path];
  return token && token.type === "color" ? (token.value as { hex: string }).hex : null;
};

export const valuePerProfile = (path: string): { profile: string; css: string; status: string }[] =>
  Object.entries(profiles).map(([id, p]) => ({ profile: id, css: p.tokens[path]?.css ?? "—", status: p.status }));
