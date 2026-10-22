// Lesson: Accessible components — modal dialog, tabs, menu button, toast and form field,
// built in Vue following the WAI-ARIA Authoring Practices Guide (APG).

const appVue = `<script setup>
import { ref, computed, nextTick } from 'vue'
import ModalDialog from './ModalDialog.vue'
import ToastRegion from './ToastRegion.vue'
import { showToast } from './toasts.js'

const projects = ref(['Website redesign', 'Mobile app', 'Quarterly report'])
const pending = ref(null) // the project waiting for confirmation
const heading = ref(null)

const description = computed(() =>
  pending.value
    ? 'This permanently deletes "' + pending.value + '" and all of its tasks. This cannot be undone.'
    : '',
)

function cancel() {
  pending.value = null
}

async function confirmDelete() {
  const name = pending.value
  projects.value = projects.value.filter((p) => p !== name)
  pending.value = null
  showToast('"' + name + '" was deleted')
  // The button that opened the dialog no longer exists: move focus somewhere sensible.
  await nextTick()
  heading.value?.focus()
}
</script>

<template>
  <h1 ref="heading" tabindex="-1">Projects</h1>
  <ul class="projects">
    <li v-for="p in projects" :key="p">
      <span>{{ p }}</span>
      <button type="button" class="delete" :aria-label="'Delete ' + p" @click="pending = p">Delete</button>
    </li>
  </ul>
  <p v-if="!projects.length">No projects left.</p>

  <ModalDialog
    :open="pending !== null"
    title="Delete project?"
    :description="description"
    @close="cancel"
  >
    <template #actions>
      <button type="button" class="cancel" @click="cancel">Cancel</button>
      <button type="button" class="confirm" @click="confirmDelete">Delete project</button>
    </template>
  </ModalDialog>

  <ToastRegion />
</template>

<style>
body { font-family: system-ui, sans-serif; color: #111827; }
.projects { list-style: none; padding: 0; max-width: 24rem; }
.projects li { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #ddd; }
button { font: inherit; min-height: 2rem; padding: 0.25rem 0.75rem; border-radius: 6px; border: 1px solid #767676; background: #fff; color: #111827; cursor: pointer; }
.confirm { background: #b91c1c; border-color: #b91c1c; color: #fff; }
:focus-visible { outline: 3px solid #1d4ed8; outline-offset: 2px; }
.visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
</style>`

const modalStyle = `<style scoped>
.backdrop { position: fixed; inset: 0; display: grid; place-items: center; background: rgb(0 0 0 / 0.45); }
.dialog { width: min(26rem, calc(100% - 2rem)); padding: 1.25rem; border-radius: 12px; background: #fff; box-shadow: 0 10px 40px rgb(0 0 0 / 0.3); }
.dialog-header { display: flex; justify-content: space-between; align-items: start; gap: 1rem; }
.dialog-title { margin: 0; font-size: 1.2rem; }
.dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; }
</style>`

const modalBroken = `<script setup>
import { ref, watch, nextTick, useId } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const titleId = useId()
const panel = ref(null)

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables() {
  return panel.value ? [...panel.value.querySelectorAll(FOCUSABLE)] : []
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      await nextTick() // wait until the dialog is in the DOM
      const [first] = focusables()
      ;(first ?? panel.value)?.focus() // initial focus inside the dialog
    }
    // TODO (experiment): give focus back to the element that opened the dialog
  },
)

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
  }
  // TODO (experiment): keep Tab and Shift+Tab inside the dialog
}
</script>

<template>
  <div v-if="open" class="backdrop" @click.self="emit('close')">
    <div
      ref="panel"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <header class="dialog-header">
        <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
        <button type="button" class="dialog-close" aria-label="Close" @click="emit('close')">
          <span aria-hidden="true">✕</span>
        </button>
      </header>
      <p v-if="description" class="dialog-desc">{{ description }}</p>
      <div class="dialog-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

${modalStyle}`

const modalFixed = `<script setup>
import { ref, watch, nextTick, useId } from 'vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
const emit = defineEmits(['close'])

const titleId = useId()
const descId = useId()
const panel = ref(null)
let returnFocusTo = null

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function focusables() {
  return panel.value ? [...panel.value.querySelectorAll(FOCUSABLE)] : []
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      returnFocusTo = document.activeElement // remember who opened us
      await nextTick()
      const [first] = focusables()
      ;(first ?? panel.value)?.focus()
    } else if (returnFocusTo) {
      returnFocusTo.focus() // give focus back
      returnFocusTo = null
    }
  },
)

function onKeydown(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const items = focusables()
  if (!items.length) return event.preventDefault()
  const first = items[0]
  const last = items[items.length - 1]
  const active = document.activeElement
  if (event.shiftKey && (active === first || active === panel.value)) {
    event.preventDefault()
    last.focus() // Shift+Tab on the first element wraps to the last
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus() // Tab on the last element wraps to the first
  }
}
</script>

<template>
  <div v-if="open" class="backdrop" @click.self="emit('close')">
    <div
      ref="panel"
      class="dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      :aria-describedby="description ? descId : undefined"
      tabindex="-1"
      @keydown="onKeydown"
    >
      <header class="dialog-header">
        <h2 :id="titleId" class="dialog-title">{{ title }}</h2>
        <button type="button" class="dialog-close" aria-label="Close" @click="emit('close')">
          <span aria-hidden="true">✕</span>
        </button>
      </header>
      <p v-if="description" :id="descId" class="dialog-desc">{{ description }}</p>
      <div class="dialog-actions">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

${modalStyle}`

const toastStyle = `<style scoped>
.toast-stack { position: fixed; inset-block-end: 1rem; inset-inline-end: 1rem; display: grid; gap: 0.5rem; }
.toast { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0.8rem; border-radius: 8px; background: #111827; color: #fff; }
.toast-close { background: transparent; color: #fff; border-color: #9ca3af; }
</style>`

const toastsBroken = `import { reactive } from 'vue'

// Simplified module-level store (one per app). Real apps often use Pinia or provide/inject.
export const toasts = reactive([])
let nextId = 1

export function showToast(message, { timeout = 6000 } = {}) {
  const id = nextId++
  toasts.push({ id, message })
  if (timeout) setTimeout(() => dismissToast(id), timeout)
  return id
}

export function dismissToast(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index !== -1) toasts.splice(index, 1)
}`

const toastRegionBroken = `<script setup>
import { toasts, dismissToast } from './toasts.js'
</script>

<template>
  <div v-if="toasts.length" class="toast-stack" role="status">
    <div v-for="t in toasts" :key="t.id" class="toast">
      <span class="toast-message">{{ t.message }}</span>
      <button type="button" class="toast-close" aria-label="Dismiss notification" @click="dismissToast(t.id)">
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  </div>
</template>

${toastStyle}`

const toastsFixed = `import { reactive, ref, nextTick } from 'vue'

// Simplified module-level store (one per app). Real apps often use Pinia or provide/inject.
export const toasts = reactive([])
export const announcement = ref('')
const timers = new Map()
let nextId = 1
let paused = false

function startTimer(toast) {
  toast.startedAt = Date.now()
  timers.set(toast.id, setTimeout(() => dismissToast(toast.id), toast.remaining))
}

function stopTimer(toast) {
  if (!timers.has(toast.id)) return
  clearTimeout(timers.get(toast.id))
  timers.delete(toast.id)
  toast.remaining -= Date.now() - toast.startedAt
}

export function showToast(message, { timeout = 6000 } = {}) {
  const toast = reactive({ id: nextId++, message, remaining: timeout, startedAt: 0 })
  toasts.push(toast)
  if (!paused) startTimer(toast)
  // Clear, then set: the same message twice is still a change screen readers notice.
  announcement.value = ''
  nextTick(() => {
    announcement.value = message
  })
  return toast.id
}

export function dismissToast(id) {
  const index = toasts.findIndex((t) => t.id === id)
  if (index === -1) return
  clearTimeout(timers.get(id))
  timers.delete(id)
  toasts.splice(index, 1)
}

// Pause auto-dismiss while the pointer or keyboard focus is on the toasts.
export function pauseToasts() {
  paused = true
  toasts.forEach(stopTimer)
}

export function resumeToasts() {
  paused = false
  toasts.forEach((t) => {
    if (!timers.has(t.id)) startTimer(t)
  })
}`

const toastRegionFixed = `<script setup>
import { toasts, announcement, dismissToast, pauseToasts, resumeToasts } from './toasts.js'
</script>

<template>
  <!-- The visual stack is NOT a live region, so its buttons are not read with each message. -->
  <div
    class="toast-stack"
    @mouseenter="pauseToasts"
    @mouseleave="resumeToasts"
    @focusin="pauseToasts"
    @focusout="resumeToasts"
  >
    <div v-for="t in toasts" :key="t.id" class="toast">
      <span class="toast-message">{{ t.message }}</span>
      <button type="button" class="toast-close" :aria-label="'Dismiss: ' + t.message" @click="dismissToast(t.id)">
        <span aria-hidden="true">✕</span>
      </button>
    </div>
  </div>

  <!-- Always rendered, text changes: this is what screen readers announce. -->
  <p class="visually-hidden" role="status">{{ announcement }}</p>
</template>

${toastStyle}`

const startFiles = {
  'App.vue': appVue,
  'ModalDialog.vue': modalBroken,
  'ToastRegion.vue': toastRegionBroken,
  'toasts.js': toastsBroken,
}

const openFirstDelete = `const opener = findAll('.delete')[0]
opener.focus()
await click(opener)`

