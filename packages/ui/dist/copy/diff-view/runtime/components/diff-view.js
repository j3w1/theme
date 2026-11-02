import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { r as developerView } from "../chunks/display-l54fb8vw.js";
// .cache/ui-build/entries/components/diff-view.js
var J3w1DiffView = class extends J3w1Element {
	static componentId = "diff-view";
	static version = "4.0.0";
	static implementationId = "sha256-xbLfnA1/siCeNpzpHk8FA2PFnz+aDd3RON68QHJ7WnM=";
	static connect = developerView;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	setText(...args) {
		if (!this._api?.setText) throw new Error("Connect the component before calling setText");
		return this._api.setText(...args);
	}
};
export { J3w1DiffView };
