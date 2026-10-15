/* Search relationships stay out of the static, readable token tables. */
import { usageIndex } from "../../lib/usage";
import { queryIndexOf } from "../../../../scripts/lib/usage-query.mjs";
export function GET() {
  return new Response(JSON.stringify(queryIndexOf(usageIndex)), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
