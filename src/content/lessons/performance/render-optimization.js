// Lesson: Avoiding unnecessary renders — Level 12, Performance

const statsJs = `// Plain, NON-reactive counters (writing reactive state from
// onUpdated would cause more updates).
export const updates = {}

export function countUpdate(name) {
  updates[name] = (updates[name] || 0) + 1
  console.log(name + ' updated')
}

export function totalUpdates(prefix) {
  return Object.keys(updates)
    .filter((name) => name.startsWith(prefix))
    .reduce((sum, name) => sum + updates[name], 0)
}`

const rowVue = `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  item: { type: Object, required: true },
  activeId: { type: Number, required: true },
  options: { type: Object, required: true },
})
defineEmits(['select'])

onUpdated(() => countUpdate('Row ' + props.item.id))
</script>

<template>
  <li
    class="row"
    :class="{ active: item.id === activeId, compact: options.compact }"
    @click="$emit('select')"
  >
    {{ item.name }}
  </li>
</template>`

const playlistApp = `<script setup>
import { ref, nextTick } from 'vue'
import Row from './Row.vue'
import { totalUpdates } from './stats.js'

const items = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: 'Track ' + (i + 1) }))
const activeId = ref(1)
const progress = ref(0)
const compact = ref(false)
const lastAction = ref('Click a track or the progress button')

// Measures how many Row updates one change causes — in your browser
async function measure(label, change) {
  const before = totalUpdates('Row')
  change()
  await nextTick()
  lastAction.value = label + ': ' + (totalUpdates('Row') - before) + ' row update(s)'
}

function select(id) {
  measure('Select', () => (activeId.value = id))
}

function tick() {
  measure('Tick', () => (progress.value = (progress.value + 10) % 110))
}
</script>

<template>
  <h2>Playlist</h2>
  <p class="now">Now playing: Track {{ activeId }} · {{ progress }}%</p>
  <button class="tick" @click="tick">Progress tick</button>
  <label><input type="checkbox" class="compact" v-model="compact" /> Compact rows</label>
  <p class="measure">{{ lastAction }}</p>
  <ul class="rows">
    <Row
      v-for="item in items"
      :key="item.id"
      :item="item"
      :active-id="activeId"
      :options="{ compact }"
      @select="select(item.id)"
    />
  </ul>
</template>`

