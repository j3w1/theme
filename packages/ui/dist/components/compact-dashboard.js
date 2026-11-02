import { t as J3w1Element } from "../chunks/element-DcrNU9Wh.js";
import { t as dashboard } from "../chunks/compositions-DWG4tv9E.js";
// .cache/ui-build/entries/components/compact-dashboard.js
var J3w1CompactDashboard = class extends J3w1Element {
	static componentId = "compact-dashboard";
	static version = "4.0.0";
	static implementationId = "sha256-XGMk6csk8qspD/G8I2T9TzGnFhunqMgxXUJbb9/81pY=";
	static connect = dashboard;
	static upgradeProperties = ["disabled", "name"];
	static observedAttributes = [...J3w1Element.observedAttributes, ...["disabled", "loading"]];
};
export { J3w1CompactDashboard };
