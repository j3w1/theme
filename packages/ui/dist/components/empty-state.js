import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { t as feedback } from "../chunks/overlays-Bw8SSDKz.js";
//#region .cache/ui-build/entries/components/empty-state.js
var J3w1EmptyState = class extends J3w1Element {
	static componentId = "empty-state";
	static version = "4.0.0";
	static implementationId = "sha256-TjsU1nEvRoXqvqnqWsM2EsMF7pDu5QD94wKIbCronI4=";
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
