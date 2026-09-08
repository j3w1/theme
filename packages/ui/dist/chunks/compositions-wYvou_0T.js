import { i as all, o as enabled } from "./choice-BYcDpKUh.js";
import { i as tabs } from "./navigation-BPzB8WCr.js";
//#region packages/ui/src/behaviors/compositions.js
function fileBrowser(root, { on }) {
	const query = root.querySelector("[data-file-query]"), rows = all(root, "tr[data-file-id]"), status = root.querySelector("[data-file-status]");
	let location = "all";
	const filter = () => {
		rows.forEach((row) => {
			row.hidden = location !== "all" && row.dataset.location !== location || !row.textContent.toLocaleLowerCase().includes((query?.value ?? "").toLocaleLowerCase());
		});
		if (status) status.textContent = `${rows.filter((row) => !row.hidden).length} files`;
	};
	on(query, "input", filter);
	on(root, "j3w1-select", (event) => {
		const item = root.querySelector(`#${CSS.escape(event.detail.id)}`);
		if (item?.dataset.location) {
			location = item.dataset.location;
			filter();
		}
	});
	on(root, "click", (event) => {
		const button = event.target.closest("[data-file-open]");
		if (button && enabled(button)) root.emit("open-file", { id: button.dataset.fileOpen });
	});
	filter();
	return {};
}
function dashboard(root, { on }) {
	on(root, "click", (event) => {
		const button = event.target.closest("[data-record]");
		if (button && enabled(button)) root.emit("open-record", { id: button.dataset.record });
	});
	return {};
}
function windowFrame(root, context) {
	const { on } = context;
	for (const list of all(root, "[role=\"tablist\"]")) tabs(root, context, list);
	on(root, "click", (event) => {
		const button = event.target.closest("button");
		if (!button || !enabled(button)) return;
		const tab = button.closest("[role=tab]");
		if (tab) {
			const list = tab.closest("[role=tablist]");
			all(list, "[role=tab]").forEach((item) => item.setAttribute("aria-selected", String(item === tab)));
		}
		root.emit("window-action", { action: button.dataset.action ?? button.getAttribute("aria-label") ?? button.textContent.trim() });
	});
	return {};
}
//#endregion
export { fileBrowser as n, windowFrame as r, dashboard as t };
