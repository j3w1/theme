import { a as FORM_LIMITS, i as FIELD_TYPES, n as emptyValues, r as parseFormSchema, t as mountWorkflow } from "./form-workflow-B5efvJ6o.js";
//#region scripts/lib/form-builder.mjs
var createBuilder = (theme) => ({
	definition: {
		schemaVersion: 1,
		theme: { ...theme },
		density: "compact",
		fields: []
	},
	nextId: 1,
	values: {},
	errors: {}
});
var changeBuilder = (state, event) => {
	const next = structuredClone(state), fields = next.definition.fields;
	const index = fields.findIndex((field) => field.id === event.id);
	if (event.type === "reset") return createBuilder(state.definition.theme);
	if (event.type === "import") {
		next.definition = parseFormSchema(event.text, state.definition.theme);
		next.values = emptyValues(next.definition.fields);
		next.errors = {};
		next.nextId = 1;
		while (next.definition.fields.some((field) => field.id === `field-${next.nextId}`)) next.nextId++;
		return next;
	}
	if (event.type === "add") {
		if (!FIELD_TYPES.includes(event.kind) || fields.length >= FORM_LIMITS.fields) throw new Error("Choose a supported field type within the 20-field limit.");
		while (fields.some((field) => field.id === `field-${next.nextId}`)) next.nextId++;
		const id = `field-${next.nextId++}`;
		fields.push({
			id,
			type: event.kind,
			label: `New ${event.kind} field`,
			help: "",
			required: false,
			options: ["select", "radio"].includes(event.kind) ? [{
				id: "option-1",
				label: "First option"
			}, {
				id: "option-2",
				label: "Second option"
			}] : []
		});
	} else if (event.type === "density") next.definition.density = event.density;
	else {
		if (index < 0) throw new Error("Unknown field identity.");
		if (event.type === "remove") fields.splice(index, 1);
		else if (event.type === "move") {
			if (![1, -1].includes(event.direction) || index + event.direction < 0 || index + event.direction >= fields.length) throw new Error("Field cannot move further in that direction.");
			[fields[index], fields[index + event.direction]] = [fields[index + event.direction], fields[index]];
		} else if (event.type === "edit") {
			const { label, help, required, options } = event;
			fields[index] = {
				...fields[index],
				label,
				help,
				required,
				options
			};
		} else throw new Error("Unsupported builder operation.");
	}
	next.definition = parseFormSchema(JSON.stringify(next.definition), state.definition.theme);
	next.values = emptyValues(fields);
	next.errors = {};
	return next;
};
var exportDefinition = (state) => JSON.stringify(state.definition, null, 2) + "\n";
var identity_default = {
	name: "j3w1-theme",
	version: "1.1.0",
	profile: "default",
	sourceDigest: "sha256-SETo2Z9+7NAyXYJmiTKff++OQSeidfptSYDBAZz9EhE="
};
//#endregion
//#region packages/ui/src/internal/form-builder.js
var templates = {
	schemaVersion: 1,
	version: "1.1.0",
	templates: {
		"text": "<div class=\"text-field\">\n  <label class=\"text-field-label\" for=\"tf-name\">Display name <span class=\"text-field-required\" aria-hidden=\"true\">*</span><span class=\"text-field-required sr-only\"> required</span></label>\n  <div class=\"text-field-root\">\n    <input class=\"text-field-input\" id=\"tf-name\" type=\"text\" value=\"j3w1\" placeholder=\"Your name\" aria-describedby=\"tf-name-help tf-name-message\">\n    <span class=\"text-field-loading\" aria-hidden=\"true\">⋯</span>\n  </div>\n  <p class=\"text-field-help\" id=\"tf-name-help\">Shown on your profile and in the window title.</p>\n  <p class=\"text-field-message\" id=\"tf-name-message\">✕ Use 2 to 32 characters.</p>\n</div>",
		"textarea": "<div class=\"textarea\">\n  <label class=\"textarea-label\" for=\"ta-notes\">Release notes <span class=\"textarea-required\" aria-hidden=\"true\">*</span><span class=\"textarea-required sr-only\"> required</span></label>\n  <div class=\"textarea-root\">\n    <textarea class=\"textarea-input\" id=\"ta-notes\" rows=\"3\" placeholder=\"What changed and why\" aria-describedby=\"ta-notes-help ta-notes-message\">Focus rings now recolour on filled surfaces.\nDisabled controls no longer use opacity.</textarea>\n  </div>\n  <p class=\"textarea-help\" id=\"ta-notes-help\">Plain text; one change per line.</p>\n  <p class=\"textarea-message\" id=\"ta-notes-message\">✕ Say why, not only what.</p>\n</div>",
		"select": "<div class=\"select\">\n  <label class=\"select-label\" for=\"sel-workspace\">Workspace <span class=\"select-required\" aria-hidden=\"true\">*</span><span class=\"select-required sr-only\"> required</span></label>\n  <div class=\"select-root\">\n    <select class=\"select-control\" id=\"sel-workspace\" aria-describedby=\"sel-workspace-help sel-workspace-message\">\n      <option value=\"\">Choose a workspace</option>\n      <option value=\"1\" selected>1: terminal</option>\n      <option value=\"2\">2: editor</option>\n      <option value=\"3\">3: browser</option>\n    </select>\n    <svg class=\"select-chevron\" aria-hidden=\"true\" focusable=\"false\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"><path d=\"M4 6.5l4 4 4-4\"/></svg>\n  </div>\n  <p class=\"select-help\" id=\"sel-workspace-help\">New windows open here.</p>\n  <p class=\"select-message\" id=\"sel-workspace-message\">✕ Choose a workspace.</p>\n</div>",
		"checkbox": "<div class=\"checkbox\">\n  <label class=\"checkbox-option\">\n    <span class=\"checkbox-control\">\n      <input class=\"checkbox-input\" type=\"checkbox\" name=\"wrap\" aria-describedby=\"cb-wrap-message\">\n      <svg class=\"checkbox-check\" aria-hidden=\"true\" focusable=\"false\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"><path d=\"M3.5 8.5l3 3 6-6\"/></svg>\n      <svg class=\"checkbox-dash\" aria-hidden=\"true\" focusable=\"false\" width=\"16\" height=\"16\" viewBox=\"0 0 16 16\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\" stroke-linecap=\"square\"><path d=\"M4 8h8\"/></svg>\n    </span>\n    <span class=\"checkbox-text\">Wrap long lines <span class=\"checkbox-required\" aria-hidden=\"true\">*</span><span class=\"checkbox-required sr-only\"> required</span></span>\n  </label>\n  <p class=\"checkbox-message\" id=\"cb-wrap-message\">✕ Confirm before continuing.</p>\n</div>",
		"radio": "<fieldset class=\"radio-group\" aria-describedby=\"rg-layout-message\">\n  <legend class=\"radio-group-legend\">Default layout <span class=\"radio-group-required\" aria-hidden=\"true\">*</span><span class=\"radio-group-required sr-only\"> required</span></legend>\n  <div class=\"radio-group-options\">\n    <label class=\"radio-group-option\">\n      <span class=\"radio-group-control\">\n        <input class=\"radio-group-input\" type=\"radio\" name=\"layout\" value=\"split\">\n        <span class=\"radio-group-dot\" aria-hidden=\"true\"></span>\n      </span>\n      <span class=\"radio-group-text\">Split horizontally</span>\n    </label>\n    <label class=\"radio-group-option\">\n      <span class=\"radio-group-control\">\n        <input class=\"radio-group-input\" type=\"radio\" name=\"layout\" value=\"stacked\">\n        <span class=\"radio-group-dot\" aria-hidden=\"true\"></span>\n      </span>\n      <span class=\"radio-group-text\">Stacked</span>\n    </label>\n    <label class=\"radio-group-option\">\n      <span class=\"radio-group-control\">\n        <input class=\"radio-group-input\" type=\"radio\" name=\"layout\" value=\"tabbed\">\n        <span class=\"radio-group-dot\" aria-hidden=\"true\"></span>\n      </span>\n      <span class=\"radio-group-text\">Tabbed</span>\n    </label>\n  </div>\n  <p class=\"radio-group-message\" id=\"rg-layout-message\">✕ Choose a layout.</p>\n</fieldset>"
	}
}.templates;
var nextBuilder = 0;
var mountBuilder = (root, { signal } = {}) => {
	const controller = new AbortController();
	signal?.addEventListener("abort", () => controller.abort(), { once: true });
	const listen = (target, type, handler) => target.addEventListener(type, handler, { signal: controller.signal });
	let previewApi;
	const prefix = root.dataset.builderPrefix ??= `builder-instance-${++nextBuilder}`;
	let state = createBuilder(identity_default), selected = null;
	const find = (selector) => root.querySelector(selector), list = find("[data-field-list]"), editor = find("[data-editor]"), status = find("[data-builder-status]"), preview = find("[data-preview]");
	const prototype = preview.firstElementChild.cloneNode(true);
	const announce = (message) => {
		status.textContent = message;
	};
	const fieldControl = (name) => editor.elements.namedItem(name);
	const focusField = (id) => {
		([...list.querySelectorAll("[data-edit-id]")].find((button) => button.dataset.editId === id) ?? find("[data-add]")).focus();
	};
	const draw = () => {
		list.replaceChildren();
		find("[data-empty]").hidden = state.definition.fields.length > 0;
		find("[data-add]").disabled = state.definition.fields.length >= FORM_LIMITS.fields;
		find("[data-density-choice]").value = state.definition.density;
		for (const [index, field] of state.definition.fields.entries()) {
			const item = document.createElement("li"), label = document.createElement("strong");
			item.dataset.fieldId = field.id;
			label.textContent = `${field.label} (${field.type}, ${field.id})`;
			item.append(label);
			const actions = document.createElement("div");
			actions.className = "form-tool-actions";
			const button = (text, handler, disabled = false) => {
				const node = document.createElement("button");
				node.type = "button";
				node.className = "button button-secondary";
				node.textContent = text;
				node.disabled = disabled;
				listen(node, "click", handler);
				actions.append(node);
				return node;
			};
			const edit = button("Edit field", () => openEditor(field));
			edit.dataset.editId = field.id;
			button("Move up", () => apply({
				type: "move",
				id: field.id,
				direction: -1
			}, "Field moved up.", field.id), index === 0);
			button("Move down", () => apply({
				type: "move",
				id: field.id,
				direction: 1
			}, "Field moved down.", field.id), index === state.definition.fields.length - 1);
			button("Remove field", () => apply({
				type: "remove",
				id: field.id
			}, "Field removed.", state.definition.fields[index + 1]?.id ?? state.definition.fields[index - 1]?.id));
			item.append(actions);
			list.append(item);
		}
		previewApi?.destroy();
		const workflow = prototype.cloneNode(true);
		preview.replaceChildren(workflow);
		preview.dataset.density = state.definition.density;
		previewApi = mountWorkflow(workflow, {
			fields: state.definition.fields,
			templates,
			prefix: prefix + "-preview",
			signal: controller.signal
		});
	};
	const apply = (event, message, focusId) => {
		try {
			state = changeBuilder(state, event);
			selected = null;
			editor.hidden = true;
			draw();
			announce(message);
			if (focusId) focusField(focusId);
			else find("[data-add]").focus();
			return true;
		} catch (error) {
			announce(`Definition unchanged. ${error.message}`);
			return false;
		}
	};
	const openEditor = (field) => {
		selected = field.id;
		editor.hidden = false;
		fieldControl("label").value = field.label;
		fieldControl("help").value = field.help;
		fieldControl("required").checked = field.required;
		fieldControl("options").value = JSON.stringify(field.options, null, 2);
		find("[data-options-label]").hidden = !["select", "radio"].includes(field.type);
		fieldControl("label").focus();
	};
	listen(find("[data-add]"), "click", () => {
		if (apply({
			type: "add",
			kind: find("[data-kind]").value
		}, "Field added. Edit its definition.")) openEditor(state.definition.fields.at(-1));
	});
	listen(editor, "submit", (event) => {
		event.preventDefault();
		const field = state.definition.fields.find((field) => field.id === selected);
		let options = [];
		if (["select", "radio"].includes(field.type)) try {
			options = JSON.parse(fieldControl("options").value);
		} catch {
			announce("Definition unchanged. Options must be a JSON array of id and label objects.");
			return;
		}
		apply({
			type: "edit",
			id: selected,
			label: fieldControl("label").value,
			help: fieldControl("help").value,
			required: fieldControl("required").checked,
			options
		}, "Field definition saved. Preview values cleared.", selected);
	});
	listen(find("[data-cancel]"), "click", () => {
		editor.hidden = true;
		focusField(selected);
		selected = null;
	});
	listen(find("[data-density-choice]"), "change", (event) => apply({
		type: "density",
		density: event.target.value
	}, "Preview density changed. Preview values cleared."));
	listen(find("[data-export]"), "click", () => {
		find("[data-json]").value = exportDefinition(state);
		announce("Definition JSON ready. Entered preview values are excluded.");
	});
	listen(find("[data-download]"), "click", () => {
		const url = URL.createObjectURL(new Blob([exportDefinition(state)], { type: "application/json" })), link = document.createElement("a");
		link.href = url;
		link.download = "theme-form.json";
		document.body.append(link);
		link.click();
		link.remove();
		setTimeout(() => URL.revokeObjectURL(url), 0);
		announce("Definition download requested. Entered preview values are excluded.");
	});
	listen(find("[data-import]"), "click", () => apply({
		type: "import",
		text: find("[data-json]").value
	}, "Definition imported. Preview values cleared."));
	listen(find("[data-reset]"), "click", () => {
		apply({ type: "reset" }, "Builder reset. Definition and preview cleared.");
		find("[data-json]").value = "";
	});
	draw();
	root.hidden = false;
	return {
		exportDefinition: () => exportDefinition(state),
		importDefinition: (text) => apply({
			type: "import",
			text
		}, "Definition imported. Preview values cleared."),
		destroy() {
			controller.abort();
			previewApi?.destroy();
		}
	};
};
//#endregion
export { mountBuilder as t };
