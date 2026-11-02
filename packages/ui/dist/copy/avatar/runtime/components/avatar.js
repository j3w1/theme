import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as avatar } from "../chunks/display-l54fb8vw.js";
// .cache/ui-build/entries/components/avatar.js
var J3w1Avatar = class extends J3w1Element {
	static componentId = "avatar";
	static version = "4.0.0";
	static implementationId = "sha256-h7ZI0GBRPh8k+G66StFqOp3ztZR+AceNt5+PiDohQ+M=";
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
export { J3w1Avatar };
