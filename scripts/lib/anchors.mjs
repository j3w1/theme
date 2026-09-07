/* The only place anchors are named. The site's Astro components and the
   export builders both import this, so the page and the exports cannot
   disagree about where a component or token lives. */

export const anchorFor = {
  verification: (id) => `v-${id}`,
  component: (id) => `c-${id}`,
  family: (id) => `f-${id}`,
  doc: (id) => `d-${id}`,
  decision: (id) => `d-decisions--${id.toLowerCase()}`,
  token: (path) => `t-${path.replaceAll(".", "-")}`,
  tokenProfile: (path, profile) => `tp-${profile}-${path.replaceAll(".", "-")}`,
  usageControl: (name) => `usage-control-${name}`,
  recipeSource: (name) => `recipe-source-${name.replaceAll(".", "-")}`,
  kitControl: (name) => `kit-control-${name}`,
  specimen: (id) => `s-${id}`,
  nonExample: (id) => `x-${id}`,
  fixture: (id) => `fx-${id.toLowerCase()}`,
};

export const siteAnchor = (manifest, anchor) => `${manifest.site.url}#${anchor}`;
