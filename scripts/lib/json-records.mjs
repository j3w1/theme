/* Deterministic JSON with one record per line in explicitly selected arrays.
   Public fields, ordering and JSON semantics stay unchanged; only whitespace
   differs. Other JSON writers retain their existing formatting and digests. */
export function recordJson(value, recordArrays) {
  const names = new Set(recordArrays);
  // Normalize once through the platform serializer: toJSON, omitted object
  // values, array holes, escapes and invalid numbers follow JSON.stringify.
  const json = JSON.parse(JSON.stringify(value));
  const render = (item, depth, key) => {
    if (item === null || typeof item !== "object") return JSON.stringify(item);
    const array = Array.isArray(item), entries = array ? item : Object.entries(item);
    if (!entries.length) return array ? "[]" : "{}";
    const indent = "  ".repeat(depth + 1);
    const rows = array
      ? entries.map(child => indent + (names.has(key) ? JSON.stringify(child) : render(child, depth + 1)))
      : entries.map(([name, child]) => indent + JSON.stringify(name) + ": " + render(child, depth + 1, name));
    return (array ? "[" : "{") + "\n" + rows.join(",\n") + "\n" + "  ".repeat(depth) + (array ? "]" : "}");
  };
  return render(json, 0) + "\n";
}
