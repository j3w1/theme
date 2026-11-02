import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as feedback } from "../chunks/overlays-BW66WXLm.js";
// .cache/ui-build/entries/components/toast.js
var J3w1Toast = class extends J3w1Element {
	static componentId = "toast";
	static version = "4.0.0";
	static implementationId = "sha256-ywJbcX+iwfyImi8hYwyUwIemYNa3TJIvKqVcolt3uzE=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
export { J3w1Toast };
