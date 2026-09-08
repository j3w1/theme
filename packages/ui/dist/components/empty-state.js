import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { t as feedback } from "../chunks/overlays-B0Pnbu42.js";
//#region .cache/ui-build/entries/components/empty-state.js
var J3w1EmptyState = class extends J3w1Element {
	static componentId = "empty-state";
	static version = "1.1.0";
	static implementationId = "sha256-82E6JDqsIabtARvW3X4yc/CKHhPm4GrXcl3kKtz+dqQ=";
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
