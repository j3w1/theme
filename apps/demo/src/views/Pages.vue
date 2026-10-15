<script setup>
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { state, notify } from '../store.js';
import UiSpecimen from '../UiSpecimen.vue';
import '@j3w1/ui/register/card';
import '@j3w1/ui/register/checkbox';
import '@j3w1/ui/register/table';
import '@j3w1/ui/styles/card.css';
import '@j3w1/ui/styles/checkbox.css';
import '@j3w1/ui/styles/link.css';
import '@j3w1/ui/styles/table.css';
const route=useRoute(),kind=computed(()=>route.params.kind),email=ref(''),password=ref(''),message=ref(''),help=ref(''),role=ref('Editor'),draft=reactive({...state.profile});
watch(kind,()=>{message.value='';password.value='';});
const articles=[['Install one component','Load the exact package version, token CSS, per-component styles and registration. Copy the maintained native markup.','../implement/'],['Use native forms','Native names, labels, fieldsets and constraints keep your application behavior explicit.','../components/text-field/'],['Prepare an agent kit','Select only the needed IDs and keep the complete copy closure and notices.','../agents/'],['Inspect keyboard behavior','Each component contract lists its exact focus, selection and keyboard rules.','../components/']];
const matches=computed(()=>articles.filter(row=>row.join(' ').toLowerCase().includes(help.value.toLowerCase())));
function authenticate(event){message.value=kind.value==='recovery'?'Recovery request simulated locally. No email was sent.':'Sign-in validation passed locally. No session or authentication request was created.';password.value='';restart(event.target);}
// After a successful local submit the form starts afresh: reset clears the browser's
// user-validity state, so a field the submit emptied is not shown as invalid. Values
// Vue rendered are put back, so the DOM keeps matching the model.
async function restart(form) {
  await nextTick();
  const kept = [...form.elements].filter(field => field.matches('input, select, textarea')).map(field => [field, field.value, field.checked]);
  form.reset();
  for (const [field, value, checked] of kept) if (['checkbox', 'radio'].includes(field.type)) field.checked = checked; else field.value = value;
}
</script>
<template>
  <header class="view-heading">
    <div>
      <p class="eyebrow">WORKSPACE / PAGES</p>
      <h1 tabindex="-1" style="text-transform:capitalize">{{ kind.replaceAll('-',' ') }}</h1>
      <p>Application page compositions with explicit local boundaries.</p>
    </div>
  </header>
  <section v-if="kind==='profile'" class="panel">
    <div class="panel-heading">
      <div>
        <span class="identity">JL</span>
        <h2>{{ state.profile.name }}</h2>
        <p>{{ state.profile.email }} · {{ state.profile.role }}</p>
      </div>
      <j3w1-link><RouterLink class="link link-standalone" to="/pages/settings">Edit profile →</RouterLink></j3w1-link>
    </div>
    <div class="metrics">
      <article><span class="metric-label">Projects</span><strong class="metric">24</strong></article>
      <article><span class="metric-label">Reviews</span><strong class="metric">148</strong></article>
      <article><span class="metric-label">Contributions</span><strong class="metric">67</strong></article>
      <article><span class="metric-label">Local workspace</span><strong class="metric">01</strong></article>
    </div>
    <UiSpecimen id="timeline" />
  </section>
  <form v-else-if="kind==='settings'" class="panel form-grid" @submit.prevent="Object.assign(state.profile,draft);notify('Profile settings saved in this local demo.')">
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="settings-name">Display name <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="settings-name" aria-describedby="settings-name-message" class="text-field-input" name="name" v-model="draft.name" required maxlength="80">
        </div>
        <p id="settings-name-message" class="text-field-message">✕ Enter a display name.</p>
      </div>
    </j3w1-text-field>
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="settings-email">Email address <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="settings-email" aria-describedby="settings-email-message" class="text-field-input" type="email" name="email" v-model="draft.email" required>
        </div>
        <p id="settings-email-message" class="text-field-message">✕ Enter an email address.</p>
      </div>
    </j3w1-text-field>
    <j3w1-select>
      <div class="select">
        <label class="select-label" for="settings-role">Role label</label>
        <div class="select-root">
          <select id="settings-role" class="select-control" name="role" v-model="draft.role">
            <option>Viewer</option>
            <option>Editor</option>
            <option>Administrator</option>
          </select>
          <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
        </div>
      </div>
    </j3w1-select>
    <j3w1-checkbox>
      <div class="checkbox">
        <label class="checkbox-option">
          <span class="checkbox-control">
            <input class="checkbox-input" type="checkbox" name="notifications" v-model="draft.notifications">
            <svg class="checkbox-check" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M3.5 8.5l3 3 6-6"></path></svg>
            <svg class="checkbox-dash" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 8h8"></path></svg>
          </span>
          <span class="checkbox-text">Demo notifications</span>
        </label>
      </div>
    </j3w1-checkbox>
    <p class="wide muted">Role labels are demonstration data and do not grant permissions.</p>
    <div class="actions wide">
      <j3w1-button><button class="button" type="submit">Save local settings</button></j3w1-button>
      <j3w1-button><button class="button button-tertiary" type="button" @click="Object.assign(draft,state.profile)">Discard changes</button></j3w1-button>
    </div>
  </form>
  <section v-else-if="kind==='permissions'" class="panel">
    <div class="panel-heading">
      <h2>Role capability demonstration</h2>
      <j3w1-select>
        <div class="select">
          <label class="select-label" for="permissions-role">Preview role</label>
          <div class="select-root">
            <select id="permissions-role" class="select-control" name="role" v-model="role">
              <option>Viewer</option>
              <option>Editor</option>
              <option>Administrator</option>
            </select>
            <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
          </div>
        </div>
      </j3w1-select>
    </div>
    <j3w1-table>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Role capabilities">
        <table class="table">
          <thead class="table-head">
            <tr>
              <th class="table-header" scope="col">Capability</th>
              <th class="table-header" scope="col">Preview availability</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="[name,allowed] in [['Read records',true],['Edit records',role!=='Viewer'],['Manage members',role==='Administrator']]" :key="name" class="table-row">
              <th class="table-cell" scope="row">{{ name }}</th>
              <td class="table-cell">{{ allowed?'✓ Available':'— Unavailable' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </j3w1-table>
    <p class="muted">This is a presentation example. Your server must enforce real authorization independently of the UI.</p>
  </section>
  <form v-else-if="['sign-in','recovery'].includes(kind)" class="panel stack account-form" @submit.prevent="authenticate">
    <h2>{{ kind==='recovery'?'Recover access':'Welcome to your workspace' }}</h2>
    <p class="muted">Use synthetic values. No credentials leave this page.</p>
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="account-email">Email address <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="account-email" aria-describedby="account-email-message" class="text-field-input" type="email" name="email" v-model="email" required autocomplete="off" placeholder="jordan@example.test">
        </div>
        <p id="account-email-message" class="text-field-message">✕ Enter an email address.</p>
      </div>
    </j3w1-text-field>
    <j3w1-text-field v-if="kind==='sign-in'">
      <div class="text-field">
        <label class="text-field-label" for="account-password">Demo password <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="account-password" aria-describedby="account-password-message" class="text-field-input" type="password" name="password" v-model="password" required minlength="8" autocomplete="off">
        </div>
        <p id="account-password-message" class="text-field-message">✕ Use at least 8 characters.</p>
      </div>
    </j3w1-text-field>
    <div class="actions">
      <j3w1-button><button class="button" type="submit">{{ kind==='recovery'?'Simulate recovery':'Validate sign-in locally' }}</button></j3w1-button>
      <j3w1-link><RouterLink class="link link-standalone" :to="kind==='recovery'?'/pages/sign-in':'/pages/recovery'">{{ kind==='recovery'?'Back to sign-in':'Forgot password?' }}</RouterLink></j3w1-link>
    </div>
    <p role="status">{{ message }}</p>
  </form>
  <div v-else-if="kind==='pricing'" class="gallery-grid">
    <article v-for="[name,price,features] in [['Personal','0',['One workspace','Core components','Local projects']],['Team','24',['Shared workspaces','Review workflows','Team templates']],['Organization','64',['Organization views','Policy controls','Priority planning']]]" :key="name" class="panel">
      <p class="eyebrow">SAMPLE PLAN</p>
      <h2>{{ name }}</h2>
      <p class="price">${{ price }}<small class="muted"> / month</small></p>
      <ul>
        <li v-for="feature in features" :key="feature">{{ feature }}</li>
      </ul>
      <j3w1-button><button class="button button-secondary" type="button" @click="notify(`${name} selected for this pricing demonstration. No purchase or subscription was created.`)">Preview {{ name }}</button></j3w1-button>
      <p class="muted">Illustrative pricing only.</p>
    </article>
  </div>
  <section v-else-if="kind==='help'">
    <div class="filters">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="help-query">Search help</label>
          <div class="text-field-root">
            <input id="help-query" class="text-field-input" type="search" name="query" v-model="help" placeholder="forms, package, keyboard…">
          </div>
        </div>
      </j3w1-text-field>
    </div>
    <div class="gallery-grid">
      <j3w1-card v-for="[title,text,url] in matches" :key="title">
        <a class="card card-link" :href="url">
          <span class="card-title">{{ title }} →</span>
          <span class="card-body">{{ text }}</span>
        </a>
      </j3w1-card>
    </div>
    <p v-if="!matches.length">No help articles match this search.</p>
  </section>
  <section v-else-if="kind==='error'" class="panel empty">
    <p class="eyebrow">SERVICE ERROR / DEMONSTRATION</p>
    <h2>The sample request could not complete.</h2>
    <p>Your local records are still available.</p>
    <div class="actions">
      <j3w1-button><button class="button" type="button" @click="message='Retry completed in the local simulation. No network request was sent.'">Retry locally</button></j3w1-button>
      <j3w1-link><RouterLink class="link link-standalone" to="/dashboards/analytics">Return to dashboard</RouterLink></j3w1-link>
    </div>
    <p role="status">{{ message }}</p>
  </section>
  <section v-else class="panel empty">
    <p class="eyebrow">404 / NOT FOUND</p>
    <h2>This page is not in the workspace.</h2>
    <p>Choose a destination from navigation or open the command prompt.</p>
    <j3w1-link><RouterLink class="link link-standalone" to="/dashboards/analytics">Return to dashboard →</RouterLink></j3w1-link>
  </section>
</template>
<style scoped>
.account-form { max-width: var(--layout-content-max); margin-inline: auto; }
.price small { font-size: var(--font-size-ui-sm); line-height: var(--font-line-height-ui-sm); font-weight: var(--font-weight-regular); }
li { margin-block: var(--space-12); }
</style>
