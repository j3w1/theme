/* The build's source revision and the repository links built from it. Only
   a full 40-hex GITHUB_SHA pins a revision: an ordinary local build has
   none, and its pages omit the pinned links rather than invent them. */

import manifest from "../../../theme.json";

export const repository = manifest.repository;

export const usageRevision = /^[a-f0-9]{40}$/.test(process.env.GITHUB_SHA ?? "") ? process.env.GITHUB_SHA! : null;

/* The short commit printed in page footers; empty for a local build. */
export const buildCommit = (process.env.GITHUB_SHA ?? "").slice(0, 7);

/* A source file at the pinned revision, or null without one. `encode`
   percent-encodes each path segment. */
export const blobUrl = (file: string, { line = null, encode = false }: { line?: number | null; encode?: boolean } = {}) => usageRevision
  ? `${repository}/blob/${usageRevision}/${encode ? file.split("/").map(encodeURIComponent).join("/") : file}${line ? `#L${line}` : ""}`
  : null;

export const newIssueUrl = (title: string) => `${repository}/issues/new?title=${encodeURIComponent(title)}`;

export const issueSearchUrl = (query: string) => `${repository}/issues?q=${encodeURIComponent(query)}`;
