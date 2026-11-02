import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as actions } from "../chunks/native-D61761VL.js";
// .cache/ui-build/entries/components/button.js
var J3w1Button = class extends J3w1Element {
	static componentId = "button";
	static version = "4.0.0";
	static implementationId = "sha256-koXqbIz5v3u05mvNMvJSSn5/vohXTinBFDR/EEkjLc0=";
	static connect = actions;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...[
		"disabled",
		"loading",
		"tone"
	]];
};
export { J3w1Button };
