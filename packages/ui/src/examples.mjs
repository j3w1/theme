import { parseFragment, serialize } from "parse5";
import { splitVariants } from "../../../scripts/lib/spec.mjs";
import { attribute, setAttribute, removeAttribute, hasClass, namespaceMarkup, walkMarkup } from "../../../scripts/lib/markup.mjs";
import { anchorFor } from "../../../scripts/lib/anchors.mjs";
import { escapeHtml as esc } from "../../../scripts/lib/hex-literals.mjs";
import { builderMarkup } from "./examples/form-markup.mjs";

const append = (node, html) => { const children = parseFragment(html).childNodes; for (const child of children) { child.parentNode = node; node.childNodes.push(child); } };
const nodes = tree => { const result = []; walkMarkup(tree, node => { if (node.tagName) result.push(node); }); return result; };
const replace = (node, html) => { const parent = node.parentNode, index = parent.childNodes.indexOf(node); const children = parseFragment(html).childNodes; children.forEach(child => { child.parentNode = parent; }); parent.childNodes.splice(index, 1, ...children); };
const wrap = (node, tag) => { const parent = node.parentNode, index = parent.childNodes.indexOf(node), wrapper = parseFragment(`<${tag}></${tag}>`).childNodes[0]; wrapper.parentNode = parent; parent.childNodes[index] = wrapper; wrapper.childNodes.push(node); node.parentNode = wrapper; };

function wizardMarkup(variant) {
  const labels = variant === "icons" ? ["Source", "Workspaces", "Bindings", "Review"] : ["Project", "Preferences", "Review"];
  return `<div class="wizard" aria-label="Set up a local project"><ol class="wizard-steps">${labels.map((label, i) => `<li class="wizard-step"><button class="wizard-step-button" type="button" ${i ? "disabled" : 'aria-current="step"'}><span class="wizard-step-marker" aria-hidden="true">${i + 1}</span><span class="wizard-step-name">${label}</span></button></li>`).join("")}</ol>${labels.map((label, i) => `<section class="wizard-panel" aria-labelledby="wizard-title-${i}" ${i ? "hidden" : ""}><h3 class="wizard-title" id="wizard-title-${i}">Step ${i + 1} of ${labels.length}: ${label}</h3>${i < labels.length - 1 ? `<label for="wizard-value-${i}">${label} name</label><input class="text-field-input" id="wizard-value-${i}" name="step-${i}" required>` : `<p class="wizard-text">All previous values remain available. Complete requests host handling; it does not send a network request.</p>`}</section>`).join("")}<div class="wizard-actions"><button class="wizard-back" type="button">Back</button><button class="wizard-next" type="button">Next / complete</button></div></div>`;
}

function widthMenu(index, label) {
  return `<j3w1-menu><div class="menu"><button class="menu-button" type="button" id="width-trigger-${index}" aria-haspopup="menu" aria-expanded="false" aria-controls="width-menu-${index}">Width: ${esc(label)}</button><ul class="menu-list" role="menu" id="width-menu-${index}" aria-labelledby="width-trigger-${index}" hidden>${["narrow", "widen", "reset"].map(action => `<li role="none"><button class="menu-item" type="button" role="menuitem" tabindex="-1" data-action="resize:${index}:${action}">${action === "narrow" ? "Narrower" : action === "widen" ? "Wider" : "Reset width"}</button></li>`).join("")}</ul></div></j3w1-menu>`;
}

