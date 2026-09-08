<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import UiSpecimen from '../UiSpecimen.vue';
const route = useRoute();
const pages = {
  basic: {title:'Forms that work with the browser.',text:'Native labels, real validation, review and correction.',ids:['admin-form']},
  advanced: {title:'More control. The same semantics.',text:'Search, select, repeat and configure with explicit keyboard behavior.',ids:['combobox','multiselect','repeater','settings-panel','date-picker','number-field','range']},
  wizard: {title:'One clear step at a time.',text:'Validation gates the next step. Previous values remain available.',ids:['wizard']},
  uploads: {title:'Choose files with confidence.',text:'Local file selection and removal. Files are never uploaded by this demo.',ids:['file-input']},
  builder: {title:'Compose a bounded form.',text:'Five field kinds, stable identities, local preview and explicit JSON transfer. The canonical builder remains draft.',ids:['form-builder']},
  charts: {title:'Make the numbers readable.',text:'A native SVG view and equivalent data table share the same values.',ids:['chart','progress','compact-dashboard']},
  developer: {title:'A workspace for exact detail.',text:'Read-only developer views with local search. No code or shell command is executed.',ids:['editor-search','code-editor','terminal','diff-view','diagnostics','file-browser','i3-window-frame']},
};
const config = computed(() => pages[route.params.kind] ?? pages.basic);
</script>
<template><header class="view-heading"><div><p class="eyebrow">WORKSPACE / FORMS & SYSTEM</p><h1 tabindex="-1">{{ config.title }}</h1><p>{{ config.text }}</p></div><a href="../implement/">Consumption guide ↗</a></header><div class="stack"><section v-for="id in config.ids" :key="id" class="panel"><div class="panel-heading"><h2>{{ id }}</h2><a :href="`../components/${id}/`">API and copy files ↗</a></div><UiSpecimen :id="id" /></section></div></template>
