/* Typed access to the manifest and the committed exports. The page renders
   exports, not raw tokens, so what people read is what agents fetch. */

import { hexOf as tokenHex } from "../../../scripts/lib/color.mjs";
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
  decisionId: string | null;
  eligibility: { action: string; reason: string; decisionIds: string[] };
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

export { cssVar } from "../../../scripts/lib/tokens.mjs";

export const hexOf = (path: string): string | null => {
  return tokenHex(defaultTokens[path]);
};
