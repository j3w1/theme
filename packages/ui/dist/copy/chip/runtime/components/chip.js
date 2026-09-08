import { t as J3w1Element } from "../chunks/element-B0z6sqq8.js";
import { t as feedback } from "../chunks/overlays-DBA40kTs.js";
//#region .cache/ui-build/entries/components/chip.js
var J3w1Chip = class extends J3w1Element {
	static componentId = "chip";
	static version = "1.0.0";
	static implementationId = "sha256-vGrbN9eoF4OUd62CdTwWT2dwZF68LND+yGcEG8FvIeA=";
	static connect = feedback;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
	dismiss(...args) {
		if (!this._api?.dismiss) throw new Error("Connect the component before calling dismiss");
		return this._api.dismiss(...args);
	}
};
//#endregion
export { J3w1Chip };
