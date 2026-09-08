import { createApp, ref, computed, watch, nextTick, onMounted, onUnmounted } from "vue/dist/vue.esm-bundler.js";
import screen from "./screen.html?raw";
import { renderHexText } from "../../scripts/lib/hex-literals.mjs";

const data = JSON.parse(document.querySelector("#review-data").textContent);
const scenes = ["dashboard", "records", "settings", "components", "developer", "consume"];
const params = new URLSearchParams(location.search);
const defaults = { scene: scenes.includes(params.get("scene")) ? params.get("scene") : "dashboard", query: "", status: "all", selected: "all", name: "Orion workspace", email: "operator@example.test", language: "English", alerts: true, density: params.get("density") === "compact" ? "compact" : "comfortable", direction: params.get("dir") === "rtl" ? "rtl" : "ltr", palette: false, command: "", active: 0, submitted: false, edited: false };
const validState = value => value && typeof value === "object" && Object.keys(defaults).every(k => typeof value[k] === typeof defaults[k]) && scenes.includes(value.scene) && ["compact", "comfortable"].includes(value.density) && ["ltr", "rtl"].includes(value.direction);
const rows = [
  { id: "001", name: "Atlas components", type: "Library", owner: "AK", progress: 86, status: "Ready", amount: "24 components" },
  { id: "002", name: "Orion workspace", type: "Application", owner: "JL", progress: 64, status: "In progress", amount: "12 screens" },
  { id: "003", name: "Field notes", type: "Documentation", owner: "MN", progress: 92, status: "Ready", amount: "38 entries" },
  { id: "004", name: "Signal monitor", type: "Dashboard", owner: "AK", progress: 41, status: "Review", amount: "6 charts" },
  { id: "005", name: "Index explorer", type: "Tool", owner: "RS", progress: 73, status: "In progress", amount: "18 views" },
];

