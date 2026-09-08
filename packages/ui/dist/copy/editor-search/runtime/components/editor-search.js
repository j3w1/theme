import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { i as editorSearch } from "../chunks/display-Cg9VLOYZ.js";
//#region .cache/ui-build/entries/components/editor-search.js
var J3w1EditorSearch = class extends J3w1Element {
	static componentId = "editor-search";
	static version = "1.0.0";
	static implementationId = "sha256-5mEikrtiFC8PWaPjClUo66Hkh88cGPkWT2B3s/FbPsQ=";
	static connect = editorSearch;
	static upgradeProperties = [
		"disabled",
		"name",
		"source",
		"query"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	next(...args) {
		if (!this._api?.next) throw new Error("Connect the component before calling next");
		return this._api.next(...args);
	}
	get source() {
		return this._api?.source;
	}
	set source(value) {
		if (this._api) this._api.source = value;
		else Object.defineProperty(this, "source", {
			value,
			configurable: true,
			writable: true
		});
	}
	get query() {
		return this._api?.query;
	}
	set query(value) {
		if (this._api) this._api.query = value;
		else Object.defineProperty(this, "query", {
			value,
			configurable: true,
			writable: true
		});
	}
	get matchCount() {
		return this._api?.matchCount;
	}
};
//#endregion
export { J3w1EditorSearch };
