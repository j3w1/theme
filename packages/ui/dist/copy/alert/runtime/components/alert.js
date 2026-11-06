import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as feedback } from "../chunks/overlays-DUY6TGBE.js";
// .cache/ui-build/entries/components/alert.js
var J3w1Alert = class extends J3w1Element {
	static componentId = "alert";
	static version = "4.0.0";
	static implementationId = "sha256-Vzrj499WNB9MJClL6aNI2L8ghYn+6H4jPDV4xTLWBbI=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
export { J3w1Alert };
