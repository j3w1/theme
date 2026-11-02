import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as formComposition } from "../chunks/forms-C3u5121t.js";
// .cache/ui-build/entries/components/settings-panel.js
var J3w1SettingsPanel = class extends J3w1Element {
	static componentId = "settings-panel";
	static version = "4.0.0";
	static implementationId = "sha256-ED51an0ymCtlHkUQM0Sk0VgNjG1GK+ucBgtJAFTi2nI=";
	static connect = formComposition;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
};
export { J3w1SettingsPanel };