export default {
  id: 'accessible-components',
  title: 'Accessible components: modal, tabs, dropdown, toast',
  summary: 'Build a modal dialog, tabs, a menu button, toasts and a form field in Vue that follow the WAI-ARIA Authoring Practices — roles, keyboard support and focus management included.',
  difficulty: 'advanced',
  minutes: 65,
  prerequisites: ['accessibility-fundamentals', 'slots', 'template-refs', 'next-tick'],
  related: ['accessibility-fundamentals', 'accessible-reusable-inputs', 'teleport', 'design-systems', 'design-patterns', 'component-v-model', 'e2e-and-quality'],
  tags: ['accessibility', 'aria', 'apg', 'modal', 'dialog', 'focus trap', 'tabs', 'roving tabindex', 'menu button', 'disclosure', 'toast', 'live region', 'form field', 'useId'],
  apis: [
    { name: 'role="dialog" + aria-modal', summary: 'Marks a modal dialog; content outside it should be treated as inert by assistive technology.' },
    { name: 'HTMLDialogElement.showModal()', summary: 'Native modal dialog: top layer, inert background, Escape to close and built-in focus handling.' },
    { name: 'role="tablist" / "tab" / "tabpanel"', summary: 'The tabs pattern: aria-selected, aria-controls and a roving tabindex with arrow-key navigation.' },
    { name: 'aria-haspopup / aria-expanded', summary: 'Tell users a button opens a menu (or other popup) and whether it is currently open.' },
    { name: 'role="status"', summary: 'A polite live region — the basis for accessible toast announcements.' },
    { name: 'useId()', summary: 'Vue 3.5+: unique ids for aria-labelledby, aria-controls and aria-describedby wiring.' },
  ],
  docs: [
    { label: 'WAI-ARIA APG — Dialog (Modal) pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/' },
    { label: 'WAI-ARIA APG — Tabs pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/tabs/' },
    { label: 'WAI-ARIA APG — Menu Button pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/' },
    { label: 'WAI-ARIA APG — Disclosure pattern', url: 'https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/' },
    { label: 'MDN — <dialog>: The Dialog element', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog' },
    { label: 'Vue Guide — Accessibility', url: 'https://vuejs.org/guide/best-practices/accessibility.html' },
    { label: 'API — useId()', url: 'https://vuejs.org/api/composition-api-helpers.html#useid' },
  ],

  intro: `
Some UI widgets have no single HTML element: tabs, menus that pop out of a button, toasts that slide in. Users of assistive technology still expect them to behave in **predictable, well-known ways** — the same keys, the same announcements, the same focus behaviour as in their operating system.

The [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) (APG) documents those expectations as *patterns*: which roles and attributes to use and which keys must work. In this lesson you build the most common ones in Vue — a **modal dialog**, **tabs**, a **menu button**, **toasts** and a **form field** — and test them the way a keyboard user would.
`,

  why: `
Custom widgets are where most accessibility bugs live. A modal that doesn't trap focus lets keyboard users wander *behind* it. Tabs without arrow-key support force users to Tab through every tab. A toast created at the wrong moment is never announced, and one that grabs focus throws the user out of what they were typing.

The fixes are not obvious from HTML alone — they're **contracts**:

- "When a dialog opens, focus moves into it; Tab stays inside; Escape closes; focus goes back to where it was."
- "In a tab list, only the selected tab is a Tab stop; arrow keys move between tabs."

Build each contract **once**, carefully, in a shared component, and every screen in your app inherits it. That is why these components are the heart of an accessible [design system](lesson:design-systems).
`,

  eli15: `
Think about how every lift in the world works the same way: press the button, the doors open, there's a panel inside, the doors close behind you, and when you get out you're on a landing. Nobody reads instructions.

Widgets on the web have the same kind of "everybody knows" rules for keyboard and screen-reader users:

- A **pop-up dialog** is like stepping into the lift: once you're in, you stay in until you leave, and when you leave you're back where you started.
- **Tabs** are like a row of folder tabs: arrow keys flip between them; Tab jumps into the open folder.
- A **menu button** opens a list; arrow keys move through it; Escape closes it.
- A **toast** is like a station announcement: you hear it, but nobody grabs your arm.

Vue doesn't know these rules for you. You write them with \`role\` attributes, a few keyboard handlers, and by moving focus at the right moment.
`,

  analogy: {
    title: 'A lift you have used a thousand times',
    body: `
A lift isn't special because of its doors; it's special because **every lift behaves the same**. You never wonder how to get out.

The APG patterns are the "every lift behaves the same" of the web. When your modal behaves like every other modal — focus in, focus trapped, Escape out, focus back — a screen-reader user can use it without thinking. When it behaves differently, they are stuck between floors.
`,
    mapping: [
      ['stepping into the lift', 'opening a modal: focus moves inside it'],
      ['doors closed behind you', 'focus trap: Tab and Shift+Tab stay in the dialog'],
      ['the "open doors" button', 'Escape closes the dialog'],
      ['arriving back on your landing', 'focus returns to the button that opened the dialog'],
      ['the floor announcement', 'a toast announced through a live region, without grabbing you'],
      ['the floor buttons panel', 'a menu: arrow keys move between items'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The modal dialog focus contract',
    caption: 'Every step is something you implement: Vue only renders the markup.',
    alt: 'A six-step cycle in a grid: the trigger button has focus; the dialog opens with role dialog and aria-modal; after nextTick initial focus moves to the first control or the least destructive action; Tab and Shift+Tab wrap inside the dialog; Escape, Cancel or Confirm closes it; focus returns to the trigger, or to a sensible fallback if the trigger was removed.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'trigger', label: 'Trigger has focus', note: '<button>Delete</button>', tone: 'paper' },
        { id: 'open', label: 'Dialog opens', note: 'role="dialog" aria-modal="true"', tone: 'acid' },
        { id: 'initial', label: 'Initial focus', note: 'first control (or least destructive)', tone: 'cobalt' },
        { id: 'restore', label: 'Focus returns', note: 'to the trigger — or a fallback', tone: 'acid' },
        { id: 'close', label: 'Close', note: 'Esc · Cancel · Confirm', tone: 'red' },
        { id: 'trap', label: 'Focus trapped', note: 'Tab wraps last → first', tone: 'kraft' },
      ],
      edges: [
        { from: 'trigger', to: 'open', label: 'click / Enter' },
        { from: 'open', to: 'initial', label: 'await nextTick()' },
        { from: 'initial', to: 'trap' },
        { from: 'trap', to: 'close' },
        { from: 'close', to: 'restore' },
        { from: 'restore', to: 'trigger', label: 'same place as before', dashed: true },
      ],
      steps: [
        { focus: ['trigger'], text: 'The user is on the **Delete** button. Remember this element — you will need it again.' },
        { focus: ['open'], edges: ['trigger->open'], text: 'The dialog renders with `role="dialog"`, `aria-modal="true"` and a name via `aria-labelledby` pointing at its heading.' },
        { focus: ['initial'], edges: ['open->initial'], text: 'After `await nextTick()` (the dialog is now in the DOM) focus moves inside — usually to the first focusable control. For destructive, irreversible actions the APG suggests the least destructive one, such as **Cancel**.' },
        { focus: ['trap'], edges: ['initial->trap'], text: 'Tab from the last control wraps to the first; Shift+Tab from the first wraps to the last. Keyboard users cannot drift into the page behind the backdrop.' },
        { focus: ['close'], edges: ['trap->close'], text: '**Escape** closes the dialog, as do the Cancel/Close buttons and the action itself.' },
        { focus: ['restore'], edges: ['close->restore'], text: 'Focus returns to the element that opened the dialog. If that element no longer exists (you just deleted its row), move focus to a logical place — a heading or the next item.' },
        { focus: ['trigger', 'restore'], edges: ['restore->trigger'], text: 'The user continues exactly where they left off. That continuity is the whole point.' },
      ],
    },
  },

  syntax: [
    `
Each pattern is a small contract of **roles + states + keys + focus**. Here are the skeletons; the playground and exercises build them for real.

#### Modal dialog
`,
    {
      code: `<div v-if="open" class="backdrop" @click.self="close">
  <div ref="panel" role="dialog" aria-modal="true"
       :aria-labelledby="titleId" :aria-describedby="descId"
       tabindex="-1" @keydown="onKeydown">      <!-- Escape + Tab trap -->
    <h2 :id="titleId">Delete project?</h2>
    <p :id="descId">This cannot be undone.</p>
    <button type="button" @click="close">Cancel</button>
    <button type="button" @click="confirm">Delete project</button>
  </div>
</div>`,
      lang: 'vue',
      title: 'custom modal dialog (what the playground builds)',
    },
    `
In real browsers, the native \`<dialog>\` element opened with \`showModal()\` is a fine — often better — choice: it renders in the *top layer* (above everything, no \`z-index\` fights), makes the rest of the page **inert** (not focusable, hidden from assistive tech), closes on Escape (firing a \`cancel\` event, then \`close\`), and handles initial focus. Per the HTML spec, closing it returns focus to the previously focused element; check that in the browsers you support.
`,
    {
      code: `<script setup>
import { useTemplateRef } from 'vue'   // 3.5+ (or: const dialog = ref(null))
const dialog = useTemplateRef('dialog')
</script>

<template>
  <button type="button" @click="dialog.showModal()">Delete project…</button>

  <dialog ref="dialog" aria-labelledby="del-title" @close="onClose">
    <h2 id="del-title">Delete project?</h2>
    <form method="dialog">              <!-- submitting closes the dialog -->
      <button value="cancel" autofocus>Cancel</button>
      <button value="confirm">Delete project</button>
    </form>
  </dialog>
</template>

<style>
dialog::backdrop { background: rgb(0 0 0 / 0.45); }
</style>`,
      lang: 'vue',
      title: 'native <dialog> (static example — real browsers only)',
      static: true,
    },
    {
      callout: 'note',
      title: 'Why the playground uses role="dialog"',
      text: 'The tests on this platform also run in jsdom, which does not implement `showModal()` or `close()`. The custom version also makes every step of the contract visible, which is the point of this lesson. In production either approach is valid; the native one gives you inertness and the top layer for free.',
    },
    `
#### Tabs (roving tabindex)
`,
    {
      code: `<div role="tablist" aria-label="Product information">
  <button v-for="(tab, i) in tabs" :key="tab.id"
          role="tab" type="button"
          :id="tabId(tab)"
          :aria-selected="i === selected"
          :aria-controls="panelId(tab)"
          :tabindex="i === selected ? 0 : -1"
          @keydown="onKeydown($event, i)">   <!-- ←/→ Home/End -->
    {{ tab.label }}
  </button>
</div>
<div v-for="(tab, i) in tabs" :key="tab.id" v-show="i === selected"
     role="tabpanel" :id="panelId(tab)" :aria-labelledby="tabId(tab)" tabindex="0">
  {{ tab.content }}
</div>`,
      lang: 'vue',
      title: 'tabs skeleton',
    },
    `
#### Menu button vs disclosure

A **menu button** opens a list of *actions* (Duplicate, Rename, Archive) — like an application menu. A **disclosure** just shows and hides content, such as a group of *navigation links*. Site navigation should normally be a disclosure, not \`role="menu"\`: a menu makes screen readers switch to application-style keyboard handling that users don't expect for links.
`,
    {
      code: `<!-- Menu button: actions -->
<button :id="triggerId" type="button" aria-haspopup="menu"
        :aria-expanded="open" :aria-controls="menuId">Actions</button>
<ul v-if="open" :id="menuId" role="menu" :aria-labelledby="triggerId">
  <li role="menuitem" tabindex="-1">Duplicate</li>   <!-- ↑/↓ Home/End Enter Esc -->
  <li role="menuitem" tabindex="-1">Archive</li>
</ul>

<!-- Disclosure: navigation links -->
<button type="button" :aria-expanded="open" aria-controls="shop-links">Shop</button>
<ul v-show="open" id="shop-links">
  <li><RouterLink to="/shoes">Shoes</RouterLink></li>   <!-- normal Tab order -->
  <li><RouterLink to="/bags">Bags</RouterLink></li>
</ul>`,
      lang: 'vue',
      title: 'two different patterns',
    },
    `
#### Toasts and form fields
`,
    {
      code: `<!-- Toast: one persistent polite live region; never move focus to it -->
<p class="visually-hidden" role="status">{{ announcement }}</p>

<!-- Form field: label, hint and error wired with ids -->
<label :for="id">Email</label>
<input :id="id" v-model="email"
       :aria-invalid="error ? 'true' : null"
       :aria-describedby="[hint && hintId, error && errorId].filter(Boolean).join(' ') || null" />
<p v-if="hint" :id="hintId">{{ hint }}</p>
<p v-if="error" :id="errorId">{{ error }}</p>`,
      lang: 'vue',
      title: 'toast region and form field wiring',
    },
    {
      callout: 'version',
      text: '`useId()` (used throughout for `aria-labelledby` / `aria-controls` / `aria-describedby`) needs **Vue 3.5+**; `useTemplateRef()` is 3.5+; `defineModel()` is 3.4+.',
    },
  ],

  walkthrough: {
    title: 'ModalDialog.vue (complete version)',
    lang: 'vue',
    code: modalFixed,
    intro: 'The finished dialog from the playground\'s **Complete version** variant. Every highlighted block is one clause of the APG modal dialog contract.',
    steps: [
      { lines: [11, 14], text: 'Two ids from `useId()` (Vue 3.5+) name and describe the dialog. `returnFocusTo` will remember which element opened it.' },
      { lines: [16, 21], text: 'A selector for everything keyboard-focusable inside the panel. `focusables()` returns them in DOM order — the order Tab visits them.' },
      { lines: [23, 36], text: 'Watching `open`. On open we store `document.activeElement`, wait for the DOM with `nextTick()`, then focus the first control (or the panel). On close we hand focus back.' },
      { lines: [38, 43], text: 'Escape closes. `stopPropagation()` keeps an outer component (say, a parent dialog) from reacting to the same key.' },
      { lines: [44, 57], text: 'The focus trap only intervenes at the edges: Tab on the last element jumps to the first, Shift+Tab on the first jumps to the last. Everywhere else the browser moves focus normally.' },
      { lines: [61, 71], text: '`role="dialog"` + `aria-modal="true"` tell assistive tech this is a modal; `aria-labelledby` gives it a name ("Delete project?, dialog") and `aria-describedby` reads the warning. `tabindex="-1"` lets the panel itself take focus when it has no controls.' },
      { lines: [72, 77], text: 'The heading provides the name. The icon-only close button has an `aria-label`, and the glyph is hidden from screen readers.' },
      { lines: [78], text: 'The description gets its id only when it exists, so `aria-describedby` never points at nothing.' },
    ],
  },

  playground: {
    title: 'Delete-confirmation dialog + toasts',
    objective: 'Delete a project with the keyboard only. Then complete the dialog and toast contracts one clause at a time.',
    files: startFiles,
    expected: 'A list of projects with **Delete** buttons. Delete opens a confirmation dialog: focus jumps inside, Escape closes it. Confirming removes the project and shows a toast. But Tab can escape the dialog, focus is lost after closing, the warning text is not connected to the dialog, and the toast is not reliably announced. Compare with the **Complete version** variant.',
    experiments: [
      {
        id: 'describedby',
        task: 'Screen readers announce the dialog\'s name but not its warning. In `ModalDialog.vue`, give the description paragraph an id (from `useId()`) and point the dialog\'s `aria-describedby` at it.',
        hint: 'Add `const descId = useId()`, then `:id="descId"` on the `<p class="dialog-desc">` and `:aria-describedby="description ? descId : undefined"` on the `role="dialog"` element.',
        tests: [
          {
            name: 'the dialog is described by text containing the warning',
            code: `${openFirstDelete}
const dialog = find('[role="dialog"]')
expect(dialog).toBeTruthy()
const ids = (dialog.getAttribute('aria-describedby') || '').split(' ').filter(Boolean)
expect(ids.length).toBeGreaterThan(0)
const described = ids.map((id) => (document.getElementById(id) || {}).textContent || '').join(' ')
expect(described).toContain('cannot be undone')`,
          },
        ],
        explain: 'When the dialog receives focus, a screen reader typically reads its name, role and description: "Delete project?, dialog, This permanently deletes…". Without `aria-describedby`, the most important sentence is only discovered if the user explores further.',
      },
      {
        id: 'trap',
        task: 'Implement the focus trap in `onKeydown`: **Tab** on the last focusable element moves focus to the first one, and **Shift+Tab** on the first moves to the last.',
        hint: 'Inside `onKeydown`, when `event.key === \'Tab\'`: get `focusables()`, compare `document.activeElement` with the first/last item, and when you wrap, call `event.preventDefault()` before `.focus()`.',
        tests: [
          {
            name: 'Tab wraps from last to first, Shift+Tab from first to last',
            code: `${openFirstDelete}
const dialog = find('[role="dialog"]')
const buttons = [...dialog.querySelectorAll('button')]
const first = buttons[0]
const last = buttons[buttons.length - 1]
last.focus()
await trigger(last, 'keydown', { key: 'Tab' })
expect(document.activeElement).toBe(first)
await trigger(first, 'keydown', { key: 'Tab', shiftKey: true })
expect(document.activeElement).toBe(last)`,
          },
        ],
        explain: 'The trap only intercepts Tab at the two edges and lets the browser handle everything in between. Without it, keyboard users tab into the page behind the backdrop — content they cannot see and that a mouse user cannot click.',
      },
      {
        id: 'return-focus',
        task: 'Close the dialog with Escape and press Tab: you start again from the top of the page. Make the dialog **return focus to the element that opened it** when it closes.',
        hint: 'When `isOpen` becomes `true`, store `document.activeElement` in a variable *before* `await nextTick()`. In the `else` branch (closing), call `.focus()` on it.',
        tests: [
          {
            name: 'Escape closes the dialog and focus goes back to the Delete button',
            code: `${openFirstDelete}
expect(exists('[role="dialog"]')).toBe(true)
await trigger('[role="dialog"]', 'keydown', { key: 'Escape' })
expect(exists('[role="dialog"]')).toBe(false)
expect(document.activeElement).toBe(opener)`,
          },
          {
            name: 'Cancel also returns focus to the Delete button',
            code: `${openFirstDelete}
await click('.cancel')
expect(exists('[role="dialog"]')).toBe(false)
expect(document.activeElement).toBe(opener)`,
          },
        ],
        explain: 'The watcher runs before Vue removes the dialog from the DOM, so the trigger still exists and can take focus. Notice `confirmDelete()` in `App.vue`: after deleting, the trigger is gone, so the app moves focus to the heading instead — the APG\'s "unless the invoking element no longer exists" clause.',
      },
      {
        id: 'toast-region',
        task: 'The toast stack has `role="status"` but is created with `v-if` at the same moment as its first message, so screen readers often stay silent. Make sure a status region exists **before** the first toast and receives the message.',
        hint: 'Remove the `v-if` from the region in `ToastRegion.vue` (an empty container is invisible anyway). The **Complete version** goes further and uses a separate visually hidden announcer.',
        tests: [
          {
            name: 'a status region exists up front and announces the deletion',
            code: `const region = find('[role="status"]') || find('[aria-live]')
expect(region).toBeTruthy()
${openFirstDelete}
await click('.confirm')
await flush()
expect(region.isConnected).toBe(true)
expect(region.textContent).toContain('was deleted')`,
          },
        ],
        explain: 'Assistive technology announces changes inside live regions it is already tracking. The complete version also keeps the dismiss buttons *outside* the live region (so "Dismiss" isn\'t read with every message), never moves focus to a toast, and pauses auto-dismiss while the pointer or focus is on the stack.',
      },
    ],
    variants: [
      { id: 'start', label: 'Starting point', files: startFiles },
      {
        id: 'complete',
        label: 'Complete version (all experiments + pausing toasts)',
        files: {
          'App.vue': appVue,
          'ModalDialog.vue': modalFixed,
          'ToastRegion.vue': toastRegionFixed,
          'toasts.js': toastsFixed,
        },
      },
    ],
  },

  animation: {
    type: 'rendering-lab',
    props: { mode: 'teleport' },
    title: 'Where should a modal live in the DOM?',
    caption: 'Modals are often rendered with `<Teleport to="body">` so no ancestor\'s `overflow` or `z-index` can clip them. Teleport moves the DOM, so the dialog sits at the *end* of the page in Tab order — one more reason to move focus into it and trap it. It also lets you mark the app container `inert` while the dialog, outside it, stays usable.',
    alt: 'A live demo of Vue Teleport: a component rendered inside a nested, clipped container is moved to another place in the document while keeping its logical parent, showing how the DOM position differs from the component tree.',
  },

  internals: {
    beginner: `
A pattern is a **promise**. \`role="tablist"\` tells a screen reader "arrow keys switch tabs here", so its user presses arrow keys. If you add the role but not the keys, you've broken a promise — which is worse than having no role at all.

So every component in this lesson has two halves: **markup** (roles, names, states that Vue renders from your data) and **behaviour** (keyboard handlers and focus moves that you write). Tests check both: the attributes in the HTML, and where \`document.activeElement\` ends up after each key.
`,
    technical: [
      `
**Focus trap mechanics.** Browsers don't offer a "keep focus here" API for custom dialogs. A trap listens for \`keydown\` Tab inside the dialog, finds the focusable elements (a selector like the one in the playground), and only when focus is on the first/last element calls \`preventDefault()\` and moves it to the other end. A sturdier production version also skips hidden elements and handles focus arriving from outside (e.g. a click on the backdrop).

**Inertness.** \`aria-modal="true"\` tells assistive technology to treat outside content as unavailable, but support varies between screen reader and browser combinations, and it does nothing for keyboard focus. The \`inert\` attribute (supported in current versions of the major browsers) makes a subtree unfocusable and hidden from assistive tech. A common setup: teleport the dialog to \`body\` and set \`inert\` on the app root while it is open. Native \`showModal()\` does this automatically.

**Roving tabindex vs \`aria-activedescendant\`.** Composite widgets (tabs, menus, listboxes, grids) are *one* Tab stop. Two techniques:

- *Roving tabindex* — the active item has \`tabindex="0"\`, the others \`-1\`; arrow keys move real DOM focus. Simple and well supported (used in the tabs exercise).
- *\`aria-activedescendant\`* — focus stays on the container, which points at the "active" child's id. Useful when focus must stay in an input, as in a combobox.
`,
      {
        code: `// Roving tabindex in one function (simplified)
function onKeydown(event, index) {
  const last = tabs.length - 1
  const next = { ArrowRight: index === last ? 0 : index + 1,
                 ArrowLeft: index === 0 ? last : index - 1,
                 Home: 0, End: last }[event.key]
  if (next === undefined) return     // let other keys behave normally
  event.preventDefault()             // e.g. stop Home/End scrolling the page
  selected.value = next              // tabindex: 0 for next, -1 for the rest
  tabEls[next].focus()               // elements already exist, no nextTick needed
}`,
        lang: 'js',
        title: 'roving tabindex',
      },
      `
**Vue specifics that matter here:**

- **Timing.** An element rendered by a state change (opening a menu, a dialog) doesn't exist until Vue patches the DOM — focus it after \`await nextTick()\`. Elements that already exist (tabs) can be focused immediately.
- **Refs in \`v-for\`.** \`ref="items"\` inside \`v-for\` fills an array, but Vue does **not** guarantee it follows source order. For keyboard navigation, use a function ref: \`:ref="(el) => (itemEls[i] = el)"\`.
- **Booleans in ARIA.** Vue 3 renders \`:aria-selected="false"\` as \`aria-selected="false"\`; \`null\`/\`undefined\` removes the attribute.
- **Watcher timing.** A default (\`pre\`) watcher on \`open\` runs *before* the DOM update, so on close the trigger still exists and can receive focus before the dialog unmounts.

**Live regions for toasts.** \`role="status"\` implies \`aria-live="polite"\` and \`aria-atomic="true"\` (the whole region is read on change). That is why the complete version keeps buttons out of the region: they would be read with every announcement.
`,
    ],
    production: [
      `
- **Prefer proven primitives.** These patterns have many edge cases (nested dialogs, scroll locking, focus arriving from outside, screen-reader quirks). Headless libraries — for example Reka UI or the Vue package of Headless UI — implement them and leave styling to you. Whether you adopt one or build your own, test the result with real assistive technology.
- **Native first.** \`<dialog>\` + \`showModal()\` for modals, \`<details>/<summary>\` for simple disclosures, \`<select>\` when a native list is acceptable. Custom widgets are a maintenance commitment.
- **Return focus robustly.** Safari on macOS does not focus buttons on mouse click, so \`document.activeElement\` may be \`<body>\` when the dialog opens. Robust dialogs let the caller pass the element to return to, or record it in the trigger's click handler. If the trigger is gone, choose a logical fallback.
- **Teleport + inert.** Teleport dialogs and toasts to \`body\`; set \`inert\` on the app root while a modal is open; lock background scrolling.
- **Toasts are for non-critical, non-essential information.** Do not put the only copy of important information or required actions in a toast that disappears. If content is time-limited, WCAG 2.2.1 (Timing Adjustable) applies — let users pause, extend or turn off timeouts; pausing on hover/focus helps. Errors that need action belong next to the thing that failed or in a \`role="alert"\` message.
- **Test the contract.** Component tests should press keys and assert \`document.activeElement\`, \`aria-expanded\`, \`aria-selected\` and live-region text — exactly like this lesson's tests. Add axe checks in E2E, plus a manual screen-reader pass per pattern.
`,
    ],
  },

  mistakes: [
    {
      title: 'Using `role="menu"` for site navigation',
      wrong: { code: `<nav>\n  <button aria-haspopup="menu" :aria-expanded="open">Shop</button>\n  <ul role="menu">\n    <li role="menuitem"><a href="/shoes">Shoes</a></li>\n  </ul>\n</nav>`, lang: 'vue' },
      right: { code: `<nav aria-label="Main">\n  <button :aria-expanded="open" aria-controls="shop-links">Shop</button>\n  <ul v-show="open" id="shop-links">\n    <li><a href="/shoes">Shoes</a></li>\n  </ul>\n</nav>`, lang: 'vue' },
      explanation: '`role="menu"` promises application-menu keyboard behaviour (arrow keys, no Tab between items) and changes how screen readers present the content. For a list of links, the disclosure pattern — a button with `aria-expanded` controlling a plain list — is what users expect.',
    },
    {
      title: 'Opening a dialog without moving focus into it',
      wrong: { code: `function open() {\n  isOpen.value = true\n  panel.value.focus() // the panel isn't rendered yet!\n}`, lang: 'js' },
      right: { code: `async function open() {\n  isOpen.value = true\n  await nextTick()\n  panel.value.focus()\n}`, lang: 'js' },
      explanation: 'With `v-if`, the dialog does not exist until Vue patches the DOM. Focusing before `nextTick()` does nothing, so keyboard and screen-reader users stay on the page behind the dialog without knowing it opened.',
    },
    {
      title: 'Every tab is a Tab stop',
      wrong: { code: `<button v-for="tab in tabs" role="tab" :aria-selected="tab.id === current">…</button>`, lang: 'vue' },
      right: { code: `<button v-for="(tab, i) in tabs" role="tab"\n        :aria-selected="i === selected"\n        :tabindex="i === selected ? 0 : -1"\n        @keydown="onKeydown($event, i)">…</button>`, lang: 'vue' },
      explanation: 'A tab list is a single Tab stop: Tab enters on the selected tab, arrow keys move between tabs, the next Tab goes to the panel. Without the roving `tabindex` and arrow keys, the roles promise behaviour that is not there.',
    },
    {
      title: 'A toast that steals focus',
      wrong: { code: `showToast(msg)\nawait nextTick()\ntoastEl.value.focus() // yanks the user out of the form`, lang: 'js' },
      right: { code: `// Announce through a persistent live region; leave focus alone\nannouncement.value = msg`, lang: 'js' },
      explanation: 'Moving focus interrupts whatever the user was doing and, when the toast disappears, leaves focus nowhere. A polite live region announces the message without disturbing focus.',
    },
    {
      title: 'Hiding the background with `aria-hidden` on an ancestor of the dialog',
      wrong: { code: `<div id="app" :aria-hidden="modalOpen">\n  …\n  <ModalDialog />  <!-- inside #app: hidden too! -->\n</div>`, lang: 'vue' },
      right: { code: `<Teleport to="body">\n  <ModalDialog />  <!-- outside #app -->\n</Teleport>\n<!-- while open: document.getElementById('app').inert = true -->`, lang: 'vue' },
      explanation: '`aria-hidden` and `inert` apply to the whole subtree. If the dialog lives inside the hidden element, it disappears from assistive tech too. Render it outside (Teleport) before making the rest inert.',
    },
  ],

  debugging: [
    {
      symptom: 'Pressing Tab in the open dialog moves focus to links behind the backdrop.',
      cause: 'No focus trap, or the trap\'s focusable list misses elements (e.g. slotted content added later).',
      fix: 'Trap Tab/Shift+Tab at the edges, query focusables at key-press time (not once on open), and/or set `inert` on the background content.',
    },
    {
      symptom: 'After closing the dialog, Tab starts from the top of the page.',
      cause: 'Focus was inside the dialog when it unmounted and nothing restored it — or the stored trigger is `<body>` (Safari mouse click) or was removed.',
      fix: 'Store the opener before opening and focus it on close; accept an explicit return target; fall back to a heading or the next item when the trigger is gone.',
    },
    {
      symptom: 'Arrow keys move between tabs but the page also scrolls (Home/End or arrows).',
      cause: 'The key handler does not call `event.preventDefault()`.',
      fix: 'Call `preventDefault()` only for keys the widget handles; let all other keys through.',
    },
    {
      symptom: 'Arrow-key navigation jumps to the wrong menu item after the list re-renders.',
      cause: 'The items were collected with `ref="items"` in `v-for`, whose array order is not guaranteed to match the source order.',
      fix: 'Use a function ref with the index: `:ref="(el) => (itemEls[i] = el)"`.',
    },
    {
      symptom: 'Screen readers read "Project deleted Dismiss notification button" for every toast — or nothing at all.',
      cause: 'Buttons live inside an atomic `role="status"` region, or the region is created together with the message.',
      fix: 'Keep one persistent, visually hidden announcer with only the message text; render the visual toasts (with buttons) outside it.',
    },
    {
      symptom: '`showModal is not a function` in unit tests.',
      cause: 'jsdom does not implement `HTMLDialogElement.showModal()`/`close()`.',
      fix: 'Run dialog behaviour tests in a real browser (component or E2E runner), stub the methods in unit tests, or use a `role="dialog"` implementation.',
    },
  ],

  bestPractices: [
    'Start from the APG pattern for the widget and implement every clause: roles, states, keys and focus.',
    'Use native elements where they exist: `<dialog>`, `<details>`, `<select>`, `<button>`.',
    'Give every dialog a name (`aria-labelledby` its heading) and, for confirmations, a description (`aria-describedby`).',
    'Move focus into a dialog after `nextTick()`; trap it; close on Escape; return it to the opener or a logical fallback.',
    'Composite widgets (tabs, menus) are one Tab stop: roving `tabindex` plus arrow keys, Home and End.',
    'Use the disclosure pattern for navigation dropdowns and the menu-button pattern for action menus.',
    'Announce toasts through one persistent polite live region; never move focus to a toast; pause timers on hover and focus.',
    'Generate all relationship ids with `useId()` (3.5+) so components can be rendered many times on one page.',
    'Test with keys and `document.activeElement`, then confirm with a real screen reader.',
  ],

  useCases: [
    'Confirmation dialogs for destructive actions (delete, cancel subscription).',
    'Product pages and settings screens with tabs.',
    'Row actions in tables ("⋯" menu with Edit, Duplicate, Archive).',
    'Header navigation with expandable link groups (disclosure).',
    '"Saved", "Copied to clipboard" and "Item added to cart" toasts.',
    'A shared `<TextField>` / `<FormField>` used by every form in the app.',
  ],

  whenToUse: {
    use: [
      'A modal dialog when the user must respond before continuing (confirmations, short focused tasks).',
      'Tabs to switch between sibling views of the same object, where only one is visible at a time.',
      'A menu button for a short list of commands acting on something.',
      'A toast for brief, non-critical confirmations that need no action.',
    ],
    avoid: [
      'Modals for long, multi-step content or anything users need to compare with the page behind — use a page or a non-modal panel.',
      'Tabs for sequential steps (use a stepper) or for navigation between pages (use links with `aria-current`).',
      '`role="menu"` for navigation links — use a disclosure.',
      'Toasts for errors that need action or information users must not miss — show it inline or in an alert.',
    ],
  },

  comparison: {
    title: 'The patterns at a glance',
    headers: ['', 'Modal dialog', 'Tabs', 'Menu button', 'Disclosure', 'Toast'],
    rows: [
      ['Key roles / attributes', '`role="dialog"`, `aria-modal`, `aria-labelledby`', '`tablist`, `tab`, `tabpanel`, `aria-selected`, `aria-controls`', '`aria-haspopup`, `aria-expanded`, `menu`, `menuitem`', 'button with `aria-expanded`, `aria-controls`', '`role="status"` (or `alert` for urgent)'],
      ['Keyboard', 'Tab/Shift+Tab trapped, Escape closes', '←/→ (or ↑/↓ when vertical), Home, End', 'Enter/Space/↓ open; ↑/↓ move; Escape closes', 'Enter/Space toggle; links in normal Tab order', 'none — it is not interactive by itself'],
      ['Focus', 'moves in on open, returns on close', 'one Tab stop (roving tabindex)', 'moves into menu; returns to button', 'stays on the button', 'never moves'],
      ['Native alternative', '`<dialog>` + `showModal()`', 'none', 'none (`<select>` only for choosing a value)', '`<details>` / `<summary>`', 'none'],
    ],
    note: 'Full keyboard tables live in the APG pattern pages linked in Docs.',
  },

  quiz: [
    {
      id: 'accessible-components-q1',
      type: 'mcq',
      prompt: 'Focus is on the selected tab in an APG-style tab list. What does pressing **Tab** do?',
      options: [
        { text: 'Moves focus to the next tab', why: 'That is what the arrow keys do. The tab list is one Tab stop.' },
        { text: 'Moves focus out of the tab list, typically into the active tab panel' },
        { text: 'Selects the next tab without moving focus', why: 'Tab never changes the selection in this pattern.' },
        { text: 'Nothing — focus is trapped in the tab list', why: 'Only modal dialogs trap focus.' },
      ],
      answer: 1,
      explanation: 'Arrow keys move between tabs; Tab leaves the tab list. That is why only the selected tab has `tabindex="0"` and the panel often has `tabindex="0"` too.',
    },
    {
      id: 'accessible-components-q2',
      type: 'output',
      prompt: 'Three tabs use a roving tabindex. `selected` is `1`. What are the `tabindex` values of the tabs, in order?',
      code: {
        lang: 'vue',
        code: `<button v-for="(tab, i) in tabs" :key="tab.id" role="tab"
        :aria-selected="i === selected"
        :tabindex="i === selected ? 0 : -1">{{ tab.label }}</button>`,
      },
      options: [
        { text: '`-1, 0, -1`' },
        { text: '`0, 1, 2`', why: 'Increasing values would create a positive tabindex order — the opposite of a single Tab stop.' },
        { text: '`0, 0, 0`', why: 'Then every tab would be a Tab stop; arrow keys would be pointless.' },
        { text: '`-1, -1, -1`', why: 'Then keyboard users could not Tab into the tab list at all.' },
      ],
      answer: 0,
      explanation: 'Only the selected tab is in the Tab order (`0`); the others are reachable with arrow keys (`-1`).',
    },
    {
      id: 'accessible-components-q3',
      type: 'bug',
      prompt: 'Confirmation toasts are often not announced by screen readers. Click the line responsible.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { toasts } from './toasts.js'
</script>

<template>
  <div v-if="toasts.length" class="toast-stack" role="status">
    <p v-for="t in toasts" :key="t.id">{{ t.message }}</p>
  </div>
</template>`,
      },
      answerLine: 6,
      explanation: 'The live region is created with `v-if` at the same moment as its first message. Screen readers announce changes to regions they already track — render the region unconditionally.',
    },
    {
      id: 'accessible-components-q4',
      type: 'fill',
      prompt: 'Complete the attributes of a custom modal dialog panel.',
      code: {
        lang: 'vue',
        code: `<div ref="panel" role="___" aria-___="true" :aria-labelledby="titleId" tabindex="-1">
  <h2 :id="titleId">Delete project?</h2>
</div>`,
      },
      answer: [['dialog', 'alertdialog'], ['modal']],
      explanation: '`role="dialog"` (or `alertdialog` for urgent confirmations) plus `aria-modal="true"` marks a modal dialog; `aria-labelledby` names it from its heading.',
    },
    {
      id: 'accessible-components-q5',
      type: 'mcq',
      prompt: 'Your site header has a "Shop" button that reveals five category **links**. Which pattern fits best?',
      options: [
        { text: 'Disclosure: a button with `aria-expanded` and `aria-controls` showing a plain list of links' },
        { text: 'Menu button: `aria-haspopup="menu"` and `role="menuitem"` links', why: 'Menus are for application-style actions; they change keyboard behaviour in ways users do not expect for site navigation.' },
        { text: 'Tabs: one tab per category', why: 'Tabs switch panels within a page; these are links to other pages.' },
        { text: 'A modal dialog listing the links', why: 'Far too heavy: it traps focus and blocks the page for a simple navigation choice.' },
      ],
      answer: 0,
      explanation: 'The disclosure pattern keeps links as normal links in the Tab order and only adds `aria-expanded` to the toggle button.',
    },
    {
      id: 'accessible-components-q6',
      type: 'short',
      prompt: 'Why must focus return to the trigger (or a sensible fallback) when a modal dialog closes?',
      answer: 'When the dialog unmounts, the focused element inside it disappears and focus falls back to the document, so keyboard and screen-reader users lose their place and must navigate from the top again. Returning focus to the trigger lets them continue exactly where they were; if the trigger was removed (e.g. the row was deleted), move focus to the next logical element instead.',
    },
  ],

  exercises: [
    {
      id: 'accessible-tabs',
      title: 'Keyboard-accessible tabs',
      difficulty: 'intermediate',
      prompt: `
These tabs only work with a mouse. Implement the APG tabs pattern (automatic activation):

- The \`.tablist\` element has \`role="tablist"\` and an \`aria-label\` (e.g. "Product information").
- Each \`button.tab\` has \`type="button"\`, \`role="tab"\`, a unique \`id\`, \`aria-selected\` (\`"true"\` / \`"false"\`), \`aria-controls\` pointing at its panel, and \`tabindex\` **0** when selected, **-1** otherwise.
- Render **one \`.panel\` per tab** with \`role="tabpanel"\`, a unique \`id\`, \`aria-labelledby\` pointing at its tab, and \`tabindex="0"\`. Only the selected panel is visible (use \`v-show\` or \`hidden\`).
- On a tab, **ArrowRight** / **ArrowLeft** select the next / previous tab (wrapping around) and move focus to it. **Home** / **End** go to the first / last tab.
- Clicking a tab still selects it.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const tabs = [
  { id: 'details', label: 'Details', content: 'Lightweight trail shoe with a 6 mm drop.' },
  { id: 'sizes', label: 'Sizes', content: 'Available in EU sizes 36 to 47.' },
  { id: 'care', label: 'Care', content: 'Hand wash cold. Air dry away from heaters.' },
]
const selected = ref(0)
</script>

<template>
  <div class="tabs">
    <div class="tablist">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: i === selected }"
        @click="selected = i"
      >
        {{ tab.label }}
      </button>
    </div>
    <div class="panel">{{ tabs[selected].content }}</div>
  </div>
</template>

<style scoped>
.tablist { display: flex; gap: 0.25rem; border-bottom: 2px solid #767676; }
.tab { padding: 0.5rem 1rem; border: 0; background: none; cursor: pointer; }
.tab.active { border-bottom: 3px solid #1d4ed8; font-weight: 700; }
.panel { padding: 1rem 0; }
</style>`,
      },
      hints: [
        'Generate ids with `const baseId = useId()` (3.5+): tab id `baseId + \'-tab-\' + tab.id`, panel id `baseId + \'-panel-\' + tab.id`. Render the panels with their own `v-for` and `v-show="i === selected"`.',
        'Collect tab elements with a function ref, `:ref="(el) => (tabEls[i] = el)"`, because array refs in `v-for` are not guaranteed to be in order.',
        'Add `@keydown="onKeydown($event, i)"`. Map ArrowRight → `(i + 1) % tabs.length`, ArrowLeft → `(i - 1 + tabs.length) % tabs.length`, Home → 0, End → last; for those keys call `event.preventDefault()`, set `selected` and `tabEls[next].focus()`.',
      ],
      solution: {
        explanation: 'The tab list is one Tab stop: only the selected tab has `tabindex="0"`. Arrow keys move real DOM focus (roving tabindex) and, with automatic activation, also select. Every relationship is expressed with ids — `aria-controls` from tab to panel and `aria-labelledby` from panel back to tab — generated by `useId()` so two tab sets on one page never clash. Tabs already exist in the DOM, so focusing them needs no `nextTick()`.',
        files: {
          'App.vue': `<script setup>
import { ref, useId } from 'vue'

const tabs = [
  { id: 'details', label: 'Details', content: 'Lightweight trail shoe with a 6 mm drop.' },
  { id: 'sizes', label: 'Sizes', content: 'Available in EU sizes 36 to 47.' },
  { id: 'care', label: 'Care', content: 'Hand wash cold. Air dry away from heaters.' },
]
const selected = ref(0)
const baseId = useId()
const tabEls = []

const tabId = (tab) => baseId + '-tab-' + tab.id
const panelId = (tab) => baseId + '-panel-' + tab.id

function onKeydown(event, index) {
  const last = tabs.length - 1
  const next = {
    ArrowRight: index === last ? 0 : index + 1,
    ArrowLeft: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  selected.value = next
  tabEls[next]?.focus()
}
</script>

<template>
  <div class="tabs">
    <div class="tablist" role="tablist" aria-label="Product information">
      <button
        v-for="(tab, i) in tabs"
        :key="tab.id"
        :ref="(el) => (tabEls[i] = el)"
        :id="tabId(tab)"
        type="button"
        role="tab"
        class="tab"
        :class="{ active: i === selected }"
        :aria-selected="i === selected"
        :aria-controls="panelId(tab)"
        :tabindex="i === selected ? 0 : -1"
        @click="selected = i"
        @keydown="onKeydown($event, i)"
      >
        {{ tab.label }}
      </button>
    </div>
    <div
      v-for="(tab, i) in tabs"
      v-show="i === selected"
      :key="tab.id"
      :id="panelId(tab)"
      class="panel"
      role="tabpanel"
      :aria-labelledby="tabId(tab)"
      tabindex="0"
    >
      {{ tab.content }}
    </div>
  </div>
</template>

<style scoped>
.tablist { display: flex; gap: 0.25rem; border-bottom: 2px solid #767676; }
.tab { padding: 0.5rem 1rem; border: 0; background: none; cursor: pointer; }
.tab.active { border-bottom: 3px solid #1d4ed8; font-weight: 700; }
.panel { padding: 1rem 0; }
</style>`,
        },
      },
      tests: [
        {
          name: 'tablist and tabs have the right roles',
          code: `expect(attr('.tablist', 'role')).toBe('tablist')
expect((attr('.tablist', 'aria-label') || '').length).toBeGreaterThan(0)
const tabs = findAll('.tab')
expect(tabs).toHaveLength(3)
for (const t of tabs) { expect(t.getAttribute('role')).toBe('tab'); expect(t.getAttribute('type')).toBe('button') }`,
        },
        {
          name: 'only the selected tab is selected and in the Tab order',
          code: `const tabs = findAll('.tab')
expect(tabs.map((t) => t.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false'])
expect(tabs.map((t) => t.getAttribute('tabindex'))).toEqual(['0', '-1', '-1'])`,
        },
        {
          name: 'tabs and panels reference each other; only the selected panel is visible',
          code: `const tabs = findAll('.tab')
const ids = new Set(tabs.map((t) => t.id))
expect(ids.size).toBe(3)
expect(findAll('[role="tabpanel"]')).toHaveLength(3)
tabs.forEach((t, i) => {
  const panel = document.getElementById(t.getAttribute('aria-controls'))
  expect(Boolean(panel)).toBe(true)
  expect(panel.getAttribute('role')).toBe('tabpanel')
  expect(panel.getAttribute('aria-labelledby')).toBe(t.id)
  expect(panel.getAttribute('tabindex')).toBe('0')
  expect(isVisible(panel)).toBe(i === 0)
})`,
        },
        {
          name: 'ArrowRight selects and focuses the next tab',
          code: `let tabs = findAll('.tab')
tabs[0].focus()
await trigger(tabs[0], 'keydown', { key: 'ArrowRight' })
tabs = findAll('.tab')
expect(document.activeElement).toBe(tabs[1])
expect(tabs[1].getAttribute('aria-selected')).toBe('true')
expect(tabs[1].getAttribute('tabindex')).toBe('0')
expect(tabs[0].getAttribute('tabindex')).toBe('-1')
expect(text('[role="tabpanel"]:not([style*="none"]):not([hidden])')).toContain('EU sizes')`,
        },
        {
          name: 'ArrowLeft wraps from first to last; Home and End jump',
          code: `let tabs = findAll('.tab')
tabs[0].focus()
await trigger(tabs[0], 'keydown', { key: 'ArrowLeft' })
tabs = findAll('.tab')
expect(document.activeElement).toBe(tabs[2])
expect(tabs[2].getAttribute('aria-selected')).toBe('true')
await trigger(tabs[2], 'keydown', { key: 'Home' })
expect(document.activeElement).toBe(findAll('.tab')[0])
await trigger(findAll('.tab')[0], 'keydown', { key: 'End' })
expect(document.activeElement).toBe(findAll('.tab')[2])`,
        },
        {
          name: 'clicking a tab still selects it',
          code: `await click(findAll('.tab')[2])
expect(findAll('.tab')[2].getAttribute('aria-selected')).toBe('true')
expect(isVisible(document.getElementById(findAll('.tab')[2].getAttribute('aria-controls')))).toBe(true)`,
        },
      ],
    },
    {
      id: 'accessible-menu-button',
      title: 'An actions menu button',
      difficulty: 'advanced',
      prompt: `
Turn this click-only "Actions" dropdown into an APG **menu button**:

- \`button.menu-trigger\`: \`type="button"\`, \`aria-haspopup="menu"\`, \`aria-controls\` = the menu's id, and \`aria-expanded="true"\` while open (when closed it must not be \`"true"\` — \`"false"\` or absent are both fine).
- When open, render \`ul.menu\` with \`role="menu"\`; each \`li.menu-item\` has \`role="menuitem"\` and \`tabindex="-1"\`. When closed, the menu is not rendered (or hidden).
- **Click** on the trigger (or **ArrowDown** on it) opens the menu and focuses the **first** item. **ArrowUp** on the trigger opens it and focuses the **last** item.
- Inside the menu, **ArrowDown** / **ArrowUp** move focus to the next / previous item, wrapping around. **Home** / **End** go to the first / last item.
- **Escape** closes the menu and returns focus to the trigger.
- **Enter** (or a click) on an item runs it: \`.last-action\` shows **"Last action: <label>"**, the menu closes and focus returns to the trigger.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const actions = ['Duplicate', 'Rename', 'Archive']
const open = ref(false)
const lastAction = ref('none')

function run(action) {
  lastAction.value = action
  open.value = false
}
</script>

<template>
  <div class="menu-wrap">
    <button class="menu-trigger" @click="open = !open">Actions ▾</button>
    <ul v-if="open" class="menu">
      <li v-for="action in actions" :key="action" class="menu-item" @click="run(action)">
        {{ action }}
      </li>
    </ul>
  </div>
  <p class="last-action">Last action: {{ lastAction }}</p>
</template>

<style scoped>
.menu-wrap { position: relative; display: inline-block; }
.menu { position: absolute; margin: 0.25rem 0 0; padding: 0.25rem; list-style: none; background: #fff; border: 1px solid #767676; border-radius: 8px; min-width: 10rem; }
.menu-item { padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer; }
.menu-item:focus { outline: 3px solid #1d4ed8; }
</style>`,
      },
      hints: [
        'Keep `open` and two ids from `useId()`. Bind `:aria-expanded="open"`, `:aria-controls="menuId"` and `aria-haspopup="menu"` on the trigger; give the `<ul>` `:id="menuId"` and `role="menu"`.',
        'Write `async openMenu(index)`: set `open`, `await nextTick()` (the menu is rendered by `v-if`), then focus `itemEls[index]`. Collect items with `:ref="(el) => (itemEls[i] = el)"`. Click → `openMenu(0)`; trigger keydown ArrowDown → `openMenu(0)`, ArrowUp → `openMenu(actions.length - 1)`.',
        'On each item, handle `@keydown` with the index: ArrowDown/ArrowUp/Home/End compute the next index and focus it (`preventDefault()`), Escape and Enter close the menu (Enter also sets `lastAction`) and then `trigger.value.focus()`.',
      ],
      solution: {
        explanation: 'The menu button combines a disclosure-like trigger (`aria-expanded`) with a composite widget: only the focused item matters, and arrow keys move real focus between `menuitem`s with `tabindex="-1"`. Because the menu is rendered with `v-if`, focusing an item must wait for `nextTick()`. Closing — by Escape or by choosing an item — always sends focus back to the trigger so keyboard users keep their place. A production version would also close on Tab and on clicks outside, and support type-ahead.',
        files: {
          'App.vue': `<script setup>
import { ref, nextTick, useId } from 'vue'

const actions = ['Duplicate', 'Rename', 'Archive']
const open = ref(false)
const lastAction = ref('none')
const trigger = ref(null)
const itemEls = []
const triggerId = useId()
const menuId = useId()

async function openMenu(index) {
  open.value = true
  await nextTick()
  itemEls[index]?.focus()
}

function closeMenu() {
  open.value = false
  trigger.value?.focus()
}

function run(action) {
  lastAction.value = action
  closeMenu()
}

function onTriggerKeydown(event) {
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    openMenu(0)
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    openMenu(actions.length - 1)
  }
}

function onItemKeydown(event, index) {
  const last = actions.length - 1
  const moves = {
    ArrowDown: index === last ? 0 : index + 1,
    ArrowUp: index === 0 ? last : index - 1,
    Home: 0,
    End: last,
  }
  if (event.key in moves) {
    event.preventDefault()
    itemEls[moves[event.key]]?.focus()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu()
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    run(actions[index])
  } else if (event.key === 'Tab') {
    open.value = false // let Tab move on naturally
  }
}
</script>

<template>
  <div class="menu-wrap">
    <button
      :id="triggerId"
      ref="trigger"
      type="button"
      class="menu-trigger"
      aria-haspopup="menu"
      :aria-expanded="open"
      :aria-controls="menuId"
      @click="open ? closeMenu() : openMenu(0)"
      @keydown="onTriggerKeydown"
    >
      Actions <span aria-hidden="true">▾</span>
    </button>
    <ul v-if="open" :id="menuId" class="menu" role="menu" :aria-labelledby="triggerId">
      <li
        v-for="(action, i) in actions"
        :key="action"
        :ref="(el) => (itemEls[i] = el)"
        class="menu-item"
        role="menuitem"
        tabindex="-1"
        @click="run(action)"
        @keydown="onItemKeydown($event, i)"
      >
        {{ action }}
      </li>
    </ul>
  </div>
  <p class="last-action">Last action: {{ lastAction }}</p>
</template>

<style scoped>
.menu-wrap { position: relative; display: inline-block; }
.menu { position: absolute; margin: 0.25rem 0 0; padding: 0.25rem; list-style: none; background: #fff; border: 1px solid #767676; border-radius: 8px; min-width: 10rem; }
.menu-item { padding: 0.4rem 0.6rem; border-radius: 4px; cursor: pointer; }
.menu-item:focus { outline: 3px solid #1d4ed8; }
</style>`,
        },
      },
      tests: [
        {
          name: 'the trigger advertises a closed menu',
          code: `expect(attr('.menu-trigger', 'type')).toBe('button')
expect(attr('.menu-trigger', 'aria-haspopup')).toBe('menu')
expect(attr('.menu-trigger', 'aria-expanded') === 'true').toBe(false)
expect(isVisible('[role="menu"]')).toBe(false)`,
        },
        {
          name: 'click opens the menu and focuses the first item',
          code: `await click('.menu-trigger')
await flush()
expect(attr('.menu-trigger', 'aria-expanded')).toBe('true')
const menu = find('[role="menu"]')
expect(Boolean(menu) && isVisible(menu)).toBe(true)
expect(attr('.menu-trigger', 'aria-controls')).toBe(menu.id)
const items = findAll('.menu-item')
for (const it of items) { expect(it.getAttribute('role')).toBe('menuitem'); expect(it.getAttribute('tabindex')).toBe('-1') }
expect(document.activeElement).toBe(items[0])`,
        },
        {
          name: 'ArrowDown / ArrowUp move between items and wrap',
          code: `await click('.menu-trigger')
await flush()
let items = findAll('.menu-item')
await trigger(items[0], 'keydown', { key: 'ArrowDown' })
expect(document.activeElement).toBe(findAll('.menu-item')[1])
await trigger(findAll('.menu-item')[1], 'keydown', { key: 'ArrowDown' })
await trigger(findAll('.menu-item')[2], 'keydown', { key: 'ArrowDown' })
expect(document.activeElement).toBe(findAll('.menu-item')[0])
await trigger(findAll('.menu-item')[0], 'keydown', { key: 'ArrowUp' })
expect(document.activeElement).toBe(findAll('.menu-item')[2])`,
        },
        {
          name: 'ArrowUp on the trigger opens with the last item focused',
          code: `find('.menu-trigger').focus()
await trigger('.menu-trigger', 'keydown', { key: 'ArrowUp' })
await flush()
const items = findAll('.menu-item')
expect(items.length).toBe(3)
expect(document.activeElement).toBe(items[2])`,
        },
        {
          name: 'Escape closes and returns focus to the trigger',
          code: `await click('.menu-trigger')
await flush()
await trigger(findAll('.menu-item')[0], 'keydown', { key: 'Escape' })
expect(isVisible('[role="menu"]')).toBe(false)
expect(attr('.menu-trigger', 'aria-expanded') === 'true').toBe(false)
expect(document.activeElement).toBe(find('.menu-trigger'))`,
        },
        {
          name: 'Enter on an item runs it, closes the menu and refocuses the trigger',
          code: `await click('.menu-trigger')
await flush()
await trigger(findAll('.menu-item')[1], 'keydown', { key: 'Enter' })
expect(text('.last-action')).toBe('Last action: Rename')
expect(isVisible('[role="menu"]')).toBe(false)
expect(document.activeElement).toBe(find('.menu-trigger'))`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'accessible-components-aria-modal',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `aria-modal="true"` do — and what doesn\'t it do?',
      answer: 'It tells assistive technology that the dialog is modal, so content outside it should be treated as unavailable; some screen readers then restrict their reading cursor to the dialog. It does **not** trap keyboard focus, block mouse interaction or make the background inert, and support varies between screen reader/browser combinations. You still need a focus trap and ideally `inert` on the background — or use native `<dialog>` with `showModal()`, which makes the rest of the page inert for you.',
      explanation: 'ARIA changes what is announced, never behaviour. Modality has to be implemented in the DOM and in keyboard handling.',
      whyAsked: 'Separates people who copy attributes from people who understand that ARIA is semantics, not behaviour.',
      mistakes: ['Saying it traps focus.', 'Saying it makes the background unclickable.', 'Never mentioning `inert` or native `<dialog>`.'],
      followUps: ['How would you make the background inert in a Vue app?', 'Why does Teleport help here?'],
      modelAnswer: '`aria-modal="true"` is a hint to assistive tech that everything outside the dialog is unavailable, so a screen reader may limit its virtual cursor to the dialog. It doesn\'t trap Tab, doesn\'t block the mouse and isn\'t supported identically everywhere. So I pair it with a focus trap and Escape handling, and I teleport the dialog to `body` and set `inert` on the app root while it\'s open. If I can use native `<dialog>` with `showModal()`, I get inertness and the top layer for free.',
    },
    {
      id: 'accessible-components-native-dialog',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Which statement about native `<dialog>` opened with `showModal()` versus a custom `role="dialog"` component is correct?',
      options: [
        'Native `<dialog>` needs `role="dialog"` and a manual focus trap to be modal',
        '`showModal()` renders the dialog in the top layer and makes the rest of the document inert; Escape closes it',
        'A custom `role="dialog"` div is automatically inert-aware once `aria-modal` is set',
        'Native `<dialog>` cannot be styled, so design systems must use custom dialogs',
      ],
      correctOption: 1,
      answer: '`showModal()` puts the dialog in the top layer (above all other content, no `z-index` battles), makes everything else inert, closes on Escape (firing `cancel` and `close` events) and handles initial focus. A custom dialog must implement all of that itself.',
      explanation: 'Native `<dialog>` already has the dialog role and can be fully styled, including `::backdrop`. `aria-modal` on a custom div only changes announcements; it doesn\'t make anything inert.',
      whyAsked: 'Modern browsers changed the trade-off; interviewers want to see current knowledge rather than habits.',
      mistakes: ['Believing native dialogs cannot be styled.', 'Assuming `aria-modal` makes the page inert.', 'Ignoring the testing limitation (jsdom has no `showModal`).'],
      followUps: ['How do you test a native dialog when your unit-test DOM doesn\'t support it?', 'What does `<form method="dialog">` do?'],
      modelAnswer: 'With `showModal()` the browser does the heavy lifting: the dialog goes into the top layer, the rest of the document becomes inert, Escape fires `cancel` and closes it, and initial focus is handled. It still needs an accessible name via `aria-labelledby`. A custom `role="dialog"` must implement the trap, Escape, inertness and focus restore manually. I default to native, and test it in a real browser because jsdom doesn\'t implement `showModal`.',
    },
    {
      id: 'accessible-components-roving',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'Explain roving tabindex and `aria-activedescendant`. When would you choose each?',
      answer: 'Both make a composite widget a single Tab stop. With **roving tabindex**, the active item has `tabindex="0"` and the rest `-1`; arrow keys move real DOM focus between items. With **`aria-activedescendant`**, DOM focus stays on a container (or an input), which references the id of the "active" item; you move a highlight and update the attribute. Roving tabindex is simpler and works well for tabs, toolbars and menus. `aria-activedescendant` suits widgets where focus must stay in a text input — like a combobox with a listbox of suggestions.',
      explanation: 'One moves focus; the other moves a pointer to the focused-looking item while real focus stays put.',
      whyAsked: 'A deep-knowledge question for engineers building design-system components.',
      mistakes: ['Not knowing either technique.', 'Using `aria-activedescendant` with ids that don\'t exist in the DOM.', 'Forgetting to scroll the active option into view in long lists.'],
      followUps: ['How would you implement type-ahead in a menu?', 'Why does a combobox keep focus in the input?'],
      modelAnswer: 'Composite widgets should be one Tab stop with arrow keys inside. Roving tabindex does that by giving only the active item `tabindex="0"` and moving real focus with the arrows — straightforward and robust, so I use it for tabs and menus. `aria-activedescendant` keeps focus on one element and points at the active child\'s id, which is what a combobox needs because the user keeps typing in the input. Either way I make sure the visual highlight and the programmatic state always agree.',
    },
    {
      id: 'accessible-components-menu-nav-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Screen-reader users complain the main navigation "behaves strangely": Tab skips the links and arrow keys do odd things. The code uses this. What\'s wrong?',
      code: {
        lang: 'vue',
        code: `<nav>
  <button aria-haspopup="menu" :aria-expanded="open" @click="open = !open">Shop</button>
  <ul v-if="open" role="menu">
    <li v-for="c in categories" :key="c.slug" role="menuitem">
      <RouterLink :to="'/shop/' + c.slug">{{ c.name }}</RouterLink>
    </li>
  </ul>
</nav>`,
      },
      answer: 'It uses the ARIA menu pattern for navigation links. `role="menu"` promises application-menu behaviour (arrow-key navigation, one Tab stop, items as menuitems) and may switch screen readers into a different interaction mode, but none of that keyboard behaviour is implemented — and links shouldn\'t be menus anyway. Use the disclosure pattern: a `<button>` with `aria-expanded` and `aria-controls`, and a plain `<ul>` of links in normal Tab order. Add `aria-current="page"` on the current link.',
      explanation: 'Wrong ARIA is worse than none: it changes how assistive tech presents and navigates the content.',
      whyAsked: 'This exact bug is common in production navigation menus.',
      mistakes: ['Fixing it by adding arrow-key handlers instead of removing the menu roles.', 'Removing the button and making the dropdown hover-only.'],
      followUps: ['When is the menu-button pattern the right choice?', 'How would you close the disclosure when focus leaves it?'],
      modelAnswer: 'The markup promises an application menu but delivers a list of links with none of the menu keyboard behaviour. For site navigation the disclosure pattern is the right model: a real button with `aria-expanded` and `aria-controls`, and a plain list of links that stay in the normal Tab order. I\'d drop `role="menu"` and `role="menuitem"`, keep the links native, and mark the current page with `aria-current="page"`. I\'d reserve the menu-button pattern for action lists like Duplicate/Archive.',
    },
    {
      id: 'accessible-components-toast-scenario',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Design an accessible toast system for a Vue app. What are your rules?',
      answer: 'One persistent, visually hidden live region (`role="status"`, polite) mounted at app start — teleported to `body` — receives the message text; visual toasts render separately so their buttons are not read with each message. Never move focus to a toast. Auto-dismiss only non-essential messages, pause timers on hover and focus, and allow a generous duration or a way to review past notifications (WCAG 2.2.1 Timing Adjustable for time limits). Errors that need action go inline or in a `role="alert"` message, not in a vanishing toast. Toast actions (e.g. Undo) must also be available elsewhere or keyboard reachable before the toast disappears. Expose it as `useToast()` backed by a store or provide/inject.',
      explanation: 'Toasts are fragile by nature: brief, out of the reading flow and often timed. Accessibility means making the message perceivable without making it intrusive.',
      whyAsked: 'Shows whether a candidate can turn accessibility rules into a reusable system design.',
      mistakes: ['Creating a live region per toast with `v-if`.', 'Using `role="alert"` for every toast.', 'Putting the only Undo action inside a toast that disappears after a few seconds.'],
      followUps: ['How do you announce the same message twice in a row?', 'Where would you mount the region in a Nuxt or SSR app?'],
      modelAnswer: 'I\'d mount one polite live region at app start and route every toast message through it, while the visible toasts render outside it with their dismiss buttons. Toasts never take focus. Timers pause on hover and focus, durations are generous, and anything important or actionable is also shown inline or kept in a notification list, because disappearing content runs into WCAG timing requirements. Urgent errors use `role="alert"` or inline messages instead. The API is a `useToast()` composable backed by a small store so any component can call it.',
    },
    {
      id: 'accessible-components-text-field',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: '`TextField.vue` renders a label, input, optional hint and optional error, but nothing is connected. Wire it up so it works when rendered many times on one page: the label names the input, the hint and error describe it, and the input reports `aria-invalid="true"` when there is an error.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import TextField from './TextField.vue'

const name = ref('')
const email = ref('')
const submitted = ref(false)
const emailError = computed(() =>
  submitted.value && !email.value.includes('@') ? 'Enter an email address like ada@example.com' : '',
)
</script>

<template>
  <form class="signup" @submit.prevent="submitted = true">
    <TextField v-model="name" label="Full name" class="name-field" />
    <TextField
      v-model="email"
      label="Email"
      hint="We only use it for receipts."
      :error="emailError"
      class="email-field"
    />
    <button class="submit">Sign up</button>
  </form>
</template>`,
          'TextField.vue': `<script setup>
const model = defineModel({ type: String, default: '' })

defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
</script>

<template>
  <div class="field">
    <label class="field-label">{{ label }}</label>
    <input v-model="model" class="field-input" />
    <p v-if="hint" class="field-hint">{{ hint }}</p>
    <p v-if="error" class="field-error">{{ error }}</p>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'each label names its own input (unique ids)',
          code: `const fields = findAll('.field')
expect(fields).toHaveLength(2)
const ids = fields.map((f) => {
  const input = f.querySelector('.field-input')
  const label = f.querySelector('.field-label')
  expect(input.id.length).toBeGreaterThan(0)
  expect(label.getAttribute('for')).toBe(input.id)
  return input.id
})
expect(new Set(ids).size).toBe(2)`,
        },
        {
          name: 'the hint describes the email input',
          code: `const input = find('.email-field .field-input')
const hint = find('.email-field .field-hint')
expect(hint.id.length).toBeGreaterThan(0)
expect((input.getAttribute('aria-describedby') || '').split(' ')).toContain(hint.id)`,
        },
        {
          name: 'no error: aria-invalid is not "true"',
          code: `expect(attr('.email-field .field-input', 'aria-invalid') === 'true').toBe(false)`,
        },
        {
          name: 'after an invalid submit: aria-invalid="true" and the error is described too',
          code: `await submit('.signup')
const input = find('.email-field .field-input')
const error = find('.email-field .field-error')
expect(Boolean(error)).toBe(true)
expect(input.getAttribute('aria-invalid')).toBe('true')
const described = (input.getAttribute('aria-describedby') || '').split(' ')
expect(described).toContain(error.id)
expect(described).toContain(find('.email-field .field-hint').id)`,
        },
      ],
      hints: [
        'Call `useId()` (Vue 3.5+) once and derive three ids: the input id, `id + \'-hint\'` and `id + \'-error\'`.',
        'Build `aria-describedby` with a computed: collect the hint id if there is a hint and the error id if there is an error, `join(\' \')`, and return `undefined` when empty so the attribute is removed.',
        'Bind `:aria-invalid="error ? \'true\' : undefined"`. Assign `defineProps()` to `const props` so the computed can read `props.hint` and `props.error`.',
      ],
      answer: 'Generate ids with `useId()`, link `<label for>` to the input `id`, compute `aria-describedby` from the ids of whichever hint/error elements are rendered, and bind `aria-invalid` from the error prop.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import TextField from './TextField.vue'

const name = ref('')
const email = ref('')
const submitted = ref(false)
const emailError = computed(() =>
  submitted.value && !email.value.includes('@') ? 'Enter an email address like ada@example.com' : '',
)
</script>

<template>
  <form class="signup" @submit.prevent="submitted = true">
    <TextField v-model="name" label="Full name" class="name-field" />
    <TextField
      v-model="email"
      label="Email"
      hint="We only use it for receipts."
      :error="emailError"
      class="email-field"
    />
    <button class="submit">Sign up</button>
  </form>
</template>`,
          'TextField.vue': `<script setup>
import { computed, useId } from 'vue'

const model = defineModel({ type: String, default: '' })

const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})

