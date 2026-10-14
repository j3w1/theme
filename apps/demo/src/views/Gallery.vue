<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import index from '@j3w1/ui/index.json';
import { loaders } from '../generated-loaders.js';
import UiSpecimen from '../UiSpecimen.vue';
import '@j3w1/ui/register/card';
import '@j3w1/ui/styles/card.css';
import '@j3w1/ui/styles/link.css';
const route = useRoute(), query = ref(''), variants = ref([]), variant = ref('default'), markup = ref(''), message = ref('');
const item = computed(() => index.components.find(item=>item.id===route.params.id));
const filtered = computed(() => index.components.filter(item=>`${item.id} ${item.name}`.toLowerCase().includes(query.value.toLowerCase())));
let request = 0;
watch(() => route.params.id, async id => { const current=++request;variants.value=[];variant.value='default';message.value='';if(!loaders[id])return;const examples=await loaders[id]();if(current!==request)return;variants.value=Object.keys(examples);variant.value=variants.value[0];markup.value=examples[variant.value]; }, {immediate:true});
watch(variant, async value => { const id=route.params.id;if(loaders[id])markup.value=(await loaders[id]())[value] ?? ''; });
async function copy() { try { await navigator.clipboard.writeText(markup.value); message.value='Maintained markup copied. Include its package registration and styles.'; } catch { message.value='Clipboard unavailable. Select the source below to copy it.'; } }
</script>
<template>
  <header class="view-heading">
    <div>
      <p class="eyebrow">J3W1 / COMPONENT GALLERY</p>
      <h1 tabindex="-1">{{ item?.name ?? `${index.components.length} components. One foundation.` }}</h1>
      <p>Official package implementations, rendered inside a Vue application.</p>
    </div>
    <j3w1-link v-if="item"><RouterLink class="link link-standalone" to="/components">← All components</RouterLink></j3w1-link>
  </header>
  <template v-if="item">
    <div class="filters">
      <j3w1-select>
        <div class="select">
          <label class="select-label" for="gallery-variant">Variant</label>
          <div class="select-root">
            <select id="gallery-variant" class="select-control" name="variant" v-model="variant">
              <option v-for="name in variants" :key="name">{{ name }}</option>
            </select>
            <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
          </div>
        </div>
      </j3w1-select>
      <j3w1-link><a class="link link-standalone" :href="`../components/${item.id}/`">Complete specification, API and copy files ↗</a></j3w1-link>
    </div>
    <section class="panel"><UiSpecimen :id="item.id" :variant="variant" /></section>
    <div class="actions">
      <j3w1-button><button class="button button-secondary" type="button" @click="copy">Copy maintained markup</button></j3w1-button>
    </div>
    <p role="status">{{ message }}</p>
    <pre class="panel"><code>{{ markup }}</code></pre>
  </template>
  <template v-else>
    <div class="filters">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="gallery-query">Find a component</label>
          <div class="text-field-root">
            <input id="gallery-query" class="text-field-input" type="search" name="query" v-model="query" placeholder="dialog, field, chart…">
          </div>
        </div>
      </j3w1-text-field>
      <span>{{ filtered.length }} components</span>
    </div>
    <div class="gallery-grid">
      <j3w1-card v-for="component in filtered" :key="component.id">
        <RouterLink class="card card-link" :to="`/components/${component.id}`">
          <span class="card-title">{{ component.name }} →</span>
          <span class="card-body">{{ component.id }}</span>
          <span class="card-meta">{{ component.maturity }}</span>
        </RouterLink>
      </j3w1-card>
    </div>
    <p v-if="!filtered.length">No matching components.</p>
  </template>
</template>
