import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as developerView } from "../chunks/display-l54fb8vw.js";
// .cache/ui-build/entries/components/diagnostics.js
var J3w1Diagnostics = class extends J3w1Element {
	static componentId = "diagnostics";
	static version = "4.0.0";
	static implementationId = "sha256-Mh5W9ln8UtoAd11LHTHBFeXEbEIbq3SsLr4Dp7ETLtk=";
	static connect = developerView;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	setText(...args) {
		if (!this._api?.setText) throw new Error("Connect the component before calling setText");
		return this._api.setText(...args);
	}
};
export { J3w1Diagnostics };
