import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { i as fileInput } from "../chunks/native-B49Q0p0_.js";
//#region .cache/ui-build/entries/components/file-input.js
var J3w1FileInput = class extends J3w1Element {
	static componentId = "file-input";
	static version = "1.1.0";
	static implementationId = "sha256-B/nwL77YF1LAsf0Iv6IhtGrQD0f1GPxw2CqKkdlju6s=";
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
