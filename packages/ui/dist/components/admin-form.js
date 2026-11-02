import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as formComposition } from "../chunks/forms-C3u5121t.js";
// .cache/ui-build/entries/components/admin-form.js
var J3w1AdminForm = class extends J3w1Element {
	static componentId = "admin-form";
	static version = "4.0.0";
	static implementationId = "sha256-nRr2ehiaHW5Pojp+99nPTbxKA38KgfMFXwRXtoTEy/U=";
	static connect = formComposition;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
};
export { J3w1AdminForm };
