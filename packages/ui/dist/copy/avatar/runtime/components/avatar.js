import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { t as avatar } from "../chunks/display-Jm9bAsnb.js";
//#region .cache/ui-build/entries/components/avatar.js
var J3w1Avatar = class extends J3w1Element {
	static componentId = "avatar";
	static version = "4.0.0";
	static implementationId = "sha256-y5w6c1MQTafVvxzhJ5TzYxwGvju264CUxS2D23RvGCQ=";
	static connect = avatar;
	static upgradeProperties = [
		"disabled",
		"name",
		"src"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"src"
	]];
	get src() {
		return this._api?.src;
	}
	set src(value) {
		if (this._api) this._api.src = value;
		else Object.defineProperty(this, "src", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Avatar };
