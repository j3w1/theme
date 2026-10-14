import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { i as fileInput } from "../chunks/native-BjBt1sUh.js";
//#region .cache/ui-build/entries/components/file-input.js
var J3w1FileInput = class extends J3w1Element {
	static componentId = "file-input";
	static version = "4.0.0";
	static implementationId = "sha256-DYtJ1M3W9zNvFy3MIif27+5jsw2JssfZ5mpXTXwGBCo=";
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
