import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { t as actions } from "../chunks/native-BFZpUch0.js";
//#region .cache/ui-build/entries/components/button.js
var J3w1Button = class extends J3w1Element {
	static componentId = "button";
	static version = "1.0.0";
	static implementationId = "sha256-eNMIxyO/4Db2oEcXbcsw/UKafUofoDv/huEoNgWhnyo=";
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
