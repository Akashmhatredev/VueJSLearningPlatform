// Lesson: Rapid review — the questions that come up most.

const reviewApp = `<script setup>
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'

const todos = ref([
  { id: 1, title: 'ref vs reactive', done: true },
  { id: 2, title: 'v-if vs v-show', done: false },
  { id: 3, title: 'Why keys in v-for?', done: false },
])
const newTitle = ref('')
const showTips = ref(false)
let nextId = 4

// Interview question: should this be a method or a computed?
function remainingCount() {
  console.log('remaining calculated')
  return todos.value.filter((t) => !t.done).length
}

function add() {
  const title = newTitle.value.trim()
  if (!title) return
  todos.value.push({ id: nextId++, title, done: false })
  newTitle.value = ''
}

function toggle(id) {
  const todo = todos.value.find((t) => t.id === id)
  if (todo) todo.done = !todo.done
}
</script>

<template>
  <form class="add-form" @submit.prevent="add">
    <input class="new-todo" v-model="newTitle" placeholder="Add a question to review" />
    <button>Add</button>
  </form>

  <ul class="todos">
    <TodoItem v-for="todo in todos" :key="todo.id" :todo="todo" @toggle="toggle" />
  </ul>

  <p class="remaining">{{ remainingCount() }} left to review</p>

  <button class="toggle-tips" @click="showTips = !showTips">
    {{ showTips ? 'Hide' : 'Show' }} tips
  </button>
  <p v-if="showTips" class="tips">Define → why → how → example → trade-off.</p>
</template>`

const reviewItem = `<script setup>
defineProps({
  todo: { type: Object, required: true },
})
const emit = defineEmits(['toggle'])
</script>

<template>
  <li class="todo" :class="{ done: todo.done }">
    <label>
      <input type="checkbox" class="check" :checked="todo.done" @change="emit('toggle', todo.id)" />
      {{ todo.title }}
    </label>
  </li>
</template>`

