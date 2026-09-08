import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { t as actions } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/button-group.js
var J3w1ButtonGroup = class extends J3w1Element {
	static componentId = "button-group";
	static version = "1.0.0";
	static implementationId = "sha256-Rptojlxzd67cNCr1x0o8Q7b6TpNJAwAPgFN4x3eGBRs=";
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
