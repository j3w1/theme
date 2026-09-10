import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as formComposition } from "../chunks/forms-BT3z7lNC.js";
//#region .cache/ui-build/entries/components/admin-form.js
var J3w1AdminForm = class extends J3w1Element {
	static componentId = "admin-form";
	static version = "1.1.0";
	static implementationId = "sha256-GjoLJm4xWA1vW9n3kATWsI3Dq5GoSb6XnQq3P4VbCFA=";
	static connect = formComposition;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
};
//#endregion
export { J3w1AdminForm };
