import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as actions } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/button-group.js
var J3w1ButtonGroup = class extends J3w1Element {
	static componentId = "button-group";
	static version = "1.1.0";
	static implementationId = "sha256-HH+ziaXkDaECvqwPLlI3lJ7HY0a0fH06WyVad5ru7iU=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
//#endregion
export { J3w1ButtonGroup };
