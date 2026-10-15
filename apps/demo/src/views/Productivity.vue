<script setup>
import { computed, ref, nextTick, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { state, notify, nextId } from '../store.js';
import '@j3w1/ui/register/list';
import '@j3w1/ui/register/toast';
import '@j3w1/ui/styles/toast.css';
import '@j3w1/ui/styles/link.css';
import '@j3w1/ui/styles/list.css';
const route = useRoute(), kind = computed(() => route.params.kind);
const text = ref(''), selectedMail = ref(1), archived = ref(false), compose = ref(false), subject = ref(''), mailBody = ref(''), eventTitle = ref(''), day = ref(8), taskName = ref('');
const mails = computed(() => state.mail.filter(mail => mail.archived===archived.value));
const selected = computed(() => state.mail.find(mail => mail.id===selectedMail.value));
function openMail(mail) { selectedMail.value=mail.id;mail.read=true;compose.value=false; }
// The mailbox is a single-selection listbox (list.md): one tab stop, selection follows focus.
const mailTabIndex = (mail, index) => (mails.value.some(item => item.id===selectedMail.value) ? mail.id===selectedMail.value : index===0) ? 0 : -1;
async function browseMail(event) {
  const list = event.currentTarget, rows = mails.value, index = rows.findIndex(mail => String(mail.id)===event.target.closest('[data-mail-id]')?.dataset.mailId);
  let next = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: rows.length - 1, Enter: index, ' ': index }[event.key];
  if (next === undefined && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) next = rows.map((_, offset) => (index + 1 + offset) % rows.length).find(position => rows[position].subject.toLowerCase().startsWith(event.key.toLowerCase()));
  if (next === undefined) return;
  event.preventDefault();
  const mail = rows[Math.max(0, Math.min(rows.length - 1, next))];
  openMail(mail);
  await nextTick();
  list.querySelector(`[data-mail-id="${mail.id}"]`)?.focus();
}
function sendChat(event) { if(!text.value.trim())return;state.messages.push({id:nextId(state.messages),person:'You',text:text.value.trim(),self:true});text.value='';notify('Message added to the local conversation.');restart(event.target); }
function sendMail() { state.mail.push({id:nextId(state.mail),from:'You',subject:subject.value,body:mailBody.value,read:true,archived:false});compose.value=false;subject.value='';mailBody.value='';notify('Message created locally. No email was sent.'); }
function addEvent(event) { state.events.push({id:nextId([...state.events, ...removedEvents.value.map(item => item.event)]),day:Number(day.value),title:eventTitle.value});eventTitle.value='';notify('Event added to the local September calendar.');restart(event.target); }
// Keep removal history after the notice closes, so Undo is never a timed-only action.
const removedEvents = ref([]), removalNotice = ref(false), notifications = ref(), undoButton = ref();
const lastRemoved = computed(() => removedEvents.value.at(-1)?.event);
let removalTimer, remaining = 12000, started = 0, pointerInNotice = false;
function pauseRemovalNotice() {
  if (!removalTimer) return;
  clearTimeout(removalTimer);
  removalTimer = undefined;
  remaining = Math.max(0, remaining - (Date.now() - started));
}
function resumeRemovalNotice() {
  if (!removalNotice.value || removalTimer || pointerInNotice || notifications.value?.contains(document.activeElement)) return;
  started = Date.now();
  removalTimer = setTimeout(() => { removalTimer = undefined; removalNotice.value = false; }, remaining);
}
async function leaveRemovalNotice() { await nextTick(); resumeRemovalNotice(); }
function hoverRemovalNotice(inside) {
  pointerInNotice = inside;
  inside ? pauseRemovalNotice() : resumeRemovalNotice();
}
async function removeEvent(event, trigger) {
  const index = state.events.indexOf(event), hadFocus = trigger === document.activeElement;
  removedEvents.value.push({ event, index });
  state.events.splice(index, 1);
  pauseRemovalNotice();
  remaining = 12000;
  removalNotice.value = true;
  await nextTick();
  // Removing a focused row leaves focus on a surviving calendar action, never the toast.
  if (hadFocus) document.querySelector('[data-event-id] button, [data-add-event]')?.focus();
  resumeRemovalNotice();
}
async function undoEvent() {
  const removed = removedEvents.value.pop();
  if (!removed) return;
  state.events.splice(removed.index, 0, removed.event);
  dismissRemovalNotice();
  notify(`${removed.event.title} restored to day ${removed.event.day}.`);
  await nextTick();
  document.querySelector(`[data-event-id="${removed.event.id}"] button`)?.focus();
}
function dismissRemovalNotice() {
  const hadFocus = notifications.value?.contains(document.activeElement);
  pauseRemovalNotice();
  removalNotice.value = false;
  pointerInNotice = false;
  if (hadFocus) nextTick(() => undoButton.value?.focus());
}
function focusNotifications(event) {
  if (event.key === 'F6' && kind.value === 'calendar' && removalNotice.value) {
    event.preventDefault();
    notifications.value?.querySelector('.toast-action')?.focus();
  }
}
onMounted(() => window.addEventListener('keydown', focusNotifications));
onUnmounted(() => { clearTimeout(removalTimer); window.removeEventListener('keydown', focusNotifications); });
function addTask(event) { if(!taskName.value.trim())return;state.tasks.push({id:nextId(state.tasks),name:taskName.value.trim(),status:'Ready'});taskName.value='';notify('Task added.');restart(event.target); }
// After a successful local submit the form starts afresh: reset clears the browser's
// user-validity state, so a field the submit emptied is not shown as invalid. Values
// Vue rendered are put back, so the DOM keeps matching the model.
async function restart(form) {
  await nextTick();
  const kept = [...form.elements].filter(field => field.matches('input, select, textarea')).map(field => [field, field.value, field.checked]);
  form.reset();
  for (const [field, value, checked] of kept) if (['checkbox', 'radio'].includes(field.type)) field.checked = checked; else field.value = value;
}
async function move(task,status) { task.status=status;notify(`${task.name} moved to ${status}.`);await nextTick();document.querySelector(`[data-task-id="${task.id}"] select`)?.focus(); }
</script>
<template>
  <header class="view-heading">
    <div>
      <p class="eyebrow">WORKSPACE / APPLICATIONS</p>
      <h1 tabindex="-1" style="text-transform:capitalize">{{ kind }}</h1>
      <p>Bounded local actions, with clear keyboard paths.</p>
    </div>
  </header>
  <div v-if="kind==='email'" class="split">
    <div class="stack">
      <j3w1-button><button class="button button-secondary" type="button" @click="compose=true">+ Compose</button></j3w1-button>
      <j3w1-select>
        <div class="select">
          <label class="select-label" for="mail-folder">Folder</label>
          <div class="select-root">
            <select id="mail-folder" class="select-control" name="folder" :value="archived ? 'archive' : 'inbox'" @change="archived=$event.target.value==='archive'">
              <option value="inbox">Inbox</option>
              <option value="archive">Archive</option>
            </select>
            <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
          </div>
        </div>
      </j3w1-select>
      <j3w1-list v-if="mails.length">
        <ul class="list" role="listbox" aria-label="Messages" @keydown="browseMail">
          <li v-for="(mail, index) in mails" :key="mail.id" class="list-option" role="option" :aria-selected="String(selectedMail===mail.id)" :tabindex="mailTabIndex(mail, index)" :data-mail-id="mail.id" @click="openMail(mail)">
            <span class="list-check" aria-hidden="true">✓</span>
            <span class="list-label">{{ mail.subject }}<template v-if="!mail.read"> <span aria-hidden="true">●</span><span class="sr-only">, unread</span></template></span>
            <span class="list-meta">{{ mail.from }}</span>
          </li>
        </ul>
      </j3w1-list>
      <p v-if="!mails.length">This folder is empty.</p>
    </div>
    <form v-if="compose" class="panel stack" @submit.prevent="sendMail">
      <h2>Compose a local message</h2>
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="mail-subject">Subject <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
          <div class="text-field-root">
            <input id="mail-subject" aria-describedby="mail-subject-message" class="text-field-input" name="subject" v-model="subject" required maxlength="120">
          </div>
          <p id="mail-subject-message" class="text-field-message">✕ Enter a subject.</p>
        </div>
      </j3w1-text-field>
      <j3w1-textarea>
        <div class="textarea">
          <label class="textarea-label" for="mail-body">Message <span class="textarea-required" aria-hidden="true">*</span><span class="textarea-required sr-only"> required</span></label>
          <div class="textarea-root">
            <textarea id="mail-body" aria-describedby="mail-body-message" class="textarea-input" name="body" v-model="mailBody" required rows="8"></textarea>
          </div>
          <p id="mail-body-message" class="textarea-message">✕ Write the message.</p>
        </div>
      </j3w1-textarea>
      <div class="actions">
        <j3w1-button><button class="button" type="submit">Create local message</button></j3w1-button>
        <j3w1-button><button class="button button-tertiary" type="button" @click="compose=false">Cancel</button></j3w1-button>
      </div>
    </form>
    <article v-else-if="selected" class="panel">
      <div class="panel-heading">
        <h2>{{ selected.subject }}</h2>
        <j3w1-button><button class="button button-secondary" type="button" @click="selected.archived=!selected.archived;notify(selected.archived?'Message archived.':'Message returned to inbox.')">{{ selected.archived?'Move to inbox':'Archive' }}</button></j3w1-button>
      </div>
      <p class="muted">From {{ selected.from }}</p>
      <p>{{ selected.body }}</p>
      <div class="actions">
        <j3w1-button><button class="button" type="button" @click="compose=true;subject=`Re: ${selected.subject}`">Reply locally</button></j3w1-button>
        <j3w1-button><button class="button button-tertiary" type="button" @click="selected.read=!selected.read">Mark {{ selected.read?'unread':'read' }}</button></j3w1-button>
      </div>
    </article>
  </div>
  <section v-else-if="kind==='chat'" class="panel">
    <div class="panel-heading">
      <h2>Design workspace</h2>
      <span class="muted">2 participants · local fixture</span>
    </div>
    <div class="stack" role="log" aria-label="Conversation">
      <article v-for="message in state.messages" :key="message.id" :class="['message', { self: message.self }]">
        <small class="muted">{{ message.person }}</small>
        <p>{{ message.text }}</p>
      </article>
    </div>
    <form class="filters" @submit.prevent="sendChat">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="chat-text">Message <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
          <div class="text-field-root">
            <input id="chat-text" aria-describedby="chat-text-message" class="text-field-input" name="message" v-model="text" required maxlength="1000" placeholder="Write a local message…">
          </div>
          <p id="chat-text-message" class="text-field-message">✕ Write a message first.</p>
        </div>
      </j3w1-text-field>
      <j3w1-button><button class="button" type="submit">Add message →</button></j3w1-button>
    </form>
  </section>
  <section v-else-if="kind==='calendar'" class="panel">
    <div class="panel-heading">
      <h2>September 2026</h2>
      <span class="muted">Fixed demonstration month</span>
    </div>
    <form class="filters" @submit.prevent="addEvent">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="event-title">Event title <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
          <div class="text-field-root">
            <input id="event-title" aria-describedby="event-title-message" class="text-field-input" name="title" v-model="eventTitle" required maxlength="80">
          </div>
          <p id="event-title-message" class="text-field-message">✕ Enter a title.</p>
        </div>
      </j3w1-text-field>
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="event-day">Day <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
          <div class="text-field-root">
            <input id="event-day" aria-describedby="event-day-message" class="text-field-input text-field-input-numeric" type="number" name="day" v-model="day" min="1" max="30" required>
          </div>
          <p id="event-day-message" class="text-field-message">✕ Choose a day from 1 to 30.</p>
        </div>
      </j3w1-text-field>
      <j3w1-button><button class="button" type="submit" data-add-event>Add event</button></j3w1-button>
    </form>
    <div class="calendar">
      <div v-for="date in 30" :key="date" class="calendar-day">
        <strong>{{ String(date).padStart(2,'0') }}</strong>
        <p v-for="event in state.events.filter(event=>event.day===date)" :key="event.id" class="calendar-event" :data-event-id="event.id">
          <span>{{ event.title }}</span>
          <j3w1-button><button class="button button-destructive" type="button" :aria-label="`Remove event: ${event.title}`" @click="removeEvent(event, $event.currentTarget)">Remove</button></j3w1-button>
        </p>
      </div>
    </div>
    <div class="actions">
      <p class="muted">Removed entries can be restored until you leave or reset the demo.</p>
      <j3w1-button v-if="lastRemoved"><button ref="undoButton" class="button button-secondary" type="button" @click="undoEvent">Undo removal of {{ lastRemoved.title }}</button></j3w1-button>
    </div>
    <div v-if="removalNotice" ref="notifications" class="toast-stack calendar-notifications" role="region" aria-label="Notifications" @mouseenter="hoverRemovalNotice(true)" @mouseleave="hoverRemovalNotice(false)" @focusin="pauseRemovalNotice" @focusout="leaveRemovalNotice">
      <j3w1-toast @j3w1-dismiss.prevent="dismissRemovalNotice">
        <div class="toast" role="status">
          <span class="toast-glyph" aria-hidden="true">i</span>
          <p class="toast-text">{{ lastRemoved.title }} removed.</p>
          <button class="toast-action" type="button" @click="undoEvent">Undo</button>
          <button class="toast-close" type="button" aria-label="Dismiss">✕</button>
        </div>
      </j3w1-toast>
    </div>
  </section>
  <template v-else-if="kind==='kanban'">
    <form class="filters" @submit.prevent="addTask">
      <j3w1-text-field>
        <div class="text-field">
          <label class="text-field-label" for="task-name">New task <span class="text-field-required" aria-hidden="true">*</span><span class="text-field-required sr-only"> required</span></label>
          <div class="text-field-root">
            <input id="task-name" aria-describedby="task-name-message" class="text-field-input" name="task" v-model="taskName" required maxlength="120" placeholder="What needs to happen?">
          </div>
          <p id="task-name-message" class="text-field-message">✕ Describe the task.</p>
        </div>
      </j3w1-text-field>
      <j3w1-button><button class="button" type="submit">Add task</button></j3w1-button>
    </form>
    <div class="kanban">
      <section v-for="column in ['Ready','In progress','Review']" :key="column" class="panel">
        <p class="eyebrow">{{ state.tasks.filter(task=>task.status===column).length }} TASKS</p>
        <h2>{{ column }}</h2>
        <article v-for="task in state.tasks.filter(task=>task.status===column)" :key="task.id" :data-task-id="task.id">
          <h3>{{ task.name }}</h3>
          <j3w1-select>
            <div class="select">
              <label class="select-label" :for="`task-${task.id}-status`">Move task</label>
              <div class="select-root">
                <select :id="`task-${task.id}-status`" class="select-control" name="status" :value="task.status" :aria-label="`Move ${task.name}`" @change="move(task,$event.target.value)">
                  <option>Ready</option>
                  <option>In progress</option>
                  <option>Review</option>
                </select>
                <svg class="select-chevron" aria-hidden="true" focusable="false" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square"><path d="M4 6.5l4 4 4-4"></path></svg>
              </div>
            </div>
          </j3w1-select>
        </article>
        <p v-if="!state.tasks.some(task=>task.status===column)" class="muted">No tasks in this column.</p>
      </section>
    </div>
    <p class="muted">Move tasks with the themed choice menu using the pointer or keyboard.</p>
  </template>
  <section v-else class="panel empty">
    <h2>Application not found</h2>
    <j3w1-link><RouterLink class="link link-standalone" to="/apps/email">Open email →</RouterLink></j3w1-link>
  </section>
</template>
