import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as feedback } from "../chunks/overlays-C6nlCHqg.js";
//#region .cache/ui-build/entries/components/chip.js
var J3w1Chip = class extends J3w1Element {
	static componentId = "chip";
	static version = "3.1.0";
	static implementationId = "sha256-tcjqOQu17U6iG4+O2oCISX+NFlZOJLwXHEh/wfwNZ0E=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
//#endregion
export { J3w1Chip };
