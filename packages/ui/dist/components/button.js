import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { t as actions } from "../chunks/native-BjBt1sUh.js";
//#region .cache/ui-build/entries/components/button.js
var J3w1Button = class extends J3w1Element {
	static componentId = "button";
	static version = "4.0.0";
	static implementationId = "sha256-5XqIG0jRl2EIptqWgZIiuSKdNf0pHpMOZB14A1W3DqU=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
//#endregion
export { J3w1Button };
