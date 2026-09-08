// Independently authored diagnostic fixture. Host defaults/styles are supplied
// privately at runtime; no purchased template implementation is distributed.
import { createApp, h } from "vue";
import { createVuetify } from "vuetify";
import { VApp, VBtn, VTextField, VSelect, VCheckbox, VTabs, VTab, VDialog, VCard, VCardTitle, VCardText, VCardActions, VTable } from "vuetify/components";
import "vuetify/styles";
import fixture from "./fixture.json";
export const mountParity = defaults => {
  const { data, tokens } = fixture;
  const query = new URLSearchParams(location.search);
  const id = query.get("component") || "button", state = query.get("state") || "default";
  const props = { disabled: state === "disabled", error: state === "invalid", density: "comfortable" };
  const render = () => {
    if (id === "button") return h(VBtn, { ...props, variant: "flat" }, () => data.label);
    if (id === "text-field") return h(VTextField, { ...props, label: data.label, modelValue: data.value });
    if (id === "select") return h(VSelect, { ...props, label: data.label, items: data.options, modelValue: data.options[0] });
    if (id === "checkbox") return h(VCheckbox, { ...props, label: data.label, modelValue: state === "checked" || state === "selected" });
    if (id === "tabs") return h(VTabs, { ...props, modelValue: "one" }, () => data.options.map((label, i) => h(VTab, { value: i ? "two" : "one" }, () => label)));
    if (id === "dialog") return h(VDialog, { modelValue: true, width: 480, transition: false }, () => h(VCard, {}, { default: () => [
      h(VCardTitle, {}, () => data.label), h(VCardText, {}, () => data.value),
      h(VCardActions, {}, () => h(VBtn, props, () => "Close")),
    ] }));
    return h(VTable, { density: "comfortable" }, () => [
      h("thead", {}, h("tr", {}, ["Name", "State"].map(value => h("th", {}, value)))),
      h("tbody", {}, h("tr", {}, data.row.map(value => h("td", {}, value)))),
    ]);
  };
  const value = role => tokens[role].css;
  const vuetify = createVuetify({ defaults, theme: { defaultTheme: "parity", themes: { parity: { dark: true, colors: {
    primary: value("color.action.primary.bg"), "on-primary": value("color.action.primary.text"),
    background: value("color.surface.canvas"), "on-background": value("color.text.default"),
    surface: value("color.surface.default"), "on-surface": value("color.text.default"),
    error: value("color.status.danger.text"),
  } } } } });
  createApp({ render: () => h(VApp, {}, () => h("main", { "data-parity-host": "", style: { fontFamily: value("font.family.mono"), padding: value("space.16") } }, [render()])) }).use(vuetify).mount("#app");
  document.documentElement.dataset.parityReady = "true";
};
