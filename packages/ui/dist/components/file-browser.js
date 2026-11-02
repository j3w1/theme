import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { n as fileBrowser } from "../chunks/compositions-DWG4tv9E.js";
// .cache/ui-build/entries/components/file-browser.js
var J3w1FileBrowser = class extends J3w1Element {
	static componentId = "file-browser";
	static version = "4.0.0";
	static implementationId = "sha256-4K76FMxRutTXWd2WQZ21c23gbzw5z86V0UnvwDOrigI=";
	static connect = fileBrowser;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
};
export { J3w1FileBrowser };
