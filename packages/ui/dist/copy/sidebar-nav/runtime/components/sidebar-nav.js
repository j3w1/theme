import { t as J3w1Element } from "../chunks/element-Dovcr9Ky.js";
import { n as disclosure } from "../chunks/navigation-BfNzDYZB.js";
//#region .cache/ui-build/entries/components/sidebar-nav.js
var J3w1SidebarNav = class extends J3w1Element {
	static componentId = "sidebar-nav";
	static version = "4.0.0";
	static implementationId = "sha256-rKjBWaKv0/VZBCTIvYNnUx/X/HyPypn7MJrL9+nt6cM=";
	static connect = disclosure;
	static upgradeProperties = [
		"disabled",
		"name",
		"open"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
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
//#endregion
export { J3w1SidebarNav };
