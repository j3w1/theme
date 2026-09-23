/* One rendering of zod issues for every "file X is not valid" message, so a
   schema failure reads the same whichever loader raised it. */

export const formatIssues = (issues) => issues.map((i) => `  ${i.path.join(".") || "(root)"}: ${i.message}`).join("\n");
