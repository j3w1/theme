// Pure query contract used by the browser and tests. All selected usage facets
// must match the same source edge; equal colours never supply a relationship.
export const queryIndexOf = (index) => ({ profiles: Object.fromEntries(Object.entries(index.profiles).map(([id, profile]) => [id, {
  tokens: Object.fromEntries(Object.entries(profile.tokens).map(([path, token]) => [path, {
    path, group: token.group, variable: token.variable, css: token.css, description: token.description, status: token.status,
    eligibility: { action: token.eligibility.action },
    uses: [...new Map(token.uses.map(({ component, part, state, variant, surface }) => {
      const edge = { component, part, state, variant, surface };
      return [JSON.stringify(edge), edge];
    })).values()],
  }])),
}])) });

export const queryUsage = (index, { profile = "default", query = "", group = "", component = "", part = "", state = "", variant = "", surface = "", status = "", eligible = false } = {}) => {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return Object.values(index.profiles[profile]?.tokens ?? {}).filter((token) => {
    if (group && token.group !== group || status && token.status !== status) return false;
    if (eligible && !["use", "use-and-report"].includes(token.eligibility.action)) return false;
    const uses = token.uses.filter((u) => (!component || u.component === component) && (!part || u.part === part) && (!state || u.state === state) && (!variant || u.variant === variant) && (!surface || u.surface === surface));
    if ((component || part || state || variant || surface) && !uses.length) return false;
    const haystack = [token.path, token.variable, token.css, token.description, ...uses.map((u) => [u.component, u.part, u.state, u.surface].join(" "))].join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
};
