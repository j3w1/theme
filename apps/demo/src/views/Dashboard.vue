<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { state } from '../store.js';
import UiSpecimen from '../UiSpecimen.vue';
import '@j3w1/ui/register/table';
import '@j3w1/ui/styles/link.css';
import '@j3w1/ui/styles/table.css';
const route = useRoute(), period = ref('12'), chart = ref();
const dashboards = {
  analytics: { title: 'A clear view of your work.', eyebrow: 'ANALYTICS', metrics: [['Active projects','24','↑ 4 this month'],['Components used','148','Across 12 applications'],['Review queue','07','3 awaiting feedback'],['Delivery health','96.8%','↑ 2.1% this week']], activity: 'Steady progress.', unit: 'Completed tasks', readiness: 'Small steps. Solid foundations.', items: ['Canonical tokens ready','Component reviews in progress','Keyboard flows under review','Release rehearsal next'] },
  crm: { title: 'Make every conversation count.', eyebrow: 'CRM', metrics: [['Open opportunities','36','8 added this month'],['Qualified leads','128','↑ 16 this week'],['Follow-ups','09','3 scheduled today'],['Win rate','32.4%','↑ 4.2% this month']], activity: 'Conversations that move forward.', unit: 'Qualified leads', readiness: 'Your next conversations.', items: ['Atlas · discovery complete','Orion · proposal review','Meridian · follow-up Friday','Lumen · introductory call'] },
  commerce: { title: 'A closer look at your store.', eyebrow: 'COMMERCE', metrics: [['Revenue','$24,680','↑ 12.8% this month'],['Orders','248','32 ready to fulfill'],['Average order','$99.52','↑ 3.4% this month'],['Returning buyers','38%','↑ 5.2% this month']], activity: 'Orders over time.', unit: 'Orders', readiness: 'From checkout to delivery.', items: ['32 orders ready to fulfill','8 shipments in progress','4 returns under review','Inventory sync simulated'] },
  academy: { title: 'Build a little knowledge, every day.', eyebrow: 'ACADEMY', metrics: [['Active learners','1,284','↑ 186 this month'],['Courses','24','4 new modules'],['Completed lessons','648','↑ 18% this week'],['Completion rate','86%','↑ 6% this month']], activity: 'Learning in motion.', unit: 'Completed lessons', readiness: 'Continue learning.', items: ['Native form semantics · 86%','Keyboard navigation · 64%','Token contracts · 92%','Accessible charts · 41%'] },
  logistics: { title: 'Keep every delivery in view.', eyebrow: 'LOGISTICS', metrics: [['Active shipments','148','24 arriving today'],['On-time delivery','97.2%','↑ 1.8% this month'],['Vehicles available','32','6 at the depot'],['Exceptions','04','2 awaiting review']], activity: 'Deliveries over time.', unit: 'Delivered shipments', readiness: 'Across the network.', items: ['North depot · operating','Central route · on schedule','West terminal · review delay','East route · loading'] },
};
const config = computed(() => dashboards[route.params.kind] ?? dashboards.analytics);
const values = [32,44,38,56,48,70,58,82,65,74,88,78];
function draw(root = chart.value) { if (!root) return; chart.value = root; root.data = values.slice(period.value === '6' ? 6 : 0).map((value,index) => ({ label: `Week ${index + (period.value === '6' ? 7 : 1)}`, value })); const caption = root.querySelector('figcaption'); if(caption) caption.textContent = `${config.value.unit} · synthetic fixture`; }
watch([period, config], () => draw());
const glyph = status => status === 'Ready' ? '✓' : status === 'Review' ? '△' : '◌';
</script>
<template>
  <header class="view-heading">
    <div>
      <p class="eyebrow">J3W1 / {{ config.eyebrow }}</p>
      <h1 tabindex="-1">{{ config.title }}</h1>
      <p>Deliberate hierarchy. Useful color. A native foundation.</p>
    </div>
    <j3w1-link><RouterLink class="link link-standalone" to="/records/products">Explore records →</RouterLink></j3w1-link>
  </header>
  <section class="metrics" aria-label="Key metrics">
    <article v-for="[label, value, note] in config.metrics" :key="label" class="panel">
      <span class="metric-label">{{ label }}</span>
      <strong class="metric">{{ value }}</strong>
      <span class="muted">{{ note }}</span>
    </article>
  </section>
  <div class="dashboard-middle">
    <section class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">ACTIVITY</p>
          <h2>{{ config.activity }}</h2>
        </div>
        <j3w1-select>
          <div class="select">
            <label class="select-label" for="dashboard-period">Period</label>
            <div class="select-root">
              <select id="dashboard-period" class="select-control" name="period" v-model="period">
                <option value="12">Last 12 weeks</option>
                <option value="6">Last 6 weeks</option>
              </select>
              <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
            </div>
          </div>
        </j3w1-select>
      </div>
      <UiSpecimen id="chart" @ready="draw" />
    </section>
    <section class="panel">
      <p class="eyebrow">WORKSPACE</p>
      <h2>{{ config.readiness }}</h2>
      <ul class="readiness">
        <li v-for="item in config.items" :key="item">{{ item }}</li>
      </ul>
      <j3w1-link><RouterLink class="link link-standalone" to="/apps/kanban">Open the work board →</RouterLink></j3w1-link>
    </section>
  </div>
  <section class="panel">
    <div class="panel-heading">
      <div>
        <p class="eyebrow">PROJECTS</p>
        <h2>Work in motion</h2>
      </div>
      <j3w1-link><RouterLink class="link link-standalone" to="/records/products">View all records →</RouterLink></j3w1-link>
    </div>
    <j3w1-table>
      <div class="table-scroll" tabindex="0" role="region" aria-label="Recent project records">
        <table class="table">
          <thead class="table-head">
            <tr>
              <th class="table-header" scope="col">Project</th>
              <th class="table-header" scope="col">Owner</th>
              <th class="table-header" scope="col">Status</th>
              <th class="table-header table-header-numeric" scope="col">Scope</th>
            </tr>
          </thead>
          <tbody class="table-body">
            <tr v-for="row in state.records.products.slice(0, 5)" :key="row.id" class="table-row">
              <td class="table-cell">
                <j3w1-link><RouterLink class="link" :to="`/records/products/${row.id}`">{{ row.name }}</RouterLink></j3w1-link>
                <small class="block muted">Library / {{ row.id }}</small>
              </td>
              <td class="table-cell">{{ row.owner }}</td>
              <td class="table-cell"><span :class="['status', row.status.toLowerCase()]"><span aria-hidden="true">{{ glyph(row.status) }}</span> {{ row.status }}</span></td>
              <td class="table-cell table-cell-numeric">{{ Number(row.id) * 6 }} components</td>
            </tr>
          </tbody>
        </table>
      </div>
    </j3w1-table>
  </section>
</template>
<style scoped>
.readiness { padding-inline-start: var(--space-16); margin-block: var(--space-24); }
.readiness li { margin-block: var(--space-16); }
</style>
