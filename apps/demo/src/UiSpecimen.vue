<script setup>
import { ref, watch, onBeforeUnmount } from 'vue';
import { loaders } from './generated-loaders.js';
const props = defineProps({ id: String, variant: { type: String, default: 'default' } });
const emit = defineEmits(['ready']);
const host = ref(), error = ref('');
let sequence = 0;
// All markup comes from the installed maintained package, never application input.
watch(() => [props.id, props.variant, host.value], async () => {
  const request = ++sequence;
  if (!host.value) return;
  error.value = '';
  try {
    if (!loaders[props.id]) throw new Error('Unknown component');
    const variants = await loaders[props.id]();
    if (request !== sequence) return;
    const template = document.createElement('template'); template.innerHTML = variants[props.variant] ?? variants.default ?? Object.values(variants)[0];
    const prefix = `demo-${crypto.randomUUID()}`;
    const ids = new Map([...template.content.querySelectorAll('[id]')].map(node => [node.id, `${prefix}-${node.id}`]));
    for (const node of template.content.querySelectorAll('*')) {
      if (ids.has(node.id)) node.id = ids.get(node.id);
      for (const attr of ['for', 'aria-labelledby', 'aria-describedby', 'aria-controls', 'aria-owns', 'aria-activedescendant', 'aria-details', 'aria-errormessage']) if (node.hasAttribute(attr)) node.setAttribute(attr, node.getAttribute(attr).split(/\s+/).map(id => ids.get(id) ?? id).join(' '));
      if (node.getAttribute('href')?.startsWith('#')) node.setAttribute('href', `#${ids.get(node.getAttribute('href').slice(1)) ?? node.getAttribute('href').slice(1)}`);
    }
    host.value.replaceChildren(template.content);
    queueMicrotask(() => { if (request === sequence) emit('ready', host.value.firstElementChild); });
  } catch (failure) { if (request === sequence) error.value = failure.message; }
}, { flush: 'post', immediate: true });
onBeforeUnmount(() => { sequence++; });
</script>
<template><p v-if="error" role="alert">{{ error }}</p><div ref="host" class="demo-specimen"></div></template>
