import { t as J3w1Element } from "./element-C3vTYwcS.js";
import { t as mountBuilder } from "./form-builder-CxRghuT4.js";
//#region packages/ui/src/behaviors/form-builder.js
function formBuilder(root, { signal }) {
	const editor = root.querySelector("[data-builder]");
	if (!editor) throw new Error("The form builder requires the complete maintained editor and preview markup");
	const api = mountBuilder(editor, { signal });
	return {
		exportDefinition: api.exportDefinition,
		importDefinition: api.importDefinition,
		get definitionJson() {
			return api.exportDefinition();
		},
		set definitionJson(text) {
			if (!api.importDefinition(String(text))) throw new TypeError("Invalid form definition; previous definition retained");
		},
		cleanup: api.destroy
	};
}
//#endregion
//#region .cache/ui-build/entries/components/form-builder.js
var J3w1FormBuilder = class extends J3w1Element {
	static componentId = "form-builder";
	static version = "1.1.0";
	static implementationId = "sha256-H5+y3Gpv/nWiT2UJLoVWmk1tbFcvuztyl/zJ5OAoUKk=";
	static connect = formBuilder;
	static upgradeProperties = [
		"disabled",
		"name",
		"definitionJson"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	exportDefinition(...args) {
		if (!this._api?.exportDefinition) throw new Error("Connect the component before calling exportDefinition");
		return this._api.exportDefinition(...args);
	}
	importDefinition(...args) {
		if (!this._api?.importDefinition) throw new Error("Connect the component before calling importDefinition");
		return this._api.importDefinition(...args);
	}
	get definitionJson() {
		return this._api?.definitionJson;
	}
	set definitionJson(value) {
		if (this._api) this._api.definitionJson = value;
		else Object.defineProperty(this, "definitionJson", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1FormBuilder as t };
