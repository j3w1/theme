import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as actions } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/button-group.js
var J3w1ButtonGroup = class extends J3w1Element {
	static componentId = "button-group";
	static version = "3.1.0";
	static implementationId = "sha256-HF+4wBpoXuaf4lA+fIks7KlPy0vdkAr42EsGAy1XE1Y=";
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