createApp({
  template: data.compare ? `<section class="compare-controls"><label>Scene<select v-model="state.scene"><option v-for="scene in scenes">{{scene}}</option></select></label><label>Frame width<select v-model.number="width"><option :value="1280">1280 · desktop</option><option :value="640">640 · 200% equivalent reflow</option><option :value="360">360 · mobile</option></select></label><label>Density<select v-model="state.density"><option>comfortable</option><option>compact</option></select></label><label>Direction<select v-model="state.direction"><option>ltr</option><option>rtl</option></select></label><button @click="reset">Reset all views</button><p>Frames scroll horizontally at full desktop width; no scale transform changes their text size.</p></section><div class="compare-grid"><section v-for="candidate in data.candidates" :key="candidate.id"><h2>{{candidate.name}} <a :href="'/review/'+candidate.id+'/'">Open</a></h2><div class="frame-scroll"><iframe :title="candidate.name" :src="'/review/'+candidate.id+'/?embedded=1'" :style="{width:width+'px'}" @load="broadcast"></iframe></div></section></div>` : screen,
  setup() {
    const state = ref({ ...defaults });
    const width = ref(1280);
    const dialog = ref(null);
    const commandInput = ref(null);
    const opener = ref(null);
    const notice = ref("");
    const filterRows = computed(() => rows.filter(r => `${r.name} ${r.type}`.toLowerCase().includes(state.value.query.toLowerCase()) && (state.value.status === "all" || r.status === state.value.status)));
    const commandRows = computed(() => [
      { category: "components", label: "Button · action tones", scene: "components" },
      { category: "components", label: "Text field · validation", scene: "settings" },
      { category: "tokens", label: "color.interaction.focus.ring", hex: data.focusHex, scene: "components" },
      { category: "apps", label: "Workspace overview", scene: "dashboard" },
      { category: "tools", label: "Records and filters", scene: "records" },
      { category: "agents", label: "Consume a component", scene: "consume" },
      { category: "reference", label: "Code, diff and terminal", scene: "developer" },
    ].filter(r => `${r.category} ${r.label}`.toLowerCase().includes(state.value.command.toLowerCase())));
    const valid = computed(() => state.value.name.trim().length > 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(state.value.email));
    let receiving = false;
    const broadcast = () => {
      const snapshot = JSON.parse(JSON.stringify(state.value));
      if (data.compare) document.querySelectorAll("iframe").forEach(frame => frame.contentWindow.postMessage({ type: "review-state", state: snapshot }, location.origin));
      else if (window.parent !== window) window.parent.postMessage({ type: "review-change", state: snapshot }, location.origin);
    };
    const receive = async event => {
      if (event.origin !== location.origin) return;
      if (data.compare && ![...document.querySelectorAll("iframe")].some(frame => frame.contentWindow === event.source)) return;
      if (!data.compare && event.source !== window.parent) return;
      if (data.compare && event.data?.type === "review-ready") { broadcast(); return; }
      if (!validState(event.data?.state)) return;
      if (event.data.type !== (data.compare ? "review-change" : "review-state")) return;
      receiving = true;
      state.value = { ...event.data.state };
      await nextTick();
      receiving = false;
      if (data.compare) broadcast();
    };
    watch(state, async () => {
      document.documentElement.dataset.density = state.value.density;
      document.documentElement.dir = state.value.direction;
      if (!receiving) broadcast();
      await nextTick();
      if (dialog.value) {
        if (state.value.palette && !dialog.value.open) { dialog.value.showModal(); commandInput.value?.focus(); }
        if (!state.value.palette && dialog.value.open) { dialog.value.close(); opener.value?.focus(); }
      }
    }, { deep: true });
    const openPalette = event => { opener.value = event?.currentTarget ?? document.activeElement; state.value.palette = true; state.value.active = 0; };
    const closePalette = () => { state.value.palette = false; };
    const activate = () => { const row = commandRows.value[state.value.active]; if (row) { state.value.scene = row.scene; closePalette(); } };
    const commandKey = event => {
      const last = commandRows.value.length - 1;
      if (event.key === "ArrowDown") { event.preventDefault(); state.value.active = Math.min(last, state.value.active + 1); }
      if (event.key === "ArrowUp") { event.preventDefault(); state.value.active = Math.max(0, state.value.active - 1); }
      if (event.key === "Enter") { event.preventDefault(); activate(); }
      // Keep native Home/End text editing in the query input.
    };
    watch(() => state.value.command, () => { state.value.active = 0; });
    const key = event => {
      const editing = event.target.closest("input,textarea,select,[contenteditable]");
      if ((event.ctrlKey && event.key.toLowerCase() === "k") || (event.key === "/" && !editing)) { event.preventDefault(); openPalette(); }
    };
    onMounted(() => {
      window.addEventListener("message", receive); window.addEventListener("keydown", key);
      document.documentElement.dataset.density = state.value.density;
      document.documentElement.dir = state.value.direction;
      if (params.has("embedded")) document.body.classList.add("embedded");
      if (!data.compare && window.parent !== window) window.parent.postMessage({ type: "review-ready" }, location.origin);
      else broadcast();
    });
    onUnmounted(() => { window.removeEventListener("message", receive); window.removeEventListener("keydown", key); });
    const reset = () => { state.value = { ...defaults }; notice.value = "Preview reset"; };
    const save = () => { state.value.submitted = true; notice.value = valid.value ? "Preview saved in memory. No request was sent." : "Check the marked fields; your values are preserved."; };
    return { data, state, scenes, width, rows, filterRows, commandRows, valid, dialog, commandInput, notice,
      broadcast, reset, save, openPalette, closePalette, activate, commandKey,
      swatch: hex => renderHexText(hex ?? ""), bars: [32, 44, 38, 56, 48, 70, 58, 82, 65, 74, 88, 78],
      go: scene => { state.value.scene = scene; },
    };
  },
}).mount("#review-app");