function tableMarkup(id, variant) {
  const data = id !== "table", cls = data ? "data-table" : "table", selectable = data && variant !== "default", resizable = variant === "resizable";
  const columns = ["Project", "Owner", "Status", "Scope"];
  const records = variant === "empty" ? [] : [["Atlas library", "Avery Kim", "Ready", "24"], ["Orion workspace", "Jordan Lee", "In progress", "12"], ["Field notes", "Morgan Noor", "Ready", "38"], ["Signal monitor", "Riley Stone", "Review", "6"]];
  return `<div class="table-scroller" tabindex="0" role="region" aria-label="Project records"><table class="${cls}" ${variant === "loading" ? 'aria-busy="true"' : ""}><caption class="table-caption">Project records · synthetic fixture</caption><thead class="${cls}-head"><tr>${selectable ? '<th class="data-table-header data-table-header-select" scope="col"><button class="data-table-select-all" type="button" role="checkbox" aria-checked="false" aria-label="Select all rows"><span class="data-table-check-glyph" aria-hidden="true">✓</span></button></th>' : ""}${columns.map((label, i) => `<th class="${cls}-header" scope="col"><button class="${cls}-sort" type="button">${label}<span class="${cls}-sort-glyph" aria-hidden="true">↕</span></button>${resizable ? `<span class="data-table-resize" aria-hidden="true"></span>${widthMenu(i + Number(selectable), label)}` : ""}</th>`).join("")}</tr></thead><tbody class="${cls}-body">${records.map((record, index) => `<tr class="${cls}-row" id="record-${index}" data-status="${record[2]}" ${data ? `aria-selected="false" tabindex="${index === 0 ? "0" : "-1"}"` : ""}>${selectable ? `<td class="data-table-cell data-table-cell-select"><input class="data-table-checkbox" type="checkbox" aria-labelledby="record-name-${index}"></td>` : ""}${record.map((value, i) => `<td class="${cls}-cell" ${i === 0 ? `id="record-name-${index}"` : ""}>${value}</td>`).join("")}</tr>`).join("")}<tr class="${cls}-empty" ${records.length ? "hidden" : ""}><td class="${cls}-empty-cell" colspan="${columns.length + Number(selectable)}">No rows match.</td></tr><tr class="${cls}-loading" ${variant === "loading" ? "" : "hidden"}><td colspan="${columns.length + Number(selectable)}">⋯ Loading rows</td></tr></tbody></table></div>`;
}

function filterableMarkup(variant) {
  return `<section class="filterable-table" aria-label="Project records"><div class="filterable-table-toolbar"><j3w1-search-field><div class="search-field"><label class="search-field-label" for="records-search">Search projects</label><div class="search-field-root"><input class="search-field-input" id="records-search" type="search"><button class="search-field-clear" type="button" aria-label="Clear search">Clear</button></div></div></j3w1-search-field><label for="records-status">Status<select class="select-control" id="records-status" data-status-filter><option value="all">All statuses</option><option>Ready</option><option>In progress</option><option>Review</option></select></label></div>${tableMarkup("data-table", variant === "default" ? "selectable" : variant)}<p class="filterable-table-count" role="status" data-table-status></p></section>`;
}

function adminMarkup(variant) {
  return `<section class="admin-form" ${variant === "review" ? 'data-start="review"' : ""}><h2 class="admin-form-title">Project details</h2><p>Review the local values before passing them to your app.</p><form data-native-form><fieldset class="fieldset"><legend>Project information</legend><j3w1-text-field><div class="text-field"><label class="text-field-label" for="project-name">Project name</label><div class="text-field-root"><input class="text-field-input" id="project-name" name="project" value="Atlas library" required></div></div></j3w1-text-field><j3w1-textarea><div class="textarea"><label class="textarea-label" for="project-notes">Notes</label><textarea class="textarea-input" id="project-notes" name="notes" rows="3">A reusable component library.</textarea></div></j3w1-textarea><j3w1-select><div class="select"><label class="select-label" for="project-scope">Scope</label><div class="select-root"><select class="select-control" id="project-scope" name="scope"><option value="library">Library</option><option value="application">Application</option></select></div></div></j3w1-select></fieldset><div class="form-tool-actions"><button class="button" type="submit">Review values</button><button class="button button-secondary" type="reset">Reset</button></div></form><section data-form-review hidden aria-label="Review project values"><h3 tabindex="-1">Review values</h3><table class="table"><caption>Values to pass to the host</caption><tbody></tbody></table><div class="form-tool-actions"><button class="button button-secondary" type="button" data-form-edit>Edit values</button><button class="button" type="button" data-form-confirm>Confirm values</button></div></section><p role="status" data-form-status></p></section>`;
}

