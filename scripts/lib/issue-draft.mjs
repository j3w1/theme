import { anchorFor } from "./anchors.mjs";

export const reportContext = (data, kind, id, profile = "default") => {
  if (!["component", "token"].includes(kind) || !data[kind === "component" ? "components" : "tokens"].includes(id)) throw new Error("Unknown report target");
  if (!data.profiles.includes(profile)) throw new Error("Unknown report profile");
  return { themeVersion: data.themeVersion, revision: data.revision ?? "local unpinned build", sourceDigest: data.sourceDigest, kind, id, profile, publicAnchor: `${data.siteUrl}#${anchorFor[kind](id)}` };
};
export const issueDraft = (fields, context) => {
  const sections = [["Expected", "expected"], ["Actual", "actual"], ["Steps to reproduce", "steps"], ["Evidence notes", "evidence"]].map(([title, name]) => `## ${title}\n\n${String(fields[name] ?? "").trim().slice(0, 1600) || "(Please describe.)"}`).join("\n\n");
  return `${sections}\n\n## Reproduction context\n\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\`\n\nConfiguration describes the initial specimen. Entered sample text is excluded.\n`;
};
// A conservative portable-link budget, not a claim about GitHub's server limit.
export const issueComposer = (id, body, budget = 8000) => {
  const url = new URL("https://github.com/j3w1/theme/issues/new");
  url.searchParams.set("title", `${id}: describe the issue`);
  url.searchParams.set("body", body);
  const manualPaste = url.href.length > budget;
  if (manualPaste) url.searchParams.delete("body");
  return { href: url.href, manualPaste };
};
