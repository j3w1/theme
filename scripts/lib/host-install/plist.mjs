/* Reads the XML property lists this kit writes: dict, array, string, key,
   integer, real, true and false. Enough to compare two TextMate themes and
   to check the generated one parses; not a general plist reader. */

const unescape = (s) => s.replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&quot;", '"').replaceAll("&apos;", "'").replaceAll("&amp;", "&");

export const parsePlist = (text) => {
  const body = /<plist[^>]*>([\s\S]*)<\/plist>/.exec(text);
  if (!body) throw new Error("not a property list");
  const tokens = [...body[1].matchAll(/<(\/?)(\w+)(\/?)>|([^<]+)/g)].filter((m) => !(m[4] && m[4].trim() === ""));
  let i = 0;
  const expect = (name, closing) => {
    const t = tokens[i++];
    if (!t || t[2] !== name || Boolean(t[1]) !== closing) throw new Error(`expected <${closing ? "/" : ""}${name}>`);
  };
  const text_ = () => (tokens[i] && tokens[i][4] !== undefined ? unescape(tokens[i++][4]) : "");
  const value = () => {
    const t = tokens[i];
    if (!t || t[1]) throw new Error("expected a value");
    const name = t[2];
    i += 1;
    if (t[3]) {
      if (name === "true") return true;
      if (name === "false") return false;
      if (name === "string") return "";
      if (name === "dict") return {};
      if (name === "array") return [];
      throw new Error(`unexpected <${name}/>`);
    }
    if (name === "dict") {
      const out = {};
      while (!(tokens[i][1] && tokens[i][2] === "dict")) {
        expect("key", false);
        const key = text_();
        expect("key", true);
        out[key] = value();
      }
      i += 1;
      return out;
    }
    if (name === "array") {
      const out = [];
      while (!(tokens[i][1] && tokens[i][2] === "array")) out.push(value());
      i += 1;
      return out;
    }
    if (["string", "integer", "real", "date", "data"].includes(name)) {
      const raw = text_();
      expect(name, true);
      return name === "integer" || name === "real" ? Number(raw) : raw;
    }
    throw new Error(`unsupported <${name}>`);
  };
  const result = value();
  if (i !== tokens.length) throw new Error("trailing content in the property list");
  return result;
};
