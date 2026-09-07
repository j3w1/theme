import { writeReport } from "../../scripts/lib/verification-report.mjs";
export default function verification() {
  return { name: "j3w1-verification-baseline", hooks: { "astro:build:done": async () => { await writeReport(null, { initialize: true }); } } };
}
