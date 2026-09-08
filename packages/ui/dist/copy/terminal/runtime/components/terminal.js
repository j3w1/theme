import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { r as developerView } from "../chunks/display-JEHZe9kB.js";
//#region .cache/ui-build/entries/components/terminal.js
var J3w1Terminal = class extends J3w1Element {
	static componentId = "terminal";
	static version = "1.1.0";
	static implementationId = "sha256-Y28GcLxvfHFg8EeCzf2et2bgSizhIpnT7+4sRO5EJTk=";
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
