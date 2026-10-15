<script setup>
import { computed, nextTick, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import '@j3w1/ui/register/link';
import '@j3w1/ui/register/sidebar-nav';
import '@j3w1/ui/register/skip-link';
import '@j3w1/ui/styles/link.css';
import '@j3w1/ui/styles/sidebar-nav.css';
import '@j3w1/ui/styles/skip-link.css';
import { state, reset } from './store.js';
import { groups } from './navigation.js';
import UiSpecimen from './UiSpecimen.vue';
const route = useRoute(), router = useRouter(), navigationOpen = ref(false), rail = ref(), toggle = ref();
const breadcrumb = computed(() => route.path.split('/').filter(Boolean).join(' / '));
// A section stays current on its own detail and edit pages.
const current = path => route.path === path || route.path.startsWith(`${path}/`) ? 'page' : undefined;
// Below 900px the rail is a drawer: opening moves focus into it, closing returns it to the toggle.
async function showNavigation(open) {
  navigationOpen.value = open;
  await nextTick();
  if (open) (rail.value?.querySelector('[aria-current="page"]') ?? rail.value?.querySelector('.sidebar-nav-link'))?.focus();
  else toggle.value?.focus();
}
function follow(event, navigate) { navigationOpen.value = false; navigate(event); }
// The hash router owns the URL fragment, so the skip link moves focus itself.
function skip() { document.querySelector('main h1')?.focus(); }
function palette(root) { root.setAttribute('shortcut', ''); const list = root.querySelector('[role="listbox"]'); list.replaceChildren(); for (const group of groups) for (const [path, name] of group.links) { const item = document.createElement('li'); item.setAttribute('role','option'); item.dataset.action = path; const category = document.createElement('span'); category.textContent = group.title.split(' ')[0] + ' '; const label = document.createElement('span'); label.className = 'command-label'; label.textContent = name; item.append(category, label); list.append(item); } root.addEventListener('j3w1-command', event => { const target = event.detail.action; if (groups.some(group => group.links.some(([path]) => path === target))) { event.preventDefault(); router.push(target); } }); root.refresh(); }
</script>
<template>
  <j3w1-skip-link><a class="skip-link" href="#demo-main" @click.prevent="skip">Skip to content</a></j3w1-skip-link>
  <div class="demo-shell">
    <aside id="demo-navigation" ref="rail" class="demo-sidebar" :class="{ 'is-open': navigationOpen }" aria-label="Application navigation" @keydown.esc="navigationOpen && showNavigation(false)">
      <div class="demo-sidebar-head">
        <a class="wordmark" href="#/">j3w1<span> / workspace</span></a>
        <j3w1-button class="demo-nav-close">
          <button class="button button-tertiary" type="button" aria-label="Close navigation" @click="showNavigation(false)">Close</button>
        </j3w1-button>
      </div>
      <p class="eyebrow">TRUE BLACK / ROSE</p>
      <j3w1-sidebar-nav>
        <nav class="sidebar-nav" aria-label="Workspace">
          <template v-for="group in groups" :key="group.title">
            <h2 class="nav-caption">{{ group.title }}</h2>
            <ul class="sidebar-nav-list">
              <RouterLink v-for="[path, label] in group.links" :key="path" :to="path" custom v-slot="{ href, navigate }">
                <li class="sidebar-nav-item">
                  <a class="sidebar-nav-link" :href="href" :aria-current="current(path)" @click="follow($event, navigate)">
                    <span class="sidebar-nav-label">{{ label }}</span>
                  </a>
                </li>
              </RouterLink>
            </ul>
          </template>
        </nav>
      </j3w1-sidebar-nav>
      <j3w1-link class="back-spec"><a class="link link-standalone" href="../">← UI Theme Spec</a></j3w1-link>
    </aside>
    <div class="demo-workspace">
      <header class="demo-topline">
        <j3w1-button class="mobile-nav">
          <button ref="toggle" class="button button-tertiary" type="button" aria-controls="demo-navigation" :aria-expanded="navigationOpen" @click="showNavigation(!navigationOpen)">☰ Navigation</button>
        </j3w1-button>
        <span class="demo-path">Workspace / {{ breadcrumb }}</span>
        <div class="demo-command"><UiSpecimen id="command-palette" @ready="palette" /></div>
        <span class="identity">JL</span>
      </header>
      <section class="demo-context" aria-label="Demo data">
        <span>Vue 3 · independently authored · synthetic local data</span>
        <j3w1-button><button class="button button-secondary" type="button" @click="reset">Reset demo ↻</button></j3w1-button>
      </section>
      <main id="demo-main"><RouterView :key="state.epoch" /></main>
      <p class="demo-notice" role="status">{{ state.notice }}</p>
      <footer class="demo-footer">
        <p>Local demonstration. Changes live in memory and reset on reload. No messages, payments or credentials are sent.</p>
        <j3w1-link><a class="link link-standalone" href="../implement/">Build this in your app →</a></j3w1-link>
      </footer>
    </div>
  </div>
</template>
