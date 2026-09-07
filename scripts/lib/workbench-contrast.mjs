import { evaluatePair } from "./contrast.mjs";

export const evaluateWorkbenchContrast = (data, { profile, fg, bg, underlay, context, pair = "custom" }) => {
  const tokens = data.tokens[profile];
  if (!tokens) throw new Error("Unknown profile");
  for (const path of [fg, bg, underlay]) if (tokens[path]?.type !== "color") throw new Error("Choose a documented colour role");
  if ((tokens[underlay].value.alpha ?? 1) !== 1) throw new Error("The underlay must be opaque");
  const declaration = /^\d+$/.test(pair) ? data.contract.contrast[Number(pair)] : null;
  const matching = declaration?.fg === fg && declaration?.bg === bg;
  if (context === "declared" && !matching) throw new Error("Choose an explicit threshold context for a custom pair");
  if (!["declared", "text", "large", "ui"].includes(context)) throw new Error("Unknown contrast context");
  const min = context === "declared" ? declaration.min ?? 4.5 : context === "text" ? 4.5 : 3;
  const result = evaluatePair({ fg: tokens[fg].value, bg: tokens[bg].value, surface: tokens[underlay].value, min, kind: context === "declared" ? declaration.kind ?? "text" : context === "ui" ? "ui" : "text", waiver: context === "declared" ? declaration.waiver ?? null : null });
  const exactEdge = (a, b) => !!a.part && !!b.part && ["kind", "part", "state", "variant", "surface"].every((key) => a[key] === b[key]);
  const alternatives = Object.entries(tokens).filter(([path, token]) => path !== fg && token.type === "color" && ["use", "use-and-report"].includes(token.eligibility.action) && token.uses.some((edge) => tokens[fg].uses.some((original) => exactEdge(edge, original)))).map(([path]) => path);
  return { ...result, roles: { fg, bg, underlay }, eligibility: [fg, bg, underlay].map((path) => ({ path, ...tokens[path].eligibility })), alternatives, declaredState: matching ? declaration.state ?? "unspecified" : null };
};