export default {
  id: 'rapid-review',
  title: 'Rapid review: the questions that come up most',
  summary: 'A fast, linked review of the Vue questions interviewers ask most often — each with a crisp answer, the trade-off to mention, and the lesson to revisit.',
  difficulty: 'intermediate',
  minutes: 50,
  prerequisites: ['answering-framework', 'ref', 'computed', 'props', 'emits'],
  related: ['live-coding', 'frontend-system-design', 'how-reactivity-works', 'lifecycle-hooks', 'component-v-model', 'scoped-slots', 'composables-intro', 'pinia-basics', 'legacy-migration'],
  tags: ['interview', 'review', 'cheat sheet', 'ref vs reactive', 'computed vs watch', 'v-if vs v-show', 'keys', 'props', 'emits', 'v-model', 'slots', 'lifecycle', 'nextTick', 'Vue 2 vs Vue 3', 'composables', 'mixins'],
  apis: [
    { name: 'defineModel()', summary: 'Vue 3.4+: two-way binding for a component\'s `v-model` in one line.' },
    { name: 'defineProps() / defineEmits()', summary: 'Declare a component\'s inputs and the events it can emit in `<script setup>`.' },
    { name: 'computed() vs watch()', summary: 'Derived values vs side effects — the most-asked comparison.' },
    { name: 'nextTick()', summary: 'Wait for Vue\'s batched DOM update to finish.' },
  ],
  docs: [
    { label: 'Vue Guide — Introduction', url: 'https://vuejs.org/guide/introduction.html' },
    { label: 'Vue Guide — Reactivity Fundamentals', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html' },
    { label: 'Vue Guide — Component v-model', url: 'https://vuejs.org/guide/components/v-model.html' },
    { label: 'Vue Guide — Slots', url: 'https://vuejs.org/guide/components/slots.html' },
    { label: 'Vue Guide — Lifecycle Hooks', url: 'https://vuejs.org/guide/essentials/lifecycle.html' },
    { label: 'Vue 3 Migration Guide', url: 'https://v3-migration.vuejs.org/' },
  ],

  intro: `
This is your last pass before an interview: the questions that come up again and again in Vue interviews, each with a **short, correct answer**, the **trade-off** worth adding, and a **link to the lesson** that covers it properly.

Use it in three ways:

1. **Skim the cheat sheet** below and mark anything you can't explain out loud in a few sentences.
2. **Run the playground** — one small app that touches many of these topics — and do the experiments; each one *is* an interview question.
3. **Drill the quiz and interview questions**, answering out loud with the [five-step framework](lesson:answering-framework) before revealing the model answer.

Anything you stumble on, follow the link and revisit the full lesson.
`,

  why: `
Interviews have a long tail of possible questions, but a fairly small core comes up in most Vue interviews: reactivity basics, computed vs watch, conditional and list rendering, component communication, lifecycle, the Composition API and its relationship to the Options API, plus some routing, state management and performance.

Knowing those answers *well* — with the mechanism and a trade-off, not just a definition — frees your attention for the harder, more open questions. Rapid review is about **fluency**: being able to produce a clear answer quickly and calmly, so you can spend your thinking on follow-ups.

It also exposes gaps. If a one-line answer below surprises you, that's exactly the topic to revisit before the interview rather than during it.
`,

  eli15: `
Think of the night before a big test. You don't reread the whole textbook. You use **flashcards**: a question on the front, a short answer on the back — and a page number for when you get one wrong.

This lesson is a deck of Vue flashcards. Each card has:

- the **question** interviewers ask,
- a **short answer** you could say in a breath,
- the **"but…"** — the trade-off that shows you really get it,
- the **lesson** to reread if you got it wrong.

The playground is the practical exam: a tiny app where each experiment is one of those flashcards turned into code.
`,

  analogy: {
    title: 'A pilot\'s pre-flight checklist',
    body: `
Experienced pilots know how to fly, yet they still run a checklist before every take-off. The checklist doesn't teach flying — it makes sure nothing important is forgotten under pressure, and points to the manual when something looks wrong.

Rapid review is your pre-interview checklist: quick confirmations of what you know, and pointers to the full "manual" lessons when something doesn't check out.
`,
    mapping: [
      ['the checklist items', 'the most frequently asked Vue questions'],
      ['"checked"', 'you can answer out loud with mechanism and trade-off'],
      ['the reference manual', 'the linked full lessons'],
      ['running it every flight', 'reviewing shortly before each interview'],
      ['a warning light', 'a question you can\'t answer — revisit that lesson now'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The map of common Vue interview topics',
    caption: 'Step through the nine areas most Vue interviews draw from, roughly from most to least frequently asked. Each step links to the lessons to revisit.',
    alt: 'A three-by-three grid of topic boxes: Reactivity, Templates and directives, Components, Composition API, Lifecycle and timing, Routing, State management, Performance, and Security and SSR. Steps highlight each box with the key questions and links.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'reactivity', label: 'Reactivity', note: 'ref · reactive · computed · watch', tone: 'acid' },
        { id: 'templates', label: 'Templates & directives', note: 'v-if/v-show · v-for keys · v-model', tone: 'cobalt' },
        { id: 'components', label: 'Components', note: 'props · emits · slots · v-model', tone: 'kraft' },
        { id: 'composition', label: 'Composition API', note: 'script setup · composables', tone: 'acid' },
        { id: 'lifecycle', label: 'Lifecycle & timing', note: 'hooks · nextTick', tone: 'paper' },
        { id: 'routing', label: 'Routing', note: 'params · guards · lazy routes', tone: 'cobalt' },
        { id: 'state', label: 'State management', note: 'Pinia · provide/inject', tone: 'kraft' },
        { id: 'performance', label: 'Performance', note: 'renders · big lists · splitting', tone: 'red' },
        { id: 'security', label: 'Security & SSR', note: 'v-html · auth · hydration', tone: 'ink' },
      ],
      edges: [],
      steps: [
        { focus: ['reactivity'], text: '**Reactivity** is asked almost everywhere: [ref](lesson:ref) vs [reactive](lesson:reactive), [computed](lesson:computed) vs [watch](lesson:watch), and for seniors [how it works](lesson:how-reactivity-works) (proxies, track & trigger).' },
        { focus: ['templates'], text: '**Templates:** [v-if vs v-show](lesson:conditional-rendering), [keys in v-for](lesson:list-rendering) and the v-if + v-for trap, [v-model](lesson:v-model-forms) and its modifiers.' },
        { focus: ['components'], text: '**Components:** [props](lesson:props) and one-way data flow, [emits](lesson:emits), [component v-model / defineModel](lesson:component-v-model), [slots](lesson:slots) and [scoped slots](lesson:scoped-slots).' },
        { focus: ['composition'], text: '**Composition API:** [Composition vs Options](lesson:composition-vs-options), [script setup](lesson:setup-and-script-setup), [composables](lesson:composables-intro) vs mixins.' },
        { focus: ['lifecycle'], text: '**Timing:** [lifecycle hooks and their order](lesson:lifecycle-hooks), [batched updates and nextTick](lesson:next-tick).' },
        { focus: ['routing'], text: '**Routing:** [dynamic params](lesson:dynamic-routes), [navigation guards](lesson:navigation-guards), [lazy-loaded routes](lesson:lazy-routes-scroll).' },
        { focus: ['state'], text: '**State:** [when to use a store](lesson:why-state-management), [Pinia basics](lesson:pinia-basics), [provide/inject](lesson:provide-inject).' },
        { focus: ['performance'], text: '**Performance:** [how Vue updates the DOM](lesson:how-vue-updates), [avoiding unnecessary renders](lesson:render-optimization), [large lists](lesson:large-lists), [code splitting](lesson:bundle-optimization).' },
        { focus: ['security'], text: '**Security & rendering:** [v-html and XSS](lesson:xss-safe-rendering), [auth & token storage](lesson:auth-security), [CSR vs SSR vs SSG](lesson:rendering-strategies), [hydration](lesson:hydration).' },
      ],
    },
  },

  syntax: [
    `
#### Cheat sheet: reactivity and templates

| Question | Short answer | Trade-off / "but…" | Revisit |
|---|---|---|---|
| \`ref\` vs \`reactive\`? | \`ref\` wraps any value in \`.value\`; \`reactive\` makes an object deeply reactive via a Proxy. | \`reactive\` loses reactivity when destructured or replaced; the Vue docs recommend \`ref\` as the primary API. | [ref](lesson:ref), [reactive](lesson:reactive) |
| \`computed\` vs method? | Computed is cached until its dependencies change; a method runs on every render. | Computed getters must be pure; use a method for non-reactive values like the current time. | [computed](lesson:computed) |
| \`computed\` vs \`watch\`? | Computed derives a value; watch runs side effects when sources change. | Don't use watch to sync derived state — that's a computed. | [watch](lesson:watch) |
| \`watch\` vs \`watchEffect\`? | watch: explicit sources, lazy by default, gives old/new values. watchEffect: tracks whatever it reads, runs immediately. | watchEffect only tracks reads made before its first \`await\`. | [watchEffect](lesson:watch-effect) |
| \`v-if\` vs \`v-show\`? | v-if adds/removes (destroying components); v-show toggles \`display\`. | v-if: cheaper initially, costlier to toggle. v-show: the reverse. | [conditional rendering](lesson:conditional-rendering) |
| Why \`key\` in \`v-for\`? | Gives each item a stable identity so Vue can reuse and move the right elements. | Index keys break state when items are reordered, inserted or removed. | [list rendering](lesson:list-rendering) |
| \`v-if\` with \`v-for\`? | Don't put them on the same element: in Vue 3, \`v-if\` runs first and can't see the loop variable. | Filter in a computed, or move \`v-if\` to a wrapper/\`<template>\`. | [list rendering](lesson:list-rendering) |
| What is \`nextTick\`? | A promise that resolves after Vue flushes its batched DOM updates. | Needed only to read or manipulate DOM after a state change. | [nextTick](lesson:next-tick) |

#### Cheat sheet: components and architecture

| Question | Short answer | Trade-off / "but…" | Revisit |
|---|---|---|---|
| How do components communicate? | Props down, events up; \`v-model\` for two-way; slots for content; provide/inject for deep trees; Pinia for app-wide state. | Choose the most local option that works. | [communication](lesson:component-communication) |
| Can a child change a prop? | No — props are read-only in the child (one-way data flow). Emit an event or use \`v-model\`. | Nested object props *can* be mutated without a warning — don\'t. | [props](lesson:props) |
| Component \`v-model\`? | \`modelValue\` prop + \`update:modelValue\` event; \`defineModel()\` (3.4+) does both. | Multiple v-models via arguments: \`v-model:title\`. | [component v-model](lesson:component-v-model) |
| Slots vs scoped slots? | Slots let the parent pass template content; scoped slots let the child pass data back to that content. | Great for flexible lists/tables; overuse makes components hard to follow. | [slots](lesson:slots), [scoped slots](lesson:scoped-slots) |
| Composition vs Options API? | Composition groups code by feature and enables composables; Options groups by option type. | Both are supported; Composition is preferred for new, larger code. | [composition vs options](lesson:composition-vs-options) |
| Composables vs mixins? | Composables are functions returning refs — explicit sources, no name clashes. | Mixins are discouraged in Vue 3 for exactly those reasons. | [composables](lesson:composables-intro) |
| Lifecycle order with a child? | Parent setup → parent onBeforeMount → child setup → child onBeforeMount → child onMounted → parent onMounted. | Access the DOM in \`onMounted\`, clean up in \`onUnmounted\`. | [lifecycle](lesson:lifecycle-hooks) |
| When do you need Pinia? | When unrelated components or routes share client state (user, cart). | Local state and props are simpler for everything else. | [why shared state](lesson:why-state-management) |
| How does reactivity work? | Proxies/getters track reads during an effect; writes trigger dependent effects, batched in a microtask. | Explains destructuring pitfalls and why updates are async. | [how reactivity works](lesson:how-reactivity-works) |
| Is \`v-html\` safe? | Only with trusted or sanitised HTML — Vue doesn\'t sanitise it. | \`{{ }}\` escapes; \`v-html\` with user input is XSS. | [XSS](lesson:xss-safe-rendering) |
`,
    {
      callout: 'version',
      title: 'Version-sensitive answers',
      text: '`defineModel()` — 3.4+. `useTemplateRef()`, `useId()`, `onWatcherCleanup()` and reactive props destructure — 3.5+. `defineOptions`/`defineSlots` — 3.3+. `<Suspense>` is still **experimental**. Vue 2 reached end of life on **31 December 2023**. Saying the version out loud shows you keep up.',
    },
    `
#### Answer shape reminder
`,
    {
      code: `DEFINE → WHY → HOW → EXAMPLE → TRADE-OFF → (offer depth)

"computed() creates a cached value derived from reactive state.        ← define
 It keeps derived data in sync without recalculating on every render.  ← why
 Vue tracks what the getter reads and recomputes when those change.    ← how
 A cart total is the classic example.                                  ← example
 Getters must be pure — side effects belong in watch."                 ← trade-off`,
      lang: 'text',
      title: 'say it like this',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: reviewApp,
    intro: 'One small app, many interview questions. Each highlighted part is a question an interviewer could ask about this exact code.',
    steps: [
      { lines: [5, 12], text: '**"ref or reactive?"** — `todos` is a `ref` holding an array, so it can be replaced wholesale and survives being returned from a composable. `nextId` is a plain `let` because the template never shows it.' },
      { lines: [14, 18], text: '**"Computed or method?"** — this is a method, so it re-runs on every render of the component. The log makes that visible. (Experiment 2 changes it.)' },
      { lines: [20, 30], text: '**"Why mutate here?"** — `push` and assigning `todo.done` are tracked because the array and its objects are reactive proxies in Vue 3 — no `Vue.set` needed.' },
      { lines: [34, 37], text: '**"What does `.prevent` do?"** — calls `event.preventDefault()` so the form doesn\'t reload the page. `v-model` keeps `newTitle` and the input in sync.' },
      { lines: [39, 41], text: '**"Why the key? How does the child talk back?"** — `:key="todo.id"` gives stable identity; the child receives `todo` as a prop and *emits* `toggle` instead of mutating the prop.' },
      { lines: [45, 48], text: '**"v-if or v-show?"** — the tips paragraph uses `v-if`, so it\'s removed from the DOM while hidden. (Experiment 1 switches it.)' },
    ],
  },

  playground: {
    title: 'One app, many interview questions',
    objective: 'Turn four common interview questions into code: v-if vs v-show, computed vs method, props/emits, and watch for side effects.',
    files: { 'App.vue': reviewApp, 'TodoItem.vue': reviewItem },
    expected: 'A form, three review items (one already ticked), **2 left to review** and a **Show tips** button. The console logs **remaining calculated** on every render — including when you only toggle the tips.',
    experiments: [
      {
        id: 'v-show',
        task: '**v-if vs v-show:** make the tips paragraph stay in the DOM while hidden, toggling only its visibility.',
        hint: 'Replace `v-if="showTips"` with `v-show="showTips"`.',
        tests: [
          { name: 'tips exist but are hidden, then visible', code: `expect(exists('.tips')).toBe(true)\nexpect(isVisible('.tips')).toBe(false)\nawait click('.toggle-tips')\nexpect(isVisible('.tips')).toBe(true)` },
        ],
        explain: 'With `v-show` the element is rendered once and Vue toggles `display: none`. Interview line: "v-show for frequent toggles, v-if for rarely shown or expensive content — and v-if destroys child component state."',
      },
      {
        id: 'computed',
        task: '**Computed vs method:** make the remaining count a `computed` so toggling the tips no longer recalculates it.',
        hint: 'Import `computed`, write `const remaining = computed(() => { … })`, and use `{{ remaining }}` in the template (no parentheses).',
        tests: [
          { name: 'toggling tips does not recalculate the count', code: `const count = () => logs.filter((l) => l.includes('remaining calculated')).length\nconst before = count()\nawait click('.toggle-tips')\nawait click('.toggle-tips')\nexpect(count()).toBe(before)\nexpect(text('.remaining')).toBe('2 left to review')` },
        ],
        explain: 'Toggling `showTips` re-renders the component, but the computed\'s only dependency is `todos`, so its cached value is reused. The log count is your evidence.',
      },
      {
        id: 'remove-emit',
        task: '**Props down, events up:** add a `<button class="remove">` to `TodoItem.vue` that emits `remove` with the todo\'s id; in `App.vue`, listen for it and delete that todo.',
        hint: 'In the child: add `\'remove\'` to `defineEmits` and `@click="emit(\'remove\', todo.id)"`. In the parent: `@remove="remove"` and `todos.value = todos.value.filter((t) => t.id !== id)`.',
        tests: [
          { name: 'Remove deletes that item', code: `await click('.remove')\nexpect(findAll('.todo')).toHaveLength(2)\nexpect(text('.todos')).not.toContain('ref vs reactive')` },
        ],
        explain: 'The child doesn\'t own the list, so it can\'t delete from it — it *announces intent* with an event and the owner changes its own state. That\'s one-way data flow.',
      },
      {
        id: 'persist-watch',
        task: '**watch for side effects:** save the todos to `localStorage` under the key `\'todos\'` (as JSON) whenever they change — including when an item is added.',
        hint: 'Import `watch`: `watch(todos, (value) => localStorage.setItem(\'todos\', JSON.stringify(value)), { deep: true })`. Try it without `deep` first and see what happens on add.',
        tests: [
          { name: 'adding a todo saves the list', code: `await type('.new-todo', 'What is nextTick?')\nawait submit('.add-form')\nconst saved = JSON.parse(localStorage.getItem('todos'))\nexpect(saved && saved.length).toBe(4)` },
        ],
        explain: 'A watcher on a ref holding an array only fires when `.value` is replaced; `push` mutates the array in place, so you need `deep: true` (or watch a getter like `() => todos.value.length`). Classic follow-up: "Why didn\'t my watcher fire?"',
      },
    ],
  },

  animation: {
    type: 'reactivity',
    props: { preset: 'compare' },
    title: 'ref vs reactive vs computed vs watch, on one cart',
    caption: 'The most-asked comparison, animated: step through how each API tracks, updates and triggers effects for the same shopping cart.',
    alt: 'A stepper comparing four reactivity APIs on one cart example: a ref and a reactive object holding state, a computed total that recalculates when items change, and a watcher that runs a side effect, each showing track, trigger and DOM update steps.',
  },

  internals: {
    beginner: `
Most Vue interview questions are versions of a few ideas: Vue tracks the reactive data a template or computed reads and updates only what depends on what changed; components pass data down with props and talk back with events; and each tool (computed, watch, v-if, v-show, stores) is a trade-off between simplicity, performance and flexibility. If you can explain those three ideas, you can reason your way through most questions.
`,
    technical: [
      `
**The three mechanisms behind most answers:**

1. **Dependency tracking.** Effects (component renders, computeds, watchers) record which reactive properties they read; writes trigger exactly those effects, queued and flushed in a microtask. → explains computed caching, "why didn\'t it update?", destructuring pitfalls, \`nextTick\`.
2. **Virtual DOM diffing with compiler hints.** Templates compile to render functions; Vue compares new and old virtual trees and patches the DOM, using keys to match list items. → explains keys, \`v-if\` vs \`v-show\`, why templates are fast.
3. **One-way data flow.** Props flow down, events flow up; shared state lives at the lowest common owner or in a store. → explains props immutability, \`v-model\`, emits, Pinia.
`,
      {
        code: `// Lifecycle order for <Parent><Child /></Parent> (Composition API)
// parent setup → parent onBeforeMount
//   child setup → child onBeforeMount → child onMounted
// parent onMounted
//
// On update: parent onBeforeUpdate → child onBeforeUpdate → child onUpdated → parent onUpdated
// On unmount: parent onBeforeUnmount → child onBeforeUnmount → child onUnmounted → parent onUnmounted`,
        lang: 'js',
        title: 'lifecycle order to memorise',
      },
      `
**Vue 2 → Vue 3 in one breath:** Proxy-based reactivity (no \`Vue.set\`, array index and new properties are tracked), the Composition API, \`createApp\` instead of the global \`new Vue\`, multiple root nodes, \`Teleport\` and (experimental) \`Suspense\`, component \`v-model\` uses \`modelValue\`/\`update:modelValue\` (and replaces \`.sync\`), filters and \`$on/$off\` removed, an \`emits\` option, better TypeScript support. Vue 2 is end-of-life since 31 December 2023. See [Refactoring & migrating legacy Vue](lesson:legacy-migration).
`,
    ],
    production: `
- Interviewers increasingly ask **"how would you…"** rather than "what is…". Practise turning each cheat-sheet row into a short story from real code you\'ve written.
- For senior roles, add production consequences: testing (how would you test this component or composable?), performance (what would you measure?), accessibility and security.
- Keep your answers **version-aware**: mention when a feature needs 3.4/3.5+, and that \`<Suspense>\` is experimental.
- After a review session, pick the two weakest topics and do their full lessons' exercises — recognition is not the same as recall.
- Pair this lesson with [Live coding](lesson:live-coding) for hands-on rounds and [Frontend architecture interviews](lesson:frontend-system-design) for design rounds.
`,
  },

  mistakes: [
    {
      title: 'Definition-only answers',
      wrong: { code: `"v-show uses display none."`, lang: 'text' },
      right: { code: `"v-show always renders the element and toggles display; v-if adds and removes it,\ndestroying child components. So v-show suits frequent toggles, v-if rarely shown content."`, lang: 'text' },
      explanation: 'A fact without the mechanism and the trade-off sounds memorised. Add the "so what".',
    },
    {
      title: 'Vue 2 answers to Vue 3 questions',
      wrong: { code: `"You must use Vue.set to add a new property reactively."`, lang: 'text' },
      right: { code: `"In Vue 2 you needed Vue.set; Vue 3's Proxy-based reactivity tracks new properties\nand array index assignments directly."`, lang: 'text' },
      explanation: 'Many online answers predate Vue 3. Saying which version a rule applies to shows you know the difference.',
    },
    {
      title: 'Mutating props "because it works"',
      wrong: { code: `props.todo.done = true // no warning for nested mutation, so it must be fine?`, lang: 'js' },
      right: { code: `emit('toggle', props.todo.id) // the owner changes its own state`, lang: 'js' },
      explanation: 'Vue only warns on reassigning a prop, but mutating nested prop data still breaks one-way data flow and makes bugs hard to trace.',
    },
    {
      title: 'Overselling tools',
      wrong: { code: `"I always use Pinia for state."`, lang: 'text' },
      right: { code: `"I keep state local by default and use Pinia when unrelated parts of the app share it."`, lang: 'text' },
      explanation: 'Interviewers look for proportionate choices. "Always" answers suggest you haven\'t met the trade-offs.',
    },
  ],

  debugging: [
    {
      symptom: 'A watcher on an array ref doesn\'t fire when you `push`.',
      cause: 'Watching a ref only triggers when `.value` is replaced; in-place mutations need deep watching.',
      fix: 'Use `{ deep: true }`, watch a getter (`() => todos.value.length`), or replace the array immutably.',
    },
    {
      symptom: 'Reading the DOM right after changing state returns old content.',
      cause: 'Vue batches DOM updates and applies them asynchronously.',
      fix: '`await nextTick()` before reading or measuring.',
    },
    {
      symptom: '`Cannot read properties of undefined` in a `v-if` placed on a `v-for` element.',
      cause: 'In Vue 3, `v-if` has higher priority than `v-for`, so the loop variable isn\'t defined yet.',
      fix: 'Filter in a computed, or move the `v-if` to an inner element or a wrapping `<template v-for>`.',
    },
    {
      symptom: 'A child component\'s state resets when it is hidden and shown.',
      cause: '`v-if` destroys and recreates the component.',
      fix: 'Use `v-show`, wrap in `<KeepAlive>` (for dynamic components/routes), or lift the state up.',
    },
  ],

  bestPractices: [
    'For every cheat-sheet row, be able to give the mechanism and a trade-off, not just the definition.',
    'Answer out loud, timed, before reading model answers.',
    'Mention version requirements (3.4+, 3.5+, experimental) where relevant.',
    'Tie answers to real code you\'ve written whenever possible.',
    'Follow the lesson links for every answer you can\'t explain fluently.',
    'Prefer "it depends — here\'s on what" over absolute rules.',
  ],

  useCases: [
    'The evening before a Vue interview.',
    'Warming up before a phone screen or technical round.',
    'Preparing to interview *other* candidates — a calibrated set of questions and good answers.',
    'Checking for knowledge gaps after finishing the course.',
  ],

  whenToUse: {
    use: [
      'As a final review after you\'ve studied the underlying lessons.',
      'To find weak spots quickly, then drill those lessons.',
      'To practise concise, structured answers.',
    ],
    avoid: [
      'As a substitute for building things — interviews probe with follow-ups that only experience answers.',
      'Memorising answers word for word; understand the mechanism instead.',
      'Cramming new topics right before an interview instead of reinforcing core ones.',
    ],
  },

  comparison: {
    title: 'The four reactivity tools at a glance',
    headers: ['', '`ref`', '`reactive`', '`computed`', '`watch`'],
    rows: [
      ['Purpose', 'reactive state (any value)', 'reactive state (objects)', 'derived value', 'side effects on change'],
      ['Access in script', '`.value`', 'properties directly', '`.value` (read-only by default)', 'callback with `(newVal, oldVal)`'],
      ['Cached?', 'n/a', 'n/a', 'yes, until dependencies change', 'n/a'],
      ['Typical example', '`const count = ref(0)`', '`const form = reactive({ … })`', 'cart total', 'save to localStorage, fetch on id change'],
      ['Classic pitfall', 'forgetting `.value`', 'destructuring loses reactivity', 'side effects in the getter', 'using it to sync derived state'],
    ],
    note: 'Deep dives: [ref](lesson:ref) · [reactive](lesson:reactive) · [computed](lesson:computed) · [watch](lesson:watch).',
  },

  quiz: [
    {
      id: 'rapid-review-q1',
      type: 'mcq',
      prompt: 'A cart\'s total price depends on the items in the cart. Which API is the best fit?',
      options: [
        { text: '`computed`' },
        { text: '`watch` that writes into a `total` ref', why: 'Works, but duplicates state and adds an update cycle — derived values belong in computed.' },
        { text: 'A method called from the template', why: 'Recalculates on every render instead of only when items change.' },
        { text: '`reactive`', why: '`reactive` holds state; it doesn\'t derive values.' },
      ],
      answer: 0,
      explanation: 'A total is derived from other state: computed is declarative, cached and can\'t get out of sync.',
    },
    {
      id: 'rapid-review-q2',
      type: 'output',
      prompt: 'The button is clicked once. What is logged?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, useTemplateRef } from 'vue' // useTemplateRef: Vue 3.5+
const count = ref(0)
const el = useTemplateRef('label')

function inc() {
  count.value++
  console.log(el.value.textContent)
}
</script>

<template>
  <p ref="label">{{ count }}</p>
  <button @click="inc">+1</button>
</template>`,
      },
      options: [
        { text: '0' },
        { text: '1', why: 'The state is 1, but Vue hasn\'t patched the DOM yet — that happens in the next flush.' },
        { text: 'undefined', why: 'The element exists after mount; `textContent` is its current (old) text.' },
        { text: 'An error', why: 'The template ref is set after mount, so it\'s available in the click handler.' },
      ],
      answer: 0,
      explanation: 'DOM updates are batched and applied asynchronously. `await nextTick()` before reading would log `1`.',
    },
    {
      id: 'rapid-review-q3',
      type: 'bug',
      prompt: 'This template throws `Cannot read properties of undefined (reading \'done\')` in Vue 3. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<template>
  <ul>
    <li
      v-for="todo in todos"
      v-if="!todo.done"
      :key="todo.id"
    >
      {{ todo.title }}
    </li>
  </ul>
</template>`,
      },
      answerLine: 5,
      explanation: 'In Vue 3, `v-if` has higher priority than `v-for` on the same element, so `todo` isn\'t defined when the condition runs. Filter in a computed (`activeTodos`) or use `<template v-for>` with an inner `v-if`.',
    },
    {
      id: 'rapid-review-q4',
      type: 'fill',
      prompt: 'Declare the component\'s inputs and events in `<script setup>`.',
      code: { lang: 'js', code: `const props = ___({ title: String })\nconst emit = ___(['close'])` },
      answer: [['defineProps'], ['defineEmits']],
      explanation: '`defineProps` and `defineEmits` are compiler macros available in `<script setup>` without importing.',
    },
    {
      id: 'rapid-review-q5',
      type: 'mcq',
      prompt: 'Select **all** the statements that are true about `v-show`.',
      options: [
        { text: 'The element is always rendered and stays in the DOM' },
        { text: 'It toggles the CSS `display` property' },
        { text: 'It can be used with `v-else`', why: '`v-else` only pairs with `v-if`/`v-else-if`.' },
        { text: 'Nothing is rendered while the condition is initially false', why: 'That describes `v-if` (lazy). `v-show` renders immediately, hidden.' },
        { text: 'Child component state is kept while hidden' },
      ],
      answer: [0, 1, 4],
      explanation: '`v-show` renders once and toggles `display`, so components keep their state; it doesn\'t support `v-else` or `<template>`.',
    },
    {
      id: 'rapid-review-q6',
      type: 'mcq',
      prompt: 'What does Vue 3\'s reactivity system use to detect changes to `reactive()` objects?',
      options: [
        { text: 'JavaScript Proxies' },
        { text: '`Object.defineProperty` getters/setters on every property', why: 'That was Vue 2\'s approach (Vue 3 still uses getters/setters for `ref`\'s `.value`).' },
        { text: 'Dirty-checking on a timer', why: 'Vue doesn\'t poll; it tracks reads and writes as they happen.' },
        { text: 'Comparing the whole state after every event', why: 'Vue tracks fine-grained dependencies instead.' },
      ],
      answer: 0,
      explanation: '`reactive()` returns a Proxy that intercepts gets (track) and sets (trigger). That\'s why new properties and array index assignments are reactive in Vue 3.',
    },
    {
      id: 'rapid-review-q7',
      type: 'short',
      prompt: 'In three sentences: why does `v-for` need a `key`, and why is the array index a poor choice?',
      answer: 'A key gives each rendered item a stable identity, so when the list changes Vue can match old and new items and move, reuse or remove the right elements and component instances. With index keys, identity follows position rather than the item: after inserting, removing or reordering, Vue patches elements in place, so DOM state like input values or child component state can end up on the wrong item. Use a unique, stable id; index keys are only safe for static lists that never reorder.',
    },
  ],

  exercises: [
    {
      id: 'rating-model',
      title: 'A star rating with defineModel()',
      difficulty: 'intermediate',
      prompt: `
Make \`StarRating.vue\` work with \`v-model\` using \`defineModel()\` (**Vue 3.4+**):

- It renders five \`<button class="star">\` elements.
- Clicking the n-th star sets the model to **n**.
- Every star whose number is **≤ the current value** has the class \`on\`.
- Changes from the parent (the **Reset** button sets the rating to 0) must be reflected.

\`App.vue\` is done: it binds \`v-model="rating"\` (starting at 2) and shows \`.value\` as **Rating: N**.
`,
      files: {
        'StarRating.vue': `<script setup>
// TODO: make this component work with v-model (defineModel, Vue 3.4+)
const stars = [1, 2, 3, 4, 5]
</script>

<template>
  <div class="rating">
    <button v-for="n in stars" :key="n" type="button" class="star">★</button>
  </div>
</template>`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const rating = ref(2)
</script>

<template>
  <StarRating v-model="rating" />
  <p class="value">Rating: {{ rating }}</p>
  <button class="reset" @click="rating = 0">Reset</button>
</template>`,
      },
      hints: [
        '`const model = defineModel({ type: Number, default: 0 })` gives you a ref that is synced with the parent\'s `v-model`.',
        'Bind the class: `:class="{ on: n <= model }"`.',
        'On click, assign: `@click="model = n"` — Vue emits `update:modelValue` for you.',
      ],
      solution: {
        explanation: '`defineModel()` declares the `modelValue` prop and the `update:modelValue` event and returns a ref: reading it gives the parent\'s value, assigning it emits the update. Before 3.4 you\'d write the prop and emit by hand — worth mentioning in an interview.',
        files: {
          'StarRating.vue': `<script setup>
const model = defineModel({ type: Number, default: 0 })
const stars = [1, 2, 3, 4, 5]
</script>

<template>
  <div class="rating" role="group" aria-label="Rating">
    <button
      v-for="n in stars"
      :key="n"
      type="button"
      class="star"
      :class="{ on: n <= model }"
      :aria-label="n + (n === 1 ? ' star' : ' stars')"
      @click="model = n"
    >★</button>
  </div>
</template>`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'

const rating = ref(2)
</script>

<template>
  <StarRating v-model="rating" />
  <p class="value">Rating: {{ rating }}</p>
  <button class="reset" @click="rating = 0">Reset</button>
</template>`,
        },
      },
      tests: [
        { name: 'shows the initial rating', code: `expect(text('.value')).toBe('Rating: 2')\nexpect(findAll('.star.on')).toHaveLength(2)` },
        { name: 'clicking the 4th star sets 4', code: `await click(findAll('.star')[3])\nexpect(text('.value')).toBe('Rating: 4')\nexpect(findAll('.star.on')).toHaveLength(4)` },
        { name: 'parent changes flow back down', code: `await click('.reset')\nexpect(findAll('.star.on')).toHaveLength(0)` },
      ],
    },
    {
      id: 'scoped-slot-list',
      title: 'A list component with scoped and fallback slots',
      difficulty: 'intermediate',
      prompt: `
Upgrade \`DataList.vue\` so the parent controls how each item looks:

- For each item, render a slot named **\`item\`** that receives \`{ item, index }\`. If the parent provides no slot, fall back to showing \`item.name\`.
- When \`items\` is empty, render a slot named **\`empty\`** whose fallback content is \`<p class="empty">Nothing here</p>\`.

\`App.vue\` already uses an \`#item\` template that renders \`<span class="row">1. Ada (Engineer)</span>\`-style rows, and a second, empty \`DataList\`.
`,
      files: {
        'DataList.vue': `<script setup>
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <ul class="data-list">
    <li v-for="item in items" :key="item.id">{{ item.name }}</li>
  </ul>
</template>`,
        'App.vue': `<script setup>
import DataList from './DataList.vue'

const people = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
]
</script>

<template>
  <DataList :items="people">
    <template #item="{ item, index }">
      <span class="row">{{ index + 1 }}. {{ item.name }} ({{ item.role }})</span>
    </template>
  </DataList>

  <DataList :items="[]" />
</template>`,
      },
      hints: [
        'Inside the `<li>`, use `<slot name="item" :item="item" :index="index">{{ item.name }}</slot>` — slot props are passed as attributes; the content between the tags is the fallback.',
        'You need the index: `v-for="(item, index) in items"`.',
        'Wrap the list in `v-if="items.length"` and add `<slot v-else name="empty"><p class="empty">Nothing here</p></slot>`.',
      ],
      solution: {
        explanation: 'Scoped slots invert control: the child owns the looping and structure, the parent owns the presentation of each item using data the child passes back. Fallback content keeps the component useful with no slots at all.',
        files: {
          'DataList.vue': `<script setup>
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <ul v-if="items.length" class="data-list">
    <li v-for="(item, index) in items" :key="item.id">
      <slot name="item" :item="item" :index="index">{{ item.name }}</slot>
    </li>
  </ul>
  <slot v-else name="empty">
    <p class="empty">Nothing here</p>
  </slot>
</template>`,
          'App.vue': `<script setup>
import DataList from './DataList.vue'

const people = [
  { id: 1, name: 'Ada', role: 'Engineer' },
  { id: 2, name: 'Grace', role: 'Admiral' },
]
</script>

<template>
  <DataList :items="people">
    <template #item="{ item, index }">
      <span class="row">{{ index + 1 }}. {{ item.name }} ({{ item.role }})</span>
    </template>
  </DataList>

  <DataList :items="[]" />
</template>`,
        },
      },
      tests: [
        { name: 'renders each item through the scoped slot', code: `const rows = findAll('.row').map((r) => r.textContent.trim())\nexpect(rows).toEqual(['1. Ada (Engineer)', '2. Grace (Admiral)'])` },
        { name: 'shows the empty fallback', code: `expect(text('.empty')).toBe('Nothing here')` },
        { name: 'falls back to the name without a slot', code: `const list = mountFile('DataList.vue', { items: [{ id: 9, name: 'Linus' }] })\nexpect(list.text()).toBe('Linus')` },
      ],
    },
  ],

  interview: [
    {
      id: 'rapid-review-pick-the-api',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 3,
      question: 'Rapid fire — which reactivity API would you use for each, and why? (a) a click counter, (b) a multi-field form object, (c) a cart total, (d) saving the cart to localStorage when it changes.',
      answer: '(a) `ref(0)` — a single primitive. (b) `ref({ … })` or `reactive({ … })` — an object; `reactive` reads nicely for forms you never replace, `ref` if you might reset it by assigning a new object. (c) `computed` — derived from items, cached. (d) `watch` (with `deep: true`, or a getter) — a side effect triggered by a change.',
      explanation: 'State → ref/reactive, derived → computed, side effect → watch.',
      whyAsked: 'A fast way to check that the candidate maps tools to purposes instead of using one for everything.',
      mistakes: ['Using watch for the total.', 'Forgetting deep watching for in-place mutations.', 'Claiming reactive can hold a primitive.'],
      followUps: ['Why do the Vue docs recommend ref as the primary API?', 'What happens if you destructure the reactive form?'],
      modelAnswer: 'Counter: a ref, because it\'s a single primitive. Form: an object — I\'d use reactive if I never replace it, or a ref if resetting by assigning a fresh object is convenient. Cart total: computed, because it\'s derived and should be cached. Saving to localStorage: watch, because it\'s a side effect, and I\'d make it deep or watch a getter since the cart is mutated in place. The rule of thumb is state, derived, side effect.',
    },
    {
      id: 'rapid-review-lifecycle-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: '`Parent` renders `<Child />`. Both log in `setup`, `onBeforeMount` and `onMounted`. In what order do the logs appear?',
      code: {
        lang: 'js',
        code: `// Parent.vue <script setup>
console.log('parent setup')
onBeforeMount(() => console.log('parent beforeMount'))
onMounted(() => console.log('parent mounted'))

// Child.vue <script setup> — same, with "child"`,
      },
      options: [
        'parent setup, parent beforeMount, parent mounted, child setup, child beforeMount, child mounted',
        'parent setup, parent beforeMount, child setup, child beforeMount, child mounted, parent mounted',
        'child setup, child beforeMount, child mounted, parent setup, parent beforeMount, parent mounted',
        'parent setup, child setup, parent beforeMount, child beforeMount, parent mounted, child mounted',
      ],
      correctOption: 1,
      answer: '`parent setup → parent beforeMount → child setup → child beforeMount → child mounted → parent mounted`. The parent starts rendering first, which creates and mounts the child; the parent is only "mounted" once its whole subtree is in the DOM.',
      explanation: 'Setup and beforeMount go top-down; mounted completes bottom-up.',
      whyAsked: 'Lifecycle ordering matters for DOM access, data loading and parent/child coordination.',
      mistakes: ['Assuming the parent is mounted before its children.', 'Thinking the child\'s setup runs before the parent\'s.'],
      followUps: ['In which hook can you safely access the DOM?', 'What is the order on unmount?', 'Where would you start a data fetch?'],
      modelAnswer: 'Parent setup, parent beforeMount, then the child is created during the parent\'s render — child setup, child beforeMount, child mounted — and finally parent mounted. Creation flows down, mounting completes from the leaves up, so when the parent\'s onMounted runs, all children are in the DOM. Unmounting follows the same shape: parent beforeUnmount first, parent unmounted last.',
    },
    {
      id: 'rapid-review-vif-vfor',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A Vue 2 component used `<li v-for="user in users" v-if="user.active">`. After upgrading to Vue 3 it throws `Cannot read properties of undefined (reading \'active\')`. Why, and what\'s the best fix?',
      answer: 'Vue 3 changed the precedence: when both are on the same element, `v-if` is evaluated before `v-for`, so `user` doesn\'t exist yet. (In Vue 2, `v-for` had priority — but combining them was discouraged even then.) Best fix: filter in a computed — `const activeUsers = computed(() => users.value.filter((u) => u.active))` — and loop over that. Alternatively move the loop to `<template v-for>` and put `v-if` on the inner `<li>`.',
      explanation: 'A computed makes the intent explicit, avoids evaluating the condition for every render, and is easy to test.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'
const props = defineProps({ users: Array })
const activeUsers = computed(() => props.users.filter((u) => u.active))
</script>

<template>
  <li v-for="user in activeUsers" :key="user.id">{{ user.name }}</li>
</template>`,
      },
      whyAsked: 'A real migration bug and a common "gotcha" question.',
      mistakes: ['Saying Vue 3 forbids it entirely (it compiles; the precedence is the problem).', 'Not knowing the Vue 2 vs 3 difference.', 'Filtering with a method called in the template.'],
      followUps: ['What lint rule catches this?', 'When would `<template v-for>` be preferable?'],
      modelAnswer: 'In Vue 3, v-if has higher priority than v-for on the same element, so the condition runs before `user` is defined. Vue 2 had the opposite precedence, which is why it "worked" before, though it was already discouraged. The clean fix is a computed `activeUsers` that filters the list, then loop over that — it\'s cached and explicit. eslint-plugin-vue flags the combination, which is worth enabling during a migration.',
    },
    {
      id: 'rapid-review-vue2-vs-vue3',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What are the most important differences between Vue 2 and Vue 3?',
      answer: 'Reactivity moved from `Object.defineProperty` to Proxies, so new properties and array index assignments are tracked (no `Vue.set`). The Composition API was introduced (and later backported to Vue 2.7). Apps are created with `createApp()` instead of a global `new Vue`, so plugins and config are per app. Components can have multiple root nodes; `Teleport` was added and `Suspense` (still experimental). Component `v-model` uses `modelValue`/`update:modelValue`, supports arguments for multiple models, and replaces `.sync`. Filters and the `$on/$off/$once` event API were removed; an `emits` option was added. Better TypeScript support and tree-shaking. Vue 2 reached end of life on 31 December 2023.',
      explanation: 'Lead with reactivity and the Composition API — they change how you write code — then list breaking changes.',
      whyAsked: 'Many companies still maintain or migrate Vue 2 code.',
      mistakes: ['Saying Vue 3 removed the Options API (it didn\'t).', 'Claiming Composition API is Vue 3-only (2.7 backported it).', 'Not knowing Vue 2 is end-of-life.'],
      followUps: ['How would you plan a Vue 2 → 3 migration?', 'What replaces an event bus in Vue 3?'],
      modelAnswer: 'The biggest change is reactivity: Vue 3 uses Proxies, so adding properties or setting array indexes is tracked without Vue.set. Then the Composition API for organising logic by feature and sharing it via composables — although the Options API is still fully supported. Apps are created with createApp, so global config is per app. Smaller but common breaking changes: component v-model is modelValue plus update:modelValue and replaces .sync, filters and the $on event API are gone, and there\'s an emits option. Plus multiple root nodes, Teleport, and experimental Suspense. Vue 2 has been end-of-life since the end of 2023, which is why migrations are common.',
    },
    {
      id: 'rapid-review-mixins-composables',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Why did the Vue community move from mixins to composables?',
      answer: 'The Vue docs list three drawbacks of mixins: (1) unclear source of properties — with several mixins it\'s hard to tell which one provides `this.loading`; (2) namespace collisions — two mixins can define the same property or method name; (3) implicit cross-mixin communication — mixins depend on each other through shared `this` keys. Composables are plain functions: you call them explicitly, destructure what they return (renaming to avoid collisions), and pass data between them as arguments. They also compose naturally and are easier to type and test.',
      explanation: 'Composables make dependencies explicit; mixins hide them behind `this`.',
      code: {
        lang: 'js',
        code: `// explicit sources, no collisions, explicit wiring between composables
const { x, y } = useMouse()
const { data: user, loading: userLoading } = useFetch(() => '/api/users/' + id.value)
const { data: posts } = useFetch(() => user.value && '/api/posts?author=' + user.value.id)`,
      },
      whyAsked: 'Tests understanding of code organisation trade-offs and the motivation behind the Composition API.',
      mistakes: ['Saying mixins don\'t work in Vue 3 (they still work but aren\'t recommended).', 'Not naming concrete drawbacks.', 'Ignoring that composables can also be badly designed.'],
      followUps: ['What makes a composable well designed?', 'How would you migrate a mixin to a composable?'],
      modelAnswer: 'Mixins merge properties into `this`, which causes three problems the Vue docs call out: you can\'t easily see where a property comes from, two mixins can clash on names, and mixins end up implicitly depending on each other\'s properties. Composables are just functions: I import and call them explicitly, destructure and rename what I need, and pass one composable\'s output into another as an argument. That makes dependencies visible and testing straightforward. Mixins still work in Vue 3 for legacy code, but I wouldn\'t write new ones.',
    },
    {
      id: 'rapid-review-undoable',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Implement a composable `useUndoable(initial)` in `useUndoable.js`. It returns `value` (a ref), `set(newValue)` (records the previous value in history), `undo()` (restores the previous value; does nothing when there\'s no history) and `canUndo` (a computed boolean).',
      starter: {
        files: {
          'useUndoable.js': `import { ref, computed } from 'vue'

export function useUndoable(initial) {
  const value = ref(initial)

  function set(newValue) {
    value.value = newValue
  }

  function undo() {
    // TODO
  }

  const canUndo = computed(() => false)

  return { value, set, undo, canUndo }
}`,
          'App.vue': `<script setup>
import { useUndoable } from './useUndoable.js'

const { value: size, set, undo, canUndo } = useUndoable(12)
</script>

<template>
  <p class="current" :style="{ fontSize: size + 'px' }">Font size: {{ size }}</p>
  <button class="bigger" @click="set(size + 2)">Bigger</button>
  <button class="undo" :disabled="!canUndo" @click="undo">Undo</button>
</template>`,
        },
      },
      tests: [
        { name: 'undo walks back through history', code: `const { useUndoable } = requireModule('useUndoable.js')\nconst u = withSetup(() => useUndoable(1))\nu.set(2)\nu.set(3)\nexpect(u.value.value).toBe(3)\nexpect(u.canUndo.value).toBe(true)\nu.undo()\nexpect(u.value.value).toBe(2)\nu.undo()\nexpect(u.value.value).toBe(1)\nexpect(u.canUndo.value).toBe(false)` },
        { name: 'undo with no history does nothing', code: `const { useUndoable } = requireModule('useUndoable.js')\nconst u = withSetup(() => useUndoable('a'))\nu.undo()\nexpect(u.value.value).toBe('a')` },
        { name: 'the page can grow and undo', code: `expect(find('.undo').disabled).toBe(true)\nawait click('.bigger')\nawait click('.bigger')\nexpect(text('.current')).toBe('Font size: 16')\nawait click('.undo')\nexpect(text('.current')).toBe('Font size: 14')\nexpect(find('.undo').disabled).toBe(false)` },
      ],
      hints: ['Keep `const history = ref([])`. In `set`, push the current `value.value` before assigning the new one.', '`undo`: if `history.value.length`, `value.value = history.value.pop()`. `canUndo = computed(() => history.value.length > 0)`.'],
      answer: 'Store previous values in a reactive history array: `set` pushes the old value then assigns; `undo` pops into `value`; `canUndo` is a computed on the history length.',
      solution: {
        files: {
          'useUndoable.js': `import { ref, computed } from 'vue'

export function useUndoable(initial) {
  const value = ref(initial)
  const history = ref([])

  function set(newValue) {
    history.value.push(value.value)
    value.value = newValue
  }

  function undo() {
    if (history.value.length === 0) return
    value.value = history.value.pop()
  }

  const canUndo = computed(() => history.value.length > 0)

  return { value, set, undo, canUndo }
}`,
          'App.vue': `<script setup>
import { useUndoable } from './useUndoable.js'

const { value: size, set, undo, canUndo } = useUndoable(12)
</script>

<template>
  <p class="current" :style="{ fontSize: size + 'px' }">Font size: {{ size }}</p>
  <button class="bigger" @click="set(size + 2)">Bigger</button>
  <button class="undo" :disabled="!canUndo" @click="undo">Undo</button>
</template>`,
        },
      },
      explanation: 'The history must be reactive (a ref) so `canUndo` updates; the state lives inside the function so every component gets its own history.',
      whyAsked: 'Exercises refs, computed, closures and composable design in one compact task — a frequent "build a composable" prompt.',
      mistakes: ['A plain array for history, so `canUndo` never updates.', 'Declaring history at module level (shared between components).', 'Recording the new value instead of the previous one.'],
      followUps: ['How would you add redo?', 'How would you cap the history length?', 'How would you make it work with an existing ref passed in (`toRef`/`watch`)?'],
      modelAnswer: 'I keep the value in a ref and a separate reactive history array, both inside the function so each caller has its own. `set` pushes the current value onto the history and then assigns the new one; `undo` pops the last entry back into the value if there is one; `canUndo` is a computed on the history length, so the Undo button disables itself reactively. For redo I\'d add a second stack that `undo` pushes onto and `set` clears.',
    },
    {
      id: 'rapid-review-code-review',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Code review, rapid fire: name the problems in this component and how you\'d fix each.',
      code: {
        lang: 'vue',
        code: `<script setup>
const props = defineProps({ comments: Array, user: Object })

function rename(name) {
  props.user.name = name
}
</script>

<template>
  <h3>{{ user.name }}</h3>
  <div v-for="c in comments">
    <p v-html="c.text"></p>
  </div>
</template>`,
      },
      answer: '(1) `props.user.name = name` mutates a prop\'s nested data, breaking one-way data flow — emit an event (`emit(\'rename\', name)`) or use `v-model`/`defineModel` and let the owner update it. (2) `v-for` has no `:key` — add `:key="c.id"` so Vue can track items. (3) `v-html="c.text"` renders user-generated content as HTML — an XSS risk; render with `{{ c.text }}`, or sanitise trusted rich text with a vetted sanitiser before using `v-html`. Bonus: `user` may be undefined while loading — guard with `v-if` or `?.`; and prop definitions could mark `required` or give defaults.',
      explanation: 'Typical review findings: data flow, list identity, security, loading states.',
      whyAsked: 'Senior candidates are often asked to review code; it reveals breadth across reactivity, rendering and security quickly.',
      mistakes: ['Missing the XSS issue.', 'Saying prop mutation is fine because there\'s no warning.', 'Only fixing one problem.'],
      followUps: ['How would you sanitise rich text safely?', 'How would the parent handle the rename event?'],
      modelAnswer: 'Three main issues. First, the component mutates a nested prop — Vue doesn\'t warn, but it breaks one-way data flow; I\'d emit a rename event or use defineModel so the owner changes its own data. Second, the v-for has no key; I\'d key by comment id. Third, and most serious, v-html renders user comments as HTML, which is an XSS hole; I\'d use text interpolation, or a well-maintained sanitiser if rich text is truly required. I\'d also guard against `user` being undefined while loading and tighten the prop definitions.',
    },
  ],

  takeaways: [
    'State → `ref`/`reactive`; derived → `computed`; side effects → `watch`.',
    '`v-if` adds/removes (and destroys components); `v-show` toggles `display`. Keys give list items identity — avoid index keys for dynamic lists.',
    'Props down, events up; `defineModel()` (3.4+) for component `v-model`; slots for content, scoped slots to pass data back.',
    'Lifecycle: creation flows parent → child, mounting completes child → parent; DOM updates are batched — use `nextTick()` to read them.',
    'Vue 3: Proxy reactivity, Composition API and composables over mixins, `createApp`; Vue 2 is end-of-life.',
    'Answer every question with mechanism and trade-off — and follow the links for anything you can\'t explain fluently.',
  ],
}
