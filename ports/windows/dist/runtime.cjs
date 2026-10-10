"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// ports/windows/src/compatibility.mjs
var FINGERPRINT_KEYS = [
  "build",
  "ubr",
  "architecture",
  "explorerVersion",
  "explorerFixedVersion",
  "startDockedVersion",
  "settingsVersion",
  "shellExperienceVersion",
  "searchVersion",
  "startPackageVersion",
  "shellPackageVersion",
  "clientPackageVersion",
  "startLayout"
];
function shellCompatibility(actual, entries) {
  const missing = FINGERPRINT_KEYS.filter((key) => actual?.[key] === void 0 || actual[key] === "" || actual[key] === "unknown");
  if (missing.length) return { compatible: false, reason: "Missing or unknown shell inputs", fields: missing };
  const match = entries.find((entry) => FINGERPRINT_KEYS.every((key) => entry[key] === actual[key]));
  if (!match) return { compatible: false, reason: "Unreviewed shell fingerprint", actual };
  return { compatible: true, startLayout: actual.startLayout, status: match.status };
}
function stylerSettings(base, variants, layout) {
  if (!variants) return base;
  if (!Object.hasOwn(variants, layout)) throw Error("Unknown Start layout; styler remains disabled");
  return { webContentStyles: [], ...base, disableNewStartMenuLayout: "default", controlStyles: [...base.controlStyles, ...variants[layout]] };
}
function flattenStylerSettings(value, prefix = "", out = {}) {
  if (prefix === "" && value && Array.isArray(value.controlStyles)) {
    for (const key of ["themeResourceVariables", "styleConstants"])
      if (!Object.hasOwn(value, key)) out[`${key}[0]`] = "";
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => flattenStylerSettings(item, `${prefix}[${index}]`, out));
    if (prefix === "controlStyles" || prefix === "webContentStyles") out[`${prefix}[${value.length}].target`] = "";
    else if (prefix === "themeResourceVariables" || prefix === "styleConstants" || /^(?:controlStyles|webContentStyles)\[\d+\]\.styles$/.test(prefix))
      out[`${prefix}[${value.length}]`] = "";
  } else if (value !== null && typeof value === "object") {
    for (const [key, item] of Object.entries(value)) flattenStylerSettings(item, prefix ? `${prefix}.${key}` : key, out);
  } else out[prefix] = value;
  return out;
}

// ports/windows/src/settings-styler-source.mjs
var import_node_crypto = require("node:crypto");
var digest = (bytes) => (0, import_node_crypto.createHash)("sha256").update(bytes).digest("hex");
function replaceOnce(source2, anchor, replacement) {
  const index = source2.indexOf(anchor);
  if (index < 0 || source2.indexOf(anchor, index + anchor.length) >= 0) throw Error("Settings adapter source structure differs");
  return source2.slice(0, index) + replacement + source2.slice(index + anchor.length);
}
function settingsStylerSource(bytes, patch) {
  if (!patch || !/^[a-f0-9]{64}$/.test(patch.sourceSha256) || digest(bytes) !== patch.sourceSha256)
    throw Error("Settings upstream source digest differs");
  if (typeof patch.replacement !== "string" || !patch.replacement.includes("HWND GetCoreWnd() {") || !patch.replacement.includes("namespace j3w1Settings") || /@[A-Z0-9_]+@/.test(patch.replacement))
    throw Error("Invalid Settings discovery fragment");
  let source2 = bytes.toString("utf8").replace(/\r\n/g, "\n");
  const begin = "HWND GetCoreWnd() {", end = "PTP_TIMER g_statsTimer;";
  const start = source2.indexOf(begin), finish = source2.indexOf(end);
  if (start < 0 || finish < start || source2.indexOf(begin, start + begin.length) >= 0 || source2.indexOf(end, finish + end.length) >= 0)
    throw Error("Settings adapter discovery structure differs");
  source2 = source2.slice(0, start) + patch.replacement + "\n\n" + source2.slice(finish);
  source2 = replaceOnce(source2, "// @compilerOptions -lcomctl32", "// @compilerOptions -lbcrypt -lcomctl32");
  source2 = replaceOnce(source2, "BOOL Wh_ModInit() {\n", "BOOL Wh_ModInit() {\n    if (!j3w1Settings::Admit()) return FALSE;\n");
  return Buffer.from(source2);
}

// ports/windows/src/runtime.mjs
var import_node_fs2 = __toESM(require("node:fs"), 1);
var import_node_path2 = __toESM(require("node:path"), 1);
var import_node_crypto3 = __toESM(require("node:crypto"), 1);
var import_node_child_process = require("node:child_process");
var import_node_util = require("node:util");

// node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value2 = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value2 = value2 * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value2 = value2 * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value2 = value2 * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value2 = -1;
    }
    return value2;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start, pos);
      }
    }
    let end = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start, end);
  }
  function scanString() {
    let result = "", start = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += "\n";
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "	";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += "\n";
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      // tokens: []{}:,
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      // strings
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      // comments
      case 47:
        const start = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      // numbers
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      // found a minus, followed by a number so
      // we fall through to proceed with scanning
      // numbers
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      // literals and unknown symbols
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes2) {
  CharacterCodes2[CharacterCodes2["lineFeed"] = 10] = "lineFeed";
  CharacterCodes2[CharacterCodes2["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes2[CharacterCodes2["space"] = 32] = "space";
  CharacterCodes2[CharacterCodes2["_0"] = 48] = "_0";
  CharacterCodes2[CharacterCodes2["_1"] = 49] = "_1";
  CharacterCodes2[CharacterCodes2["_2"] = 50] = "_2";
  CharacterCodes2[CharacterCodes2["_3"] = 51] = "_3";
  CharacterCodes2[CharacterCodes2["_4"] = 52] = "_4";
  CharacterCodes2[CharacterCodes2["_5"] = 53] = "_5";
  CharacterCodes2[CharacterCodes2["_6"] = 54] = "_6";
  CharacterCodes2[CharacterCodes2["_7"] = 55] = "_7";
  CharacterCodes2[CharacterCodes2["_8"] = 56] = "_8";
  CharacterCodes2[CharacterCodes2["_9"] = 57] = "_9";
  CharacterCodes2[CharacterCodes2["a"] = 97] = "a";
  CharacterCodes2[CharacterCodes2["b"] = 98] = "b";
  CharacterCodes2[CharacterCodes2["c"] = 99] = "c";
  CharacterCodes2[CharacterCodes2["d"] = 100] = "d";
  CharacterCodes2[CharacterCodes2["e"] = 101] = "e";
  CharacterCodes2[CharacterCodes2["f"] = 102] = "f";
  CharacterCodes2[CharacterCodes2["g"] = 103] = "g";
  CharacterCodes2[CharacterCodes2["h"] = 104] = "h";
  CharacterCodes2[CharacterCodes2["i"] = 105] = "i";
  CharacterCodes2[CharacterCodes2["j"] = 106] = "j";
  CharacterCodes2[CharacterCodes2["k"] = 107] = "k";
  CharacterCodes2[CharacterCodes2["l"] = 108] = "l";
  CharacterCodes2[CharacterCodes2["m"] = 109] = "m";
  CharacterCodes2[CharacterCodes2["n"] = 110] = "n";
  CharacterCodes2[CharacterCodes2["o"] = 111] = "o";
  CharacterCodes2[CharacterCodes2["p"] = 112] = "p";
  CharacterCodes2[CharacterCodes2["q"] = 113] = "q";
  CharacterCodes2[CharacterCodes2["r"] = 114] = "r";
  CharacterCodes2[CharacterCodes2["s"] = 115] = "s";
  CharacterCodes2[CharacterCodes2["t"] = 116] = "t";
  CharacterCodes2[CharacterCodes2["u"] = 117] = "u";
  CharacterCodes2[CharacterCodes2["v"] = 118] = "v";
  CharacterCodes2[CharacterCodes2["w"] = 119] = "w";
  CharacterCodes2[CharacterCodes2["x"] = 120] = "x";
  CharacterCodes2[CharacterCodes2["y"] = 121] = "y";
  CharacterCodes2[CharacterCodes2["z"] = 122] = "z";
  CharacterCodes2[CharacterCodes2["A"] = 65] = "A";
  CharacterCodes2[CharacterCodes2["B"] = 66] = "B";
  CharacterCodes2[CharacterCodes2["C"] = 67] = "C";
  CharacterCodes2[CharacterCodes2["D"] = 68] = "D";
  CharacterCodes2[CharacterCodes2["E"] = 69] = "E";
  CharacterCodes2[CharacterCodes2["F"] = 70] = "F";
  CharacterCodes2[CharacterCodes2["G"] = 71] = "G";
  CharacterCodes2[CharacterCodes2["H"] = 72] = "H";
  CharacterCodes2[CharacterCodes2["I"] = 73] = "I";
  CharacterCodes2[CharacterCodes2["J"] = 74] = "J";
  CharacterCodes2[CharacterCodes2["K"] = 75] = "K";
  CharacterCodes2[CharacterCodes2["L"] = 76] = "L";
  CharacterCodes2[CharacterCodes2["M"] = 77] = "M";
  CharacterCodes2[CharacterCodes2["N"] = 78] = "N";
  CharacterCodes2[CharacterCodes2["O"] = 79] = "O";
  CharacterCodes2[CharacterCodes2["P"] = 80] = "P";
  CharacterCodes2[CharacterCodes2["Q"] = 81] = "Q";
  CharacterCodes2[CharacterCodes2["R"] = 82] = "R";
  CharacterCodes2[CharacterCodes2["S"] = 83] = "S";
  CharacterCodes2[CharacterCodes2["T"] = 84] = "T";
  CharacterCodes2[CharacterCodes2["U"] = 85] = "U";
  CharacterCodes2[CharacterCodes2["V"] = 86] = "V";
  CharacterCodes2[CharacterCodes2["W"] = 87] = "W";
  CharacterCodes2[CharacterCodes2["X"] = 88] = "X";
  CharacterCodes2[CharacterCodes2["Y"] = 89] = "Y";
  CharacterCodes2[CharacterCodes2["Z"] = 90] = "Z";
  CharacterCodes2[CharacterCodes2["asterisk"] = 42] = "asterisk";
  CharacterCodes2[CharacterCodes2["backslash"] = 92] = "backslash";
  CharacterCodes2[CharacterCodes2["closeBrace"] = 125] = "closeBrace";
  CharacterCodes2[CharacterCodes2["closeBracket"] = 93] = "closeBracket";
  CharacterCodes2[CharacterCodes2["colon"] = 58] = "colon";
  CharacterCodes2[CharacterCodes2["comma"] = 44] = "comma";
  CharacterCodes2[CharacterCodes2["dot"] = 46] = "dot";
  CharacterCodes2[CharacterCodes2["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes2[CharacterCodes2["minus"] = 45] = "minus";
  CharacterCodes2[CharacterCodes2["openBrace"] = 123] = "openBrace";
  CharacterCodes2[CharacterCodes2["openBracket"] = 91] = "openBracket";
  CharacterCodes2[CharacterCodes2["plus"] = 43] = "plus";
  CharacterCodes2[CharacterCodes2["slash"] = 47] = "slash";
  CharacterCodes2[CharacterCodes2["formFeed"] = 12] = "formFeed";
  CharacterCodes2[CharacterCodes2["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + " ".repeat(index);
    })
  },
  "	": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\n" + "	".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "	".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r\n" + "	".repeat(index);
    })
  }
};
var supportedEols = ["\n", "\r", "\r\n"];

