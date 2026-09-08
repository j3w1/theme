import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as developerView } from "../chunks/display-Cg9VLOYZ.js";
//#region .cache/ui-build/entries/components/terminal.js
var J3w1Terminal = class extends J3w1Element {
	static componentId = "terminal";
	static version = "1.0.0";
	static implementationId = "sha256-NFABvkaFDRCNSAl+wVYey6UaCr11EIT0gL0XsYGJdYQ=";
	static connect = developerView;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	setText(...args) {
		if (!this._api?.setText) throw new Error("Connect the component before calling setText");
		return this._api.setText(...args);
	}
};
//#endregion
export { J3w1Terminal };
