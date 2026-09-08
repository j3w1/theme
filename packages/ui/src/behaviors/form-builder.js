import { mountBuilder } from "../internal/form-builder.js";

export function formBuilder(root, { signal }) {
  const editor = root.querySelector("[data-builder]");
  if (!editor) throw new Error("The form builder requires the complete maintained editor and preview markup");
  const api = mountBuilder(editor, { signal });
  return { exportDefinition: api.exportDefinition, importDefinition: api.importDefinition,
    get definitionJson() { return api.exportDefinition(); },
    set definitionJson(text) { if (!api.importDefinition(String(text))) throw new TypeError("Invalid form definition; previous definition retained"); },
    cleanup: api.destroy,
  };
}

