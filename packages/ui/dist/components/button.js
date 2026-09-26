import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as actions } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/button.js
var J3w1Button = class extends J3w1Element {
	static componentId = "button";
	static version = "3.0.0";
	static implementationId = "sha256-4GynsfOBeZoLipEKdBuw2M552TcYItsll0ENK+1FizU=";
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
