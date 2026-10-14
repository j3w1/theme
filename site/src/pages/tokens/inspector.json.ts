/* Static inspector data is requested only after a token/swatch interaction. */
import { tokenColorIndex } from "../../../../scripts/lib/hex-literals.mjs";
import { profiles, defaultProfileId, theme } from "../../lib/theme";
export function GET() {
  const data = Object.fromEntries(Object.entries(profiles).map(([id, profile]) => [id, Object.fromEntries(Object.entries(profile.tokens).map(([path, token]) => [path, [token.css, token.aliasOf ?? "", token.status, token.description ?? "", token.eligibility, token.deprecated]]))]));
  return new Response(JSON.stringify({ defaultProfile: defaultProfileId, version: theme.version, profiles: data, colorIndex: tokenColorIndex(profiles) }), { headers: { "Content-Type": "application/json; charset=utf-8" } });
}