export default {
  id: 'render-optimization',
  title: 'Avoiding unnecessary renders',
  summary: 'Measure which components re-render, then make the extra ones disappear with stable props, smarter component boundaries, computed values, v-once and v-memo.',
  difficulty: 'advanced',
  minutes: 40,
  prerequisites: ['how-vue-updates', 'scheduling-flush', 'props'],
  related: ['large-lists', 'runtime-performance', 'debugging-reactivity', 'measuring-performance', 'emits'],
  tags: ['performance', 're-render', 'props stability', 'v-memo', 'v-once', 'computed stability', 'emits', 'watchers', 'onUpdated', 'onRenderTriggered'],
  apis: [
    { name: 'v-memo', summary: 'Skips updating an element/component subtree while every value in its dependency array is unchanged (Vue 3.2+).' },
    { name: 'v-once', summary: 'Renders an element/component once and skips it in all future updates.' },
    { name: 'defineEmits()', summary: 'Declares a component\'s events; declared listeners don\'t make the child re-render when the parent passes a new handler function.' },
    { name: 'computed()', summary: 'Cached derived state; since 3.4 it only triggers dependents when its value changes.' },
  ],
  docs: [
    { label: 'Vue Guide — Performance: Update Optimizations', url: 'https://vuejs.org/guide/best-practices/performance.html#update-optimizations' },
    { label: 'Vue Guide — Performance: Props Stability', url: 'https://vuejs.org/guide/best-practices/performance.html#props-stability' },
    { label: 'API — v-memo', url: 'https://vuejs.org/api/built-in-directives.html#v-memo' },
    { label: 'API — v-once', url: 'https://vuejs.org/api/built-in-directives.html#v-once' },
  ],

  intro: `
Vue already skips most work for you: only components whose dependencies or props changed re-render (see [how Vue updates the DOM](lesson:how-vue-updates)). But it's easy to accidentally hand Vue a reason to re-render *everything* — a prop that changes for every row, a new object on every render, a watcher that copies state around.

This lesson is about finding those reasons and removing them. The toolkit is small:

- **stable props** — give each child exactly what it needs, as values that only change when its output changes;
- **component boundaries** — keep fast-changing state in small components;
- **computed instead of copied state**;
- and, rarely, the escape hatches **\`v-once\`** and **\`v-memo\`**.

The rule that comes first: **measure before you optimise.** Every example here counts renders in your browser.
`,

  why: `
A re-render that changes nothing is pure overhead: Vue runs the component's render function, builds vnodes, diffs them and finds nothing to patch. For one small component, nobody will ever notice. For 500 table rows on every keystroke, or a list re-rendering on every tick of a progress bar, users notice: typing lags, scrolling stutters, interactions feel slow (that's what the INP metric captures — see [measuring performance](lesson:measuring-performance)).

The good news: most unnecessary renders come from a handful of patterns, and the fixes usually make the code *clearer*, not more clever.
`,

  eli15: `
Imagine a classroom where the teacher announces, "Whoever has the red ball, stand up!" — and passes the ball around.

If the teacher shouts **"The ball is now with seat 7!"** to the whole class, *every* student has to stop, think "is that me?", and sit back down. Thirty students interrupted to move one ball.

If instead the teacher just taps **two** students — the one giving the ball and the one receiving it — only they react.

Vue components work the same way. Passing every row "the selected id is 7" makes every row re-check itself. Passing each row "are *you* selected? yes/no" means only the two rows whose answer changed have to do anything.
`,

  analogy: {
    title: 'The classroom announcement',
    body: `
Broadcasting a fact everyone must interpret wakes up everyone. Telling each person only what concerns them wakes up only the people whose answer changed.
`,
    mapping: [
      ['shouting "the ball is with seat 7"', 'passing `:active-id="activeId"` to every row'],
      ['every student checking "is it me?"', 'every row re-rendering when the id changes'],
      ['tapping just two students', 'passing `:active="item.id === activeId"` — only 2 rows change'],
      ['handing out a fresh worksheet to everyone each minute', 'a new object/array prop built on every parent render'],
      ['a student who never needs to listen again', '`v-once`'],
      ['"only interrupt me if my answer changes"', '`v-memo="[item.id === activeId]"`'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'updates' },
    title: 'Wasted renders, measured',
    caption: 'A live demo that counts component updates in your browser. Change one value and compare how many components re-render with unstable vs stable props.',
    alt: 'A measured live demo: a list of child components with update counters. Changing one piece of state shows how many children re-rendered, comparing an unstable-props version where all rows update with a stable-props version where only the affected rows update.',
  },

  syntax: [
    `
#### 1. Pass each child what *it* needs (props stability)

A child re-renders when any of its props changes. If a prop changes for **every** child when only one child's output changes, every child pays.
`,
    {
      code: `<!-- ❌ every row re-renders when activeId changes -->
<Row v-for="item in items" :key="item.id" :item="item" :active-id="activeId" />

<!-- ✅ only the previously active and the newly active row re-render -->
<Row v-for="item in items" :key="item.id" :item="item" :active="item.id === activeId" />`,
      lang: 'vue',
      title: 'stable props',
    },
    `
#### 2. Don't build new objects, arrays or functions in the template

Props are compared by identity. These create a **new** value on every parent render, so the child re-renders even when the contents are identical:

| In the template | New every render? | Stable alternative |
|---|---|---|
| \`:options="{ compact }"\` | yes (contains a variable) | \`:compact="compact"\`, or a \`computed\` object |
| \`:options="{ size: 'sm' }"\` | no — constants only, the compiler treats it as static | — |
| \`:items="list.filter(isOpen)"\` | yes | \`const openItems = computed(…)\` |
| \`:format="(n) => n.toFixed(2)"\` (a prop) | yes | a function defined once in \`<script setup>\` |
| \`@select="pick(item.id)"\` (an event) | new function in \`v-for\`, but **harmless if the child declares the event** with \`defineEmits\` | declare your emits |
`,
    {
      callout: 'tip',
      title: 'Declare your emits',
      text: 'Inline event handlers are cached by the compiler — except inside `v-for` when they use the loop variable. Even then, if the child **declares** the event with `defineEmits`, Vue doesn\'t treat the new listener as a prop change. Undeclared listeners (fallthrough attributes) do re-render the child. Declaring emits is good documentation *and* good performance.',
    },
    `
#### 3. Keep fast-changing state in small components

The component that **reads** a value is the one that re-renders. A clock, a progress bar or a live counter at the top of a big component re-renders the whole template every tick; the same state inside a tiny \`<Clock>\` re-renders two nodes. (You practised this in [how Vue updates the DOM](lesson:how-vue-updates).)

#### 4. Derive with computed, don't copy with watchers
`,
    {
      code: `// ❌ an extra effect, an extra ref, and a window where they disagree
const fullName = ref('')
watch([first, last], ([f, l]) => (fullName.value = f + ' ' + l), { immediate: true })

// ✅ cached, always consistent; since 3.4 it only notifies when the result changes
const fullName = computed(() => first.value + ' ' + last.value)`,
      lang: 'js',
      title: 'computed over watch-and-copy',
    },
    `
Computed stability (3.4+) helps here too: \`const isEmpty = computed(() => cart.items.length === 0)\` only re-renders readers when the boolean flips, not on every item added. Details in [scheduling & flush timing](lesson:scheduling-flush).

#### 5. Escape hatches: \`v-once\` and \`v-memo\`
`,
    {
      code: `<!-- rendered once, never updated again -->
<footer v-once>{{ legalText }} — build {{ buildId }}</footer>

<!-- skip this row's update unless one of the listed values changed (3.2+) -->
<Row
  v-for="item in items"
  :key="item.id"
  v-memo="[item.id === activeId, item.liked]"
  :item="item"
  :active="item.id === activeId"
/>`,
      lang: 'vue',
      title: 'v-once and v-memo',
    },
    `
**The rules for \`v-memo\`:** the array must list **every** value that can change what the subtree shows — forget one and the UI goes stale. On a \`v-for\`, put it on the **same element** as \`v-for\` (it doesn't work on elements *inside* a \`v-for\`). \`v-memo="[]"\` behaves like \`v-once\`. The Vue docs describe it as a micro-optimisation for performance-critical scenarios — reach for stable props first.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`v-memo`: **Vue 3.2+**. Computed stability: **3.4+**. `v-once` and the props-comparison behaviour have been in Vue 3 from the start.',
    },
  ],

  walkthrough: {
    title: 'App.vue (playlist)',
    lang: 'vue',
    code: playlistApp,
    intro: 'The playground parent. `measure()` counts how many Row updates a single change causes and prints it on screen — the numbers are measured live, not invented.',
    steps: [
      { lines: [6, 10], text: '`items` is a plain constant (it never changes). `activeId`, `progress` and `compact` are the state that changes.' },
      { lines: [12, 18], text: '`measure()` reads the total Row update count, applies a change, waits for the DOM update with `nextTick()`, and reports the difference. Writing `lastAction` happens in a handler, not in `onUpdated`, so measuring doesn\'t loop.' },
      { lines: [31], text: 'App re-renders whenever `activeId` or `progress` changes — expected, it displays both.' },
      { lines: [36, 43], text: 'The Row list. Two props are the problem: `:active-id` changes for **every** row on each selection, and `:options="{ compact }"` is a **new object** on every App render — including every progress tick.' },
      { lines: [42], text: '`@select="select(item.id)"` is a new function per render (it uses the loop variable, so it can\'t be cached) — but Row declares `select` in `defineEmits`, so it does **not** cause row updates.' },
    ],
  },

  playground: {
    title: 'A playlist that re-renders too much',
    objective: 'Measure how many rows re-render on a selection and on a progress tick, then make both numbers as small as they should be.',
    files: { 'App.vue': playlistApp, 'Row.vue': rowVue, 'stats.js': statsJs },
    expected: `
Eight tracks, Track 1 active. Click **Track 3**: the readout says **Select: 8 row update(s)**. Click **Progress tick**: **Tick: 8 row update(s)** — the whole list re-rendered for a number that only appears in the header. The console logs every row update.
`,
    experiments: [
      {
        id: 'measure',
        task: 'Click a few tracks and the progress button. For each, write down how many rows *should* need to re-render, and compare with the readout.',
        hint: 'Selecting changes how exactly two rows look. A progress tick changes no row at all.',
        explain: 'Ideal numbers: **2** for a selection, **0** for a tick. The gap between 8 and those numbers is the waste you are about to remove.',
      },
      {
        id: 'stable-object',
        task: 'Make a **Progress tick** re-render **0** rows while the **Compact rows** checkbox still works.',
        hint: 'The new object comes from `:options="{ compact }"`. Either pass a primitive (`:compact="compact"` + a Boolean prop in Row), or build the object once: `const options = computed(() => ({ compact: compact.value }))` and bind `:options="options"`.',
        tests: [
          {
            name: 'a tick re-renders no rows; compact still applies',
            code: `await click('.tick')
expect(text('.measure')).toBe('Tick: 0 row update(s)')
await check('.compact', true)
expect(findAll('.row.compact')).toHaveLength(8)`,
          },
        ],
        explain: 'A computed returns the **same object** until `compact` changes, so the prop is identical across App renders and the rows are skipped. When `compact` really changes, all rows legitimately update — they all look different.',
      },
      {
        id: 'stable-active',
        task: 'Keep your fix from the previous experiment. Now make a selection re-render only **2** rows: pass each Row a boolean `:active="item.id === activeId"` instead of `:active-id`, and update **Row.vue** to use an `active` prop.',
        hint: 'In Row.vue replace the `activeId` prop with `active: { type: Boolean, default: false }` and the class binding with `active: active`.',
        tests: [
          {
            name: 'selecting re-renders exactly two rows',
            code: `await click(findAll('.row')[2])
expect(text('.measure')).toBe('Select: 2 row update(s)')
expect(findAll('.row')[2].classList.contains('active')).toBe(true)
expect(findAll('.row')[0].classList.contains('active')).toBe(false)`,
          },
        ],
        explain: 'Each row now receives "am I active?". When the selection moves from 1 to 3, only row 1\'s and row 3\'s answers change, so Vue skips the other six. (Without the previous fix you would still see 8: a selection re-renders App, and every App render used to hand each row a brand-new options object.) Same output, a quarter of the work — and the gap grows with the list.',
      },
      {
        id: 'v-memo-instead',
        task: 'Reset the playground to the lesson example, then fix **both** problems with a single directive instead: add `v-memo="[item.id === activeId, compact]"` to the `<Row v-for…>`.',
        hint: 'Put `v-memo` on the same element as `v-for`. List every value that can change how a row looks.',
        tests: [
          {
            name: 'selection updates 2 rows and a tick updates none',
            code: `await click(findAll('.row')[2])
expect(text('.measure')).toBe('Select: 2 row update(s)')
await click('.tick')
expect(text('.measure')).toBe('Tick: 0 row update(s)')
await check('.compact', true)
expect(findAll('.row.compact')).toHaveLength(8)`,
          },
        ],
        explain: '`v-memo` skips a row entirely while its dependency values are unchanged — it doesn\'t even look at the unstable props. Powerful, but now **you** are responsible for the dependency list: leave out `compact` and the checkbox stops working. Prefer the stable-props fixes; keep `v-memo` for measured hot spots.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Unstable vs stable props',
    caption: 'The same list, two ways of passing selection and options down.',
    alt: 'Side-by-side code comparison. The left version passes activeId and an inline options object to every row, so every row re-renders on each selection and each parent update. The right version passes a boolean active flag and a computed options object, so only rows whose output changes re-render.',
    props: {
      left: {
        label: 'Unstable: every row re-renders',
        lang: 'vue',
        code: `<Row
  v-for="item in items"
  :key="item.id"
  :item="item"
  :active-id="activeId"
  :options="{ compact }"
/>`,
      },
      right: {
        label: 'Stable: only changed rows re-render',
        lang: 'vue',
        code: `<script setup>
const options = computed(() => ({ compact: compact.value }))
</script>

<Row
  v-for="item in items"
  :key="item.id"
  :item="item"
  :active="item.id === activeId"
  :options="options"
/>`,
      },
      points: [
        '`active-id` changes for every row on each selection; `active` changes for exactly two rows.',
        '`{ compact }` in the template is a new object on every parent render; the computed returns the same object until `compact` changes.',
        'Both versions render identical HTML — only the amount of work differs.',
        'Measure with an update counter before and after: the difference grows with the size of the list.',
      ],
    },
  },

  internals: {
    beginner: `
When a parent re-renders, Vue asks each child: "did any of your props change?" It checks each prop with a quick identity comparison. If nothing changed, the child is skipped completely. So the trick is to make sure a prop only "changes" when the child would actually look different.
`,
    technical: [
      `
**How the skip decision is made.** For compiled templates, the parent's vnode for a child carries a list of its *dynamic* props (from the \`PROPS\` patch flag). On update, Vue compares just those, each with \`!==\`. Listeners for events the child **declares** in \`emits\` are excluded from the comparison — Vue reads the current handler at emit time — which is why declared events never force an update. A prop built only from constants gets no patch flag at all and is never compared.

**What \`v-memo\` compiles to.** The compiler wraps the subtree so that, before rendering it, Vue compares the memo array with the one saved last time. If every entry is the same, it reuses the previous vnode, and the patcher skips identical vnodes entirely — no render of the child, no props comparison, no diff. That's why it can paper over unstable props, and why a missing dependency means stale UI.

**\`v-once\`.** The subtree's vnode is created once and cached; future renders reuse it and the patcher skips it.

**Where computed stability fits.** A child-level \`computed(() => props.activeId === props.item.id)\` does *not* prevent the update — the prop itself changed, so the child re-renders before the computed is even read. Stability has to be created where the value is passed: in the parent.
`,
      {
        callout: 'warn',
        title: 'Implementation detail',
        text: 'The patch flag numbers, the dynamic-props list, how memo caches are stored and the `emits` exclusion are internal mechanisms (the documented guarantees are: props changes re-render children, `v-memo`/`v-once` skip updates as described). They are useful for understanding, not for depending on.',
      },
    ],
    production: `
- **Measure first.** Count updates (\`onUpdated\`, \`onRenderTriggered\` in development, Vue Devtools) and profile a production build. Many re-renders are cheap and not worth touching.
- **Fix the cause, not the symptom.** Stable props and component boundaries remove work and keep code honest; \`v-memo\` hides work and adds a dependency list that must be maintained.
- **Lists are where it matters.** A prop that changes for every row multiplies by the row count. Design row props as "what this row shows".
- **Declare emits** on reusable components — it documents the API and avoids re-renders from fresh handlers.
- **Avoid watcher chains.** A watcher that copies state into another ref is an extra effect and an extra source of truth; derive with \`computed\`.
- **Big lists need more than render tricks**: windowing (virtual scrolling) renders only what's visible — see [Large lists & virtual scrolling](lesson:large-lists). Caching whole views with \`<KeepAlive>\` has its own trade-offs — see [runtime performance](lesson:runtime-performance).
`,
  },

  mistakes: [
    {
      title: 'Passing a "global" value every row has to interpret',
      wrong: { code: `<Row v-for="r in rows" :key="r.id" :row="r" :selected-id="selectedId" />`, lang: 'vue' },
      right: { code: `<Row v-for="r in rows" :key="r.id" :row="r" :selected="r.id === selectedId" />`, lang: 'vue' },
      explanation: 'When `selectedId` changes, the first version changes a prop on every row; the second changes it on two.',
    },
    {
      title: 'Filtering or mapping inside a prop binding',
      wrong: { code: `<ProductGrid :products="products.filter((p) => p.inStock)" />`, lang: 'vue' },
      right: { code: `<script setup>\nconst inStock = computed(() => products.value.filter((p) => p.inStock))\n</script>\n\n<ProductGrid :products="inStock" />`, lang: 'vue' },
      explanation: 'A new array on every parent render means the grid re-renders on every parent update, for any reason. The computed returns the same array until `products` changes (and filters once instead of every render).',
    },
    {
      title: 'An incomplete `v-memo` dependency list',
      wrong: { code: `<TodoRow v-for="t in todos" :key="t.id" v-memo="[t.id === editingId]" :todo="t" />\n<!-- toggling t.done does nothing on screen -->`, lang: 'vue' },
      right: { code: `<TodoRow v-for="t in todos" :key="t.id" v-memo="[t.id === editingId, t.done, t.text]" :todo="t" />`, lang: 'vue' },
      explanation: '`v-memo` trusts the array completely. Every value that affects the row\'s output must be listed, or updates are silently skipped.',
    },
    {
      title: 'Syncing state with a watcher',
      wrong: { code: `const total = ref(0)\nwatch(() => cart.items, (items) => {\n  total.value = items.reduce((s, i) => s + i.price, 0)\n}, { deep: true, immediate: true })`, lang: 'js' },
      right: { code: `const total = computed(() => cart.items.reduce((s, i) => s + i.price, 0))`, lang: 'js' },
      explanation: 'The watcher version runs a deep traversal on every change and keeps a second copy of the truth. The computed is cached, lazy and always consistent.',
    },
    {
      title: 'Optimising before measuring',
      wrong: { code: `<!-- v-memo sprinkled on every component "for performance" -->`, lang: 'vue' },
      right: { code: `// 1. count updates / profile  2. find the prop or state causing them\n// 3. fix that  4. measure again`, lang: 'js' },
      explanation: 'Unmeasured optimisations add complexity and bugs (stale UI) without proven benefit.',
    },
  ],

  debugging: [
    {
      symptom: 'Every row in a list re-renders when one item is selected.',
      cause: 'A prop shared by all rows changes on selection (`selectedId`, the whole selection array).',
      fix: 'Pass a per-row boolean (`:selected="row.id === selectedId"`, or `selectedSet.has(row.id)`).',
    },
    {
      symptom: 'Children re-render whenever the parent updates for any reason.',
      cause: 'A prop is a new object, array or function created in the parent\'s template, or an event listener the child didn\'t declare.',
      fix: 'Use computeds / functions defined once in setup, pass primitives, and declare events with `defineEmits`.',
    },
    {
      symptom: 'After adding `v-memo`, some changes don\'t show up.',
      cause: 'A value the subtree displays isn\'t in the memo array.',
      fix: 'Add every output-affecting value to the array — or remove `v-memo` and fix the props instead.',
    },
    {
      symptom: 'You can\'t tell which prop or state triggers a re-render.',
      cause: 'Guesswork.',
      fix: 'Use `onRenderTriggered` in the child (development builds) to log the key and type, as shown in [debugging reactivity](lesson:debugging-reactivity).',
    },
  ],

  bestPractices: [
    'Measure re-renders before and after every optimisation.',
    'Design child props as "what this child shows", not shared global state.',
    'Never build objects, arrays or functions with variables inside prop bindings — use computeds or setup-level constants.',
    'Declare events with `defineEmits`.',
    'Put fast-changing state in the smallest component that displays it.',
    'Derive with `computed`; avoid watchers that copy state.',
    'Treat `v-memo` and `v-once` as last-mile tools with complete dependency lists.',
  ],

  useCases: [
    'Selectable lists, tables and grids (rows, seats, cells).',
    'Pages with a live clock, progress bar or presence indicator next to heavy content.',
    'Filter panels that pass derived arrays to large result components.',
    'Dashboards with many widgets fed from one store.',
    'Static legal/footer content rendered once with `v-once`.',
  ],

  whenToUse: {
    use: [
      'Stable props and component boundaries: always — they are good design anyway.',
      '`v-memo` on a measured hot list where props can\'t easily be made stable.',
      '`v-once` for content that must never change after the first render.',
    ],
    avoid: [
      'Optimising components that render rarely or cheaply.',
      '`v-memo` with dependency lists you can\'t keep complete.',
      '`v-once` on anything driven by state the user can change.',
    ],
  },

  comparison: {
    title: 'Ways to avoid a re-render',
    headers: ['', 'Stable props', 'Component split', '`computed`', '`v-memo` (3.2+)', '`v-once`'],
    rows: [
      ['What it does', 'props change only when output changes', 'moves state to where it is read', 'caches derived values, stable since 3.4', 'skips a subtree while deps are equal', 'renders a subtree once, ever'],
      ['Risk of stale UI', 'none', 'none', 'none', 'yes, if deps are incomplete', 'yes, by design'],
      ['Extra code to maintain', 'none', 'one component', 'none', 'a dependency array', 'none'],
      ['Use it', 'by default', 'for fast-changing state', 'for derived data', 'measured hot spots', 'truly static content'],
    ],
    note: 'Start from the left. The further right you go, the more the tool trusts you to be right.',
  },

  quiz: [
    {
      id: 'render-optimization-q1',
      type: 'mcq',
      prompt: 'A list of 200 `<Row>`s receives `:selected-id="selectedId"`. Selection changes from 5 to 9. How many rows re-render?',
      options: [
        { text: '200 — the prop changed for every row' },
        { text: '2 — only rows 5 and 9 look different', why: 'That would be true with a per-row boolean. Here every row\'s `selected-id` prop changed.' },
        { text: '0 — Vue compares the rendered HTML first', why: 'Vue decides from props before rendering; it doesn\'t compare HTML.' },
        { text: '1 — only the new selection', why: 'Every row received a changed prop.' },
      ],
      answer: 0,
      explanation: 'Pass `:selected="row.id === selectedId"` instead, and only the two rows whose boolean flipped re-render.',
    },
    {
      id: 'render-optimization-q2',
      type: 'output',
      prompt: 'The parent re-renders because `clock` changed. Which children re-render? (`Badge` declares no props other than those shown.)',
      code: {
        lang: 'vue',
        code: `<p>{{ clock }}</p>
<Badge :label="'Hi ' + name" />          <!-- A -->
<Badge :items="tags.filter(Boolean)" />   <!-- B -->
<Badge :options="{ size: 'sm' }" />       <!-- C -->`,
      },
      options: [
        { text: 'Only B' },
        { text: 'A, B and C', why: 'A\'s string is equal to last time, and C is made only of constants, which the compiler treats as static.' },
        { text: 'B and C', why: 'C contains only constants: the compiler gives it no patch flag, so it is never compared or updated.' },
        { text: 'None', why: '`filter` returns a new array each render, so B\'s prop changed.' },
      ],
      answer: 0,
      explanation: 'A: the string value is identical (`!==` is false). B: a new array every render. C: a constant-only literal is static. Only B re-renders.',
    },
    {
      id: 'render-optimization-q3',
      type: 'bug',
      prompt: 'Rows memoized with `v-memo` stop showing the ✓ when a todo is completed. Click the line with the bug.',
      code: {
        lang: 'vue',
        code: `<template>
  <ul>
    <li
      v-for="todo in todos"
      :key="todo.id"
      v-memo="[todo.id === editingId]"
    >
      {{ todo.text }} <span v-if="todo.done">✓</span>
    </li>
  </ul>
</template>`,
      },
      answerLine: 6,
      explanation: 'The memo array leaves out `todo.done` (and `todo.text`), so changes to them are skipped. Use `v-memo="[todo.id === editingId, todo.done, todo.text]"` — or drop `v-memo`.',
    },
    {
      id: 'render-optimization-q4',
      type: 'fill',
      prompt: 'Fill the blanks: pass each row a boolean, and skip a row\'s update unless that boolean changes.',
      code: {
        lang: 'vue',
        code: `<Row
  v-for="item in items"
  :key="item.id"
  :active="item.id ___ activeId"
  v-___="[item.id === activeId]"
/>`,
      },
      answer: [['==='], ['memo']],
      explanation: '`:active="item.id === activeId"` makes the prop stable per row; `v-memo` with the same condition skips untouched rows entirely (3.2+).',
    },
    {
      id: 'render-optimization-q5',
      type: 'mcq',
      prompt: 'Inside `v-for`, rows get `@select="pick(item.id)"` — a new function on every render. When does that make rows re-render?',
      options: [
        { text: 'Only if the Row component does not declare `select` in `defineEmits`' },
        { text: 'Always — functions are compared by identity', why: 'Declared event listeners are excluded from the props comparison.' },
        { text: 'Never — event handlers are always cached', why: 'Handlers that use the `v-for` variable can\'t be cached; it\'s the emits declaration that protects you.' },
        { text: 'Only in production builds', why: 'The behaviour is the same in development and production.' },
      ],
      answer: 0,
      explanation: 'For declared events Vue looks up the current handler at emit time and doesn\'t compare it. Undeclared listeners fall through as attributes and count as changed props.',
    },
    {
      id: 'render-optimization-q6',
      type: 'output',
      prompt: 'What does the footer show after `buildId` changes from `"a1"` to `"b2"`?',
      code: {
        lang: 'vue',
        code: `<footer v-once>Build {{ buildId }}</footer>`,
      },
      options: [
        { text: '`Build a1`' },
        { text: '`Build b2`', why: '`v-once` renders the subtree once and skips every later update.' },
        { text: '`Build` (empty)', why: 'The first render already filled in `a1`.' },
        { text: 'An error', why: '`v-once` is a regular built-in directive.' },
      ],
      answer: 0,
      explanation: '`v-once` is for content that must never change after the first render.',
    },
    {
      id: 'render-optimization-q7',
      type: 'short',
      prompt: 'Why should stable props usually be preferred over `v-memo`?',
      answer: 'Stable props remove the reason for the re-render and keep the code honest: the child updates exactly when its inputs change, with nothing extra to maintain. `v-memo` skips work based on a hand-written dependency list; if a value is missing, the UI silently goes stale, and the list must be kept in sync as the template evolves. `v-memo` is a targeted tool for measured hot spots.',
    },
  ],

  exercises: [
    {
      id: 'memo-deps',
      title: 'Fix a stale v-memo',
      difficulty: 'intermediate',
      prompt: `
Someone memoized the rows of a song list to speed up selection. Now **likes** don't show up.

- Rows (\`class="song"\`) show the title and \`class="likes"\` with **♥ N**.
- Clicking a row selects it (class \`selected\`); clicking its \`class="like"\` button adds a like.
- Keep \`v-memo\`, but make selecting **and** liking both update the screen.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const songs = ref([
  { id: 1, title: 'Blue Hour', likes: 3 },
  { id: 2, title: 'Night Drive', likes: 5 },
  { id: 3, title: 'Paper Planes', likes: 1 },
])
const selectedId = ref(1)

function like(song) {
  song.likes++
}
</script>

<template>
  <ul>
    <li
      v-for="song in songs"
      :key="song.id"
      v-memo="[song.id === selectedId]"
      class="song"
      :class="{ selected: song.id === selectedId }"
      @click="selectedId = song.id"
    >
      {{ song.title }}
      <span class="likes">♥ {{ song.likes }}</span>
      <button class="like" @click.stop="like(song)">Like</button>
    </li>
  </ul>
</template>`,
      },
      hints: [
        '`v-memo` re-renders a row only when a value in its array changes. Which value does the row display that isn\'t in the array?',
        '`song.likes` changes, but the memo array only contains the selection boolean.',
        'Use `v-memo="[song.id === selectedId, song.likes]"`.',
      ],
      solution: {
        explanation: 'Every value that affects a row\'s output must be in the memo array. Selection is covered by the boolean, likes by `song.likes`. (The title never changes here; if it could, it would need to be listed too.)',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const songs = ref([
  { id: 1, title: 'Blue Hour', likes: 3 },
  { id: 2, title: 'Night Drive', likes: 5 },
  { id: 3, title: 'Paper Planes', likes: 1 },
])
const selectedId = ref(1)

function like(song) {
  song.likes++
}
</script>

<template>
  <ul>
    <li
      v-for="song in songs"
      :key="song.id"
      v-memo="[song.id === selectedId, song.likes]"
      class="song"
      :class="{ selected: song.id === selectedId }"
      @click="selectedId = song.id"
    >
      {{ song.title }}
      <span class="likes">♥ {{ song.likes }}</span>
      <button class="like" @click.stop="like(song)">Like</button>
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'selecting still works', code: `await click(findAll('.song')[1]); expect(findAll('.song')[1].classList.contains('selected')).toBe(true); expect(findAll('.song')[0].classList.contains('selected')).toBe(false)` },
        { name: 'liking updates the count', code: `await click(findAll('.like')[2]); expect(findAll('.likes')[2].textContent.trim()).toBe('♥ 2')` },
        { name: 'liking twice', code: `await click(findAll('.like')[0]); await click(findAll('.like')[0]); expect(findAll('.likes')[0].textContent.trim()).toBe('♥ 5')` },
      ],
    },
    {
      id: 'stable-function-prop',
      title: 'A function prop that breaks memoless rows',
      difficulty: 'advanced',
      prompt: `
Each \`PriceRow\` re-renders on every **Refresh rates** click — even though prices don't change — because of how the formatter is passed.

- Clicking \`class="refresh"\` must re-render **0** rows (the rows log updates; \`class="measure"\` shows **Rows updated: N** for the last refresh).
- Rows still show formatted prices like **€12.50** (\`class="price"\`).
- Don't use \`v-memo\`.
`,
      files: {
        'stats.js': statsJs,
        'PriceRow.vue': `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  item: { type: Object, required: true },
  format: { type: Function, required: true },
})

onUpdated(() => countUpdate('Row ' + props.item.id))
</script>

<template>
  <li class="row">{{ item.name }} <span class="price">{{ format(item.price) }}</span></li>
</template>`,
        'App.vue': `<script setup>
import { ref, nextTick } from 'vue'
import PriceRow from './PriceRow.vue'
import { totalUpdates } from './stats.js'

const items = [
  { id: 1, name: 'Coffee beans', price: 12.5 },
  { id: 2, name: 'Grinder', price: 49 },
  { id: 3, name: 'Kettle', price: 35.25 },
]
const lastRefresh = ref('never')
const measured = ref(0)

async function refresh() {
  const before = totalUpdates('Row')
  lastRefresh.value = new Date().toLocaleTimeString()
  await nextTick()
  measured.value = totalUpdates('Row') - before
}
</script>

<template>
  <p>Rates refreshed: {{ lastRefresh }}</p>
  <button class="refresh" @click="refresh">Refresh rates</button>
  <p class="measure">Rows updated: {{ measured }}</p>
  <ul>
    <PriceRow
      v-for="item in items"
      :key="item.id"
      :item="item"
      :format="(n) => '€' + n.toFixed(2)"
    />
  </ul>
</template>`,
      },
      hints: [
        'An inline arrow function passed as a **prop** is a new function on every render. (Only `@event` handlers get the compiler\'s caching.)',
        'Define the formatter once in `<script setup>` so the same function is passed every time.',
        '`const formatPrice = (n) => \'€\' + n.toFixed(2)` and `:format="formatPrice"`.',
      ],
      solution: {
        explanation: 'A function declared once in `<script setup>` keeps the same identity across renders, so the `format` prop never changes and the rows are skipped on every refresh. The measurement drops from 3 to 0 without touching PriceRow.',
        files: {
          'stats.js': statsJs,
          'PriceRow.vue': `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  item: { type: Object, required: true },
  format: { type: Function, required: true },
})

onUpdated(() => countUpdate('Row ' + props.item.id))
</script>

<template>
  <li class="row">{{ item.name }} <span class="price">{{ format(item.price) }}</span></li>
</template>`,
          'App.vue': `<script setup>
import { ref, nextTick } from 'vue'
import PriceRow from './PriceRow.vue'
import { totalUpdates } from './stats.js'

const items = [
  { id: 1, name: 'Coffee beans', price: 12.5 },
  { id: 2, name: 'Grinder', price: 49 },
  { id: 3, name: 'Kettle', price: 35.25 },
]
const lastRefresh = ref('never')
const measured = ref(0)

// defined once: the same function every render
const formatPrice = (n) => '€' + n.toFixed(2)

async function refresh() {
  const before = totalUpdates('Row')
  lastRefresh.value = new Date().toLocaleTimeString()
  await nextTick()
  measured.value = totalUpdates('Row') - before
}
</script>

<template>
  <p>Rates refreshed: {{ lastRefresh }}</p>
  <button class="refresh" @click="refresh">Refresh rates</button>
  <p class="measure">Rows updated: {{ measured }}</p>
  <ul>
    <PriceRow
      v-for="item in items"
      :key="item.id"
      :item="item"
      :format="formatPrice"
    />
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'prices are formatted', code: `expect(findAll('.price').map((e) => e.textContent.trim())).toEqual(['€12.50', '€49.00', '€35.25'])` },
        { name: 'a refresh re-renders no rows', code: `await click('.refresh'); expect(text('.measure')).toBe('Rows updated: 0')` },
        { name: 'and still none after several refreshes', code: `await click('.refresh'); await click('.refresh'); expect(text('.measure')).toBe('Rows updated: 0')` },
      ],
    },
  ],

  interview: [
    {
      id: 'render-optimization-list-selection',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A table of 500 rows lags when you select a row: every row re-renders. Walk me through diagnosing and fixing it.',
      answer: 'Confirm with an update counter or `onRenderTriggered` (dev) that all rows update and find the prop responsible — typically each row receives the shared `selectedId` (or the whole selection array) and computes its own state. Fix by passing a per-row boolean (`:selected="row.id === selectedId"`, or `selectedSet.has(row.id)`), so only the two rows whose boolean flips re-render. Also check for new objects/arrays/functions in row props and undeclared emits. If rows still cost too much, consider `v-memo` on the `v-for` element or virtual scrolling. Re-measure.',
      explanation: 'Props should describe what the row shows. Shared values multiply work by the row count.',
      whyAsked: 'The single most common Vue rendering-performance question in real projects.',
      mistakes: ['Jumping to v-memo or virtualization without finding the prop.', 'Not measuring before and after.', 'Moving the selection into each row as local state (breaks single source of truth).'],
      followUps: ['What about multi-select?', 'When would virtual scrolling be the better fix?', 'How does declaring emits matter here?'],
      modelAnswer: 'First I\'d confirm it: a quick update counter, or onRenderTriggered in a row in development, tells me which prop triggers the renders. Usually every row gets the shared selectedId and works out its own state, so the prop changes for all 500 rows at once. I\'d pass each row a boolean — selected equals row.id === selectedId, or a Set lookup for multi-select — so only two rows change. I\'d also make sure no row prop is a fresh object or inline function, and that row events are declared with defineEmits. If it\'s still slow, v-memo on the v-for element or virtual scrolling are next, and I\'d re-measure each step.',
    },
    {
      id: 'render-optimization-v-memo',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 3,
      question: 'What does `v-memo` do, how do you use it correctly, and what are its pitfalls?',
      answer: '`v-memo="[a, b]"` (Vue 3.2+) memoizes a subtree: on re-render, if every value in the array equals the previous one, Vue reuses the old vnode and skips rendering and diffing that subtree. With lists, put it on the same element as `v-for` (it doesn\'t work inside a `v-for`). `v-memo="[]"` is like `v-once`. Pitfall: any output-affecting value missing from the array means silently stale UI; it\'s a micro-optimisation for measured hot spots, and stable props are usually the better first fix.',
      explanation: 'A manual "should this update?" switch — fast, but you own correctness.',
      whyAsked: 'Probes knowledge of advanced directives and the judgement to use them sparingly.',
      mistakes: ['Putting v-memo on a child element inside v-for.', 'Listing only the selection flag and forgetting displayed data.', 'Using it everywhere by default.'],
      followUps: ['How is it different from computed?', 'How would you test that a memoized row still updates?'],
      modelAnswer: 'v-memo takes an array of values; if they\'re all the same as last render, Vue skips the subtree — no render, no diff. The classic use is a big v-for where selection changes: v-memo with item.id === selectedId on the same element as v-for, so only the two affected rows update. The danger is that Vue trusts the array completely: if the row also shows likes and I don\'t list them, likes stop updating. So I treat it as a measured micro-optimisation, prefer stable props first, and write tests that change each displayed field.',
    },
    {
      id: 'render-optimization-inline-objects',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A heavy chart component re-renders every second, but its data changes once a minute. The parent has a clock. What would you look for?',
      code: {
        lang: 'vue',
        code: `<p>{{ now }}</p>
<SalesChart
  :points="sales.map((s) => ({ x: s.day, y: s.total }))"
  :options="{ theme, legend: true }"
/>`,
      },
      answer: 'The clock re-renders the parent every second, and both props are rebuilt on each render: `map` returns a new array and the options literal contains a variable (`theme`), so it\'s a new object. Props are compared by identity, so the chart re-renders. Move both into computeds (`chartPoints`, `chartOptions`) so they keep their identity until `sales`/`theme` change — and consider moving the clock into its own small component so the parent doesn\'t re-render at all.',
      explanation: 'New identities in props defeat Vue\'s child-skipping.',
      whyAsked: 'Tests understanding of props identity and component boundaries in a realistic setting.',
      mistakes: ['Blaming the chart library.', 'Suggesting deep watchers.', 'Not noticing that the constant-only part would be fine but `theme` makes the literal dynamic.'],
      followUps: ['Would computed stability (3.4+) help `chartPoints`?', 'How would you verify the fix?'],
      modelAnswer: 'The parent re-renders every second because of the clock, and each render builds a new points array with map and a new options object, since the literal includes theme. The chart\'s props therefore change identity every second and it re-renders. I\'d move both into computeds so they only change when sales or theme change, and I\'d isolate the clock in its own component so the parent stops re-rendering entirely. I\'d confirm with an update counter or onRenderTriggered before and after.',
    },
    {
      id: 'render-optimization-watch-vs-computed',
      difficulty: 'beginner',
      type: 'comparison',
      minutes: 2,
      question: 'Why is `computed` usually better than `watch` + `ref` for derived values, from a rendering point of view?',
      options: [
        'computed runs on every render, so it is always fresh',
        'computed is cached, lazy and (3.4+) only notifies readers when its value changes; a watcher adds an extra effect and a second copy of the state',
        'watch is deprecated',
        'There is no difference',
      ],
      correctOption: 1,
      answer: 'A computed is cached and lazily re-evaluated, and since 3.4 it only triggers readers when its value actually changes. A watcher that copies values into a ref adds another effect, another source of truth that can disagree, and (with deep or post watchers) extra traversals or renders.',
      explanation: 'Derive, don\'t synchronise.',
      whyAsked: 'A quick check for a common anti-pattern that also affects performance.',
      mistakes: ['Saying computed recalculates on every render.', 'Saying watchers are always wrong (they are right for side effects).'],
      followUps: ['When is a watcher the right tool?', 'What is computed stability?'],
      modelAnswer: 'A computed is cached: it only recalculates when its dependencies change and someone reads it, and since 3.4 its readers only re-run when the result is actually different. A watch-and-copy setup adds an extra effect, a second ref that can briefly disagree with the source, and often a deep traversal. Watchers are for side effects — fetching, saving, logging — not for deriving values.',
    },
    {
      id: 'render-optimization-emits',
      difficulty: 'advanced',
      type: 'output',
      minutes: 3,
      question: 'Rows in a `v-for` get `@remove="remove(item.id)"`. Row A declares `defineEmits([\'remove\'])`; Row B does not declare it. The parent re-renders for an unrelated reason. Which rows re-render?',
      options: ['Both', 'Only Row B rows', 'Only Row A rows', 'Neither'],
      correctOption: 1,
      answer: 'Only the Row B rows. The handler uses the loop variable, so the compiler can\'t cache it and passes a new function each render. For Row A the listener is a declared event, which Vue excludes from the props comparison; for Row B it is an undeclared listener (a fallthrough attribute), so the new function counts as a changed prop.',
      explanation: 'Declaring emits documents the component and keeps fresh handlers from forcing updates.',
      whyAsked: 'A subtle, advanced detail that separates deep knowledge from surface knowledge.',
      mistakes: ['Assuming all handlers are cached.', 'Assuming any new function always re-renders.'],
      followUps: ['Why can\'t the compiler cache that handler?', 'What else does declaring emits give you?'],
      modelAnswer: 'Only the rows that don\'t declare the event. Because the inline handler references item from the v-for, the compiler can\'t cache it, so every parent render passes a new function. Vue skips comparing listeners for events a child declares in emits — it looks the handler up when the event fires — so Row A is unaffected. Row B treats onRemove as a plain fallthrough attribute, the identity changed, and it re-renders. So declaring emits is a performance habit as well as documentation.',
    },
    {
      id: 'render-optimization-coding-seats',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'A cinema seat picker re-renders **every** seat when you pick one. Make a pick re-render only the seat that changed. Seats are `class="seat"` (selected ones also have class `selected`); `class="measure"` shows **Seats updated: N** for the last click. Multiple seats can be selected; clicking a selected seat deselects it.',
      starter: {
        files: {
          'stats.js': statsJs,
          'Seat.vue': `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  id: { type: Number, required: true },
  selectedIds: { type: Array, required: true },
})
defineEmits(['toggle'])

onUpdated(() => countUpdate('Seat ' + props.id))
</script>

<template>
  <button
    class="seat"
    :class="{ selected: selectedIds.includes(id) }"
    @click="$emit('toggle', id)"
  >{{ id }}</button>
</template>`,
          'App.vue': `<script setup>
import { ref, nextTick } from 'vue'
import Seat from './Seat.vue'
import { totalUpdates } from './stats.js'

const seats = Array.from({ length: 12 }, (_, i) => i + 1)
const selectedIds = ref([])
const measured = ref(0)

async function toggle(id) {
  const before = totalUpdates('Seat')
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
  await nextTick()
  measured.value = totalUpdates('Seat') - before
}
</script>

<template>
  <div class="seats">
    <Seat v-for="id in seats" :key="id" :id="id" :selected-ids="selectedIds" @toggle="toggle" />
  </div>
  <p class="measure">Seats updated: {{ measured }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'picking a seat selects it', code: `await click(findAll('.seat')[3]); expect(findAll('.seat')[3].classList.contains('selected')).toBe(true)` },
        { name: 'a pick re-renders exactly one seat', code: `await click(findAll('.seat')[3]); expect(text('.measure')).toBe('Seats updated: 1'); await click(findAll('.seat')[7]); expect(text('.measure')).toBe('Seats updated: 1')` },
        { name: 'clicking again deselects (still one update)', code: `await click(findAll('.seat')[3]); await click(findAll('.seat')[3]); expect(findAll('.seat')[3].classList.contains('selected')).toBe(false); expect(text('.measure')).toBe('Seats updated: 1')` },
        { name: 'multiple seats can be selected', code: `await click(findAll('.seat')[0]); await click(findAll('.seat')[1]); expect(findAll('.seat.selected')).toHaveLength(2)` },
      ],
      hints: [
        'Every Seat reads the shared selection array in its own render, so every Seat depends on it — through props *and* reactivity.',
        'Decide "is this seat selected?" in the parent and pass a boolean prop instead of the array.',
        'In App: `:selected="selectedIds.includes(id)"`; in Seat: a `selected` Boolean prop and `:class="{ selected }"`.',
      ],
      answer: 'Compute a per-seat boolean in the parent and pass it as the prop, so only the toggled seat\'s prop changes.',
      solution: {
        files: {
          'stats.js': statsJs,
          'Seat.vue': `<script setup>
import { onUpdated } from 'vue'
import { countUpdate } from './stats.js'

const props = defineProps({
  id: { type: Number, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['toggle'])

onUpdated(() => countUpdate('Seat ' + props.id))
</script>

<template>
  <button
    class="seat"
    :class="{ selected }"
    @click="$emit('toggle', id)"
  >{{ id }}</button>
</template>`,
          'App.vue': `<script setup>
import { ref, nextTick } from 'vue'
import Seat from './Seat.vue'
import { totalUpdates } from './stats.js'

const seats = Array.from({ length: 12 }, (_, i) => i + 1)
const selectedIds = ref([])
const measured = ref(0)

async function toggle(id) {
  const before = totalUpdates('Seat')
  const i = selectedIds.value.indexOf(id)
  if (i === -1) selectedIds.value.push(id)
  else selectedIds.value.splice(i, 1)
  await nextTick()
  measured.value = totalUpdates('Seat') - before
}
</script>

<template>
  <div class="seats">
    <Seat v-for="id in seats" :key="id" :id="id" :selected="selectedIds.includes(id)" @toggle="toggle" />
  </div>
  <p class="measure">Seats updated: {{ measured }}</p>
</template>`,
        },
      },
      explanation: 'In the starter every Seat read `selectedIds` during its render, so a push or splice re-ran all twelve seat renders. Now only the parent reads the array; each seat gets a boolean, and only the toggled seat\'s boolean changes. For very large selections a `Set` (`selectedSet.has(id)`) makes each lookup cheaper than `includes`.',
      whyAsked: 'A realistic multi-select variant of the list-selection problem; checks that the candidate can move derivation to the right place.',
      mistakes: ['Keeping the array prop and adding a computed inside Seat (the seat still depends on the array).', 'Giving each seat local selected state (loses the single source of truth).', 'Reaching for v-memo instead of fixing the props.'],
      followUps: ['How would you make the lookup O(1)?', 'What if seats were rendered in a virtual list?'],
      modelAnswer: 'Each seat was reading the whole selection array in its own render, so every change to the array re-rendered all of them. I move the question "am I selected?" into the parent and pass a boolean prop. Now the parent is the only reader of the array, and when one seat toggles only that seat\'s boolean changes, so only it re-renders. For big venues I\'d keep the selection in a Set for constant-time lookups, and I\'d verify with the update counter.',
    },
  ],

  takeaways: [
    'Measure first: count updates, then optimise what\'s actually expensive.',
    'Pass each child what it shows — per-row booleans instead of shared ids or arrays.',
    'Objects, arrays and functions built from variables in the template are new every render; use computeds or setup-level constants.',
    'Declared emits keep fresh handler functions from re-rendering children.',
    'Keep fast-changing state in small components; derive with `computed`, not watcher copies.',
    '`v-memo` (3.2+) and `v-once` skip updates entirely — powerful, but you own correctness.',
  ],
}
