import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as developerView } from "../chunks/display-dj9YaBfn.js";
//#region .cache/ui-build/entries/components/diff-view.js
var J3w1DiffView = class extends J3w1Element {
	static componentId = "diff-view";
	static version = "3.1.0";
	static implementationId = "sha256-9/yJ4RG8NMxGr2lxNjJ65pw/8NDOysXb18W3xPVyfmw=";
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
