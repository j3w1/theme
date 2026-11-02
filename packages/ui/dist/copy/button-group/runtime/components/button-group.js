import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as actions } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/button-group.js
var J3w1ButtonGroup = class extends J3w1Element {
	static componentId = "button-group";
	static version = "4.0.0";
	static implementationId = "sha256-nnr9B7SyHVj5bc9rHfUyedaHq9k8ZhIaf8pJalBfpeU=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
export { J3w1ButtonGroup };