export function renderUsage(component, variant, prefix) {
  if (!/^[a-z][a-z0-9-]*$/.test(prefix)) throw new TypeError("Use a unique lowercase kebab-case example prefix");
  let markup = splitVariants(component.demo ?? "").get(variant);
  if (markup === undefined) throw new Error(`Missing maintained variant: ${component.id}/${variant}`);
  if (component.id === "wizard") markup = wizardMarkup(variant);
  if (["table", "data-table"].includes(component.id)) markup = tableMarkup(component.id, variant);
  if (component.id === "filterable-table") markup = filterableMarkup(variant);
  if (component.id === "admin-form") markup = adminMarkup(variant);
  if (component.id === "form-builder") markup = builderMarkup("builder");
  const tree = parseFragment(markup);
  if (["dialog", "drawer", "command-palette"].includes(component.id)) {
    const dialog = nodes(tree).find(node => node.tagName === "dialog");
    if (!dialog) throw new Error("Missing native dialog");
    removeAttribute(dialog, "open");
    if (["dialog", "drawer"].includes(component.id)) {
      const parent = dialog.parentNode;
      if (hasClass(parent, `${component.id}-backdrop`)) replace(parent, serialize(parseFragment(serialize(parent))));
      // Unwrap the static backdrop; native ::backdrop owns the production overlay.
      const currentDialog = nodes(tree).find(node => node.tagName === "dialog");
      const backdrop = currentDialog.parentNode;
      if (hasClass(backdrop, `${component.id}-backdrop`)) { const outer = backdrop.parentNode, index = outer.childNodes.indexOf(backdrop); currentDialog.parentNode = outer; outer.childNodes.splice(index, 1, currentDialog); }
      append(tree, `<button class="button" type="button" data-open>Open ${esc(component.name.toLowerCase())}</button>`);
    }
    for (const button of nodes(tree).filter(node => node.tagName === "button" && (hasClass(node, "dialog-button") || hasClass(node, "drawer-button")))) {
      if (attribute(button, "type") !== "submit") setAttribute(button, hasClass(button, "dialog-button-primary") || hasClass(button, "dialog-button-destructive") ? "data-action" : "data-close", hasClass(button, "dialog-button-destructive") ? "delete" : hasClass(button, "dialog-button-primary") ? "confirm" : "cancel");
    }
  }
  if (component.id === "menu") {
    for (const [index, button] of nodes(tree).filter(node => node.tagName === "button" && attribute(node, "aria-haspopup") === "menu" && attribute(node, "role") === "menuitem").entries()) {
      const id = `submenu-${index}`; setAttribute(button, "aria-controls", id); setAttribute(button, "id", `${id}-trigger`);
      append(button.parentNode, `<ul class="menu-list" role="menu" id="${id}" aria-labelledby="${id}-trigger" hidden><li role="none"><button class="menu-item" type="button" role="menuitemradio" aria-checked="true" tabindex="-1" data-action="${id}:first">First option</button></li><li role="none"><button class="menu-item" type="button" role="menuitemradio" aria-checked="false" tabindex="-1" data-action="${id}:second">Second option</button></li></ul>`);
    }
  }
  if (component.id === "toolbar" && variant === "overflow") {
    const more = nodes(tree).find(node => hasClass(node, "toolbar-more"));
    if (more) replace(more, `<j3w1-menu><div class="menu"><button class="toolbar-button toolbar-more" type="button" id="toolbar-more-trigger" aria-haspopup="menu" aria-expanded="false" aria-controls="toolbar-more-menu" tabindex="-1">More</button><ul class="menu-list" role="menu" id="toolbar-more-menu" aria-labelledby="toolbar-more-trigger" hidden><li role="none"><button class="menu-item" type="button" role="menuitem" tabindex="-1" data-action="format">Format</button></li><li role="none"><button class="menu-item" type="button" role="menuitemcheckbox" tabindex="-1" aria-checked="false" data-action="whitespace">Show whitespace</button></li></ul></div></j3w1-menu>`);
  }
  if (component.id === "i3-window-frame") {
    const list = nodes(tree).find(node => hasClass(node, "i3-window-frame-workspaces"));
    const area = nodes(tree).find(node => hasClass(node, "i3-window-frame-area"));
    if (list && area) {
      const buttons = nodes(list).filter(node => attribute(node, "role") === "tab");
      buttons.forEach((button, index) => { setAttribute(button, "id", `workspace-tab-${index}`); setAttribute(button, "aria-controls", `workspace-panel-${index}`); });
      wrap(area, "section");
      const panel = area.parentNode; setAttribute(panel, "role", "tabpanel"); setAttribute(panel, "id", "workspace-panel-0"); setAttribute(panel, "aria-labelledby", "workspace-tab-0");
      buttons.slice(1).forEach((_, index) => append(panel.parentNode, `<section role="tabpanel" id="workspace-panel-${index + 1}" aria-labelledby="workspace-tab-${index + 1}" hidden><p>Workspace ${index + 2} is empty.</p></section>`));
    }
  }
  if (component.id === "breadcrumbs") {
    for (const [index, button] of nodes(tree).filter(node => hasClass(node, "breadcrumbs-ellipsis")).entries()) {
      const id = `breadcrumb-levels-${index}`, count = Number(attribute(button, "aria-label")?.match(/\d+/)?.[0] ?? 2);
      setAttribute(button, "aria-controls", id);
      append(button.parentNode, `<ol id="${id}" hidden>${Array.from({ length: count }, (_, i) => `<li><a class="breadcrumbs-link" href="#level-${i}">Level ${i + 1}</a></li>`).join("")}</ol>`);
    }
  }
  if (component.id === "tree" || component.id === "file-browser") {
    for (const item of nodes(tree).filter(node => attribute(node, "role") === "treeitem" && attribute(node, "aria-expanded") !== undefined)) {
      const label = item.childNodes.find(node => attribute(node, "data-tree-label") !== undefined);
      if (label) append(label, '<button type="button" tabindex="-1" data-tree-toggle aria-label="Toggle children">▸</button>');
    }
  }
  if (component.id === "settings-panel") {
    const panel = nodes(tree).find(node => hasClass(node, "settings-panel"));
    wrap(panel, "form");
    nodes(tree).filter(node => hasClass(node, "settings-panel-apply")).forEach(node => setAttribute(node, "type", "submit"));
    for (const node of nodes(tree).filter(node => attribute(node, "role") === "switch")) wrap(node, "j3w1-switch");
    append(tree, '<p role="status" data-form-status></p>');
  }
  if (component.id === "diff-view") {
    const table = nodes(tree).find(node => hasClass(node, "diff-view"));
    wrap(table, "div");
    setAttribute(table.parentNode, "class", "diff-view-scroll");
    setAttribute(table.parentNode, "tabindex", "0");
    setAttribute(table.parentNode, "role", "region");
    setAttribute(table.parentNode, "aria-label", "Source differences");
  }
  if (component.id === "file-input") {
    nodes(tree).filter(node => hasClass(node, "file-input-list")).forEach(node => { node.childNodes = []; });
    nodes(tree).filter(node => hasClass(node, "file-input-status")).forEach(node => { node.childNodes = parseFragment("No file chosen").childNodes; });
    nodes(tree).filter(node => hasClass(node, "file-input-help")).forEach(node => { node.childNodes = parseFragment("Choose local files. This component does not upload them; the host validates its own file policy.").childNodes; });
  }
  if (component.id === "alert" && variant === "dismissible") nodes(tree).filter(node => hasClass(node, "alert-text")).forEach(node => { node.childNodes = parseFragment("Example notification. Dismiss removes this local message.").childNodes; });
  for (const node of nodes(tree)) {
    if (["input", "textarea", "select"].includes(node.tagName) && !attribute(node, "name") && attribute(node, "type") !== "search") setAttribute(node, "name", attribute(node, "id") ?? "value");
    if (node.tagName === "button" && attribute(node, "type") === undefined) setAttribute(node, "type", "button");
    if (node.tagName === "a" && hasClass(node, "pagination-link")) { const text = serialize(node).replace(/<[^>]+>/g, "").trim(); if (/^\d+$/.test(text)) setAttribute(node, "data-page", text); }
  }
  // Each documented standalone example includes the targets of its sample fragment links.
  const known = new Set(nodes(tree).map(node => attribute(node, "id")).filter(Boolean));
  const targets = new Set(nodes(tree).map(node => attribute(node, "href")).filter(href => href?.startsWith("#") && href.length > 1).map(href => href.slice(1)).filter(id => !known.has(id)));
  for (const id of targets) append(tree, `<p id="${esc(id)}" tabindex="-1" class="j3w1-example-target">Example destination: ${esc(id.replaceAll("-", " "))}</p>`);
  namespaceMarkup(tree, id => anchorFor.uiExample(prefix, id), { strict: false, renameNames: component.id !== "form-builder" });
  const attributes = component.id === "repeater" ? ' max="10"' : "";
  return `<j3w1-${component.id} id="${prefix}"${attributes}>${serialize(tree)}</j3w1-${component.id}>`;
}
