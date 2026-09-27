import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { i as fileInput } from "../chunks/native-CAzZmDKR.js";
//#region .cache/ui-build/entries/components/file-input.js
var J3w1FileInput = class extends J3w1Element {
	static componentId = "file-input";
	static version = "3.1.0";
	static implementationId = "sha256-I04CMuF8jK8QE2Ic3QeTDX3RgNuSfeo9gJ8zJZf+Gcc=";
	static connect = fileInput;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	clear(...args) {
		if (!this._api?.clear) throw new Error("Connect the component before calling clear");
		return this._api.clear(...args);
	}
	get files() {
		return this._api?.files;
	}
};
//#endregion
export { J3w1FileInput };
