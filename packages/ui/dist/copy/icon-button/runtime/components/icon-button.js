import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as actions } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/icon-button.js
var J3w1IconButton = class extends J3w1Element {
	static componentId = "icon-button";
	static version = "2.0.0";
	static implementationId = "sha256-B+qJ3N5JvHBpGTIrc+VVyR5tZ5dM/7CvAjTNOh6/omM=";
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
