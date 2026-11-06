import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as popover } from "../chunks/overlays-BZgvDaS-.js";
// .cache/ui-build/entries/components/popover.js
var J3w1Popover = class extends J3w1Element {
	static componentId = "popover";
	static version = "4.0.0";
	static implementationId = "sha256-E8BtpYZ7a0hcbtKQhq+HPn+YyO+iugnk/f0qx6U8LRk=";
	static connect = popover;
	static upgradeProperties = [
		"disabled",
		"name",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	show(...args) {
		if (!this._api?.show) throw new Error("Connect the component before calling show");
		return this._api.show(...args);
	}
	hide(...args) {
		if (!this._api?.hide) throw new Error("Connect the component before calling hide");
		return this._api.hide(...args);
	}
	get open() {
		return this._api?.open;
	}
	set open(value) {
		if (this._api) this._api.open = value;
		else Object.defineProperty(this, "open", {
			value,
			configurable: true,
			writable: true
		});
	}
};
export { J3w1Popover };
