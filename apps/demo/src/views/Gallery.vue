<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import index from '@j3w1/ui/index.json';
import { loaders } from '../generated-loaders.js';
import UiSpecimen from '../UiSpecimen.vue';
const route = useRoute(), query = ref(''), variants = ref([]), variant = ref('default'), markup = ref(''), message = ref('');
const item = computed(() => index.components.find(item=>item.id===route.params.id));
const filtered = computed(() => index.components.filter(item=>`${item.id} ${item.name}`.toLowerCase().includes(query.value.toLowerCase())));
let request = 0;
watch(() => route.params.id, async id => { const current=++request;variants.value=[];variant.value='default';message.value='';if(!loaders[id])return;const examples=await loaders[id]();if(current!==request)return;variants.value=Object.keys(examples);variant.value=variants.value[0];markup.value=examples[variant.value]; }, {immediate:true});
watch(variant, async value => { const id=route.params.id;if(loaders[id])markup.value=(await loaders[id]())[value] ?? ''; });
async function copy() { try { await navigator.clipboard.writeText(markup.value); message.value='Maintained markup copied. Include its package registration and styles.'; } catch { message.value='Clipboard unavailable. Select the source below to copy it.'; } }
</script>
<template><header class="view-heading"><div><p class="eyebrow">J3W1 / COMPONENT GALLERY</p><h1 tabindex="-1">{{ item?.name ?? '67 components. One foundation.' }}</h1><p>Official package implementations, rendered inside a Vue application.</p></div><RouterLink v-if="item" to="/components">← All components</RouterLink></header>
  <template v-if="item"><div class="filters"><label>Variant<select v-model="variant"><option v-for="name in variants" :key="name">{{ name }}</option></select></label><a :href="`../components/${item.id}/`">Complete specification, API and copy files ↗</a></div><section class="panel"><UiSpecimen :id="item.id" :variant="variant" /></section><div class="actions"><button type="button" @click="copy">Copy maintained markup</button></div><p role="status">{{ message }}</p><pre class="panel"><code>{{ markup }}</code></pre></template>
  <template v-else><div class="filters"><label>Find a component<input v-model="query" type="search" placeholder="dialog, field, chart…"></label><span>{{ filtered.length }} components</span></div><div class="gallery-grid"><RouterLink v-for="component in filtered" :key="component.id" :to="`/components/${component.id}`" class="panel gallery-link"><p class="eyebrow">{{ component.maturity }}</p><h2>{{ component.name }} →</h2><p class="muted">{{ component.id }}</p></RouterLink></div><p v-if="!filtered.length">No matching components.</p></template>
</template>
