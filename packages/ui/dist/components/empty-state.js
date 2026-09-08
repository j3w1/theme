import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { t as feedback } from "../chunks/overlays-DBA40kTs.js";
//#region .cache/ui-build/entries/components/empty-state.js
var J3w1EmptyState = class extends J3w1Element {
	static componentId = "empty-state";
	static version = "1.0.0";
	static implementationId = "sha256-aPduWvZBFNr5pjh/f3Aw2L7tGvEOXvCtk1os93a/Y2I=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
//#endregion
export { J3w1EmptyState };
