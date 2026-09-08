import { anchorFor, siteAnchor } from "./anchors.mjs";
import { playgroundPayload, validatePlaygroundConfig } from "../../schemas/playground.mjs";

const revisionPattern = /^(?:[a-f0-9]{40}|v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/;
export const encodeWorkbenchLink = (config, data, { includeText = false } = {}) => {
  const payload = { version: 1, revision: data.revision, sourceDigest: data.sourceDigest, config: playgroundPayload(config, data.contract, data.profiles, { includeText }) };
  return `#${encodeURIComponent(JSON.stringify(payload))}`;
};
export const decodeWorkbenchLink = (hash, data) => {
  if (!hash) return { config: validatePlaygroundConfig({}, data.contract, data.profiles), mismatch: false, requestedRevision: null };
  if (hash.length > 12000) throw new Error("Preview link is too long");
  const payload = JSON.parse(decodeURIComponent(hash.replace(/^#/, "")));
  if (!payload || Array.isArray(payload) || typeof payload !== "object" || Object.keys(payload).some((key) => !["version", "revision", "sourceDigest", "config"].includes(key)) || payload.version !== 1) throw new Error("Unsupported preview link format");
  if (payload.revision !== null && (typeof payload.revision !== "string" || !revisionPattern.test(payload.revision))) throw new Error("Preview revision must be a pinned tag or full commit");
  if (typeof payload.sourceDigest !== "string" || !/^sha256-[A-Za-z0-9+/]{43}=$/.test(payload.sourceDigest)) throw new Error("Invalid preview source digest");
  return { config: validatePlaygroundConfig(payload.config, data.contract, data.profiles), mismatch: payload.sourceDigest !== data.sourceDigest || payload.revision !== data.revision, requestedRevision: payload.revision };
};

export const reproductionPayload = (config, data, measurements = null) => ({
  version: 1, themeVersion: data.themeVersion, id: config.component, kind: "component", profile: config.profile, publicAnchor: siteAnchor({ site: { url: data.siteUrl } }, anchorFor.component(config.component)), permalink: `${data.siteUrl}workbench/${config.component}/${encodeWorkbenchLink(config, data)}`, revision: data.revision ?? "local unpinned build", sourceDigest: data.sourceDigest,
  config: playgroundPayload(config, data.contract, data.profiles),
  viewport: measurements ? { width: measurements.width, height: measurements.height, outerOverflow: measurements.outerOverflow, innerOverflow: measurements.innerOverflow } : null,
});
