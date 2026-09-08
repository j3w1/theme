<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { state, reset } from './store.js';
import { groups } from './navigation.js';
import UiSpecimen from './UiSpecimen.vue';
const route = useRoute(), router = useRouter(), navigationOpen = ref(false);
const breadcrumb = computed(() => route.path.split('/').filter(Boolean).join(' / '));
function palette(root) { root.setAttribute('shortcut', ''); const list = root.querySelector('[role="listbox"]'); list.replaceChildren(); for (const group of groups) for (const [path, name] of group.links) { const item = document.createElement('li'); item.setAttribute('role','option'); item.dataset.action = path; const category = document.createElement('span'); category.textContent = group.title.split(' ')[0] + ' '; const label = document.createElement('span'); label.className = 'command-label'; label.textContent = name; item.append(category, label); list.append(item); } root.addEventListener('j3w1-command', event => { const target = event.detail.action; if (groups.some(group => group.links.some(([path]) => path === target))) { event.preventDefault(); router.push(target); } }); root.refresh(); }
</script>
<template>
  <a class="skip-link" href="#demo-main">Skip to content</a>
  <div class="demo-shell">
    <aside class="demo-sidebar" :class="{ 'is-open': navigationOpen }" aria-label="Application navigation">
      <a class="wordmark" href="#/">j3w1<span> / workspace</span></a><p class="eyebrow">TRUE BLACK / ROSE</p>
      <nav><section v-for="group in groups" :key="group.title"><h2 class="nav-caption">{{ group.title }}</h2><RouterLink v-for="[path, label] in group.links" :key="path" :to="path" @click="navigationOpen=false">{{ label }}</RouterLink></section></nav>
      <a href="../" class="back-spec">← UI Theme Spec</a>
    </aside>
    <div class="demo-workspace"><header class="demo-topline"><button class="mobile-nav" type="button" :aria-expanded="navigationOpen" @click="navigationOpen=!navigationOpen">☰ Navigation</button><span>Workspace / {{ breadcrumb }}</span><span class="identity">JL</span></header>
      <div class="demo-context"><span>Vue 3 · independently authored · synthetic local data</span><button type="button" @click="reset">Reset demo ↻</button></div>
      <main id="demo-main"><RouterView :key="state.epoch" /></main><p class="demo-notice" role="status">{{ state.notice }}</p>
      <footer class="demo-footer">Local demonstration. Changes live in memory and reset on reload. No messages, payments or credentials are sent.<br /><a href="../implement/">Build this in your app →</a></footer>
    </div>
  </div>
  <div class="demo-command"><UiSpecimen id="command-palette" @ready="palette" /></div>
</template>