// node_modules/jsonc-parser/lib/esm/impl/format.js
function format(documentText, range, options) {
  let initialIndentLevel;
  let formatText;
  let formatTextStart;
  let rangeStart;
  let rangeEnd;
  if (range) {
    rangeStart = range.offset;
    rangeEnd = rangeStart + range.length;
    formatTextStart = rangeStart;
    while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
      formatTextStart--;
    }
    let endOffset = rangeEnd;
    while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
      endOffset++;
    }
    formatText = documentText.substring(formatTextStart, endOffset);
    initialIndentLevel = computeIndentLevel(formatText, options);
  } else {
    formatText = documentText;
    initialIndentLevel = 0;
    formatTextStart = 0;
    rangeStart = 0;
    rangeEnd = documentText.length;
  }
  const eol = getEOL(options, documentText);
  const eolFastPathSupported = supportedEols.includes(eol);
  let numberLineBreaks = 0;
  let indentLevel = 0;
  let indentValue;
  if (options.insertSpaces) {
    indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
  } else {
    indentValue = "	";
  }
  const indentType = indentValue === "	" ? "	" : " ";
  let scanner = createScanner(formatText, false);
  let hasError = false;
  function newLinesAndIndent() {
    if (numberLineBreaks > 1) {
      return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
    if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) {
      return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    if (amountOfSpaces <= 0) {
      return eol;
    }
    return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
  }
  function scanNext() {
    let token = scanner.scan();
    numberLineBreaks = 0;
    while (token === 15 || token === 14) {
      if (token === 14 && options.keepLines) {
        numberLineBreaks += 1;
      } else if (token === 14) {
        numberLineBreaks = 1;
      }
      token = scanner.scan();
    }
    hasError = token === 16 || scanner.getTokenError() !== 0;
    return token;
  }
  const editOperations = [];
  function addEdit(text, startOffset, endOffset) {
    if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) {
      editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
    }
  }
  let firstToken = scanNext();
  if (options.keepLines && numberLineBreaks > 0) {
    addEdit(repeat(eol, numberLineBreaks), 0, 0);
  }
  if (firstToken !== 17) {
    let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
    let initialIndent = indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel);
    addEdit(initialIndent, formatTextStart, firstTokenStart);
  }
  while (firstToken !== 17) {
    let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
    let secondToken = scanNext();
    let replaceContent = "";
    let needsLineBreak = false;
    while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
      let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
      addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
      firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
      needsLineBreak = secondToken === 12;
      replaceContent = needsLineBreak ? newLinesAndIndent() : "";
      secondToken = scanNext();
    }
    if (secondToken === 2) {
      if (firstToken !== 1) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else if (secondToken === 4) {
      if (firstToken !== 3) {
        indentLevel--;
      }
      ;
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else {
      switch (firstToken) {
        case 3:
        case 1:
          indentLevel++;
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 5:
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 12:
          replaceContent = newLinesAndIndent();
          break;
        case 13:
          if (numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 6:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 10:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (secondToken === 6 && !needsLineBreak) {
            replaceContent = "";
          }
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else {
            if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) {
              replaceContent = cachedSpaces[1];
            } else if (secondToken !== 5 && secondToken !== 17) {
              hasError = true;
            }
          }
          break;
        case 16:
          hasError = true;
          break;
      }
      if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) {
        replaceContent = newLinesAndIndent();
      }
    }
    if (secondToken === 17) {
      if (options.keepLines && numberLineBreaks > 0) {
        replaceContent = newLinesAndIndent();
      } else {
        replaceContent = options.insertFinalNewline ? eol : "";
      }
    }
    const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
    addEdit(replaceContent, firstTokenEnd, secondTokenStart);
    firstToken = secondToken;
  }
  return editOperations;
}
function repeat(s, count) {
  let result = "";
  for (let i = 0; i < count; i++) {
    result += s;
  }
  return result;
}
function computeIndentLevel(content, options) {
  let i = 0;
  let nChars = 0;
  const tabSize = options.tabSize || 4;
  while (i < content.length) {
    let ch = content.charAt(i);
    if (ch === cachedSpaces[1]) {
      nChars++;
    } else if (ch === "	") {
      nChars += tabSize;
    } else {
      break;
    }
    i++;
  }
  return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === "\r") {
      if (i + 1 < text.length && text.charAt(i + 1) === "\n") {
        return "\r\n";
      }
      return "\r";
    } else if (ch === "\n") {
      return "\n";
    }
  }
  return options && options.eol || "\n";
}
function isEOL(text, offset) {
  return "\r\n".indexOf(text.charAt(offset)) !== -1;
}

