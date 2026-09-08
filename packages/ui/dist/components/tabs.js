import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { i as tabs } from "../chunks/navigation-B2AMi0qO.js";
//#region .cache/ui-build/entries/components/tabs.js
var J3w1Tabs = class extends J3w1Element {
	static componentId = "tabs";
	static version = "1.1.0";
	static implementationId = "sha256-keQCv1e8kkpBUt7lpkq2v81sfB8K6yZ/HdZWhnBXK8Y=";
	static connect = tabs;
	static upgradeProperties = [
		"disabled",
		"name",
		"selectedId"
	];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"activation"
	]];
	select(...args) {
		if (!this._api?.select) throw new Error("Connect the component before calling select");
		return this._api.select(...args);
	}
	get selectedId() {
		return this._api?.selectedId;
	}
	set selectedId(value) {
		if (this._api) this._api.selectedId = value;
		else Object.defineProperty(this, "selectedId", {
			value,
			configurable: true,
			writable: true
		});
	}
};
//#endregion
export { J3w1Tabs };
