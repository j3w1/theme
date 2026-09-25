import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as developerView } from "../chunks/display-dj9YaBfn.js";
//#region .cache/ui-build/entries/components/code-editor.js
var J3w1CodeEditor = class extends J3w1Element {
	static componentId = "code-editor";
	static version = "1.2.0";
	static implementationId = "sha256-3WxbcGavn/Z9JCb+Y8cOVz9zqOd3NJJlVmW2IE3J6t8=";
	static connect = developerView;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	setText(...args) {
		if (!this._api?.setText) throw new Error("Connect the component before calling setText");
		return this._api.setText(...args);
	}
};
//#endregion
export { J3w1CodeEditor };
