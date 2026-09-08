import { t as J3w1Element } from "../chunks/element-C3vTYwcS.js";
import { t as actions } from "../chunks/native-B49Q0p0_.js";
//#region .cache/ui-build/entries/components/button.js
var J3w1Button = class extends J3w1Element {
	static componentId = "button";
	static version = "1.1.0";
	static implementationId = "sha256-iljdo29aJPlpRcV0JiWsbCyUOdYtiEUupAvVzD66dEI=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
//#endregion
export { J3w1Button };
