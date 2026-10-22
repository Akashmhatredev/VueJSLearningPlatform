// Lesson: Component communication patterns

const ccApp = `<script setup>
import { ref, computed } from 'vue'
import SearchBar from './SearchBar.vue'
import NoteList from './NoteList.vue'
import NoteEditor from './NoteEditor.vue'

// App owns the shared state: every sibling reads it from here
const notes = ref([
  { id: 1, title: 'Groceries', body: 'Milk, eggs, bread' },
  { id: 2, title: 'Ideas', body: 'Learn Vue components' },
  { id: 3, title: 'Gym', body: 'Leg day' },
])
const query = ref('')
const selectedId = ref(1)

const visible = computed(() =>
  notes.value.filter((n) => n.title.toLowerCase().includes(query.value.toLowerCase()))
)
const selected = computed(() => notes.value.find((n) => n.id === selectedId.value))

function updateBody(body) {
  selected.value.body = body // the owner changes its own data
}
</script>

<template>
  <SearchBar v-model="query" />
  <div class="layout">
    <NoteList :notes="visible" :selected-id="selectedId" @select="(id) => (selectedId = id)" />
    <NoteEditor v-if="selected" :note="selected" @update:body="updateBody" />
  </div>
</template>

<style>
.layout { display: flex; gap: 16px; margin-top: 8px; }
</style>`

const searchBar = `<script setup>
const query = defineModel()
</script>

<template>
  <div class="search-bar">
    <input class="search" v-model="query" placeholder="Search notes…" />
  </div>
</template>`

const noteList = `<script setup>
import NoteListItem from './NoteListItem.vue'

defineProps({
  notes: { type: Array, required: true },
  selectedId: Number,
})
const emit = defineEmits(['select'])
</script>

<template>
  <ul class="note-list">
    <NoteListItem
      v-for="note in notes"
      :key="note.id"
      :note="note"
      :active="note.id === selectedId"
      @click="emit('select', note.id)"
    />
  </ul>
</template>

<style scoped>
.note-list { list-style: none; padding: 0; margin: 0; min-width: 140px; }
</style>`

const noteListItem = `<script setup>
defineProps({
  note: { type: Object, required: true },
  active: Boolean,
})
</script>

<template>
  <li class="note-item" :class="{ active }">{{ note.title }}</li>
</template>

<style scoped>
.note-item { padding: 4px 8px; cursor: pointer; border-radius: 6px; }
.note-item.active { background: #222; color: #fff; }
.note-item.dark { background: #333; color: #eee; }
</style>`

const noteEditor = `<script setup>
defineProps({ note: { type: Object, required: true } })
const emit = defineEmits(['update:body'])
</script>

<template>
  <section class="editor">
    <h3 class="editor-title">{{ note.title }}</h3>
    <textarea
      class="editor-body"
      :value="note.body"
      @input="emit('update:body', $event.target.value)"
    ></textarea>
  </section>
</template>`

const cartFiles = {
  'ProductGrid.vue': `<script setup>
defineProps({ products: { type: Array, required: true } })
const emit = defineEmits(['add'])
</script>

<template>
  <div class="grid">
    <div v-for="p in products" :key="p.id" class="product">
      {{ p.name }} — \${{ p.price }}
      <button class="add" @click="emit('add', p.id)">Add</button>
    </div>
  </div>
</template>`,
  'CartSummary.vue': `<script setup>
defineProps({
  count: { type: Number, required: true },
  total: { type: Number, required: true },
})
</script>

<template>
  <aside class="cart">
    <span class="cart-count">{{ count }} items</span>
    <span class="cart-total">\${{ total }}</span>
  </aside>
</template>`,
}

const themeShared = {
  'AppHeader.vue': `<script setup>
import ToolBar from './ToolBar.vue'
</script>

<template>
  <header class="app-header">
    <strong>Notes</strong>
    <ToolBar />
  </header>
</template>`,
  'ToolBar.vue': `<script setup>
import ThemeButton from './ThemeButton.vue'
</script>

<template>
  <nav class="toolbar">
    <ThemeButton />
  </nav>
</template>`,
}

const accordionApp = `<script setup>
import AccordionGroup from './AccordionGroup.vue'
import AccordionItem from './AccordionItem.vue'
</script>

<template>
  <AccordionGroup>
    <AccordionItem id="shipping" title="Shipping">Ships in 2 days.</AccordionItem>
    <AccordionItem id="returns" title="Returns">30-day returns.</AccordionItem>
    <AccordionItem id="warranty" title="Warranty">2-year warranty.</AccordionItem>
  </AccordionGroup>
</template>`

