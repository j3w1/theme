/* Which built routes receive the inline hex swatch decoration (D-014). The
   site build and design mode's live proxy both read this list, so the two
   sides of a comparison are decorated identically. Paths are built-file
   paths relative to the site root, such as "tokens/index.html". */

export const HEX_DECORATION = Object.freeze({
  /* Single pages. */
  pages: ["index.html", "reference/index.html"],
  /* Every HTML file under these trees, with today's token matches. */
  trees: ["tokens/", "ports/", "recipes/", "kit/", "workbench/", "preview/", "components/", "foundations/", "tools/", "patterns/", "builder/", "figma/", "implement/", "agents/"],
  /* Historical literals keep their exact fill without today's token matches. */
  historicalTrees: ["releases/"],
  /* Reconstructed specimens keep their exact, digest-recorded bytes. */
  skipDirectory: "specimens",
});

/* The colour index a route is decorated with: `index` for a listed page or
   tree, an empty index under a historical tree, null when the route is not
   decorated at all. */
export const hexIndexForRoute = (relative, index) => {
  if (relative.split("/").slice(0, -1).includes(HEX_DECORATION.skipDirectory)) return null;
  if (HEX_DECORATION.historicalTrees.some((tree) => relative.startsWith(tree))) return {};
  if (HEX_DECORATION.pages.includes(relative)) return index;
  if (HEX_DECORATION.trees.some((tree) => relative.startsWith(tree))) return index;
  return null;
};
