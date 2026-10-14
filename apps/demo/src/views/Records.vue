<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { state, recordKinds, nextId, notify } from '../store.js';
import '@j3w1/ui/register/description-list';
import '@j3w1/ui/register/table';
import '@j3w1/ui/styles/description-list.css';
import '@j3w1/ui/styles/link.css';
import '@j3w1/ui/styles/table.css';
const route = useRoute(), router = useRouter(), query = ref(''), status = ref('all'), direction = ref(1), sort = ref('name'), page = ref(1);
const kind = computed(() => recordKinds[route.params.kind] ? route.params.kind : 'products');
const config = computed(() => recordKinds[kind.value]), records = computed(() => state.records[kind.value]);
const selected = computed(() => records.value.find(row => row.id === route.params.id));
const editing = computed(() => route.params.id === 'new' || route.params.action === 'edit');
const filtered = computed(() => records.value.filter(row => `${row.name} ${row.owner} ${row.id}`.toLowerCase().includes(query.value.toLowerCase()) && (status.value === 'all' || row.status === status.value)).sort((a,b) => (typeof a[sort.value] === 'number' ? a[sort.value]-b[sort.value] : a[sort.value].localeCompare(b[sort.value])) * direction.value));
const pages = computed(() => Math.max(1,Math.ceil(filtered.value.length / 5))), visible = computed(() => filtered.value.slice((page.value-1)*5,page.value*5));
const draft = reactive({ name: '', owner: '', status: 'Ready', amount: 0, note: '' });
watch(() => route.fullPath, () => { query.value='';status.value='all';page.value=1;Object.assign(draft, selected.value ?? { name: '', owner: 'Jordan Lee', status: 'Ready', amount: 0, note: '' }); }, { immediate:true });
watch([query,status], () => { page.value=1; });
const ariaSort = column => sort.value === column ? (direction.value === 1 ? 'ascending' : 'descending') : 'none';
function order(column) { if(sort.value===column)direction.value*=-1;else {sort.value=column;direction.value=1;} }
function save() { const row = { ...draft, amount:Number(draft.amount), id:selected.value?.id ?? nextId(records.value) }; if(selected.value)Object.assign(selected.value,row);else records.value.push(row); notify(`${config.value.singular} saved in this local demo.`);router.push(`/records/${kind.value}/${row.id}`); }
</script>
<template>
  <header class="view-heading">
    <div>
      <p class="eyebrow">WORKSPACE / RECORDS</p>
      <h1 tabindex="-1">{{ editing ? (selected ? 'Edit ' : 'New ') + config.singular.toLowerCase() : selected ? selected.name : config.title }}</h1>
      <p>{{ editing ? 'Update the local record, then review the result.' : 'Search, inspect and edit synthetic application records.' }}</p>
    </div>
    <j3w1-link>
      <RouterLink v-if="!route.params.id" class="link link-standalone" :to="`/records/${kind}/new`">+ New {{ config.singular.toLowerCase() }}</RouterLink>
      <RouterLink v-else class="link link-standalone" :to="`/records/${kind}`">← All {{ config.title.toLowerCase() }}</RouterLink>
    </j3w1-link>
  </header>
  <form v-if="editing" class="panel form-grid" @submit.prevent="save">
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="record-name">{{ config.singular }} name <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="record-name" aria-describedby="record-name-message" class="text-field-input" name="name" v-model="draft.name" required maxlength="120">
        </div>
        <p id="record-name-message" class="text-field-message">✕ Enter a name.</p>
      </div>
    </j3w1-text-field>
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="record-owner">Owner <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="record-owner" aria-describedby="record-owner-message" class="text-field-input" name="owner" v-model="draft.owner" required>
        </div>
        <p id="record-owner-message" class="text-field-message">✕ Enter an owner.</p>
      </div>
    </j3w1-text-field>
    <j3w1-select>
      <div class="select">
        <label class="select-label" for="record-status">Status</label>
        <div class="select-root">
          <select id="record-status" class="select-control" name="status" v-model="draft.status">
            <option>Ready</option>
            <option>In progress</option>
            <option>Review</option>
          </select>
          <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
        </div>
      </div>
    </j3w1-select>
    <j3w1-text-field>
      <div class="text-field">
        <label class="text-field-label" for="record-amount">{{ config.metric }} {{ config.unit }} <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
        <div class="text-field-root">
          <input id="record-amount" aria-describedby="record-amount-message" class="text-field-input text-field-input-numeric" type="number" name="amount" v-model="draft.amount" min="0" :step="kind==='users' ? 1 : .01" required>
        </div>
        <p id="record-amount-message" class="text-field-message">✕ Enter a value of 0 or more.</p>
      </div>
    </j3w1-text-field>
    <j3w1-textarea class="wide">
      <div class="textarea">
        <label class="textarea-label" for="record-note">Notes</label>
        <div class="textarea-root">
          <textarea id="record-note" class="textarea-input" name="note" v-model="draft.note" rows="4"></textarea>
        </div>
      </div>
    </j3w1-textarea>
    <div class="actions wide">
      <j3w1-button><button class="button" type="submit">Save {{ config.singular.toLowerCase() }}</button></j3w1-button>
      <j3w1-link><RouterLink class="link link-standalone" :to="selected ? `/records/${kind}/${selected.id}` : `/records/${kind}`">Cancel</RouterLink></j3w1-link>
    </div>
  </form>
  <section v-else-if="selected" class="panel">
    <div class="panel-heading">
      <h2>{{ config.singular }} / {{ selected.id }}</h2>
      <j3w1-link><RouterLink class="link link-standalone" :to="`/records/${kind}/${selected.id}/edit`">Edit record →</RouterLink></j3w1-link>
    </div>
    <j3w1-description-list>
      <dl class="description-list">
        <div><dt>Name</dt><dd>{{ selected.name }}</dd></div>
        <div><dt>Owner</dt><dd>{{ selected.owner }}</dd></div>
        <div><dt>Status</dt><dd>{{ selected.status }}</dd></div>
        <div><dt>{{ config.metric }}</dt><dd>{{ config.unit }}{{ selected.amount.toLocaleString() }}</dd></div>
        <div><dt>Notes</dt><dd>{{ selected.note }}</dd></div>
      </dl>
    </j3w1-description-list>
    <template v-if="kind==='invoices'">
      <h3>Invoice preview</h3>
      <p>Reference INV-{{ selected.id }} · sample line item · {{ config.unit }}{{ selected.amount.toFixed(2) }}</p>
      <p class="muted">No payment processing, tax calculation or external delivery is performed.</p>
    </template>
  </section>
  <section v-else-if="route.params.id" class="panel empty">
    <h2>Record not found</h2>
    <p>This record does not exist in the current local state.</p>
  </section>
  <section v-else class="panel">
    <div class="filters">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="records-search">Search {{ config.title.toLowerCase() }}</label>
          <div class="text-field-root">
            <input id="records-search" class="text-field-input" type="search" name="query" v-model="query" placeholder="Name, owner or ID…">
          </div>
        </div>
      </j3w1-text-field>
      <j3w1-select>
        <div class="select">
          <label class="select-label" for="records-status">Status</label>
          <div class="select-root">
            <select id="records-status" class="select-control" name="status" v-model="status">
              <option value="all">All statuses</option>
              <option>Ready</option>
              <option>In progress</option>
              <option>Review</option>
            </select>
            <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
          </div>
        </div>
      </j3w1-select>
    </div>
    <j3w1-table>
      <div class="table-scroll" tabindex="0" role="region" :aria-label="`${config.title} table`">
        <table class="table">
          <thead class="table-head">
            <tr>
              <th class="table-header" scope="col" :aria-sort="ariaSort('name')">
                <button class="table-sort" type="button" @click.stop="order('name')">Name<span class="table-sort-glyph" aria-hidden="true">▲</span></button>
              </th>
              <th class="table-header" scope="col">Owner</th>
              <th class="table-header" scope="col">Status</th>
              <th class="table-header table-header-numeric" scope="col" :aria-sort="ariaSort('amount')">
                <button class="table-sort" type="button" @click.stop="order('amount')">{{ config.metric }}<span class="table-sort-glyph" aria-hidden="true">▲</span></button>
              </th>
              <th class="table-header" scope="col">Action</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="row in visible" :key="row.id" class="table-row">
              <td class="table-cell">
                <j3w1-link><RouterLink class="link" :to="`/records/${kind}/${row.id}`">{{ row.name }}</RouterLink></j3w1-link>
                <small class="block muted">{{ config.singular }} / {{ row.id }}</small>
              </td>
              <td class="table-cell">{{ row.owner }}</td>
              <td class="table-cell"><span :class="['status', row.status.toLowerCase()]">{{ row.status }}</span></td>
              <td class="table-cell table-cell-numeric">{{ config.unit }}{{ row.amount.toLocaleString() }}</td>
              <td class="table-cell">
                <j3w1-link><RouterLink class="link" :to="`/records/${kind}/${row.id}/edit`">Edit <span class="muted">{{ row.id }}</span></RouterLink></j3w1-link>
              </td>
            </tr>
            <tr v-if="!visible.length" class="table-empty">
              <td class="table-empty-cell" colspan="5">No matching records. Clear the search or choose another status.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </j3w1-table>
    <div class="pager">
      <p role="status">{{ filtered.length }} records · Page {{ page }} of {{ pages }}</p>
      <div class="actions">
        <j3w1-button><button class="button button-secondary" type="button" :disabled="page===1" @click="page--">← Previous</button></j3w1-button>
        <j3w1-button><button class="button button-secondary" type="button" :disabled="page===pages" @click="page++">Next →</button></j3w1-button>
      </div>
    </div>
  </section>
</template>