// node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions2) {
  ParseOptions2.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentParent = { type: "array", offset: -1, length: -1, children: [], parent: void 0 };
  function ensurePropertyComplete(endOffset) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent;
    }
  }
  function onValue(valueNode) {
    currentParent.children.push(valueNode);
    return valueNode;
  }
  const visitor = {
    onObjectBegin: (offset) => {
      currentParent = onValue({ type: "object", offset, length: -1, parent: currentParent, children: [] });
    },
    onObjectProperty: (name, offset, length) => {
      currentParent = onValue({ type: "property", offset, length: -1, parent: currentParent, children: [] });
      currentParent.children.push({ type: "string", value: name, offset, length, parent: currentParent });
    },
    onObjectEnd: (offset, length) => {
      ensurePropertyComplete(offset + length);
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset, length) => {
      currentParent = onValue({ type: "array", offset, length: -1, parent: currentParent, children: [] });
    },
    onArrayEnd: (offset, length) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value, offset, length) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep, offset, length) => {
      if (currentParent.type === "property") {
        if (sep === ":") {
          currentParent.colonOffset = offset;
        } else if (sep === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  const result = currentParent.children[0];
  if (result) {
    delete result.parent;
  }
  return result;
}
function findNodeAtLocation(root2, path3) {
  if (!root2) {
    return void 0;
  }
  let node = root2;
  for (let segment of path3) {
    if (typeof segment === "string") {
      if (node.type !== "object" || !Array.isArray(node.children)) {
        return void 0;
      }
      let found = false;
      for (const propertyNode of node.children) {
        if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment && propertyNode.children.length === 2) {
          node = propertyNode.children[1];
          found = true;
          break;
        }
      }
      if (!found) {
        return void 0;
      }
    } else {
      const index = segment;
      if (node.type !== "array" || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
        return void 0;
      }
      node = node.children[index];
    }
  }
  return node;
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(
            14
            /* ParseErrorCode.InvalidUnicode */
          );
          break;
        case 5:
          handleError(
            15
            /* ParseErrorCode.InvalidEscapeCharacter */
          );
          break;
        case 3:
          handleError(
            13
            /* ParseErrorCode.UnexpectedEndOfNumber */
          );
          break;
        case 1:
          if (!disallowComments) {
            handleError(
              11
              /* ParseErrorCode.UnexpectedEndOfComment */
            );
          }
          break;
        case 2:
          handleError(
            12
            /* ParseErrorCode.UnexpectedEndOfString */
          );
          break;
        case 6:
          handleError(
            16
            /* ParseErrorCode.InvalidCharacter */
          );
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(
              10
              /* ParseErrorCode.InvalidCommentToken */
            );
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(
            1
            /* ParseErrorCode.InvalidSymbol */
          );
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(
            2
            /* ParseErrorCode.InvalidNumberFormat */
          );
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
    } else {
      handleError(5, [], [
        2,
        5
        /* SyntaxKind.CommaToken */
      ]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [
          2,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [
        2
        /* SyntaxKind.CloseBraceToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [
          4,
          5
          /* SyntaxKind.CommaToken */
        ]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [
        4
        /* SyntaxKind.CloseBracketToken */
      ], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}
function getNodeType(value) {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

// node_modules/jsonc-parser/lib/esm/impl/edit.js
function setProperty(text, originalPath, value, options) {
  const path3 = originalPath.slice();
  const errors = [];
  const root2 = parseTree(text, errors);
  let parent = void 0;
  let lastSegment = void 0;
  while (path3.length > 0) {
    lastSegment = path3.pop();
    parent = findNodeAtLocation(root2, path3);
    if (parent === void 0 && value !== void 0) {
      if (typeof lastSegment === "string") {
        value = { [lastSegment]: value };
      } else {
        value = [value];
      }
    } else {
      break;
    }
  }
  if (!parent) {
    if (value === void 0) {
      throw new Error("Can not delete in empty document");
    }
    return withFormatting(text, { offset: root2 ? root2.offset : 0, length: root2 ? root2.length : 0, content: JSON.stringify(value) }, options);
  } else if (parent.type === "object" && typeof lastSegment === "string" && Array.isArray(parent.children)) {
    const existing = findNodeAtLocation(parent, [lastSegment]);
    if (existing !== void 0) {
      if (value === void 0) {
        if (!existing.parent) {
          throw new Error("Malformed AST");
        }
        const propertyIndex = parent.children.indexOf(existing.parent);
        let removeBegin;
        let removeEnd = existing.parent.offset + existing.parent.length;
        if (propertyIndex > 0) {
          let previous = parent.children[propertyIndex - 1];
          removeBegin = previous.offset + previous.length;
        } else {
          removeBegin = parent.offset + 1;
          if (parent.children.length > 1) {
            let next = parent.children[1];
            removeEnd = next.offset;
          }
        }
        return withFormatting(text, { offset: removeBegin, length: removeEnd - removeBegin, content: "" }, options);
      } else {
        return withFormatting(text, { offset: existing.offset, length: existing.length, content: JSON.stringify(value) }, options);
      }
    } else {
      if (value === void 0) {
        return [];
      }
      const newProperty = `${JSON.stringify(lastSegment)}: ${JSON.stringify(value)}`;
      const index = options.getInsertionIndex ? options.getInsertionIndex(parent.children.map((p) => p.children[0].value)) : parent.children.length;
      let edit;
      if (index > 0) {
        let previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      } else if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty + "," };
      }
      return withFormatting(text, edit, options);
    }
  } else if (parent.type === "array" && typeof lastSegment === "number" && Array.isArray(parent.children)) {
    const insertIndex = lastSegment;
    if (insertIndex === -1) {
      const newProperty = `${JSON.stringify(value)}`;
      let edit;
      if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        const previous = parent.children[parent.children.length - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else if (value === void 0 && parent.children.length >= 0) {
      const removalIndex = lastSegment;
      const toRemove = parent.children[removalIndex];
      let edit;
      if (parent.children.length === 1) {
        edit = { offset: parent.offset + 1, length: parent.length - 2, content: "" };
      } else if (parent.children.length - 1 === removalIndex) {
        let previous = parent.children[removalIndex - 1];
        let offset = previous.offset + previous.length;
        let parentEndOffset = parent.offset + parent.length;
        edit = { offset, length: parentEndOffset - 2 - offset, content: "" };
      } else {
        edit = { offset: toRemove.offset, length: parent.children[removalIndex + 1].offset - toRemove.offset, content: "" };
      }
      return withFormatting(text, edit, options);
    } else if (value !== void 0) {
      let edit;
      const newProperty = `${JSON.stringify(value)}`;
      if (!options.isArrayInsertion && parent.children.length > lastSegment) {
        const toModify = parent.children[lastSegment];
        edit = { offset: toModify.offset, length: toModify.length, content: newProperty };
      } else if (parent.children.length === 0 || lastSegment === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: parent.children.length === 0 ? newProperty : newProperty + "," };
      } else {
        const index = lastSegment > parent.children.length ? parent.children.length : lastSegment;
        const previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else {
      throw new Error(`Can not ${value === void 0 ? "remove" : options.isArrayInsertion ? "insert" : "modify"} Array index ${insertIndex} as length is not sufficient`);
    }
  } else {
    throw new Error(`Can not add ${typeof lastSegment !== "number" ? "index" : "property"} to parent of type ${parent.type}`);
  }
}
function withFormatting(text, edit, options) {
  if (!options.formattingOptions) {
    return [edit];
  }
  let newText = applyEdit(text, edit);
  let begin = edit.offset;
  let end = edit.offset + edit.content.length;
  if (edit.length === 0 || edit.content.length === 0) {
    while (begin > 0 && !isEOL(newText, begin - 1)) {
      begin--;
    }
    while (end < newText.length && !isEOL(newText, end)) {
      end++;
    }
  }
  const edits = format(newText, { offset: begin, length: end - begin }, { ...options.formattingOptions, keepLines: false });
  for (let i = edits.length - 1; i >= 0; i--) {
    const edit2 = edits[i];
    newText = applyEdit(newText, edit2);
    begin = Math.min(begin, edit2.offset);
    end = Math.max(end, edit2.offset + edit2.length);
    end += edit2.content.length - edit2.length;
  }
  const editLength = text.length - (newText.length - end) - begin;
  return [{ offset: begin, length: editLength, content: newText.substring(begin, end) }];
}
function applyEdit(text, edit) {
  return text.substring(0, edit.offset) + edit.content + text.substring(edit.offset + edit.length);
}

// node_modules/jsonc-parser/lib/esm/main.js
var ScanError;
(function(ScanError2) {
  ScanError2[ScanError2["None"] = 0] = "None";
  ScanError2[ScanError2["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError2[ScanError2["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError2[ScanError2["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError2[ScanError2["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError2[ScanError2["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError2[ScanError2["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind2) {
  SyntaxKind2[SyntaxKind2["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind2[SyntaxKind2["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind2[SyntaxKind2["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind2[SyntaxKind2["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind2[SyntaxKind2["CommaToken"] = 5] = "CommaToken";
  SyntaxKind2[SyntaxKind2["ColonToken"] = 6] = "ColonToken";
  SyntaxKind2[SyntaxKind2["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind2[SyntaxKind2["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind2[SyntaxKind2["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind2[SyntaxKind2["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind2[SyntaxKind2["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind2[SyntaxKind2["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind2[SyntaxKind2["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind2[SyntaxKind2["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind2[SyntaxKind2["Trivia"] = 15] = "Trivia";
  SyntaxKind2[SyntaxKind2["Unknown"] = 16] = "Unknown";
  SyntaxKind2[SyntaxKind2["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse2 = parse;
var ParseErrorCode;
(function(ParseErrorCode2) {
  ParseErrorCode2[ParseErrorCode2["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode2[ParseErrorCode2["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode2[ParseErrorCode2["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode2[ParseErrorCode2["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode2[ParseErrorCode2["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode2[ParseErrorCode2["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode2[ParseErrorCode2["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode2[ParseErrorCode2["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode2[ParseErrorCode2["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode2[ParseErrorCode2["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode2[ParseErrorCode2["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode2[ParseErrorCode2["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode2[ParseErrorCode2["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function modify(text, path3, value, options) {
  return setProperty(text, path3, value, options);
}
function applyEdits(text, edits) {
  let sortedEdits = edits.slice(0).sort((a, b) => {
    const diff = a.offset - b.offset;
    if (diff === 0) {
      return a.length - b.length;
    }
    return diff;
  });
  let lastModifiedOffset = text.length;
  for (let i = sortedEdits.length - 1; i >= 0; i--) {
    let e = sortedEdits[i];
    if (e.offset + e.length <= lastModifiedOffset) {
      text = applyEdit(text, e);
    } else {
      throw new Error("Overlapping edit");
    }
    lastModifiedOffset = e.offset;
  }
  return text;
}

// scripts/lib/host-install/files.mjs
var import_node_fs = __toESM(require("node:fs"), 1);
var import_node_path = __toESM(require("node:path"), 1);
var import_node_crypto2 = require("node:crypto");
var sha256Hex = (bytes) => (0, import_node_crypto2.createHash)("sha256").update(bytes).digest("hex");
function writeDurableTemp(target, bytes, { mode = 384 } = {}) {
  const temp = import_node_path.default.join(import_node_path.default.dirname(target), `.${import_node_path.default.basename(target)}.j3w1-${(0, import_node_crypto2.randomUUID)()}.tmp`);
  let fd;
  try {
    fd = import_node_fs.default.openSync(temp, "wx", mode);
    import_node_fs.default.writeFileSync(fd, bytes);
    import_node_fs.default.fsyncSync(fd);
    import_node_fs.default.closeSync(fd);
    fd = void 0;
    return temp;
  } catch (error) {
    if (fd !== void 0) import_node_fs.default.closeSync(fd);
    if (import_node_fs.default.existsSync(temp)) import_node_fs.default.unlinkSync(temp);
    throw error;
  }
}
function replaceDurableTemp(temp, target, {
  beforeAttempt = () => {
  },
  attempts = 40,
  delay = 25,
  rename = import_node_fs.default.renameSync,
  sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms),
  platform = process.platform
} = {}) {
  for (let attempt = 0; ; attempt++) {
    beforeAttempt();
    try {
      return rename(temp, target);
    } catch (error) {
      if (platform !== "win32" || !["EPERM", "EACCES", "EBUSY"].includes(error.code) || attempt + 1 >= attempts) throw error;
      sleep(delay);
    }
  }
}

// ports/windows/src/runtime.mjs
var args = JSON.parse(import_node_fs2.default.readFileSync(0, "utf8"));
var source = import_node_path2.default.resolve(args.source);
var state = import_node_path2.default.resolve(args.state);
var action = args.action;
var fixture = args.fixture === true;
if (process.platform !== "win32" && !fixture) throw Error("Run on native Windows.");
var read = (p) => import_node_fs2.default.readFileSync(safe(p), "utf8");
var json = (p) => JSON.parse(read(p).replace(/^\uFEFF/, ""));
var eq = import_node_util.isDeepStrictEqual;
var root = fixture ? import_node_path2.default.join(state, "fixture") : process.env.LOCALAPPDATA;
var settings = json(import_node_path2.default.join(source, "dist/windows-settings.json"));
var v = settings.values;
var journal = import_node_path2.default.join(state, "journal.json");
safe(source);
safe(state);
var mutating = !["Plan", "Test"].includes(action);
var lock = import_node_path2.default.join(state, "lifecycle.lock");
var lockFd;
if (mutating) {
  import_node_fs2.default.mkdirSync(state, { recursive: true });
  try {
    lockFd = import_node_fs2.default.openSync(safe(lock), "wx", 384);
  } catch (error) {
    throw Error("Another lifecycle owns lifecycle.lock. If interrupted, verify its recorded process has ended before removing this lock and running Restore.");
  }
  import_node_fs2.default.writeFileSync(lockFd, JSON.stringify({ pid: process.pid, action }));
  process.on("exit", () => {
    import_node_fs2.default.closeSync(lockFd);
    import_node_fs2.default.unlinkSync(lock);
  });
}
var history = import_node_fs2.default.existsSync(journal) ? json(journal) : { schemaVersion: 1, transactions: [] };
if (history.schemaVersion !== 1 || !Array.isArray(history.transactions)) throw Error("Unsupported recovery journal");
function safe(p) {
  p = import_node_path2.default.resolve(p);
  for (let q = p; ; q = import_node_path2.default.dirname(q)) {
    try {
      if (import_node_fs2.default.lstatSync(q).isSymbolicLink()) throw Error(`Reparse/symlink refused: ${q}`);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (import_node_path2.default.dirname(q) === q) break;
  }
  return p;
}
function atomic(p, b) {
  safe(p);
  import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(p), { recursive: true });
  const temp = writeDurableTemp(p, b);
  try {
    replaceDurableTemp(temp, p, { beforeAttempt: () => safe(p) });
  } finally {
    if (import_node_fs2.default.existsSync(temp)) import_node_fs2.default.unlinkSync(temp);
  }
}
function persist() {
  atomic(journal, JSON.stringify(history, null, 2) + "\n");
}
function ps(request) {
  if (fixture) {
    const p = import_node_path2.default.join(root, "registry.json"), reg = import_node_fs2.default.existsSync(p) ? json(p) : {};
    if (request.operation === "get") {
      const key = request.key + "|" + request.name;
      return reg[key] ?? { exists: false };
    }
    if (request.operation === "set") {
      const key = request.key + "|" + request.name;
      if (request.value.exists) reg[key] = request.value;
      else delete reg[key];
      atomic(p, JSON.stringify(reg));
      return { ok: true };
    }
    return { ok: true };
  }
  const r = (0, import_node_child_process.spawnSync)(args.pwsh, ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", import_node_path2.default.join(source, "adapter.ps1")], { input: JSON.stringify(request), encoding: "utf8", windowsHide: true });
  if (r.status !== 0) throw Error(`Windows adapter failed: ${r.stderr.trim()}`);
  return JSON.parse(r.stdout.trim());
}
function lockscreen(request) {
  if (fixture) {
    const file = import_node_path2.default.join(root, "lockscreen.json");
    if (request.operation === "get") return import_node_fs2.default.existsSync(file) ? json(file) : { exists: false };
    atomic(file, JSON.stringify(request.value));
    return { ok: true };
  }
  const executable = import_node_path2.default.join(process.env.windir, "System32/WindowsPowerShell/v1.0/powershell.exe");
  const result = (0, import_node_child_process.spawnSync)(executable, ["-NoLogo", "-NoProfile", "-NonInteractive", "-File", import_node_path2.default.join(source, "lockscreen.ps1")], { input: JSON.stringify(request), encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0) throw Error(`Lock-screen API failed: ${result.stderr.trim()}`);
  return JSON.parse(result.stdout.trim());
}
function parseConfig(text) {
  const errors = [];
  const value = parse2(text.replace(/^\uFEFF/, ""), errors, { allowTrailingComma: true, disallowComments: false });
  if (errors.length || value === null || typeof value !== "object" || Array.isArray(value)) throw Error("Malformed JSON/JSONC settings; no edits made");
  return value;
}
function getAt(obj, parts) {
  let cur = obj;
  for (const key of parts) {
    if (cur === null || typeof cur !== "object" || !Object.hasOwn(cur, key)) return { exists: false };
    cur = cur[key];
  }
  return { exists: true, value: cur };
}
function keysFor(op, config, writing = false) {
  if (op.member) {
    const slot = getAt(config, op.member.collection), items = slot.exists ? slot.value : [];
    if (!Array.isArray(items)) throw Error("Managed collection is not an array");
    const matches2 = items.map((item, i) => ({ item, i })).filter(({ item }) => item?.[op.member.key] === op.member.value);
    if (matches2.length > 1) throw Error("Duplicate managed collection identity");
    return [...op.member.collection, matches2[0]?.i ?? items.length, ...op.keys];
  }
  if (!op.profile) return op.keys;
  const profiles = config.profiles?.list;
  if (!Array.isArray(profiles)) throw Error("Terminal profile list was removed; restore conflict");
  const matches = profiles.map((p, i) => ({ p, i })).filter(({ p }) => p[op.profile.key] === op.profile.value);
  if (matches.length !== 1) throw Error("Terminal profile identity changed; restore conflict");
  return ["profiles", "list", matches[0].i, ...op.keys];
}
function get(op) {
  if (op.path) safe(op.path);
  if (op.kind === "lockscreen") return lockscreen({ operation: "get" });
  if (op.kind === "windhawk-setting") {
    if (!import_node_fs2.default.existsSync(windhawk) && !fixture) return { exists: false };
    return { exists: true, value: wh(["app", "settings", "get"]).settings[op.name] };
  }
  if (op.kind === "registry") return ps({ operation: "get", key: op.key, name: op.name });
  if (op.kind === "json") {
    const text = import_node_fs2.default.existsSync(op.path) ? read(op.path) : "{}";
    const config = parseConfig(text);
    return getAt(config, keysFor(op, config));
  }
  if (op.kind === "file") {
    return import_node_fs2.default.existsSync(op.path) ? { exists: true, value: import_node_fs2.default.readFileSync(op.path).toString("base64") } : { exists: false };
  }
  throw Error("Unknown operation");
}
function put(op, value) {
  if (op.kind === "lockscreen") {
    if (!value.exists || ![".jpg", ".jpeg", ".png", ".bmp"].includes(value.extension)) throw Error("Invalid lock-screen recovery image");
    const bytes = Buffer.from(value.value, "base64"), file = import_node_path2.default.join(state, "recovery", "lockscreen-" + sha256Hex(bytes) + value.extension);
    atomic(file, bytes);
    lockscreen({ operation: "set", path: file, value });
    return;
  }
  if (op.kind === "windhawk-setting") {
    if (value.exists) wh(["app", "settings", "set", op.name, String(value.value)]);
    return;
  }
  if (op.kind === "registry") return ps({ operation: "set", key: op.key, name: op.name, value });
  if (op.kind === "file") {
    if (value.exists) atomic(op.path, Buffer.from(value.value, "base64"));
    else if (import_node_fs2.default.existsSync(op.path)) {
      safe(op.path);
      import_node_fs2.default.unlinkSync(op.path);
    }
    return;
  }
  const old = import_node_fs2.default.existsSync(op.path) ? read(op.path) : "{}\n";
  parseConfig(old);
  const keys = keysFor(op, parseConfig(old));
  const bom = old.startsWith("\uFEFF") ? "\uFEFF" : "";
  const body = old.slice(bom.length);
  const next = bom + applyEdits(body, modify(body, keys, value.exists ? value.value : void 0, { formattingOptions: { insertSpaces: true, tabSize: 4, eol: old.includes("\r\n") ? "\r\n" : "\n" } }));
  const parsed = parseConfig(next);
  const expected = getAt(parsed, keysFor(op, parsed));
  if (!eq(expected, value)) throw Error("JSON edit verification failed");
  if (import_node_fs2.default.existsSync(op.path) && read(op.path) !== old) throw Error("Concurrent settings edit; retry when application is closed");
  atomic(op.path, next);
}
var ops = [];
if (["Plan", "Apply", "Update"].includes(action)) {
  const reg = (key, name, value, type = "DWord") => ops.push({ kind: "registry", key, name, after: { exists: true, value, type } });
  const file = (dest, from) => ops.push({ kind: "file", path: safe(dest), after: { exists: true, value: import_node_fs2.default.readFileSync(import_node_path2.default.join(source, "dist", from)).toString("base64") } });
  const set = (p, keys, value) => ops.push({ kind: "json", path: safe(p), keys, after: { exists: true, value } });
  const member = (p, collection, key, value, item) => ops.push({ kind: "json", path: safe(p), keys: [], member: { collection, key, value }, after: { exists: true, value: item } });
  if (args.mode === "Full" && (!fixture || args.fixtureWindhawk)) {
    const startupTarget = safe(args.guardPwsh ?? args.pwsh ?? (fixture ? import_node_path2.default.join(state, "fixture/runtime/pwsh.exe") : null));
    const quote = (value) => '"' + String(value).replace(/(\\*)"/g, '$1$1\\"').replace(/(\\+)$/, "$1$1") + '"';
    for (const value of [startupTarget, source, state]) if (/[\r\n\0"]/.test(value)) throw Error("Invalid startup guard path");
    const startupArguments = `-NoLogo -NoProfile -NonInteractive -WindowStyle Hidden -File ${quote(import_node_path2.default.join(source, "install.ps1"))} -Action Guard -StateRoot ${quote(state)}`;
    const ownedStartup = history.transactions.filter((tx) => tx.status === "applied").flatMap((tx) => tx.operations).filter((op) => op.applied && op.kind === "file" && import_node_path2.default.basename(op.path) === "j3w1-theme-guard.lnk").at(-1);
    const startupSpec = { target: startupTarget, arguments: startupArguments, workingDirectory: source };
    if (ownedStartup?.after?.exists) startupSpec.expectedShortcut = { path: ownedStartup.path, value: ownedStartup.after.value };
    const startup = fixture ? { path: import_node_path2.default.join(root, "startup/j3w1-theme-guard.lnk"), value: Buffer.from(JSON.stringify({ target: startupTarget, arguments: startupArguments, workingDirectory: source })).toString("base64") } : ps({ operation: "startupShortcut", ...startupSpec });
    if (typeof startup.path !== "string" || typeof startup.value !== "string" || !startup.value) throw Error("Invalid startup shortcut result");
    ops.push({ kind: "file", path: safe(startup.path), after: { exists: true, value: startup.value } });
    ops.push({ kind: "registry", key: "Software\\Microsoft\\Windows\\CurrentVersion\\Run", name: "j3w1ThemeGuard", after: { exists: false } });
    ops.push({ kind: "windhawk-setting", name: "disableUpdateCheck", after: { exists: true, value: true } });
  }
  const personalization = "Software\\Microsoft\\Windows\\CurrentVersion\\Themes\\Personalize";
  reg(personalization, "AppsUseLightTheme", 0);
  reg(personalization, "SystemUsesLightTheme", 0);
  reg(personalization, "EnableTransparency", 0);
  reg(personalization, "ColorPrevalence", 0);
  const accent = v["native.accent"].slice(1), rgb = accent.match(/../g), abgr = parseInt("ff" + rgb.toReversed().join(""), 16), argb = parseInt("ff" + accent, 16);
  reg("Software\\Microsoft\\Windows\\DWM", "AccentColor", abgr);
  reg("Software\\Microsoft\\Windows\\DWM", "ColorizationColor", argb);
  reg("Software\\Microsoft\\Windows\\DWM", "ColorPrevalence", 1);
  reg("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Accent", "AccentColorMenu", abgr);
  const assets = import_node_path2.default.join(state, "assets");
  file(import_node_path2.default.join(assets, "j3w1-wallpaper.bmp"), "j3w1-wallpaper.bmp");
  for (const open of [false, true]) {
    const name = "j3w1-folder" + (open ? "-open" : "") + ".ico";
    file(import_node_path2.default.join(assets, name), name);
    reg("Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\Shell Icons", open ? "4" : "3", import_node_path2.default.join(assets, name), "String");
  }
  for (const category of ["Folder", "Directory"]) reg("Software\\Classes\\" + category + "\\DefaultIcon", "", import_node_path2.default.join(assets, "j3w1-folder.ico"), "String");
  const lockBaseline = lockscreen({ operation: "get" });
  if (lockBaseline.exists) ops.push({ kind: "lockscreen", after: { exists: true, value: import_node_fs2.default.readFileSync(import_node_path2.default.join(source, "dist/j3w1-wallpaper.bmp")).toString("base64"), extension: ".bmp" } });
  reg("Control Panel\\Desktop", "Wallpaper", import_node_path2.default.join(assets, "j3w1-wallpaper.bmp"), "String");
  reg("Control Panel\\Desktop", "WallpaperStyle", "10", "String");
  reg("Control Panel\\Desktop", "TileWallpaper", "0", "String");
  const cursorNames = ["Arrow", "Help", "AppStarting", "Wait", "Crosshair", "IBeam", "NWPen", "No", "SizeNS", "SizeWE", "SizeNWSE", "SizeNESW", "SizeAll", "UpArrow", "Hand", "Pin", "Person"];
  for (const name of cursorNames) {
    const f = "j3w1-" + name.toLowerCase() + ".cur";
    file(import_node_path2.default.join(assets, f), f);
    reg("Control Panel\\Cursors", name, import_node_path2.default.join(assets, f), "ExpandString");
  }
  if (/[\r\n]/.test(assets)) throw Error("Theme asset path contains a line break");
  const themeText = read(import_node_path2.default.join(source, "dist/j3w1.theme")).replaceAll("%LOCALAPPDATA%\\j3w1-theme\\windows\\assets", assets.replaceAll("/", "\\"));
  ops.push({ kind: "file", path: safe(import_node_path2.default.join(root, "Microsoft/Windows/Themes/j3w1-managed.theme")), after: { exists: true, value: Buffer.from(themeText).toString("base64") } });
  const terminal = fixture ? import_node_path2.default.join(root, "terminal/settings.json") : import_node_path2.default.join(root, "Packages/Microsoft.WindowsTerminal_8wekyb3d8bbwe/LocalState/settings.json");
  if (import_node_fs2.default.existsSync(terminal)) {
    file(import_node_path2.default.join(root, "Microsoft/Windows Terminal/Fragments/j3w1/j3w1.json"), "terminal-fragment.json");
    const config = parseConfig(read(terminal));
    member(terminal, ["themes"], "name", "j3w1", json(import_node_path2.default.join(source, "dist/terminal-theme.json")));
    set(terminal, ["theme"], "j3w1");
    set(terminal, ["profiles", "defaults", "colorScheme"], "j3w1");
    set(terminal, ["profiles", "defaults", "font", "face"], "SauceCodePro NFM");
    set(terminal, ["profiles", "defaults", "opacity"], 100);
    set(terminal, ["profiles", "defaults", "useAcrylic"], false);
    for (const profile of config.profiles?.list ?? []) {
      const key = profile.guid ? "guid" : "name", identity = { key, value: profile[key] };
      if (!identity.value || config.profiles.list.filter((p) => p[key] === identity.value).length !== 1) throw Error("Terminal profiles need unique GUIDs or names before theming");
      for (const [keys, value] of [[["colorScheme"], "j3w1"], [["font", "face"], "SauceCodePro NFM"], [["opacity"], 100], [["useAcrylic"], false]]) {
        ops.push({ kind: "json", path: safe(terminal), keys, profile: identity, after: { exists: true, value } });
      }
    }
  }
  const pt = import_node_path2.default.join(root, "Microsoft/PowerToys");
  for (const [module2, props] of Object.entries({ FancyZones: { fancyzones_zoneHighlightColor: v["powertoys.highlight"], fancyzones_zoneColor: v["powertoys.inactive"], fancyzones_zoneBorderColor: v["powertoys.border"], fancyzones_zoneNumberColor: v["powertoys.number"], fancyzones_systemTheme: false }, AlwaysOnTop: { "frame-color": v["native.accent"], "frame-accent-color": false, "frame-opacity": 100, "frame-thickness": 2, "round-corners-enabled": false } })) {
    const f = import_node_path2.default.join(pt, module2, "settings.json");
    if (import_node_fs2.default.existsSync(f)) {
      const x = parseConfig(read(f));
      for (const [k, val] of Object.entries(props)) {
        if (!Object.hasOwn(x.properties ?? {}, k)) throw Error(`Unsupported PowerToys setting ${module2}/${k}`);
        set(f, ["properties", k, "value"], val);
      }
    }
  }
  const layouts = import_node_path2.default.join(pt, "FancyZones/custom-layouts.json");
  if (import_node_fs2.default.existsSync(layouts)) {
    const added = json(import_node_path2.default.join(source, "dist/fancyzones-layouts.json"))["custom-layouts"];
    for (const item of added) member(layouts, ["custom-layouts"], "uuid", item.uuid, item);
  }
  const cmdpal = import_node_path2.default.join(root, "Packages/Microsoft.CommandPalette_8wekyb3d8bbwe/LocalState/settings.json");
  if (import_node_fs2.default.existsSync(cmdpal)) {
    const x = parseConfig(read(cmdpal));
    if (!x.CustomThemeColor || !["A", "R", "G", "B"].every((k) => Number.isInteger(x.CustomThemeColor[k]))) throw Error("Unsupported Command Palette color schema");
    const [R, G, B] = rgb.map((c) => parseInt(c, 16));
    for (const [key, value] of Object.entries({ Theme: "Dark", ColorizationMode: "CustomColor", CustomThemeColor: { A: 255, R, G, B }, CustomThemeColorIntensity: 15, BackdropStyle: "Clear", BackdropOpacity: 100 })) {
      if (!Object.hasOwn(x, key)) throw Error(`Unsupported Command Palette setting ${key}`);
      set(cmdpal, [key], value);
    }
  }
}
function compatibility() {
  if (fixture && !args.environment) return { compatible: args.compatible !== false, startLayout: "redesigned" };
  return shellCompatibility(fixture ? args.environment : ps({ operation: "environment" }), settings.compatibility);
}
function compat() {
  return compatibility().compatible;
}
var windhawk = import_node_path2.default.join(state, "tools/windhawk/2.0.0-alpha.6/windhawk-cli.exe");
function wh(argv, allowMissing = false) {
  const command = fixture && args.fixtureWindhawk ? process.execPath : windhawk;
  const prefix = fixture && args.fixtureWindhawk ? [args.fixtureWindhawk, state] : [];
  const r = (0, import_node_child_process.spawnSync)(command, [...prefix, "--json", ...argv], { encoding: "utf8", windowsHide: true, maxBuffer: 8 * 1024 * 1024 });
  if (r.error) throw r.error;
  const result = r.stdout.trim() ? JSON.parse(r.stdout) : null;
  if (allowMissing && result?.error?.code === "MOD_NOT_INSTALLED") return null;
  if (r.status !== 0 || result?.success === false) throw Error(`Windhawk ${argv.slice(0, 3).join(" ")} failed: ${result?.error?.message ?? r.stderr.trim()}`);
  return result?.data;
}
var fixtureEngineRunning = args.fixtureEngineStopped !== true;
function engineRunning(waitMs = 0) {
  if (fixture) return fixtureEngineRunning;
  return ps({ operation: "engine", path: safe(import_node_path2.default.join(import_node_path2.default.dirname(windhawk), "windhawk.exe")), waitMs }).running === true;
}
function startWindhawk() {
  if (engineRunning()) return;
  if (fixture) {
    if (args.fixtureEngineStartupFails) throw Error("Theme engine failed to start");
    fixtureEngineRunning = true;
    return;
  }
  const executable = safe(import_node_path2.default.join(import_node_path2.default.dirname(windhawk), "windhawk.exe"));
  if (!import_node_fs2.default.existsSync(executable)) throw Error("Retained theme engine is missing");
  const child = (0, import_node_child_process.spawn)(executable, ["-tray-only"], { detached: true, stdio: "ignore", windowsHide: true });
  child.on("error", () => {
  });
  child.unref();
  if (!engineRunning(15e3)) throw Error("Theme engine failed to start; enabled settings do not establish active rendering");
}
function modArtifact(shown) {
  const name = shown?.config?.libraryFileName;
  if (typeof name !== "string" || !name.startsWith(shown.id + "_") || !/^[A-Za-z0-9@._-]+\.dll$/.test(name)) return null;
  const file = safe(import_node_path2.default.join(import_node_path2.default.dirname(windhawk), "AppData/Engine/Mods/64", name));
  if (!import_node_fs2.default.existsSync(file) || !import_node_fs2.default.statSync(file).isFile()) return null;
  return { id: shown.id, version: shown.metadata?.version, config: shown.config, sha256: sha256Hex(import_node_fs2.default.readFileSync(file)) };
}
function compiledReceipt(mod) {
  return mod.restorationReceipts?.at(-1)?.artifact ?? mod.artifact;
}
function previousManagedMod(tx, id) {
  return history.transactions.slice(0, history.transactions.indexOf(tx)).filter((t) => t.status === "applied").at(-1)?.mods?.find((m) => m.id === id);
}
function exportedSourceDigest(file, id) {
  const data = json(file);
  if (data.format !== "windhawk-user-data-v1" || !Array.isArray(data.mods)) return null;
  const mods = data.mods.filter((m) => m.modId === id);
  if (mods.length !== 1 || typeof mods[0].source !== "string") return null;
  return sha256Hex(Buffer.from(mods[0].source.replace(/\r\n/g, "\n")));
}
function sameRestoredConfig(actual, expected) {
  const { libraryFileName: a, ...left } = actual ?? {}, { libraryFileName: b, ...right } = expected ?? {};
  return typeof a === "string" && typeof b === "string" && eq(left, right);
}
function sameModArtifact(shown, recorded) {
  if (!recorded) return false;
  const actual = modArtifact(shown);
  return actual !== null && actual.id === recorded.id && actual.version === recorded.version && actual.sha256 === recorded.sha256 && eq(actual.config, { ...recorded.config, disabled: actual.config.disabled });
}
function sameSettingKeys(a, b) {
  const left = a?.settings, right = b?.settings;
  return left && right && eq(Object.keys(left).sort(), Object.keys(right).sort()) && Object.values(right).every((x) => ["string", "number", "boolean"].includes(typeof x));
}
function stageMods(tx) {
  if (args.mode !== "Full") return;
  if (fixture && !args.fixtureWindhawk) {
    tx.mods = [];
    return;
  }
  if (!compat()) throw Error("Unsupported Windows/shell fingerprint. Full mode refused; Native remains available.");
  if (!fixture && !import_node_fs2.default.existsSync(windhawk)) throw Error("Pinned Windhawk CLI missing. Run the dependency bootstrap first.");
  const deps = json(import_node_path2.default.join(source, "dependencies.json"));
  const bundled = settings.bundledMods ?? [];
  for (const mod of bundled) if (!/^[a-z0-9-]+$/.test(mod.id) || mod.path !== `dist/${mod.id}.wh.cpp` || !/^[a-f0-9]{64}$/.test(mod.sha256)) throw Error("Invalid bundled Windhawk source");
  const upstream = deps.mods.map((mod) => {
    const sourcePath = safe(import_node_path2.default.join(state, "downloads", mod.id + ".wh.cpp"));
    if (mod.id !== "windows-11-settings-styler") return { ...mod, sourcePath };
    if (settings.settingsStartup?.sourceSha256 !== mod.sha256) throw Error("Settings startup dependency pin differs");
    const adapted = settingsStylerSource(import_node_fs2.default.readFileSync(sourcePath), settings.settingsStartup), sha256 = sha256Hex(adapted);
    const derived = safe(import_node_path2.default.join(state, "downloads", "derived", mod.id + "-" + sha256 + ".wh.cpp"));
    if (import_node_fs2.default.existsSync(derived)) {
      if (sha256Hex(import_node_fs2.default.readFileSync(derived)) !== sha256) throw Error("Settings derived source cache differs");
    } else atomic(derived, adapted);
    return { ...mod, sourcePath: derived, upstreamSourceSha256: mod.sha256, sha256 };
  });
  const mods = [...upstream, ...bundled.map((m) => ({ ...m, sourcePath: import_node_path2.default.join(source, m.path) }))];
  if (new Set(mods.map((m) => m.id)).size !== mods.length) throw Error("Duplicate Windhawk adapter identity");
  for (const [index, mod] of mods.entries()) {
    console.error(`Preparing theme adapter ${index + 1} of ${mods.length}: ${mod.id}. Compilation can take a minute.`);
    const src = safe(mod.sourcePath);
    if (!import_node_fs2.default.existsSync(src) || sha256Hex(import_node_fs2.default.readFileSync(src)) !== mod.sha256) throw Error(`Missing verified mod source: ${mod.id}`);
    if (wh(["mod", "show", mod.id], true)) throw Error(`An upstream-ID copy of ${mod.id} is already installed. Resolve that duplicate explicitly before staging the pinned local adapter.`);
    const installedId = "local@" + mod.id;
    const before = wh(["mod", "show", installedId], true), backup = import_node_path2.default.join(state, "backups", tx.id + "-" + mod.id + ".json");
    if (before) {
      import_node_fs2.default.mkdirSync(import_node_path2.default.dirname(backup), { recursive: true });
      wh(["data", "export", "--out", backup, "--mods", installedId, "--no-app-settings", "--offline"]);
    }
    const beforeSettings = before ? wh(["mod", "settings", "get", installedId]) : null;
    const prior = history.transactions.filter((t) => t.status === "applied").at(-1)?.mods?.find((m) => m.id === installedId);
    const reuse = before?.metadata?.version === mod.version && prior?.sourceSha256 === mod.sha256 && eq(beforeSettings, prior.settings) && sameModArtifact(before, compiledReceipt(prior));
    const values = flattenStylerSettings(stylerSettings(json(import_node_path2.default.join(source, "dist", mod.id + ".json")), settings.stylerVariants?.[mod.id], compatibility().startLayout));
    const unchanged = reuse && before.config.disabled === false && Object.entries(values).every(([key, value]) => String((beforeSettings.settings ?? beforeSettings)[key]) === String(value));
    tx.mods.push({
      id: installedId,
      sourceId: mod.id,
      version: mod.version,
      sourceSha256: mod.sha256,
      ...mod.upstreamSourceSha256 ? { upstreamSourceSha256: mod.upstreamSourceSha256 } : {},
      before: before ? { id: before.id, version: before.metadata?.version, config: before.config } : null,
      beforeSettings,
      backup: before ? backup : null,
      backupSha256: before ? sha256Hex(import_node_fs2.default.readFileSync(safe(backup))) : null,
      beforeSourceSha256: before && prior?.sourceSha256 === exportedSourceDigest(backup, installedId) ? prior.sourceSha256 : null,
      reused: reuse,
      unchanged,
      ...unchanged ? { settings: beforeSettings, artifact: modArtifact(before) } : {}
    });
    persist();
    if (unchanged) {
      console.error("Keeping the verified active adapter unchanged: " + mod.id + ".");
      continue;
    }
    if (reuse) {
      console.error("Reusing the verified compiled adapter: " + mod.id + ".");
      wh(["mod", "disable", installedId]);
    } else {
      const installed = wh(["mod", "install", mod.id, "--file", src, "--disabled"]);
      if (installed?.id !== installedId) throw Error("Windhawk returned an unexpected installed identity");
    }
    const staged = wh(["mod", "show", installedId]);
    if (staged?.config?.disabled !== true || staged?.metadata?.version !== mod.version) throw Error("Windhawk disabled staging or version readback failed");
    wh(["mod", "settings", "set", installedId, ...Object.entries(values).map(([k, v2]) => `${k}=${v2}`)]);
    const got = wh(["mod", "settings", "get", installedId]);
    const actual = got.settings ?? got;
    if (!Object.entries(values).every(([key, value]) => String(actual[key]) === String(value))) throw Error(`Windhawk settings readback differs: ${mod.id}`);
    tx.mods.at(-1).settings = got;
    tx.mods.at(-1).artifact = modArtifact(staged);
    persist();
    console.error(`Theme adapter ${index + 1} of ${mods.length} verified.`);
  }
}
var label = (op) => op.kind === "lockscreen" ? "Windows lock-screen image" : op.kind === "windhawk-setting" ? `Windhawk/${op.name}` : op.kind === "registry" ? `${op.key}/${op.name}` : op.path;
var opId = (op) => JSON.stringify([op.kind, op.key, op.name, op.path, op.profile, op.member, op.keys]);
var currentPath = import_node_path2.default.join(state, "current.json");
function updatePointer() {
  const active = history.transactions.filter((t) => t.status === "applied").at(-1);
  if (active) atomic(currentPath, JSON.stringify({ revision: active.revision, mode: active.mode }) + "\n");
  else if (import_node_fs2.default.existsSync(currentPath)) import_node_fs2.default.unlinkSync(safe(currentPath));
}
function restore(tx) {
  const conflicts = [];
  for (const mod of [...tx.mods ?? []].reverse()) {
    if (mod.restored) continue;
    if (mod.unchanged) {
      mod.restored = true;
      persist();
      continue;
    }
    console.error(`Restoring theme adapter ${mod.sourceId ?? mod.id}. Saved source may need compilation.`);
    try {
      if (!wh(["mod", "show", mod.id], true) && !mod.before) {
        mod.restored = true;
        persist();
        continue;
      }
      const shown = wh(["mod", "show", mod.id]), currentSettings = wh(["mod", "settings", "get", mod.id]);
      const reuseRestore = mod.reused && mod.before && sameSettingKeys(currentSettings, mod.beforeSettings) && sameModArtifact(shown, compiledReceipt(mod));
      if (mod.settings && !eq(currentSettings, mod.settings) && !(reuseRestore && eq(currentSettings, mod.beforeSettings))) {
        conflicts.push(mod.id);
        continue;
      }
      if (!reuseRestore && mod.backup && mod.backupSha256 && sha256Hex(import_node_fs2.default.readFileSync(safe(mod.backup))) !== mod.backupSha256) throw Error("Saved adapter export digest mismatch");
      wh(["mod", "disable", mod.id]);
      if (reuseRestore) {
        console.error("Restoring saved settings using the verified compiled adapter: " + mod.sourceId + ".");
        wh(["mod", "settings", "set", mod.id, ...Object.entries(mod.beforeSettings.settings).map(([k, v2]) => k + "=" + v2)]);
        if (!eq(wh(["mod", "settings", "get", mod.id]), mod.beforeSettings)) throw Error("Saved settings readback differs");
        if (mod.before.config.disabled === false) wh(["mod", "enable", mod.id]);
        if (!eq(wh(["mod", "show", mod.id]).config, mod.before.config)) throw Error("Saved configuration readback differs");
      } else if (mod.backup) {
        wh(["--yes", "data", "import", mod.backup, "--mods", mod.id, "--no-app-settings", "--offline"]);
        if (mod.beforeSourceSha256) {
          const prior = previousManagedMod(tx, mod.id), restored = wh(["mod", "show", mod.id]);
          if (!prior || prior.sourceSha256 !== mod.beforeSourceSha256 || exportedSourceDigest(mod.backup, mod.id) !== prior.sourceSha256 || restored.metadata?.version !== prior.version || !eq(wh(["mod", "settings", "get", mod.id]), mod.beforeSettings) || !sameRestoredConfig(restored.config, mod.before.config)) throw Error("Restored adapter identity or settings mismatch");
          const artifact = modArtifact(restored);
          if (!artifact) throw Error("Restored adapter has no compiled artifact");
          prior.compilationHistory ??= [];
          prior.compilationHistory.push({ sourceSha256: prior.sourceSha256, artifact: prior.artifact });
          prior.restorationReceipts ??= [];
          prior.restorationReceipts.push({ restoredBy: tx.id, sourceSha256: prior.sourceSha256, artifact });
          prior.artifact = artifact;
        }
      } else wh(["--yes", "mod", "remove", mod.id]);
      mod.restored = true;
      persist();
    } catch (error) {
      conflicts.push(`${mod.id}: ${error.message}`);
    }
  }
  console.error("Restoring saved personalization and application settings.");
  const exact = /* @__PURE__ */ new Set();
  for (const snapshot of tx.documents ?? []) {
    if (!snapshot.after) continue;
    try {
      const op = { kind: "file", path: snapshot.path };
      if (eq(get(op), snapshot.after)) {
        put(op, snapshot.before);
        exact.add(snapshot.path);
        for (const item of tx.operations) if (item.kind === "json" && item.path === snapshot.path) item.applied = false;
        persist();
      }
    } catch (error) {
      conflicts.push(`${snapshot.path}: ${error.message}`);
    }
  }
  for (const op of tx.operations.toReversed()) {
    if (!op.applied || exact.has(op.path)) continue;
    try {
      const now = get(op);
      if (eq(now, op.before)) {
        op.applied = false;
        persist();
        continue;
      }
      if (!eq(now, op.after)) {
        conflicts.push(label(op));
        continue;
      }
      put(op, op.before);
      op.applied = false;
      persist();
    } catch (error) {
      conflicts.push(`${label(op)}: ${error.message}`);
    }
  }
  tx.status = conflicts.length ? "restore-conflict" : "restored";
  persist();
  return [...new Set(conflicts)];
}
function verify({ checkEngine = true } = {}) {
  const active = history.transactions.filter((t) => t.status === "applied");
  const tx = active.at(-1);
  if (!tx) throw Error("No installed transaction");
  const effective = /* @__PURE__ */ new Map();
  for (const t of active) for (const op of t.operations) if (op.applied) effective.set(opId(op), op);
  const failed = [];
  for (const op of effective.values()) try {
    if (!eq(get(op), op.after)) failed.push(label(op));
  } catch (error) {
    failed.push(label(op));
  }
  if (tx.mode === "Full") {
    if (checkEngine && !engineRunning()) failed.push("theme engine is not running");
    if (!compat()) failed.push("shell compatibility");
    for (const mod of tx.mods ?? []) try {
      if (!eq(wh(["mod", "settings", "get", mod.id]), mod.settings)) failed.push(`${mod.id}: settings drift`);
      const shown = wh(["mod", "show", mod.id]);
      if (shown?.config?.disabled !== false) failed.push(`${mod.id}: disabled or unknown state`);
      if (shown?.metadata?.version !== mod.version) failed.push(`${mod.id}: version drift`);
      if (compiledReceipt(mod) && !sameModArtifact(shown, compiledReceipt(mod))) failed.push(`${mod.id}: compiled artifact drift`);
    } catch (error) {
      failed.push(`${mod.id}: ${error.message}`);
    }
  }
  return { result: failed.length ? "failed" : "passed", revision: tx.revision, failed, limitations: settings.limitations };
}
if (action === "Plan") {
  console.log(JSON.stringify({ action, mode: args.mode, compatible: compat(), compatibility: compatibility(), operations: ops.map((op) => ({ kind: op.kind, target: label(op), keys: op.keys ?? op.name, changes: !eq(get(op), op.after) })), limitations: settings.limitations }, null, 2));
} else if (action === "Test") {
  const result = verify();
  console.log(JSON.stringify(result, null, 2));
  if (result.failed.length) process.exitCode = 1;
} else if (["Restore", "Uninstall"].includes(action)) {
  const candidates = history.transactions.filter((t) => t.status !== "restored");
  const selected = args.latest ? candidates.slice(-1) : candidates;
  const conflicts = [];
  for (const [index, tx] of selected.toReversed().entries()) {
    console.error(`Restoring saved update ${index + 1} of ${selected.length}.`);
    conflicts.push(...restore(tx));
    if (conflicts.length) break;
  }
  ps({ operation: "refresh" });
  if (!conflicts.length) updatePointer();
  console.log(JSON.stringify({ result: conflicts.length ? "conflicts" : "restored", conflicts, recovery: conflicts.length ? "Resolve the listed values using journal.json, then rerun Restore. Backups are retained." : null }));
  if (conflicts.length) process.exitCode = 2;
} else if (action === "Guard") {
  const tx = history.transactions.filter((x) => x.status === "applied" && x.mode === "Full").at(-1);
  if (tx) {
    const failures = [];
    for (const mod of tx.mods ?? []) try {
      wh(["mod", "disable", mod.id]);
    } catch (error) {
      failures.push(`${mod.id}: ${error.message}`);
    }
    if (!compat()) failures.push("unknown shell compatibility");
    for (const mod of tx.mods ?? []) try {
      const shown = wh(["mod", "show", mod.id]);
      if (shown.metadata?.version !== mod.version || !eq(wh(["mod", "settings", "get", mod.id]), mod.settings)) failures.push(`${mod.id}: version or settings drift`);
      if (compiledReceipt(mod) && !sameModArtifact(shown, compiledReceipt(mod))) failures.push(`${mod.id}: compiled artifact drift`);
    } catch (error) {
      failures.push(`${mod.id}: ${error.message}`);
    }
    if (wh(["app", "settings", "get"]).settings.disableUpdateCheck !== true) failures.push("dependency update policy changed");
    if (!failures.length) try {
      for (const mod of tx.mods ?? []) wh(["mod", "enable", mod.id]);
      startWindhawk();
    } catch (error) {
      failures.push(error.message);
      for (const mod of tx.mods ?? []) try {
        wh(["mod", "disable", mod.id]);
      } catch {
      }
    }
    console.log(JSON.stringify({ shell: failures.length ? "disabled-incompatible" : "enabled", failures }));
    if (failures.length) process.exitCode = 2;
  }
} else if (["Apply", "Update"].includes(action)) {
  if (args.mode === "Full" && !compat()) throw Error("Full preflight failed: unsupported Windows/shell fingerprint");
  const currentMode = history.transactions.filter((t) => t.status === "applied").at(-1)?.mode;
  if (currentMode && currentMode !== args.mode) throw Error("Restore the installed mode before changing Full/Native mode");
  const pending = history.transactions.find((x) => ["applying", "restore-conflict"].includes(x.status));
  if (pending) throw Error("Incomplete transaction: run Restore before another Apply");
  const effective = /* @__PURE__ */ new Map();
  for (const tx of history.transactions.filter((t) => t.status === "applied")) for (const op of tx.operations) if (op.applied) effective.set(opId(op), op);
  for (const op of ops) {
    const managed = effective.get(opId(op));
    if (managed && !eq(get(op), managed.after)) throw Error(`Managed setting conflict: ${label(op)}. Restore and resolve it before applying.`);
  }
  const planned = ops.map((op) => ({ ...op, before: get(op) })).filter((op) => !eq(op.before, op.after));
  const previous = history.transactions.filter((t) => t.status === "applied").at(-1);
  if (!planned.length && previous?.revision === args.revision && previous?.mode === args.mode) {
    const checked = verify({ checkEngine: false });
    if (checked.failed.length) throw Error("Installed state drift; run Test for details");
    if (args.mode === "Full") startWindhawk();
    console.log(JSON.stringify({ result: "unchanged", revision: args.revision }));
  } else {
    const documents = [...new Set(planned.filter((op) => op.kind === "json").map((op) => op.path))].map((p) => ({ path: p, before: get({ kind: "file", path: p }) }));
    const tx = { id: import_node_crypto3.default.randomUUID(), revision: args.revision, mode: args.mode, status: "applying", operations: planned, documents, mods: [] };
    history.transactions.push(tx);
    persist();
    try {
      stageMods(tx);
      console.error("Applying personalization and application settings.");
      let completed = 0;
      for (const op of planned) {
        if (!eq(get(op), op.before)) throw Error("Concurrent edit before write");
        op.applied = true;
        persist();
        put(op, op.after);
        if (!eq(get(op), op.after)) throw Error("Readback failed");
        const document = documents.find((d) => d.path === op.path);
        if (document) {
          document.after = get({ kind: "file", path: op.path });
          persist();
        }
        if (fixture && args.failAfter === ++completed) throw Error("Injected partial failure");
      }
      console.error("Refreshing the theme and verifying activation.");
      ps({ operation: "refresh" });
      if (args.mode === "Full" && !compat()) throw Error("Compatibility changed during apply");
      for (const mod of tx.mods) if (!mod.unchanged) wh(["mod", "enable", mod.id]);
      if (args.mode === "Full") startWindhawk();
      tx.status = "applied";
      persist();
      updatePointer();
      console.log(JSON.stringify({ result: "applied", revision: args.revision, changes: planned.length, limitations: settings.limitations }));
    } catch (error) {
      console.error("Installation failed; reversing this transaction before returning the error.");
      for (const mod of tx.mods) if (!mod.unchanged) try {
        wh(["mod", "disable", mod.id]);
      } catch {
      }
      const conflicts = restore(tx);
      try {
        ps({ operation: "refresh" });
      } catch (refreshError) {
        conflicts.push(`Personalization refresh: ${refreshError.message}`);
        tx.status = "restore-conflict";
        persist();
      }
      if (!conflicts.length) updatePointer();
      throw Error(`${error.message}; rollback ${conflicts.length ? "needs conflict recovery; run Restore" : "completed"}`);
    }
  }
} else throw Error("Unknown lifecycle action");
