/* Shared native-source substitution. Only owned uppercase placeholders are
   expanded; template fragments are supplied explicitly by their caller. */
export function renderWindowsTemplate(source, substitutions, label) {
  const text = source.replace(/@([A-Z0-9_]+)@/g, (_, key) => {
    if (!Object.hasOwn(substitutions, key)) throw Error("Unknown " + label + " placeholder " + key);
    return substitutions[key];
  });
  if (/@[A-Z0-9_]+@/.test(text)) throw Error("Unresolved " + label + " placeholder");
  return text;
}
