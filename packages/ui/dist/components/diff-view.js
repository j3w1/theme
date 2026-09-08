import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { r as developerView } from "../chunks/display-D5cQPyZu.js";
//#region .cache/ui-build/entries/components/diff-view.js
var J3w1DiffView = class extends J3w1Element {
	static componentId = "diff-view";
	static version = "1.1.0";
	static implementationId = "sha256-xF2hUtNX2vPwvvPlaZnorWNP76fR2HsZgjB+5KR0Jio=";
	static connect = developerView;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	setText(...args) {
		if (!this._api?.setText) throw new Error("Connect the component before calling setText");
		return this._api.setText(...args);
	}
};
//#endregion
export { J3w1DiffView };
