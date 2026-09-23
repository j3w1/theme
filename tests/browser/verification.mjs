/* The explicit verification scope every browser test must carry (AGENTS.md,
   "Execution evidence"). The evidence reporter refuses a test without one,
   so every field is required here too: a scope with a missing field is a
   coverage claim nobody wrote. Key order is part of the recorded evidence. */

export const verification = ({ component, category, states, variants, note }) => {
  const scope = { component, category, states, variants, note };
  for (const [key, value] of Object.entries(scope)) if (value === undefined) throw new Error(`verification scope needs ${key}`);
  return { annotation: { type: "verification", description: JSON.stringify(scope) } };
};
