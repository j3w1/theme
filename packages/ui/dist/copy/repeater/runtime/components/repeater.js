import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { r as repeater } from "../chunks/advanced-CJyaPTcu.js";
//#region .cache/ui-build/entries/components/repeater.js
var J3w1Repeater = class extends J3w1Element {
	static componentId = "repeater";
	static version = "1.0.0";
	static implementationId = "sha256-Zintiqipt6rX+61oi6HXE9ZwakN7DIQ3uHprrOncSfs=";
	static connect = repeater;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"max"
	]];
	add(...args) {
		if (!this._api?.add) throw new Error("Connect the component before calling add");
		return this._api.add(...args);
	}
	remove(...args) {
		if (!this._api?.remove) throw new Error("Connect the component before calling remove");
		return this._api.remove(...args);
	}
	move(...args) {
		if (!this._api?.move) throw new Error("Connect the component before calling move");
		return this._api.move(...args);
	}
	get rowIds() {
		return this._api?.rowIds;
	}
};
//#endregion
export { J3w1Repeater };