const id = useId()
const hintId = id + '-hint'
const errorId = id + '-error'

const describedBy = computed(() => {
  const ids = []
  if (props.hint) ids.push(hintId)
  if (props.error) ids.push(errorId)
  return ids.length ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="field">
    <label :for="id" class="field-label">{{ label }}</label>
    <input
      :id="id"
      v-model="model"
      class="field-input"
      :aria-invalid="error ? 'true' : undefined"
      :aria-describedby="describedBy"
    />
    <p v-if="hint" :id="hintId" class="field-hint">{{ hint }}</p>
    <p v-if="error" :id="errorId" class="field-error">{{ error }}</p>
  </div>
</template>`,
        },
      },
      explanation: 'Every relationship is an id reference, and `useId()` makes those ids unique per component instance (and SSR-safe). The computed `aria-describedby` only references elements that are actually rendered, so screen readers never follow a dangling id. See also [Accessible, reusable inputs](lesson:accessible-reusable-inputs).',
      whyAsked: 'Form fields are the most reused accessible component; the task checks id wiring, conditional ARIA and instance-safe ids.',
      mistakes: ['Hard-coding `id="email"` inside a reusable component.', 'Pointing `aria-describedby` at an error element that is not rendered.', 'Rendering `aria-invalid="false"` noise everywhere instead of removing it (allowed, but cleaner without).'],
      followUps: ['How would you move focus to the first invalid field on submit?', 'How would you let callers pass their own `id`?', 'What changes when the field is rendered on the server?'],
      modelAnswer: 'I generate one base id with `useId()` so every instance is unique, link the label with `for`, and derive the hint and error ids from it. A computed builds `aria-describedby` from whichever of hint and error is rendered and returns `undefined` when empty so Vue removes the attribute. `aria-invalid` is bound to the error. That gives "Email, edit text, invalid, We only use it for receipts, Enter an email address…" in a screen reader.',
    },
    {
      id: 'accessible-components-library-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team is starting a design system. Would you build accessible primitives (dialog, tabs, menu, combobox) yourselves or adopt a headless library? How would you structure and verify them?',
      answer: 'Weigh it honestly: a maintained headless library gives you implemented and battle-tested keyboard/focus/ARIA behaviour while you own the styling; building in-house gives full control but means owning every edge case (nested dialogs, scroll lock, screen-reader quirks) forever. Either way: separate behaviour from appearance (headless components or composables such as `useFocusTrap`, `useRovingTabindex`), keep a single implementation per pattern, expose accessible defaults (required `label` props, `useId()` wiring), document keyboard behaviour next to each component, and verify with keyboard-driven component tests, axe checks and manual screen-reader passes on each release.',
      explanation: 'The architectural goal is that the accessible path is the default path for every feature team.',
      whyAsked: 'Senior-level judgement: build vs buy, separation of concerns and verification strategy.',
      mistakes: ['Claiming a library makes an app accessible by itself.', 'Allowing each team to build its own dropdown.', 'No plan for testing with assistive technology.'],
      followUps: ['What would you put in a component\'s documentation page?', 'How would you prevent teams from bypassing the primitives?'],
      modelAnswer: 'I\'d start from the requirement that each pattern exists exactly once. Whether that comes from a headless library or our own code is a trade-off between control and the cost of owning every edge case — for complex widgets like comboboxes, a well-maintained headless library is usually worth evaluating. I\'d keep behaviour in headless components or composables and styling in our layer, require labels through props, wire ids with `useId()`, and document the keyboard contract per component. Verification is keyboard-driven component tests, axe in CI and a manual screen-reader pass before releases.',
    },
  ],

  takeaways: [
    'APG patterns are contracts of roles, states, keys and focus — implement every clause or users are misled.',
    'Modal dialog: name it, move focus in after `nextTick()`, trap Tab, close on Escape, return focus to the opener or a logical fallback. Native `<dialog>` + `showModal()` does much of this in real browsers.',
    'Tabs and menus are single Tab stops: roving `tabindex` plus arrow keys, Home and End.',
    'Action lists use the menu-button pattern; navigation dropdowns use the disclosure pattern.',
    'Toasts: one persistent polite live region, no focus stealing, pausable timers, nothing essential that disappears.',
    'Wire every label, description and control relationship with `useId()` (3.5+) ids so components can render many times.',
    'Test like a keyboard user: press keys, assert `document.activeElement` and ARIA states — then check with a screen reader.',
  ],
}
