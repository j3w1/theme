/* Tool configuration is deliberately closed. Component choices come from the
   maintained contract; these bounds constrain the tool, not application data. */
export const PLAYGROUND_IDS = ["button", "text-field", "checkbox", "tabs", "dialog"];
export const PREVIEW_IDS = [...PLAYGROUND_IDS, "table", "sidebar-nav"];
export const PLAYGROUND_FIELDS = ["component", "variant", "state", "density", "profile", "direction", "label", "help", "width", "fixture", "motion", "part"];
export const TEXT_LIMITS = { label: 256, help: 512 };

export const defaultPlaygroundConfig = (contract, profiles) => ({
  component: contract.id,
  variant: contract.variants[0].id,
  state: "default",
  density: contract.sizes.includes("compact") ? "compact" : contract.sizes[0],
  profile: profiles.find((profile) => profile.default).id,
  direction: "ltr",
  label: "",
  help: "",
  width: 640,
  fixture: "canonical",
  motion: "system",
  part: "",
});

export const validatePlaygroundConfig = (input, contract, profiles) => {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Expected a configuration object");
  if (!PREVIEW_IDS.includes(contract.id)) throw new Error("Unsupported playground component");
  for (const key of Object.keys(input)) if (!PLAYGROUND_FIELDS.includes(key)) throw new Error(`Unknown configuration field: ${key}`);
  const value = { ...defaultPlaygroundConfig(contract, profiles), ...input };
  const choices = {
    component: [contract.id], variant: contract.variants.map((item) => item.id),
    state: contract.states, density: contract.sizes,
    profile: profiles.map((item) => item.id), direction: ["ltr", "rtl"],
    fixture: ["canonical", "en", "es", "zh", "ar", "long"], motion: ["system", "reduced"],
    part: ["", ...contract.anatomy.map((item) => item.part)],
  };
  for (const [key, allowed] of Object.entries(choices)) if (!allowed.includes(value[key])) throw new Error(`Unsupported ${key}`);
  if (!Number.isInteger(value.width) || value.width < 320 || value.width > 1280) throw new Error("Width must be an integer from 320 to 1280 CSS pixels");
  for (const [key, limit] of Object.entries(TEXT_LIMITS)) {
    if (typeof value[key] !== "string" || value[key].length > limit || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value[key])) throw new Error(`Invalid ${key} text`);
  }
  return Object.fromEntries(PLAYGROUND_FIELDS.map((key) => [key, value[key]]));
};

/* Sharing never includes entered sample text by default. Consent is per copy,
   not a persisted preference. The caller displays the resulting payload. */
export const playgroundPayload = (input, contract, profiles, { includeText = false } = {}) => {
  const config = validatePlaygroundConfig(input, contract, profiles);
  if (!includeText) { config.label = ""; config.help = ""; }
  return config;
};
