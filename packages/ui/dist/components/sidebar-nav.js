import { t as J3w1Element } from "../chunks/element-DdnhHcFm.js";
import { n as disclosure } from "../chunks/navigation-BPzB8WCr.js";
//#region .cache/ui-build/entries/components/sidebar-nav.js
var J3w1SidebarNav = class extends J3w1Element {
	static componentId = "sidebar-nav";
	static version = "1.1.0";
	static implementationId = "sha256-S5LFiFhk5KHEtBwn1VVj7gINbDPQM1NfdGolJFs7m5U=";
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