export default {
  id: 'component-communication',
  title: 'Component communication patterns',
  summary: 'Choose the right way for components to share data — props and events, v-model, slots, lifting state up, provide/inject, template refs, shared stores — and avoid the classic design mistakes.',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['props', 'emits', 'slots'],
  related: ['provide-inject', 'pinia-basics', 'why-state-management', 'setup-and-script-setup', 'composables-intro', 'design-patterns', 'router-basics'],
  tags: ['component communication', 'lifting state up', 'provide/inject', 'defineExpose', 'template refs', 'Pinia', 'event bus', 'prop drilling', 'siblings', 'design mistakes'],
  apis: [
    { name: 'provide() / inject()', summary: 'An ancestor provides a value; any descendant can inject it without passing props through every level.' },
    { name: 'defineExpose()', summary: 'Makes chosen methods/values of a `<script setup>` component available to a parent holding a template ref.' },
    { name: 'readonly()', summary: 'Wraps reactive state so consumers can read but not mutate it — useful when providing state.' },
  ],
  docs: [
    { label: 'Vue Guide — Provide / Inject', url: 'https://vuejs.org/guide/components/provide-inject.html' },
    { label: 'Vue Guide — State Management', url: 'https://vuejs.org/guide/scaling-up/state-management.html' },
    { label: 'Vue Guide — Template refs on components', url: 'https://vuejs.org/guide/essentials/template-refs.html#ref-on-component' },
    { label: 'Pinia — Introduction', url: 'https://pinia.vuejs.org/introduction.html' },
  ],

  intro: `
You've learned the individual tools: [props](lesson:props), [emits](lesson:emits), [component v-model](lesson:component-v-model), [slots](lesson:slots) and [scoped slots](lesson:scoped-slots). Real apps also need to connect **siblings**, **distant relatives**, and parts of the app that have nothing to do with each other.

This lesson is the map. For any "these two components need to share something" problem, you'll know the options — **lifting state up**, **provide/inject**, a **shared store**, **template refs with \`defineExpose\`**, the **URL** — and, just as important, which ones to avoid.

The guiding question is always the same: **who owns this data, and who needs it?**
`,

  why: `
Every Vue app eventually hits these situations:

- A search box and a results list are **siblings**. Typing in one must filter the other.
- A theme toggle buried in a toolbar must restyle panels **far away** in the tree.
- The logged-in user is needed by the header, the settings page and a dozen widgets.
- A parent needs to tell a child to **do something** ("focus your input", "reset").

Pick the wrong tool and you get familiar pain: props passed through five components that don't use them (*prop drilling*), copies of the same data drifting out of sync, events nobody can trace, or a global store full of one-off UI flags.

Pick the right one and data flow stays **visible**: you can point to where state lives and follow every change to it.
`,

  eli15: `
Think about how people share information in a school.

- A teacher hands a worksheet to a student, and the student raises a hand to answer → **props down, events up**.
- Two students at the same desk can't pass notes during class — so they both talk to the teacher, who keeps the shared list on the board → **lifting state up** to the common parent.
- The headteacher puts the rules on a noticeboard that any class in the building can read, without every teacher copying them → **provide/inject**.
- The school office keeps records everyone can request — attendance, timetables → a **store** (Pinia).
- Sometimes a teacher says to one particular student, "please close the window" → a **template ref** calling an exposed method.
- Shouting announcements down the corridor and hoping the right person hears → an **event bus**. It works until nobody knows who said what.
`,

  analogy: {
    title: 'How information moves around a school',
    body: `
Each way of passing information fits a particular distance and audience. Notes between neighbours, announcements for everyone, records kept in one office. When everyone uses the right channel, it's easy to find out where any piece of information came from.
`,
    mapping: [
      ['teacher hands out worksheets; students raise hands', 'props down, events up (parent ↔ child)'],
      ['two students share a list kept by their teacher', 'lifting state up to a common parent (siblings)'],
      ['the headteacher\'s noticeboard', 'provide/inject (an ancestor → any descendant)'],
      ['the school office records', 'a shared store such as Pinia (app-wide state)'],
      ['"please close the window, Sam"', 'template ref + `defineExpose` (parent calls a child method)'],
      ['shouting in the corridor', 'an event bus (hard to trace; avoid)'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'provide-inject' },
    title: 'provide/inject skips the middle',
    caption: 'An ancestor provides a value once; a deeply nested descendant injects it directly — the components in between never touch it. Click a component to see its code.',
    alt: 'An animated component tree: a top-level component provides a value; it travels past intermediate components (which are not involved) straight to a deeply nested component that injects it.',
  },

  animation: {
    type: 'component-flow',
    props: { mode: 'pinia' },
    title: 'A shared store for app-wide state',
    caption: 'Several components read and change the same store. When an action changes the state, every component that uses it updates — no matter where it sits in the tree.',
    alt: 'An animated diagram of several components in different parts of the tree connected to a single store box. One component calls an action; the store state changes and the components reading it update.',
  },

  syntax: [
    `
**The decision guide** — start at the top and stop at the first row that fits:

| Situation | Pattern | Direction |
|---|---|---|
| Parent gives data to a child | props | down |
| Child tells its parent something happened | emits | up |
| Child edits a value the parent owns | \`v-model\` / \`defineModel()\` | both (prop + event) |
| Parent supplies markup; child supplies data for it | slots / scoped slots | content in, data out |
| Siblings need the same data | **lift state up** to the nearest common parent | down to both, events up |
| Deep descendants need data from an ancestor (theme, form context, compound components) | **provide / inject** | ancestor → descendants |
| Many unrelated components need the same state (user, cart, settings) | **store** (Pinia) or a shared composable | any ↔ store |
| Parent must trigger an action in a child (focus, reset, play) | **template ref + \`defineExpose\`** | parent → child method |
| State should survive reloads / be shareable as a link (filters, tab, page) | **URL** (route params/query) | any ↔ URL |

**Lifting state up.** When two siblings need the same data, move it to their parent and wire both:
`,
    {
      code: `<!-- App.vue owns query; SearchBar edits it, ResultsList reads it -->
<script setup>
import { ref, computed } from 'vue'
const query = ref('')
const results = computed(() => items.filter((i) => i.name.includes(query.value)))
</script>

<template>
  <SearchBar v-model="query" />
  <ResultsList :items="results" />
</template>`,
      lang: 'vue',
      title: 'siblings share via their parent',
    },
    `
**provide / inject** — skip the middle layers. Provide a **ref** (so it stays reactive), and prefer exposing a function for changes:
`,
    {
      code: `<!-- ancestor -->
<script setup>
import { ref, readonly, provide } from 'vue'
const theme = ref('light')
function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
provide('theme', { theme: readonly(theme), toggleTheme })
</script>

<!-- any descendant, however deep -->
<script setup>
import { inject } from 'vue'
const { theme, toggleTheme } = inject('theme')
// inject('theme', fallback) supplies a default when no ancestor provides it
</script>`,
      lang: 'vue',
      title: 'provide / inject',
    },
    `
**Shared state** for unrelated components — a Pinia store (a library, see [Pinia basics](lesson:pinia-basics)), or for small apps a composable with module-level state:
`,
    {
      code: `// stores/cart.js — Pinia (requires app.use(createPinia()))
import { defineStore } from 'pinia'
export const useCartStore = defineStore('cart', {
  state: () => ({ items: [] }),
  getters: { count: (s) => s.items.length },
  actions: { add(item) { this.items.push(item) } },
})

// useCart.js — plain Vue, module-level state shared by every importer (simplified)
import { ref, computed } from 'vue'
const items = ref([])                          // created ONCE for the whole app
export function useCart() {
  return { items, count: computed(() => items.value.length), add: (i) => items.value.push(i) }
}`,
      lang: 'js',
      title: 'store vs shared composable',
    },
    `
**Template refs + \`defineExpose\`** — for imperative actions. \`<script setup>\` components are **closed by default**: a parent's ref sees only what the child exposes:
`,
    {
      code: `<!-- NoteEditor.vue -->
<script setup>
import { ref } from 'vue'
const textarea = ref(null)
function focus() { textarea.value.focus() }
defineExpose({ focus })
</script>

<!-- parent -->
<script setup>
import { ref, nextTick } from 'vue'
const editor = ref(null)
async function newNote() {
  /* …add and select a note… */
  await nextTick()          // wait until the editor has re-rendered
  editor.value.focus()
}
</script>
<template>
  <NoteEditor ref="editor" />
</template>`,
      lang: 'vue',
      title: 'calling a child method',
    },
    {
      callout: 'warn',
      title: 'Patterns to avoid',
      text: 'Reaching into other components with `$parent` / `$root`, or reading a child\'s internal state through a template ref, couples components to each other\'s internals. A global **event bus** is also discouraged: Vue 3 removed the instance methods `$on`, `$off` and `$once`, so buses now need an external library (e.g. *mitt*) — and they hide data flow. Prefer props/events, provide/inject or a store.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: ccApp,
    intro: 'A notes app where three siblings coordinate through the state their parent owns.',
    steps: [
      { lines: [8, 14], text: 'The shared state lives in the **nearest common parent** of the components that need it. No sibling owns it, so none can drift out of sync.' },
      { lines: [16, 19], text: 'Derived data is computed once, in the owner, and handed down. The list never filters on its own.' },
      { lines: [21, 23], text: 'The only place a note\'s body changes. Children *request* changes through events; the owner applies them.' },
      { lines: [27], text: '`v-model` connects the search box to `query` — a prop down and an event up.' },
      { lines: [29], text: 'The list gets data via props and reports clicks via `select`. It doesn\'t know about the search box or the editor.' },
      { lines: [30], text: 'The editor shows the selected note and emits edits back. Three siblings, zero direct links between them.' },
    ],
  },

  playground: {
    title: 'Notes app: siblings, deep descendants and imperative calls',
    objective: 'Coordinate siblings through lifted state, reach a grandchild with provide/inject, and call a child method with defineExpose.',
    files: {
      'App.vue': ccApp,
      'SearchBar.vue': searchBar,
      'NoteList.vue': noteList,
      'NoteListItem.vue': noteListItem,
      'NoteEditor.vue': noteEditor,
    },
    expected: 'A search box, a list of three notes and an editor. Typing in the search filters the list; clicking a note opens it in the editor; editing the text updates the note (switch notes and back to check).',
    experiments: [
      {
        id: 'result-count',
        task: 'Show how many notes match next to the search box: give `SearchBar` a `count` prop rendered as `<span class="count">2 notes</span>`, and pass it from `App`.',
        hint: 'In `SearchBar.vue`: `defineProps({ count: Number })` next to `defineModel()`. In `App.vue`: `<SearchBar v-model="query" :count="visible.length" />`.',
        tests: [
          { name: 'shows the total at first', code: `expect(text('.count')).toBe('3 notes')` },
          { name: 'follows the search', code: `await type('.search', 'g'); expect(text('.count')).toBe('2 notes')` },
        ],
        explain: 'The count is derived from state the parent already owns, so it\'s just another prop. Siblings never talk to each other directly — they all talk to the owner.',
      },
      {
        id: 'provide-theme',
        task: 'Add a dark theme without prop drilling. In `App.vue`, create `const dark = ref(false)`, `provide(\'dark\', dark)`, and add `<button class="theme-toggle" @click="dark = !dark">Theme</button>`. In the **grandchild** `NoteListItem.vue`, `inject(\'dark\')` and add the class `dark` to each `.note-item` when it\'s true. Don\'t touch `NoteList.vue`.',
        hint: 'In `NoteListItem.vue`: `import { inject } from \'vue\'`, `const dark = inject(\'dark\', ref(false))` (import `ref` too, or use a plain `false` default), and `:class="{ active, dark }"`.',
        tests: [
          {
            name: 'toggling the theme reaches the grandchild',
            code: `expect(classes(findAll('.note-item')[1])).not.toContain('dark')
await click('.theme-toggle')
expect(classes(findAll('.note-item')[1])).toContain('dark')`,
          },
        ],
        explain: '`NoteList` sits between App and the items but never handles the theme. Because App provided a **ref**, the injected value stays reactive — providing `dark.value` (a plain boolean) would freeze it.',
      },
      {
        id: 'expose-focus',
        task: 'Add a **New note** button (`class="new-note"`) in `App` that adds an empty note titled "Untitled", selects it, and then **focuses the editor\'s textarea** by calling a `focus()` method that `NoteEditor` exposes with `defineExpose`.',
        hint: 'NoteEditor: `const box = ref(null)`, `ref="box"` on the textarea, `defineExpose({ focus: () => box.value.focus() })`. App: `const editor = ref(null)`, `<NoteEditor ref="editor" …>`, and in the handler `await nextTick(); editor.value.focus()`.',
        tests: [
          {
            name: 'creates and selects a new note',
            code: `await click('.new-note')
await flush()
expect(findAll('.note-item')).toHaveLength(4)
expect(text('.editor-title')).toBe('Untitled')`,
          },
          {
            name: 'focuses the editor textarea',
            code: `await click('.new-note')
await flush()
expect(document.activeElement).toBe(find('.editor-body'))`,
          },
        ],
        explain: 'Focusing is an *action*, not data, so a method call fits. `defineExpose` keeps the child\'s public surface tiny — the parent can call `focus()` but can\'t poke at anything else. `nextTick` waits for the editor to show the new note first.',
      },
      {
        id: 'hidden-mutation',
        task: 'In `NoteEditor.vue`, replace the emit with a direct write: `@input="note.body = $event.target.value"`. It "works". Now think: who changed the data, and how would `App` know?',
        explain: 'Objects are passed by reference, so the child silently mutated App\'s note — no warning, because props are only *shallowly* read-only. App can no longer validate, save or log changes in one place. Revert to the emit: keeping mutations in the owner is what makes data flow traceable.',
      },
    ],
  },

  internals: {
    beginner: `
Every pattern answers two questions: **where does the data live**, and **how do others reach it**? Props and events connect neighbours. Lifting state puts data in a shared parent. Provide/inject lets an ancestor make data available to its whole subtree. A store keeps data outside the tree entirely, so any component can use it.
`,
    technical: [
      `
**provide/inject** works like a chain of lookups. Each component instance has a \`provides\` object that inherits (via the prototype chain) from its parent's. \`provide(key, value)\` writes to the current instance's object; \`inject(key)\` reads from the **parent's** chain, walking up until it finds the key:
`,
      {
        code: `// Simplified model — not Vue's real source
function provide(key, value) {
  const instance = currentInstance
  if (instance.provides === instance.parent?.provides) {
    instance.provides = Object.create(instance.parent.provides)   // own layer on first provide
  }
  instance.provides[key] = value
}

function inject(key, defaultValue) {
  const provides = currentInstance.parent?.provides ?? appContext.provides
  if (key in provides) return provides[key]      // found somewhere up the chain
  return defaultValue                            // (dev warning if no default given)
}`,
        lang: 'js',
        title: 'mental model of provide / inject',
      },
      `
Consequences: lookups are cheap; a component can't inject what it provides itself (inject reads from its parent); \`app.provide()\` makes app-wide values; and **injection is not reactive by itself** — you get exactly the value that was provided, so provide a \`ref\`/\`reactive\` (optionally \`readonly\`) to keep consumers in sync.

**Stores** are reactive objects that live outside any component. A module-level \`ref\` in a composable is the minimal version; Pinia adds devtools integration, plugins, SSR-safe per-app instances and a clear actions/getters structure.

**\`defineExpose\`**: a \`<script setup>\` component's public instance exposes nothing by default. A template ref on it gives the parent only the exposed members (refs are unwrapped). This is deliberate — it keeps components encapsulated.
`,
    ],
    production: `
- **Colocate state**: keep it in the lowest component that covers everyone who needs it. Move it up (or out to a store) only when a new consumer appears.
- **One owner per piece of state**. Derived values are \`computed\` from it — never copied into a second ref that must be kept in sync.
- **Provide read-only state plus functions** (\`readonly(theme)\`, \`toggleTheme\`) so descendants can't mutate shared state behind the owner's back. Use \`Symbol\` keys (with \`InjectionKey\` types in TypeScript) to avoid name collisions in large apps.
- **Don't put everything in a global store.** Form inputs, open/closed flags and hover state are usually local. Stores are for state that is genuinely shared or must outlive components.
- **Server-side rendering:** module-level state in a composable is shared by every request on the server (cross-request state pollution). Pinia creates per-app stores and avoids this. See [why state management](lesson:why-state-management).
- **Use the URL for shareable UI state** (filters, sort order, current tab, page number) with Vue Router query parameters ([router basics](lesson:router-basics)).
- **Keep imperative APIs small**: \`defineExpose({ focus, reset })\` is fine; exposing internal state invites coupling.
`,
  },

  mistakes: [
    {
      title: 'Prop drilling through components that don\'t care',
      wrong: { code: `<!-- App → Layout → Sidebar → UserMenu → Avatar, each just forwarding -->\n<Layout :user="user" />\n<Sidebar :user="user" />\n<UserMenu :user="user" />`, lang: 'vue' },
      right: { code: `// App.vue\nprovide('user', readonly(user))\n\n// Avatar.vue (deep)\nconst user = inject('user')\n// or, if many unrelated parts need it: a Pinia store`, lang: 'js' },
      explanation: 'Middle layers that only forward a prop become coupled to data they don\'t use. Provide/inject or a store lets the consumer get it directly.',
    },
    {
      title: 'Copying shared state into local state',
      wrong: { code: `const cart = useCartStore()\nconst count = ref(cart.items.length) // snapshot — goes stale`, lang: 'js' },
      right: { code: `const cart = useCartStore()\nconst count = computed(() => cart.items.length)`, lang: 'js' },
      explanation: 'Two copies of the same truth drift apart. Derive from the owner instead of duplicating.',
    },
    {
      title: 'Reaching into a child\'s internals with a template ref',
      wrong: { code: `// parent\nformRef.value.fields.email = ''\nformRef.value.errors = []`, lang: 'js' },
      right: { code: `// child exposes an intention-revealing method\ndefineExpose({ reset })\n\n// parent\nformRef.value.reset()`, lang: 'js' },
      explanation: 'Writing into a child\'s state couples the parent to its implementation. Expose a small, named API — or, better, drive the child through props and events.',
    },
    {
      title: 'A global event bus for everything',
      wrong: { code: `bus.emit('cart:add', item)    // somewhere\nbus.on('cart:add', (item) => …) // somewhere else… and here… and here`, lang: 'js' },
      right: { code: `const cart = useCartStore()\ncart.add(item)                // one place, visible in devtools`, lang: 'js' },
      explanation: 'With a bus, nobody can tell who emits or listens without searching the whole codebase, and forgotten `off()` calls leak listeners. A store makes shared state and its changes explicit.',
    },
    {
      title: 'Providing a plain value instead of a ref',
      wrong: { code: `const theme = ref('light')\nprovide('theme', theme.value) // descendants get 'light' forever`, lang: 'js' },
      right: { code: `const theme = ref('light')\nprovide('theme', readonly(theme))`, lang: 'js' },
      explanation: 'Injection hands over exactly what was provided. Provide the ref (read-only if consumers shouldn\'t change it) so descendants react to changes.',
    },
    {
      title: 'One giant component doing everything',
      wrong: { code: `<!-- CheckoutPage.vue: 900 lines — form, validation, cart, payment, API calls -->`, lang: 'vue' },
      right: { code: `<!-- CheckoutPage owns the checkout state; children render pieces -->\n<AddressForm v-model="address" />\n<PaymentPicker v-model="payment" />\n<OrderSummary :items="items" :total="total" />`, lang: 'vue' },
      explanation: 'A "god component" is hard to read, test and change. Split by responsibility, keep one clear owner for the shared state, and connect the pieces with props, events and v-model.',
    },
  ],

  debugging: [
    {
      symptom: '`[Vue warn]: injection "theme" not found.`',
      cause: 'No ancestor provides that key (typo, the provider is in a different branch of the tree), or the component tries to inject its own provide.',
      fix: 'Provide it in an ancestor (or with `app.provide`), check the key (consider a shared `Symbol`), and give `inject` a default where appropriate.',
    },
    {
      symptom: 'An injected value never updates.',
      cause: 'A plain value (`theme.value`) was provided instead of the ref.',
      fix: 'Provide the ref or reactive object itself (wrapped in `readonly` if needed).',
    },
    {
      symptom: '`editor.value.focus is not a function` (or `editor.value` is `null`).',
      cause: 'The child doesn\'t `defineExpose` the method, or the ref is read before the child has mounted (or while it\'s hidden by `v-if`).',
      fix: 'Expose the method in the child; call it after mount or after `await nextTick()` once the child is rendered.',
    },
    {
      symptom: 'One sibling updates but the other still shows old data.',
      cause: 'Each sibling keeps its own copy of the state.',
      fix: 'Lift the state up to the common parent (or a store) and pass it down to both.',
    },
    {
      symptom: 'Shared state looks correct in development but leaks between users in SSR.',
      cause: 'Module-level state in a composable is shared across server requests.',
      fix: 'Use Pinia (per-app stores) or create state per app/request.',
    },
  ],

  bestPractices: [
    'Ask "who owns this data?" first; keep exactly one owner and derive everything else.',
    'Use the simplest pattern that fits: props/events → lifted state → provide/inject → store.',
    'Keep state as low in the tree as possible; lift or extract only when a new consumer needs it.',
    'Provide read-only state plus mutation functions; never let descendants mutate shared state directly.',
    'Use template refs + `defineExpose` only for imperative actions (focus, reset, scroll, play).',
    'Avoid `$parent`, `$root` and event buses; prefer explicit, traceable data flow.',
    'Put shareable UI state (filters, tabs, pages) in the URL.',
  ],

  useCases: [
    'Search box + results list (siblings) via lifted state.',
    'Themes, locale or form context for a subtree via provide/inject.',
    'Compound components (tabs, accordions, menus) sharing state via provide/inject.',
    'Auth user, cart and preferences shared app-wide via Pinia.',
    'Focusing inputs, resetting forms or controlling media players via exposed methods.',
    'Filters and pagination stored in route query parameters.',
  ],

  whenToUse: {
    use: [
      'Props/events: direct parent–child relationships.',
      'Lifted state: siblings or cousins with a nearby common parent.',
      'provide/inject: one ancestor serving many descendants in a subtree.',
      'A store: state used across unrelated parts of the app or that must survive navigation.',
    ],
    avoid: [
      'A store for state only one component uses.',
      'provide/inject for simple one-level parent–child data — props are clearer.',
      'Template refs to read or write a child\'s internal data.',
      'Event buses and `$parent` for anything new.',
    ],
  },

  comparison: {
    title: 'Communication patterns at a glance',
    headers: ['', 'Props / emits', 'Lifted state', 'provide / inject', 'Store (Pinia)', 'Ref + defineExpose'],
    rows: [
      ['Reach', 'parent ↔ child', 'siblings via parent', 'ancestor → any descendant', 'anywhere', 'parent → child'],
      ['Explicit in templates?', 'yes', 'yes', 'no (implicit dependency)', 'no (import)', 'yes (`ref="…"`)'],
      ['Reactive?', 'yes', 'yes', 'if you provide refs/reactive', 'yes', 'n/a (method calls)'],
      ['Devtools / traceability', 'good', 'good', 'medium', 'excellent', 'low'],
      ['Main risk', 'prop drilling when deep', 'parent grows large', 'hidden coupling to an ancestor', 'overuse for local state', 'coupling to internals'],
    ],
    note: 'There\'s no single best pattern — start simple and move up the table only when the simpler option causes real pain.',
  },

  quiz: [
    {
      id: 'component-communication-q1',
      type: 'mcq',
      prompt: '`FilterPanel` and `ProductGrid` are siblings inside `ShopPage`. Changing a filter must update the grid. What is the simplest correct approach?',
      options: [
        { text: 'Have `FilterPanel` emit an event that `ProductGrid` listens to directly.', why: 'Siblings can\'t listen to each other\'s events — events only reach the direct parent.' },
        { text: 'Lift the filter state into `ShopPage`, edit it from `FilterPanel` (v-model/events) and pass it to `ProductGrid` as a prop.' },
        { text: 'Use `$parent` from `ProductGrid` to read the filters from `FilterPanel`.', why: '`$parent` couples components to tree structure and internals.' },
        { text: 'Create a global event bus.', why: 'Works, but hides data flow; lifting state is simpler and explicit.' },
      ],
      answer: 1,
      explanation: 'Siblings share state through their nearest common parent. A store is only needed if many unrelated components need the filters.',
    },
    {
      id: 'component-communication-q2',
      type: 'output',
      prompt: 'No ancestor provides `\'locale\'`. What does this component render?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { inject } from 'vue'
const locale = inject('locale', 'en-GB')
</script>

<template>
  <p>{{ locale }}</p>
</template>`,
      },
      options: [
        { text: 'en-GB' },
        { text: 'undefined', why: 'A default value was passed as the second argument.' },
        { text: 'An error is thrown', why: 'Missing injections never throw; at most Vue warns when there is no default.' },
        { text: 'locale', why: 'The key is only used for the lookup.' },
      ],
      answer: 0,
      explanation: 'When nothing up the chain provides the key, `inject` returns the default (and doesn\'t warn because one was given).',
    },
    {
      id: 'component-communication-q3',
      type: 'bug',
      prompt: 'Clicking the toggle changes `dark` in the parent, but descendants that inject `\'dark\'` never change. Which line is the bug?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, provide } from 'vue'

const dark = ref(false)
provide('dark', dark.value)

function toggle() {
  dark.value = !dark.value
}
</script>`,
      },
      answerLine: 5,
      explanation: '`dark.value` is the plain boolean `false` at that moment. Provide the ref itself — `provide(\'dark\', dark)` or `provide(\'dark\', readonly(dark))` — so injectors stay reactive.',
    },
    {
      id: 'component-communication-q4',
      type: 'fill',
      prompt: 'Let a parent call the child\'s `reset()` through a template ref.',
      code: {
        lang: 'js',
        code: `// SignupForm.vue (<script setup>)
function reset() { email.value = ''; password.value = '' }
___({ reset })

// Parent (<script setup>), with <SignupForm ref="form" />
const form = ref(null)
function clearForm() {
  form.value.___()
}`,
      },
      answer: [['defineExpose'], ['reset']],
      explanation: '`<script setup>` components are closed by default; `defineExpose` publishes `reset`, which the parent calls through the ref.',
    },
    {
      id: 'component-communication-q5',
      type: 'mcq',
      prompt: 'The logged-in user is needed by the header, the settings page, a comment form and an analytics widget in different parts of the app. Which pattern fits best?',
      options: [
        { text: 'Pass `user` as a prop from App through every layer.', why: 'That is prop drilling through many unrelated components.' },
        { text: 'A shared store (e.g. Pinia) holding the user and auth actions.' },
        { text: 'Each component fetches the user itself and keeps its own copy.', why: 'Duplicated requests and copies that drift apart.' },
        { text: 'Template refs from App to each component.', why: 'Refs are for imperative calls, not for distributing data.' },
      ],
      answer: 1,
      explanation: 'App-wide state used by unrelated components belongs in a store. Remember the server still enforces authorization — client state is only for the UI.',
    },
    {
      id: 'component-communication-q6',
      type: 'mcq',
      prompt: 'A Vue 2 codebase uses `this.$root.$on(\'saved\', …)` and `this.$root.$emit(\'saved\')` as an event bus. What is true in Vue 3?',
      options: [
        { text: 'It works unchanged.', why: 'The instance methods `$on`, `$off` and `$once` were removed in Vue 3.' },
        { text: '`$on`/`$off`/`$once` were removed; you\'d need an external emitter library — or better, refactor to props/events, provide/inject or a store.' },
        { text: 'Replace it with `app.config.globalProperties.$emit`.', why: '`$emit` only emits component events to the parent; it\'s not a bus.' },
        { text: 'Use `defineEmits` in the root component to broadcast to all children.', why: 'Component events go up to the parent, never down or sideways.' },
      ],
      answer: 1,
      explanation: 'Vue 3 removed the instance event API. External emitters (e.g. mitt) can replace it, but the official recommendation is to prefer explicit patterns.',
    },
    {
      id: 'component-communication-q7',
      type: 'short',
      prompt: 'Describe how you decide between props/events, provide/inject and a store for sharing some piece of state.',
      answer: 'First find who owns the state and who needs it. If it\'s a parent and its direct children, use props down and events up (or v-model). If siblings need it, lift it to the common parent. If one ancestor serves many descendants in its subtree (theme, form context, compound components), use provide/inject with a readonly ref plus functions. If unrelated parts of the app need it or it must outlive components, use a store like Pinia. Prefer the simplest option that fits and move up only when it hurts.',
    },
  ],

  exercises: [
    {
      id: 'cart-siblings',
      title: 'Connect a product grid and a cart summary',
      difficulty: 'intermediate',
      prompt: `
\`ProductGrid\` emits \`add\` with a product id. \`CartSummary\` shows \`count\` and \`total\` props. They are siblings and currently disconnected.

In \`App.vue\`:

- Keep the cart (a list of product ids) as state in \`App\`.
- Listen for \`add\` on \`ProductGrid\` and add the id to the cart.
- Pass \`count\` (number of items) and \`total\` (sum of prices) to \`CartSummary\` as computed values.

Don't change the two child components.
`,
      files: {
        'App.vue': `<script setup>
import ProductGrid from './ProductGrid.vue'
import CartSummary from './CartSummary.vue'

const products = [
  { id: 1, name: 'Mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Plant', price: 20 },
]
// TODO: cart state, count and total
</script>

<template>
  <ProductGrid :products="products" />
  <CartSummary :count="0" :total="0" />
</template>`,
        ...cartFiles,
      },
      hints: [
        '`const cart = ref([])` (import `ref` and `computed`).',
        '`<ProductGrid :products="products" @add="(id) => cart.push(id)" />`.',
        '`const total = computed(() => cart.value.reduce((sum, id) => sum + products.find((p) => p.id === id).price, 0))`.',
      ],
      solution: {
        explanation: 'The siblings never reference each other. `App` owns the cart, receives intents from `ProductGrid`, and derives what `CartSummary` displays. Adding a third consumer (say, a header badge) is just another prop.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import ProductGrid from './ProductGrid.vue'
import CartSummary from './CartSummary.vue'

const products = [
  { id: 1, name: 'Mug', price: 12 },
  { id: 2, name: 'Notebook', price: 8 },
  { id: 3, name: 'Plant', price: 20 },
]

const cart = ref([])
const count = computed(() => cart.value.length)
const total = computed(() =>
  cart.value.reduce((sum, id) => sum + products.find((p) => p.id === id).price, 0)
)

function addToCart(id) {
  cart.value.push(id)
}
</script>

<template>
  <ProductGrid :products="products" @add="addToCart" />
  <CartSummary :count="count" :total="total" />
</template>`,
          ...cartFiles,
        },
      },
      tests: [
        { name: 'starts empty', code: `expect(text('.cart-count')).toBe('0 items'); expect(text('.cart-total')).toBe('$0')` },
        {
          name: 'adding products updates the summary',
          code: `await click(findAll('.add')[0])
await click(findAll('.add')[2])
await click(findAll('.add')[0])
expect(text('.cart-count')).toBe('3 items')
expect(text('.cart-total')).toBe('$44')`,
        },
      ],
    },
    {
      id: 'theme-provider',
      title: 'A theme shared with provide/inject',
      difficulty: 'intermediate',
      prompt: `
\`ThemeButton\` is nested three levels deep (\`App → AppHeader → ToolBar → ThemeButton\`), and \`ThemePanel\` lives elsewhere in \`App\`. Share a theme **without passing props through \`AppHeader\` or \`ToolBar\`**.

- In \`App.vue\`, keep \`theme\` (\`'light'\` or \`'dark'\`) in a ref and provide, under the key \`'theme'\`, an object \`{ theme: readonly(theme), toggleTheme }\`.
- \`ThemeButton.vue\`: inject it; \`<button class="theme-button">\` shows **Dark mode** when the theme is light and **Light mode** when it is dark, and toggles on click.
- \`ThemePanel.vue\`: inject it; \`<section class="panel">\` gets the class \`dark\` when the theme is dark.
`,
      files: {
        'App.vue': `<script setup>
import AppHeader from './AppHeader.vue'
import ThemePanel from './ThemePanel.vue'
// TODO: theme state + provide
</script>

<template>
  <AppHeader />
  <ThemePanel />
</template>`,
        ...themeShared,
        'ThemeButton.vue': `<script setup>
// TODO: inject the theme
</script>

<template>
  <button class="theme-button">Dark mode</button>
</template>`,
        'ThemePanel.vue': `<script setup>
// TODO: inject the theme
</script>

<template>
  <section class="panel">Your notes appear here.</section>
</template>`,
      },
      hints: [
        'App: `const theme = ref(\'light\')`, `function toggleTheme() { theme.value = theme.value === \'light\' ? \'dark\' : \'light\' }`, `provide(\'theme\', { theme: readonly(theme), toggleTheme })`.',
        'ThemeButton: `const { theme, toggleTheme } = inject(\'theme\')` and `@click="toggleTheme"`.',
        'Template expressions unwrap the injected ref: `{{ theme === \'light\' ? \'Dark mode\' : \'Light mode\' }}` and `:class="{ dark: theme === \'dark\' }"`.',
      ],
      solution: {
        explanation: '`AppHeader` and `ToolBar` stay untouched — the theme skips them entirely. Providing `readonly(theme)` plus `toggleTheme` means descendants can read and request changes, but only App mutates the state.',
        files: {
          'App.vue': `<script setup>
import { ref, readonly, provide } from 'vue'
import AppHeader from './AppHeader.vue'
import ThemePanel from './ThemePanel.vue'

const theme = ref('light')

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

provide('theme', { theme: readonly(theme), toggleTheme })
</script>

<template>
  <AppHeader />
  <ThemePanel />
</template>`,
          ...themeShared,
          'ThemeButton.vue': `<script setup>
import { inject } from 'vue'

const { theme, toggleTheme } = inject('theme')
</script>

<template>
  <button class="theme-button" @click="toggleTheme">
    {{ theme === 'light' ? 'Dark mode' : 'Light mode' }}
  </button>
</template>`,
          'ThemePanel.vue': `<script setup>
import { inject } from 'vue'

const { theme } = inject('theme')
</script>

<template>
  <section class="panel" :class="{ dark: theme === 'dark' }">Your notes appear here.</section>
</template>`,
        },
      },
      tests: [
        { name: 'starts light', code: `expect(text('.theme-button')).toBe('Dark mode'); expect(classes('.panel')).not.toContain('dark')` },
        {
          name: 'the deep button toggles the panel',
          code: `await click('.theme-button')
expect(classes('.panel')).toContain('dark')
expect(text('.theme-button')).toBe('Light mode')
await click('.theme-button')
expect(classes('.panel')).not.toContain('dark')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'component-communication-patterns',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What are the ways components can communicate in Vue 3, and when do you use each?',
      answer: 'Props (parent → child data) and emits (child → parent events); v-model/defineModel for two-way values; slots and scoped slots for content and child-provided data; lifting state to a common parent for siblings; provide/inject for an ancestor serving a subtree; a store (Pinia) or shared composable for app-wide state; template refs with defineExpose for imperative actions; and the URL for shareable state. Avoid `$parent`/`$root` and event buses.',
      explanation: 'Pick by distance and audience: neighbours → props/events; subtree → provide/inject; everyone → store.',
      whyAsked: 'A broad question that reveals architectural maturity.',
      mistakes: ['Listing patterns without trade-offs.', 'Recommending an event bus as a default.', 'Using a store for everything.'],
      followUps: ['How do siblings communicate?', 'provide/inject vs Pinia?', 'When is defineExpose appropriate?'],
      modelAnswer: 'The base is props down and events up, with v-model as sugar for editable values and slots for content. Siblings share state by lifting it to their common parent. When one ancestor serves many descendants — a theme, a form context, compound components like tabs — I use provide/inject, providing read-only refs and functions. App-wide state such as the user or cart goes into Pinia. For imperative actions like focusing, a template ref plus `defineExpose`. I avoid `$parent` and event buses because they hide data flow.',
    },
    {
      id: 'component-communication-siblings',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 2,
      question: 'Two sibling components need to share data. How do you do it?',
      answer: 'Lift the state up to their nearest common parent: the parent owns the data, passes it down as props (or v-model) to both, and listens for events from either to update it. If many unrelated components need it, use a store instead.',
      explanation: 'Siblings don\'t talk directly; they share an owner.',
      whyAsked: 'A standard beginner question with a clear right answer.',
      mistakes: ['Trying to emit from one sibling to the other.', 'Jumping straight to a global store or event bus.'],
      followUps: ['When would you switch to a store?', 'What if the common parent is very far up?'],
      modelAnswer: 'I lift the state to the nearest common parent. That parent owns it, passes it to both siblings as props or v-model, and updates it when either emits. Both stay in sync because there\'s only one copy. If the common parent is far away or many unrelated components need it, I\'d use provide/inject or a Pinia store instead.',
    },
    {
      id: 'component-communication-provide-vs-pinia',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare provide/inject with a Pinia store. When would you choose each?',
      answer: 'provide/inject scopes data to a subtree: each provider instance supplies its own value, which is ideal for compound components (tabs, accordions, form fields reading a form context), theming a section, or plugin-like dependencies. It\'s implicit (the dependency isn\'t visible in templates) and only reactive if you provide refs. Pinia holds global, app-wide state with devtools, plugins, SSR-safe instances and a clear actions/getters structure — ideal for user/session, cart, cached server data shared across routes.',
      explanation: 'Subtree-scoped (and possibly multiple instances) → provide/inject; one global source of truth → Pinia.',
      whyAsked: 'Distinguishes candidates who know where each tool shines.',
      mistakes: ['Saying provide/inject replaces Pinia.', 'Forgetting provide/inject supports multiple independent instances (two tab groups on one page).'],
      followUps: ['How do you make injected state read-only?', 'Why might module-level state be a problem with SSR?'],
      modelAnswer: 'Provide/inject is scoped: whatever an ancestor provides is visible only to its subtree, and each instance can provide its own value — perfect for compound components, where two separate tab groups on one page each need their own active tab. Pinia is a global singleton per app with devtools, plugins and SSR safety, so I use it for app-wide state like the user, the cart or cached API data. I make provided state read-only and expose functions, and I avoid plain module-level state in SSR apps.',
    },
    {
      id: 'component-communication-expose',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A parent needs to scroll a `ChatLog` child to the bottom whenever the user sends a message. Would you use a prop, an event, or a template ref with `defineExpose`? Why?',
      answer: 'Scrolling is an imperative action, not data, so a template ref with a small exposed method (`defineExpose({ scrollToBottom })`) is appropriate: `await nextTick(); chatLog.value.scrollToBottom()`. Alternatively, the child can watch its `messages` prop and scroll itself (post-flush), which avoids the imperative call entirely and is often cleaner.',
      explanation: 'Exposed methods are fine for actions; data still flows through props.',
      whyAsked: 'Tests judgment about when imperative APIs are justified.',
      mistakes: ['Encoding the action as a toggling boolean prop (`:scroll-trigger="n"`).', 'Exposing internal state instead of a method.'],
      followUps: ['Why are `<script setup>` components closed by default?', 'How would you test the exposed method?'],
      modelAnswer: 'It\'s an action, so I\'d either expose a `scrollToBottom` method with `defineExpose` and call it through a template ref after `nextTick`, or — often cleaner — let `ChatLog` watch its `messages` prop with a post-flush watcher and scroll itself. I avoid "trigger" props that flip just to cause side effects. If I expose something, it\'s a small intention-revealing method, never internal state.',
    },
    {
      id: 'component-communication-event-bus',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Your team proposes a global event bus for cross-component communication in a Vue 3 app. What do you say?',
      answer: 'Vue 3 removed `$on`/`$off`/`$once`, so a bus needs an external library like mitt. Buses hide data flow (any file can emit or listen), make debugging and testing harder, and leak listeners if `off()` is forgotten on unmount. For shared state use a store; for subtree concerns use provide/inject; for parent/child use props and events. A bus can be acceptable for genuinely fire-and-forget, app-level notifications, used sparingly and with cleanup.',
      explanation: 'Explicit data flow beats implicit broadcast.',
      whyAsked: 'Common legacy pattern; tests awareness of Vue 3 changes and maintainability.',
      mistakes: ['Not knowing `$on` was removed.', 'Ignoring listener cleanup.'],
      followUps: ['How would you migrate an existing bus incrementally?'],
      modelAnswer: 'I\'d push back. In Vue 3 there\'s no built-in bus anymore — `$on` and friends were removed — so it would be an extra library. More importantly, buses make data flow invisible: you have to grep the codebase to know who reacts to what, and forgotten `off()` calls leak listeners. Most cases are better served by a Pinia store for shared state, provide/inject for subtrees, or plain props and events. For rare global notifications like toasts, a small, well-contained emitter with cleanup on unmount can be OK.',
    },
    {
      id: 'component-communication-design-review',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'In a code review you see: a `ProductPage` passing `user`, `cart`, `theme` and `locale` props through four layers; a `ReviewForm` that mutates `props.product.reviews.push(...)`; and a child that reads `this.$parent.filters`. What would you change?',
      answer: 'Move app-wide data (user, cart) into stores; provide theme/locale from the app or layout with provide/inject (read-only refs) instead of drilling. Stop the prop mutation: `ReviewForm` should emit `submit` with the new review and let the owner (or a store action) add it. Replace `$parent.filters` with a prop (or v-model) from the parent, or lift filters to where both need them. Result: one owner per piece of state, explicit inputs/outputs, and components that can be tested in isolation.',
      explanation: 'Fix drilling, hidden mutation and structural coupling.',
      whyAsked: 'Simulates real senior-level review work.',
      mistakes: ['Moving everything into one giant store.', 'Fixing only the symptom (e.g. cloning props) without clarifying ownership.'],
      followUps: ['How would you sequence these refactors safely?', 'Which tests would you add first?'],
      modelAnswer: 'Three smells. Prop drilling: user and cart are app-wide, so they go into Pinia stores; theme and locale suit provide/inject from the layout as read-only refs. Hidden mutation: `ReviewForm` pushing into a prop array changes the parent\'s data behind its back, so it should emit `submit` with the review and let the owner or a store action add it. Structural coupling: `$parent.filters` breaks as soon as the tree changes, so filters become a prop or are lifted to the right owner. Each component then has explicit inputs and outputs.',
    },
    {
      id: 'component-communication-coding-accordion',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Build a compound **accordion** with provide/inject: `AccordionGroup` keeps which item is open (only one at a time) and provides it; each `AccordionItem` (props `id`, `title`) injects it. Clicking an item\'s `.accordion-header` opens it (closing the others); clicking the open one closes it. The open item renders its slot in `.accordion-body`.',
      starter: {
        files: {
          'App.vue': accordionApp,
          'AccordionGroup.vue': `<script setup>
// TODO: open state + provide
</script>

<template>
  <div class="accordion"><slot /></div>
</template>`,
          'AccordionItem.vue': `<script setup>
defineProps({ id: { type: String, required: true }, title: String })
// TODO: inject
</script>

<template>
  <div class="accordion-item">
    <button class="accordion-header">{{ title }}</button>
    <div class="accordion-body"><slot /></div>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'all closed at first', code: `expect(findAll('.accordion-body')).toHaveLength(0)` },
        {
          name: 'opening one closes the others',
          code: `await click(findAll('.accordion-header')[0])
expect(findAll('.accordion-body')).toHaveLength(1)
expect(text('.accordion-body')).toBe('Ships in 2 days.')
await click(findAll('.accordion-header')[1])
expect(findAll('.accordion-body')).toHaveLength(1)
expect(text('.accordion-body')).toBe('30-day returns.')`,
        },
        {
          name: 'clicking the open item closes it',
          code: `await click(findAll('.accordion-header')[2])
await click(findAll('.accordion-header')[2])
expect(findAll('.accordion-body')).toHaveLength(0)`,
        },
      ],
      hints: [
        'Group: `const openId = ref(null)`, `function toggle(id) { openId.value = openId.value === id ? null : id }`, `provide(\'accordion\', { openId: readonly(openId), toggle })`.',
        'Item: `const props = defineProps(...)`, `const { openId, toggle } = inject(\'accordion\')`, `const isOpen = computed(() => openId.value === props.id)`.',
        'Template: `@click="toggle(id)"` on the header and `v-if="isOpen"` on the body.',
      ],
      answer: 'The group owns `openId` and a `toggle` function and provides them; each item injects them, derives `isOpen`, and calls `toggle(id)` on click.',
      solution: {
        files: {
          'App.vue': accordionApp,
          'AccordionGroup.vue': `<script setup>
import { ref, readonly, provide } from 'vue'

const openId = ref(null)

function toggle(id) {
  openId.value = openId.value === id ? null : id
}

provide('accordion', { openId: readonly(openId), toggle })
</script>

<template>
  <div class="accordion"><slot /></div>
</template>`,
          'AccordionItem.vue': `<script setup>
import { computed, inject } from 'vue'

const props = defineProps({ id: { type: String, required: true }, title: String })
const { openId, toggle } = inject('accordion')
const isOpen = computed(() => openId.value === props.id)
</script>

<template>
  <div class="accordion-item">
    <button
      class="accordion-header"
      :aria-expanded="isOpen ? 'true' : 'false'"
      @click="toggle(id)"
    >
      {{ title }}
    </button>
    <div v-if="isOpen" class="accordion-body"><slot /></div>
  </div>
</template>`,
        },
      },
      explanation: 'Items are slot content of the group, so the group can\'t pass them props directly — provide/inject is the natural channel. Each group instance provides its own state, so two accordions on one page stay independent.',
      whyAsked: 'Compound components are the textbook use of provide/inject and test reactivity of injected values.',
      mistakes: ['Providing `openId.value` (not reactive).', 'Letting items set `openId` directly instead of calling `toggle`.', 'Using a global store, which breaks with two accordions on a page.'],
      followUps: ['How would you allow several items open at once?', 'How would you add keyboard navigation between headers?'],
      modelAnswer: 'The group owns `openId` and a `toggle` function and provides them under a key, with `openId` read-only. Items can\'t receive props from the group because they\'re slot content, so they inject the context, compute `isOpen` by comparing with their `id`, and call `toggle(id)` on click. Because it\'s provide/inject rather than a store, each accordion instance is independent. I\'d add `aria-expanded` and `aria-controls` for accessibility.',
    },
  ],

  takeaways: [
    'Always start with "who owns this data, and who needs it?" — one owner, everything else derived.',
    'Parent ↔ child: props down, events up (v-model for editable values, slots for content).',
    'Siblings: lift state to the nearest common parent.',
    'A subtree that needs an ancestor\'s data: provide/inject — provide refs (read-only) and functions.',
    'App-wide state: a store such as Pinia; shareable UI state: the URL.',
    'Template refs + `defineExpose` for imperative actions only; avoid `$parent`, `$root` and event buses.',
  ],
}
