/* Consumption policy authorized by the owner for issue #4 (D-013).
   Approval is metadata, not an inference from a profile, alias or colour. */
export const POLICY_TEXT = "Use the pinned approved default profile. Pending roles in that profile use-and-report their decision IDs; this does not approve them. Proposed profiles are preview-only and blocked for delivery. Heritage profiles are historical-only. Deprecated or heritage roles are blocked for new approved-profile mappings. Consume roles within their documented scope, never primitives. Release numbering does not approve profiles or tokens.";

export const releaseOf = (version) => ({ version, stability: version.split("+")[0].includes("-") ? "prerelease" : "release", policy: POLICY_TEXT });
const extension = (token) => token.extensions?.["io.github.j3w1.theme"] ?? {};

export const eligibilityOf = (profile, token, resolved) => {
  const visited = new Set();
  const dependencies = [];
  const visit = (entry) => {
    if (!entry || visited.has(entry.path)) return;
    visited.add(entry.path);
    dependencies.push(entry);
    for (const path of entry.chain ?? []) visit(resolved.get(path));
  };
  visit(token);
  const pending = dependencies.filter((entry) => extension(entry).status === "proposed");
  const decisionIds = [...new Set(pending.map((entry) => extension(entry).approval?.decision).filter(Boolean))].sort();
  const result = (action, reason) => ({ action, reason, decisionIds });
  if (profile.status === "proposed") return result("blocked", "Proposed profile: preview only, not downstream delivery.");
  if (profile.status === "heritage") return result("historical-only", "Historical fidelity only; preserve all documented limitations and deprecations.");
  if (profile.status !== "approved") return result("blocked", "The profile is not approved.");
  if (token.path.startsWith("color.primitive.")) return result("blocked", "Inspection only: consume semantic roles, not primitives.");
  if (dependencies.some((entry) => entry.deprecated)) return result("blocked", "A role or dependency is deprecated; do not create new approved-profile mappings.");
  if (dependencies.some((entry) => extension(entry).status === "heritage")) return result("blocked", "A heritage value is not eligible for an approved-profile mapping.");
  if (pending.length) {
    if (!profile.default) return result("blocked", "The pending-role exception applies only to the approved default profile.");
    if (pending.some((entry) => !extension(entry).approval?.decision)) return result("blocked", "A pending dependency has no decision ID; resolve its metadata before consumption.");
    return result("use-and-report", "Use the pinned value and disclose every pending decision ID; approval statuses are unchanged.");
  }
  return result("use", "Use within the role's documented scope and restrictions.");
};

export const eligibilityText = (eligibility) => `${eligibility.action}${eligibility.decisionIds.length ? ` (${eligibility.decisionIds.join(", ")})` : ""}`;
