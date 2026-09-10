import { t as J3w1Element } from "../chunks/element-C1XeXVYC.js";
import { t as avatar } from "../chunks/display-dj9YaBfn.js";
//#region .cache/ui-build/entries/components/avatar.js
var J3w1Avatar = class extends J3w1Element {
	static componentId = "avatar";
	static version = "1.1.0";
	static implementationId = "sha256-9PgfheXI3Ht6cd3HFnYda/QvWYpmQekqwz0+B0C5sjY=";
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
