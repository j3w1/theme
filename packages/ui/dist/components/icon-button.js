import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as actions } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/icon-button.js
var J3w1IconButton = class extends J3w1Element {
	static componentId = "icon-button";
	static version = "1.2.0";
	static implementationId = "sha256-wYHOAUeHifrjiaumHoUoFFmFiVzbnV2eSwf5IoyT6bs=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
//#endregion
export { J3w1IconButton };
