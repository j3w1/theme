import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { r as developerView } from "../chunks/display-dj9YaBfn.js";
//#region .cache/ui-build/entries/components/code-editor.js
var J3w1CodeEditor = class extends J3w1Element {
	static componentId = "code-editor";
	static version = "1.1.0";
	static implementationId = "sha256-aBjLKRIMLNlPR2Bekv2cODV2T+UVTKqsdd03e1NgEeY=";
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
