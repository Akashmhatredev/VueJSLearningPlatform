// Lesson: Large lists & virtual scrolling — Level 12, Performance

const virtualListVue = `<script setup>
import { ref, computed, watch } from 'vue'

// A SIMPLIFIED virtual list: fixed row height, vertical only.
const props = defineProps({
  items: { type: Array, required: true },
  rowHeight: { type: Number, default: 32 }, // every row must be exactly this tall
  height: { type: Number, default: 320 },   // visible area in px
  overscan: { type: Number, default: 2 },   // extra rows above and below the window
})
const emit = defineEmits(['range'])

const viewport = ref(null)
const scrollTop = ref(0)

function onScroll() {
  scrollTop.value = viewport.value.scrollTop
}

// Returns the previous object when nothing changed (Vue 3.4+), so
// scrolling less than a row doesn't re-render anything.
const range = computed((previous) => {
  const first = Math.floor(scrollTop.value / props.rowHeight)
  const visible = Math.ceil(props.height / props.rowHeight)
  const start = Math.max(0, first - props.overscan)
  const end = Math.min(props.items.length, first + visible + props.overscan)
  if (previous && previous.start === start && previous.end === end) return previous
  return { start, end }
})

const visibleRows = computed(() =>
  props.items
    .slice(range.value.start, range.value.end)
    .map((item, i) => ({ item, index: range.value.start + i })),
)

const totalHeight = computed(() => props.items.length * props.rowHeight)
const offset = computed(() => range.value.start * props.rowHeight)

watch(range, (r) => emit('range', r), { immediate: true })

function scrollToIndex(index) {
  viewport.value.scrollTop = index * props.rowHeight
  onScroll() // browsers also fire a scroll event; this keeps us in sync either way
}
defineExpose({ scrollToIndex })
</script>

<template>
  <div
    ref="viewport"
    class="viewport"
    :style="{ height: height + 'px', overflowY: 'auto' }"
    @scroll="onScroll"
  >
    <div class="spacer" :style="{ height: totalHeight + 'px' }">
      <div class="window" :style="{ transform: 'translateY(' + offset + 'px)' }">
        <div
          v-for="row in visibleRows"
          :key="row.item.id"
          class="row"
          :style="{ height: rowHeight + 'px' }"
        >
          <slot :item="row.item" :index="row.index" />
        </div>
      </div>
    </div>
  </div>
</template>`

const listApp = `<script setup>
import { ref, nextTick } from 'vue'
import VirtualList from './VirtualList.vue'

function makeRows(count) {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: 'Row ' + (i + 1),
    price: ((i * 37) % 1000) / 10,
  }))
}

const allItems = ref(makeRows(10000))
const list = ref(null)
const shown = ref({ start: 0, end: 0 })
const mode = ref('virtual')
const lastTiming = ref('')

function reverse() {
  allItems.value = [...allItems.value].reverse()
}

// Measures how long switching modes takes in YOUR browser
async function switchMode(next) {
  const t0 = performance.now()
  mode.value = next
  await nextTick()
  lastTiming.value = next + ' render took ' + Math.round(performance.now() - t0) + ' ms'
}
</script>

<template>
  <h2>10,000 rows</h2>
  <p class="info" v-if="mode === 'virtual'">
    Rendering {{ shown.end - shown.start }} of {{ allItems.length }} rows
    ({{ shown.start + 1 }}–{{ shown.end }})
  </p>
  <p class="timing">{{ lastTiming }}</p>
  <button class="reverse" @click="reverse">Reverse order</button>
  <button class="mode-plain" @click="switchMode('plain')">Render all (no virtualization)</button>
  <button class="mode-virtual" @click="switchMode('virtual')">Back to virtual</button>

  <VirtualList
    v-if="mode === 'virtual'"
    ref="list"
    :items="allItems"
    :row-height="32"
    :height="320"
    :overscan="2"
    @range="shown = $event"
  >
    <template #default="{ item, index }">
      #{{ index + 1 }} · {{ item.name }} · €{{ item.price.toFixed(2) }}
    </template>
  </VirtualList>

  <div v-else class="plain" style="height: 320px; overflow-y: auto">
    <div v-for="(item, index) in allItems" :key="item.id" class="row" style="height: 32px">
      #{{ index + 1 }} · {{ item.name }} · €{{ item.price.toFixed(2) }}
    </div>
  </div>
</template>`

export default {
  id: 'large-lists',
  title: 'Large lists & virtual scrolling',
  summary: 'Render thousands of rows without freezing the page: correct keys, pagination, lightweight data and a hand-built (simplified) virtual list that only renders what you can see.',
  difficulty: 'advanced',
  minutes: 45,
  prerequisites: ['list-rendering', 'how-vue-updates', 'render-optimization'],
  related: ['runtime-performance', 'shallow-and-raw', 'search-pagination', 'measuring-performance', 'accessibility-fundamentals'],
  tags: ['performance', 'v-for', 'keys', 'virtual scrolling', 'windowing', 'virtual list', 'pagination', 'infinite scroll', 'shallowRef', 'Object.freeze', 'content-visibility', 'accessibility'],
  apis: [
    { name: 'key (in v-for)', summary: 'A stable, unique identity per item so Vue can keep, move or remove the right element and component.' },
    { name: 'shallowRef()', summary: 'Tracks only replacement of .value — no deep proxies for each of thousands of items.' },
    { name: 'Object.freeze()', summary: 'Frozen (non-extensible) objects are not converted into reactive proxies.' },
    { name: 'defineExpose()', summary: 'Exposes methods like scrollToIndex() to a parent via a template ref.' },
  ],
  docs: [
    { label: 'Vue Guide — Performance: Virtualize Large Lists', url: 'https://vuejs.org/guide/best-practices/performance.html#virtualize-large-lists' },
    { label: 'Vue Guide — Performance: Reduce Reactivity Overhead for Large Immutable Structures', url: 'https://vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures' },
    { label: 'Vue Guide — List Rendering: Maintaining State with key', url: 'https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key' },
    { label: 'MDN — content-visibility', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility' },
  ],

  intro: `
A list of 20 items is free. A list of 20,000 items is a project.

Each rendered row costs **DOM nodes** (memory, style and layout work for the browser), often a **component instance** (setup, reactivity, lifecycle), and — if the data is deeply reactive — a **proxy** for every object you touch. Multiply by thousands and the first render takes noticeably long, scrolling stutters and memory climbs.

This lesson covers the whole toolbox: **keys** that keep rows attached to the right data, **pagination** and **infinite scroll**, **lightweight data** with \`shallowRef\` and frozen objects, and **virtual scrolling** — rendering only the rows inside the visible window. You'll build a simplified virtual list yourself and measure the difference in your own browser.
`,

  why: `
Users don't read 10,000 rows at once. They see the fifteen that fit on the screen. Rendering the other 9,985 is work they never benefit from — but pay for: in load time, in jank while scrolling, in battery.

There are two separate costs to manage:

1. **Rendering cost** — how many DOM nodes and component instances exist. Fix: render fewer (pagination, virtualization).
2. **Data cost** — how much reactive machinery wraps the data. Fix: don't make big read-only data deeply reactive.

And one correctness issue that gets worse with size: **keys**. A wrong key in a 5-row list is a small bug; in a long, sortable, editable list it scrambles user input.
`,

  eli15: `
Imagine a train with ten thousand carriages and one small station window. Passengers on the platform only ever see the two or three carriages passing the window.

You could build all ten thousand carriages and pull them past. Or you could be sneaky: build just enough carriages to fill the window (plus one or two spare on each side), and as the "train" moves, **repaint** the carriage that leaves on one side with the next carriage's number and push it back in on the other side. To the passengers it looks like a never-ending train.

That's a **virtual list**. The scrollbar is real and the right length (so it *feels* like 10,000 rows), but only about a dozen rows exist at any moment.
`,

  analogy: {
    title: 'The train past a small window',
    body: `
Only the carriages in the window need to exist. A long empty track keeps the scrollbar honest; a handful of reused carriages slide in and out with new numbers painted on.
`,
    mapping: [
      ['the station window', 'the scroll viewport (fixed height, overflow: auto)'],
      ['the full length of the track', 'a spacer element as tall as all rows together'],
      ['the few carriages that exist', 'the rendered window of rows (+ overscan)'],
      ['spare carriages on each side', 'overscan rows, so fast scrolling doesn\'t show gaps'],
      ['painting new numbers on carriages', 'Vue patching rows as the visible slice changes'],
      ['how far the train has moved', '`scrollTop` → start index = scrollTop / rowHeight'],
    ],
  },

  visual: {
    type: 'performance',
    props: { demo: 'virtual-list' },
    title: 'Virtual list vs everything, measured',
    caption: 'A live demo that renders a long list both ways and reports, from your own browser, how many DOM nodes exist and how long rendering took.',
    alt: 'A measured live demo comparing a fully rendered long list with a virtualized one. Counters show how many rows exist in the DOM and the time each approach took to render, measured in the learner\'s browser.',
  },

  syntax: [
    `
#### Keys: identity, not position
`,
    {
      code: `<!-- ✅ stable unique id: rows (and their state) follow their data -->
<TodoRow v-for="todo in todos" :key="todo.id" :todo="todo" />

<!-- ❌ index: after a remove/sort, row 0's DOM and component state
     are reused for whatever item is now first -->
<TodoRow v-for="(todo, i) in todos" :key="i" :todo="todo" />

<!-- ❌ random: every render is "all new rows" — everything is recreated -->
<TodoRow v-for="todo in todos" :key="Math.random()" :todo="todo" />`,
      lang: 'vue',
      title: 'keys',
    },
    `
An index key is only safe when the list never reorders, never has items inserted or removed except at the end, and rows hold no state of their own (no inputs, no local refs, no transitions). Since that's hard to guarantee as code evolves, use ids. If your data has no id, create one when the data enters the app (not during render).

#### Choosing a strategy

| Approach | DOM size | Good for | Watch out for |
|---|---|---|---|
| Render everything | grows with data | short lists (often fine up to hundreds) | measure — it depends on row complexity |
| Pagination | one page | search results, admin tables | users lose context between pages |
| Infinite scroll | grows as you scroll | feeds | DOM and memory keep growing; restore scroll on back |
| Virtual scrolling | ~what fits on screen | long uniform lists, logs, tables | accessibility, find-in-page, variable heights |
| \`content-visibility: auto\` (CSS) | all rows exist, off-screen ones skip rendering work | long documents, moderate lists | rows still exist in the DOM; check browser support |

#### The core of a virtual list (simplified, fixed row height)
`,
    {
      code: `const first   = Math.floor(scrollTop / rowHeight)        // first row in view
const visible = Math.ceil(viewportHeight / rowHeight)     // how many fit
const start   = Math.max(0, first - overscan)
const end     = Math.min(items.length, first + visible + overscan)

// render items.slice(start, end) inside:
//   .viewport  height: viewportHeight; overflow-y: auto      (scrolls)
//     .spacer  height: items.length * rowHeight             (real scrollbar)
//       .window transform: translateY(start * rowHeight)    (moves the rows into view)`,
      lang: 'js',
      title: 'windowing maths',
    },
    {
      callout: 'warn',
      title: 'This is a simplified virtual list',
      text: 'It assumes every row is exactly `rowHeight` pixels, scrolls vertically only and re-renders on every scroll event. Production libraries add: variable and dynamically measured row heights, horizontal and grid virtualization, sticky headers, scroll anchoring when items above change, keyboard navigation, `requestAnimationFrame`-throttled updates, and accessibility attributes. Neutral options to evaluate include **vue-virtual-scroller**, **TanStack Virtual** (\`@tanstack/vue-virtual\`) and VueUse\'s **useVirtualList** — read their docs and test with your own data.',
    },
    `
#### Lightweight data for big lists
`,
    {
      code: `import { shallowRef, triggerRef } from 'vue'

// Only replacing .value is tracked — no proxy per row
const rows = shallowRef(await api.loadRows())

// update by replacement (immutable style)…
rows.value = rows.value.map((r) => (r.id === id ? { ...r, starred: !r.starred } : r))

// …or mutate in place and notify manually
rows.value[0].starred = true
triggerRef(rows)

// Frozen objects are never proxied, even inside reactive state
const catalogue = ref(Object.freeze(bigReadOnlyArray))`,
      lang: 'js',
      title: 'shallowRef and frozen data',
    },
    {
      callout: 'note',
      title: 'Accessibility of virtual lists',
      text: 'Rows outside the window don\'t exist in the DOM, so the browser\'s find-in-page can\'t see them and assistive technology only perceives part of the list. Mitigations: provide search/filter UI, announce totals (e.g. `aria-setsize` / `aria-posinset` on list items, or `aria-rowcount` / `aria-rowindex` in grids), keep keyboard focus working as rows recycle, and don\'t virtualize lists that are short enough to render normally.',
    },
  ],

  walkthrough: {
    title: 'VirtualList.vue (simplified)',
    lang: 'vue',
    code: virtualListVue,
    intro: 'The reusable virtual list from the playground. About 70 lines — read it as an explanation of the idea, not as a production library.',
    steps: [
      { lines: [5, 10], text: 'Props: the full item array, a **fixed** row height, the viewport height and an overscan count. Fixed height is the big simplification — it lets us compute positions with multiplication instead of measuring rows.' },
      { lines: [13, 18], text: 'The only reactive scroll state: `scrollTop`, copied from the viewport element on each scroll event.' },
      { lines: [20, 29], text: 'The window maths. `first` is the first row in view; `start`/`end` add overscan on both sides and clamp to the list. Returning the `previous` object when start and end are unchanged (3.4+) keeps the computed **stable**, so most scroll events cause no re-render at all.' },
      { lines: [31, 35], text: 'Only `end - start` items are sliced and rendered. Each keeps its real index for display.' },
      { lines: [37, 38], text: '`totalHeight` gives the spacer the height of *all* rows, so the scrollbar looks right. `offset` pushes the rendered window down to where those rows would be.' },
      { lines: [42, 46], text: '`scrollToIndex()` is exposed to the parent through a template ref, for "jump to row" features.' },
      { lines: [50, 68], text: 'Viewport → spacer → translated window → rows. The rows are keyed by item id, so when the window moves, rows that stay visible are kept and the others are reused for new items.' },
    ],
  },

  playground: {
    title: 'A 10,000-row virtual list',
    objective: 'Scroll a 10,000-row list that only renders a dozen rows, measure the alternative, then extend the list.',
    files: { 'App.vue': listApp, 'VirtualList.vue': virtualListVue },
    expected: `
A scrollable box of rows and a line reading **Rendering 12 of 10000 rows (1–12)**. Scroll: the range changes, the count stays small. Click **Render all (no virtualization)** to render every row in a plain \`v-for\` — the timing line shows how long that took **in your browser** — then **Back to virtual** and compare.
`,
    experiments: [
      {
        id: 'observe',
        task: 'Scroll slowly and quickly, and watch the "Rendering N of 10000" line. Then try **Render all** and compare the timings and how scrolling feels.',
        hint: 'Your browser\'s DevTools Elements panel shows how many `.row` elements exist in each mode.',
        explain: 'The virtual list keeps roughly *visible + 2 × overscan* rows in the DOM, whatever the list size. Rendering everything scales with the data. Exact timings depend on your device — which is why we measure instead of quoting numbers.',
      },
      {
        id: 'overscan',
        task: 'Increase the overscan from **2** to **5** rows. How many rows are rendered at the top, and in the middle of the list?',
        hint: 'It\'s the `:overscan` prop on `<VirtualList>` in App.vue.',
        tests: [
          {
            name: 'at the top: 10 visible + 5 below = 15 rows',
            code: `expect(findAll('.viewport .row')).toHaveLength(15)`,
          },
          {
            name: 'in the middle: 5 + 10 + 5 = 20 rows',
            code: `const viewport = find('.viewport')
viewport.scrollTop = 100 * 32
await trigger('.viewport', 'scroll')
expect(findAll('.viewport .row')).toHaveLength(20)
expect(text('.info')).toContain('(96–115)')`,
          },
        ],
        explain: 'Overscan trades a few extra DOM rows for fewer blank flashes during fast scrolling. Too small: gaps appear while new rows render. Too large: you\'re back to rendering more than needed.',
      },
      {
        id: 'jump',
        task: 'Add a **Jump to row 5000** button (`class="jump"`) that calls the list\'s exposed `scrollToIndex(4999)`.',
        hint: 'The template ref `list` already points at the VirtualList: `<button class="jump" @click="list.scrollToIndex(4999)">Jump to row 5000</button>`.',
        tests: [
          {
            name: 'row 5000 is rendered after jumping',
            code: `await click('.jump')
const rows = findAll('.viewport .row').map((r) => r.textContent)
expect(rows.some((t) => t.includes('Row 5000 '))).toBe(true)
expect(rows.some((t) => t.includes('Row 1 '))).toBe(false)`,
          },
        ],
        explain: 'Jumping is just setting `scrollTop = index × rowHeight` — possible because every row has a known, fixed height. With variable heights, libraries have to estimate and correct positions, which is one of the hard parts they solve for you.',
      },
      {
        id: 'shallow-data',
        task: 'The 10,000 rows are wrapped in `ref()`, so every row object you touch becomes a reactive proxy. They\'re read-only — switch to `shallowRef()`. **Reverse order** must still work.',
        hint: 'Import `shallowRef` and use it for `allItems`. `reverse()` already replaces `.value` with a new array, which shallowRef tracks.',
        tests: [
          {
            name: 'rows are not deeply reactive, and reversing still works',
            code: `const { isReactive } = requireModule('vue')
expect(isReactive(state.allItems[0])).toBe(false)
await click('.reverse')
expect(findAll('.viewport .row')[0].textContent).toContain('Row 10000')`,
          },
        ],
        explain: '`shallowRef` only tracks assignments to `.value`. Replacing the whole array still triggers updates; the 10,000 row objects stay plain. For read-only or replace-only data this saves proxy creation and tracking for every row you read.',
      },
    ],
  },

  animation: {
    type: 'vdom',
    props: { preset: 'keys' },
    title: 'What keys change in a diff',
    caption: 'Step through the same list update with and without keys: with keys, existing items keep their elements and only the real change is applied; without, elements are patched by position.',
    alt: 'A conceptual virtual DOM comparison of a list update. With keys, matching items keep their DOM nodes and are moved or removed precisely; without keys, nodes are reused by position, so contents shift between elements.',
  },

  internals: {
    beginner: `
A virtual list is a trick with three boxes: an outer box you scroll, a very tall invisible box inside it that makes the scrollbar the right size, and a small group of rows that gets moved down to wherever you're looking. As you scroll, Vue swaps the rows' contents for the items that should now be visible.
`,
    technical: [
      `
**Why keys matter more in big lists.** When the visible slice moves by one row, the new slice shares all but one item with the old slice. Keyed by id, Vue keeps those rows' DOM nodes and component instances, removes one and creates one. Keyed by position (index within the slice), every row would be patched with a different item on every scroll — more work, and broken local state.

**What an update costs.** Each scroll event updates \`scrollTop\`, which invalidates the \`range\` computed. If the range didn't change (you scrolled less than a row), computed stability (3.4+) means the slice and the component don't update at all. If it did, the component re-renders a dozen or so rows — independent of the list size.

**Data cost.** \`ref(bigArray)\` makes the array reactive; each row object becomes a proxy when it is first accessed through it, and reads are tracked. \`shallowRef\` or frozen objects skip that: Vue doesn't proxy non-extensible objects, and a shallow ref never converts its value. The price: in-place mutations are invisible, so you replace (or call \`triggerRef\`).

**Browser limits.** Browsers cap how tall an element can be, so lists with millions of rows need extra tricks (scaling positions, chunking) that dedicated libraries implement. The simplified list here is fine for tens of thousands of fixed-height rows.
`,
      {
        callout: 'warn',
        title: 'Implementation detail',
        text: 'How Vue\'s keyed diff decides which nodes to move (it minimises moves for reordered lists) is internal and has been tuned across versions. Rely on the documented contract: same key → same element/component instance; changed key → recreated.',
      },
    ],
    production: `
- **Measure first.** Many lists of a few hundred simple rows are fine without virtualization. Profile a production build on a modest device before adding complexity.
- **Combine strategies:** server-side pagination or filtering to limit what you fetch, then virtualization for what you show.
- **Use a maintained library for production virtual lists** unless your case is as simple as fixed-height rows. Variable heights, scroll anchoring and accessibility are where homemade versions break.
- **Keep row components light.** With virtualization, rows are created and destroyed while scrolling; heavy setup in each row shows up as scroll jank. Plain elements or small components beat deep component trees per row.
- **Freeze or shallow big data** that's read-only, and update immutably.
- **Accessibility:** provide filtering/search, expose list size and position (\`aria-setsize\`/\`aria-posinset\` or grid row attributes), make keyboard navigation scroll the list, and don't virtualize what doesn't need it.
- **Infinite scroll:** cap or virtualize accumulated items, and restore the scroll position when users navigate back.
`,
  },

  mistakes: [
    {
      title: 'Using the index as key in an editable or sortable list',
      wrong: { code: `<TodoRow v-for="(todo, i) in todos" :key="i" :todo="todo" />\n<!-- remove the first todo: its local state moves to the next todo -->`, lang: 'vue' },
      right: { code: `<TodoRow v-for="todo in todos" :key="todo.id" :todo="todo" />`, lang: 'vue' },
      explanation: 'Index keys tie component instances and DOM nodes to positions. When items move, state (typed text, open menus, focus) stays at the position and ends up on the wrong item.',
    },
    {
      title: 'Generating keys during render',
      wrong: { code: `<li v-for="row in rows" :key="crypto.randomUUID()">{{ row.name }}</li>`, lang: 'vue' },
      right: { code: `// assign ids once, when data arrives\nrows.value = data.map((row, i) => ({ ...row, uid: row.id ?? 'row-' + i }))\n// <li v-for="row in rows" :key="row.uid">`, lang: 'vue' },
      explanation: 'A key that changes every render makes Vue recreate every element every time. Keys must be stable across renders.',
    },
    {
      title: 'Making big read-only data deeply reactive',
      wrong: { code: `const products = ref(await api.allProducts()) // a proxy for every product you touch`, lang: 'js' },
      right: { code: `const products = shallowRef(await api.allProducts())\n// replace, don't mutate: products.value = next`, lang: 'js' },
      explanation: 'Deep reactivity is useful for small mutable state. For thousands of rows you never mutate in place, it\'s overhead.',
    },
    {
      title: 'Virtualizing rows of unknown height with fixed-height maths',
      wrong: { code: `// rows contain wrapping text, but rowHeight is assumed to be 32px\n// → overlapping rows, jumping scrollbar`, lang: 'js' },
      right: { code: `// enforce a fixed height with CSS (truncate text),\n// or use a library that measures rows dynamically`, lang: 'js' },
      explanation: 'The simple formula only works when every row really is exactly `rowHeight` tall.',
    },
  ],

  debugging: [
    {
      symptom: 'After deleting or sorting, typed text or open panels appear on the wrong rows.',
      cause: 'The list is keyed by index (or by a non-unique value).',
      fix: 'Key by a stable unique id. Check for duplicate keys — Vue warns about them in development.',
    },
    {
      symptom: 'The page freezes for a moment when a large list first appears.',
      cause: 'Every row is created up front (DOM nodes, component instances, proxies).',
      fix: 'Measure, then paginate or virtualize; keep data in `shallowRef`; simplify row components.',
    },
    {
      symptom: 'Blank space flashes while scrolling a virtual list quickly.',
      cause: 'Overscan is too small, or each update does too much work per row.',
      fix: 'Increase overscan a little, lighten rows, and throttle updates to animation frames (libraries do this).',
    },
    {
      symptom: 'Rows overlap or the scrollbar jumps in a virtual list.',
      cause: 'Real row heights differ from the assumed fixed height.',
      fix: 'Enforce the height in CSS, or use a library with dynamic measurement.',
    },
    {
      symptom: 'Updating an item in a `shallowRef` list doesn\'t show on screen.',
      cause: 'Nested mutation of a shallow ref isn\'t tracked.',
      fix: 'Replace the array (or the item) immutably, or call `triggerRef(list)` after mutating.',
    },
  ],

  bestPractices: [
    'Always key list items by a stable unique id.',
    'Measure render time and scrolling on a production build and a modest device before optimising.',
    'Fetch less (pagination/filtering on the server), then render less (virtualization).',
    'Keep big read-only data in `shallowRef` or frozen objects; update by replacement.',
    'Keep virtualized rows cheap: few nodes, little setup.',
    'Prefer a maintained virtualization library for variable heights, grids and accessibility.',
    'Don\'t virtualize short lists; it costs accessibility and complexity for nothing.',
  ],

  useCases: [
    'Log viewers, chat histories and activity feeds with thousands of entries.',
    'Data tables and spreadsheets with many rows.',
    'Long dropdowns and pickers (countries, time zones, products).',
    'Infinite feeds that would otherwise grow without bound.',
    'Catalogues loaded once and filtered client-side (`shallowRef` + computed filters).',
  ],

  whenToUse: {
    use: [
      'Virtual scrolling for long, uniform lists where users scroll rather than search.',
      'Pagination when users navigate by page or results come from a server query.',
      '`shallowRef`/`Object.freeze` for large datasets you replace instead of mutate.',
    ],
    avoid: [
      'Virtualizing lists short enough to render normally.',
      'Index keys in any list that can reorder, insert, delete or holds row state.',
      'Fixed-height windowing for rows whose height you can\'t control.',
    ],
  },

  comparison: {
    title: 'Holding a big list in state',
    headers: ['', '`ref(array)`', '`shallowRef(array)`', '`ref(Object.freeze(array))`', 'plain constant'],
    rows: [
      ['Rows become proxies', 'yes, as they\'re accessed', 'no', 'no (frozen objects are skipped)', 'no'],
      ['`list.value = next` updates UI', 'yes', 'yes', 'yes', 'no — not reactive'],
      ['`list.value[0].x = 1` updates UI', 'yes', 'no (use `triggerRef`)', 'no — items aren\'t proxied (freeze items too to forbid it)', 'no'],
      ['`push()` updates UI', 'yes', 'no (use `triggerRef` or replace)', 'no — `push` on a frozen array throws', 'no'],
      ['Best for', 'small, mutable lists', 'big replace-only data', 'big truly read-only data', 'data that never changes'],
    ],
    note: 'More on these tools in [shallowRef, triggerRef, markRaw & toRaw](lesson:shallow-and-raw).',
  },

  quiz: [
    {
      id: 'large-lists-q1',
      type: 'mcq',
      prompt: 'When is using the array index as `key` acceptable?',
      options: [
        { text: 'Only when the list never reorders or has items inserted/removed (except at the end) and rows keep no state of their own' },
        { text: 'Always — Vue handles it', why: 'Vue will reuse elements by position, which moves row state to the wrong items when the list changes.' },
        { text: 'Never — it throws an error', why: 'It works without errors; that\'s why the bugs it causes are sneaky.' },
        { text: 'Whenever the list has fewer than 100 items', why: 'Size isn\'t the issue; reordering and row state are.' },
      ],
      answer: 0,
      explanation: 'Index keys are tied to positions. Stable ids are tied to data — use them by default.',
    },
    {
      id: 'large-lists-q2',
      type: 'output',
      prompt: 'Row height 40 px, viewport 400 px, overscan 2, 1,000 items. The user has scrolled to `scrollTop = 2000`. Which indexes are rendered?',
      code: {
        lang: 'js',
        code: `const first = Math.floor(scrollTop / rowHeight)
const visible = Math.ceil(viewport / rowHeight)
const start = Math.max(0, first - overscan)
const end = Math.min(total, first + visible + overscan)`,
      },
      options: [
        { text: '48 to 61 (start 48, end 62 exclusive)' },
        { text: '50 to 59', why: 'That ignores the overscan rows above and below.' },
        { text: '0 to 61', why: 'Rows above the window (minus overscan) aren\'t rendered.' },
        { text: '2000 to 2400', why: 'Those are pixel offsets; divide by the row height to get indexes.' },
      ],
      answer: 0,
      explanation: 'first = 2000/40 = 50, visible = 10, start = 48, end = 50 + 10 + 2 = 62, so indexes 48–61: 14 rows.',
    },
    {
      id: 'large-lists-q3',
      type: 'bug',
      prompt: 'Deleting the first comment makes the next comment\'s half-written reply disappear (and appear on another comment). Click the culprit line.',
      code: {
        lang: 'vue',
        code: `<template>
  <CommentCard
    v-for="(comment, index) in comments"
    :key="index"
    :comment="comment"
    @delete="remove(comment.id)"
  />
</template>`,
      },
      answerLine: 4,
      explanation: 'With index keys, deleting item 0 makes Vue reuse the first card\'s instance (and its local reply draft) for what used to be the second comment. Use `:key="comment.id"`.',
    },
    {
      id: 'large-lists-q4',
      type: 'fill',
      prompt: 'Fill the blanks for a big read-only list that should not be deeply reactive, then update it by replacement.',
      code: {
        lang: 'js',
        code: `const rows = ___(await api.loadRows())

function star(id) {
  rows.___ = rows.value.map((r) => (r.id === id ? { ...r, starred: true } : r))
}`,
      },
      answer: [['shallowRef'], ['value']],
      explanation: '`shallowRef` tracks only `.value` assignments; replacing the array triggers the update while rows stay plain objects.',
    },
    {
      id: 'large-lists-q5',
      type: 'mcq',
      prompt: 'Which is a genuine downside of virtual scrolling?',
      options: [
        { text: 'Off-screen rows aren\'t in the DOM, so find-in-page and assistive technology can\'t see the whole list' },
        { text: 'It makes the scrollbar the wrong length', why: 'A spacer sized to all rows keeps the scrollbar correct.' },
        { text: 'It only works with Pinia', why: 'Virtualization is independent of state management.' },
        { text: 'It always uses more memory than rendering everything', why: 'It usually uses far less DOM — that\'s the point.' },
      ],
      answer: 0,
      explanation: 'Compensate with search/filter UI, ARIA size/position attributes and careful keyboard support — and don\'t virtualize short lists.',
    },
    {
      id: 'large-lists-q6',
      type: 'output',
      prompt: 'What does this log?',
      code: {
        lang: 'js',
        code: `const list = shallowRef([{ id: 1, starred: false }])
console.log(isReactive(list.value[0]))

const frozen = reactive({ rows: Object.freeze([{ id: 1 }]) })
console.log(isReactive(frozen.rows))`,
      },
      options: [
        { text: '`false false`' },
        { text: '`true true`', why: 'shallowRef never converts its value, and frozen objects are never proxied.' },
        { text: '`false true`', why: 'Frozen (non-extensible) arrays are returned as-is by reactive conversion.' },
        { text: '`true false`', why: 'shallowRef doesn\'t make its contents reactive.' },
      ],
      answer: 0,
      explanation: 'Both techniques keep big data out of deep reactivity. The trade-off: in-place changes aren\'t tracked.',
    },
    {
      id: 'large-lists-q7',
      type: 'short',
      prompt: 'You need to show 50,000 log lines. Outline your approach in a few sentences.',
      answer: 'Measure first, but at that size plan to render only what is visible: virtualize the list with fixed-height rows (or a library that measures rows), key rows by a stable id, and keep the data in a shallowRef (or frozen) since log lines are read-only. Ideally fetch in pages from the server and append. Add search and filtering so users don\'t have to scroll everything, expose the total count accessibly, and verify scrolling smoothness on a production build and a modest device.',
    },
  ],

  exercises: [
    {
      id: 'index-key-bug',
      title: 'Notes that jump between todos',
      difficulty: 'intermediate',
      prompt: `
Each \`TodoItem\` has its own note field. Type a note on **Walk the dog**, then remove **Buy milk** — the note jumps to another todo.

- Rows have \`class="todo"\` with the title in \`class="title"\` and the note input \`class="note"\`.
- \`class="remove"\` removes that todo.
- A note must stay with **its** todo after removals.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'

const todos = ref([
  { id: 11, title: 'Buy milk' },
  { id: 12, title: 'Walk the dog' },
  { id: 13, title: 'Write report' },
])

function remove(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}
</script>

<template>
  <TodoItem
    v-for="(todo, index) in todos"
    :key="index"
    :todo="todo"
    @remove="remove(todo.id)"
  />
</template>`,
        'TodoItem.vue': `<script setup>
import { ref } from 'vue'

defineProps({ todo: { type: Object, required: true } })
defineEmits(['remove'])
const note = ref('') // local state belongs to THIS component instance
</script>

<template>
  <div class="todo">
    <span class="title">{{ todo.title }}</span>
    <input class="note" v-model="note" placeholder="note…" />
    <button class="remove" @click="$emit('remove')">✕</button>
  </div>
</template>`,
      },
      hints: [
        'Local state lives in a component *instance*. Which instance does Vue reuse for which todo after a removal?',
        'With `:key="index"`, instance #0 is reused for whatever todo is now first.',
        'Key by the todo\'s id: `:key="todo.id"`.',
      ],
      solution: {
        explanation: 'With id keys, removing "Buy milk" unmounts exactly that instance; "Walk the dog" keeps its own instance — and its `note` — just one position higher. Index keys had tied instances to positions, so the remaining todos were patched into the wrong instances.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import TodoItem from './TodoItem.vue'

const todos = ref([
  { id: 11, title: 'Buy milk' },
  { id: 12, title: 'Walk the dog' },
  { id: 13, title: 'Write report' },
])

function remove(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}
</script>

<template>
  <TodoItem
    v-for="todo in todos"
    :key="todo.id"
    :todo="todo"
    @remove="remove(todo.id)"
  />
</template>`,
          'TodoItem.vue': `<script setup>
import { ref } from 'vue'

defineProps({ todo: { type: Object, required: true } })
defineEmits(['remove'])
const note = ref('') // local state belongs to THIS component instance
</script>

<template>
  <div class="todo">
    <span class="title">{{ todo.title }}</span>
    <input class="note" v-model="note" placeholder="note…" />
    <button class="remove" @click="$emit('remove')">✕</button>
  </div>
</template>`,
        },
      },
      tests: [
        {
          name: 'a note stays with its todo after removing the one above',
          code: `await type(findAll('.note')[1], 'take the long route')
await click(findAll('.remove')[0])
const titles = findAll('.title').map((e) => e.textContent)
expect(titles).toEqual(['Walk the dog', 'Write report'])
expect(findAll('.note')[0].value).toBe('take the long route')
expect(findAll('.note')[1].value).toBe('')`,
        },
        { name: 'removing works', code: `await click(findAll('.remove')[2]); expect(findAll('.todo')).toHaveLength(2)` },
      ],
    },
    {
      id: 'shallow-catalogue',
      title: 'A catalogue without deep reactivity',
      difficulty: 'advanced',
      prompt: `
A catalogue of 2,000 products is loaded once and only ever "starred". Keep it out of deep reactivity without breaking starring.

- \`products\` must **not** be deeply reactive (its items must be plain objects).
- The first 20 products render as \`class="product"\`, each with a \`class="star"\` button showing **★** when starred and **☆** otherwise.
- \`class="count"\` shows **Starred: N**.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

function makeProducts(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: 'Product ' + (i + 1), starred: false }))
}

const products = ref(makeProducts(2000))
const firstPage = computed(() => products.value.slice(0, 20))
const starredCount = computed(() => products.value.filter((p) => p.starred).length)

function toggleStar(id) {
  const product = products.value.find((p) => p.id === id)
  product.starred = !product.starred
}
</script>

<template>
  <p class="count">Starred: {{ starredCount }}</p>
  <div v-for="p in firstPage" :key="p.id" class="product">
    {{ p.name }}
    <button class="star" @click="toggleStar(p.id)">{{ p.starred ? '★' : '☆' }}</button>
  </div>
</template>`,
      },
      hints: [
        '`shallowRef` keeps the items plain. But then `product.starred = …` is an untracked nested mutation.',
        'Either replace the array immutably, or mutate and then call `triggerRef(products)`.',
        '`products.value = products.value.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))`.',
      ],
      solution: {
        explanation: '`shallowRef` stops Vue from proxying 2,000 objects. Replacing `.value` with a new array (new object only for the changed product) is a tracked write, so both computeds and the template update. `triggerRef(products)` after an in-place mutation would also work; the immutable version has the bonus that unchanged products keep their identity.',
        files: {
          'App.vue': `<script setup>
import { shallowRef, computed } from 'vue'

function makeProducts(count) {
  return Array.from({ length: count }, (_, i) => ({ id: i + 1, name: 'Product ' + (i + 1), starred: false }))
}

const products = shallowRef(makeProducts(2000))
const firstPage = computed(() => products.value.slice(0, 20))
const starredCount = computed(() => products.value.filter((p) => p.starred).length)

function toggleStar(id) {
  products.value = products.value.map((p) => (p.id === id ? { ...p, starred: !p.starred } : p))
}
</script>

<template>
  <p class="count">Starred: {{ starredCount }}</p>
  <div v-for="p in firstPage" :key="p.id" class="product">
    {{ p.name }}
    <button class="star" @click="toggleStar(p.id)">{{ p.starred ? '★' : '☆' }}</button>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'products are not deeply reactive', code: `const { isReactive } = requireModule('vue'); expect(isReactive(state.products[0])).toBe(false)` },
        { name: 'starring updates the button', code: `await click(findAll('.star')[2]); expect(findAll('.star')[2].textContent).toBe('★')` },
        { name: 'starring updates the count', code: `await click(findAll('.star')[0]); await click(findAll('.star')[5]); expect(text('.count')).toBe('Starred: 2'); await click(findAll('.star')[0]); expect(text('.count')).toBe('Starred: 1')` },
      ],
    },
  ],

  interview: [
    {
      id: 'large-lists-10k-rows',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You need to display a table of 10,000 rows in Vue. What approaches would you consider, and how would you choose?',
      answer: 'First ask what users do with it and measure. Options: server-side pagination or filtering (render one page), infinite scroll (but DOM grows), virtual scrolling (render only visible rows plus overscan — best for long uniform lists), or `content-visibility: auto` for moderate sizes. Independently: key rows by id, keep row components light, and keep the data in `shallowRef`/frozen if it\'s read-only. Choose by interaction (browse vs search), row height uniformity, accessibility needs, and measured performance on a production build.',
      explanation: 'Render less, make the data lighter, keep keys correct — and decide based on measurement and UX.',
      whyAsked: 'A classic performance question that tests breadth (strategies) and judgement (trade-offs).',
      mistakes: ['Jumping straight to "use a virtual scroll library" without asking about UX.', 'Ignoring the data side (deep reactivity).', 'Forgetting accessibility.'],
      followUps: ['What breaks with variable row heights?', 'How would you keep find-in-page useful?', 'Where does the data come from — can the server paginate?'],
      modelAnswer: 'I\'d start with how people use the table and a measurement on a production build. If they search, server-side filtering and pagination might mean we never render 10,000 rows. If they scroll and scan, I\'d virtualize: render only the visible rows plus some overscan inside a spacer, using a maintained library if row heights vary. Either way I\'d key rows by id, keep row components light, and hold read-only data in a shallowRef so Vue doesn\'t proxy every row. I\'d also cover accessibility — search, row counts announced with ARIA attributes, keyboard navigation — and re-measure scroll smoothness.',
    },
    {
      id: 'large-lists-index-key',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'In a list of editable cards keyed by index, deleting a card makes the next card show the deleted card\'s unsaved edits. Why?',
      answer: 'Vue matches old and new children by key. With index keys, after deleting item 0 the key `0` now belongs to the former item 1, so Vue reuses the first card\'s component instance (with its local edit state and DOM) for a different item and removes the last instance. Use a stable unique id as the key.',
      explanation: 'Keys define identity. Index = identity by position, not by data.',
      whyAsked: 'One of the most common real Vue bugs; quick to ask, revealing to answer.',
      mistakes: ['Saying keys are "only for performance".', 'Suggesting `Math.random()` keys.'],
      followUps: ['When is an index key acceptable?', 'What if the data has no id?'],
      modelAnswer: 'Keys tell Vue which element or component instance belongs to which item. With index keys, deleting the first item shifts every item down one position, but the keys 0, 1, 2 stay in place — so Vue keeps the first instance and patches it with the next item\'s props, while its local state, the unsaved edits, stays. The last instance gets removed. Using a stable id as the key makes instances follow their data. If the data has no id, I assign one when it enters the app, never during render.',
    },
    {
      id: 'large-lists-virtual-tradeoffs',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What are the trade-offs and hard parts of virtual scrolling?',
      answer: 'Benefits: DOM size and per-update work stay roughly constant regardless of data size. Costs and hard parts: off-screen rows aren\'t in the DOM (find-in-page, screen readers, browser extensions can\'t see them); variable or dynamic row heights require measurement and position correction; scroll anchoring when items above change; jump-to-index and scroll restoration; keyboard focus as rows recycle; very large heights hit browser element-size limits; rows mount/unmount constantly, so heavy row setup causes jank; SSR/SEO only sees the initial window.',
      explanation: 'Virtualization moves complexity from the browser into your code — use it where it pays.',
      whyAsked: 'Tests whether the candidate has used virtualization in practice or only heard of it.',
      mistakes: ['Presenting it as a free win.', 'Ignoring accessibility.', 'Not knowing about variable-height issues.'],
      followUps: ['How do libraries handle variable heights?', 'How would you make a virtual list accessible?'],
      modelAnswer: 'Virtualization keeps the DOM small, so render and update cost no longer scale with the data. The price is that most of the list doesn\'t exist in the DOM, which hurts find-in-page, assistive technology and SEO. The technically hard parts are variable row heights — you need to measure rows and correct positions as you go — keeping the scroll position stable when content above changes, jumping to an index, and keeping keyboard focus as rows recycle. Rows also mount and unmount constantly, so they need to be cheap. That\'s why I use a maintained library for anything beyond fixed-height rows, and I don\'t virtualize lists that are short enough to render.',
    },
    {
      id: 'large-lists-shallow',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'For a 50,000-item list loaded from an API, compare `ref(list)`, `shallowRef(list)` and `ref(Object.freeze(list))`.',
      answer: '`ref` makes the array deeply reactive: every item accessed through it becomes a proxy and reads are tracked; in-place mutations update the UI. `shallowRef` tracks only `.value` assignments; items stay plain; update by replacing the array or with `triggerRef`. A frozen array (and frozen items) is never proxied and can\'t be mutated at all; you replace it wholesale. For big replace-only data, `shallowRef` (or freezing) avoids proxy and tracking overhead.',
      explanation: 'Pay for deep reactivity only where you mutate in place.',
      whyAsked: 'Checks knowledge of reactivity costs for large data — a common real-world performance lever.',
      mistakes: ['Thinking shallowRef is "not reactive".', 'Freezing data that needs in-place edits.', 'Forgetting nested mutations are invisible with shallowRef.'],
      followUps: ['How do you update one item in a shallowRef list?', 'What does Object.freeze cost?'],
      modelAnswer: 'With ref, the array is deeply reactive, so each item I touch becomes a proxy and every read is tracked — convenient for small mutable lists, overhead for 50,000 rows. shallowRef only reacts to assigning .value; the items stay plain objects, and I update by replacing the array, or mutate and call triggerRef. Freezing goes further: frozen objects are never proxied and can\'t be mutated, which suits truly read-only data. For an API payload I replace on refresh, I\'d pick shallowRef and immutable updates.',
    },
    {
      id: 'large-lists-infinite-feed',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design an infinite-scrolling social feed that stays fast after the user has scrolled through thousands of posts.',
      answer: 'Fetch pages with cursor-based pagination and an IntersectionObserver sentinel near the bottom; dedupe and guard against parallel fetches. Keep posts in a `shallowRef` (or normalized store) and append immutably. Virtualize rendering (variable heights → a library with measurement) so only nearby posts are in the DOM; key by post id. Lazy-load media with explicit dimensions to avoid layout shift, and pause off-screen video. Cap or evict very old pages from memory if needed, and persist scroll position and loaded pages for back navigation. Measure scroll performance and memory on low-end devices.',
      explanation: 'An infinite feed is pagination + virtualization + careful memory and media handling.',
      whyAsked: 'A system-design style frontend question that combines data fetching, rendering and UX.',
      mistakes: ['Appending forever to a deep reactive array and rendering all posts.', 'Ignoring media and layout shift.', 'Losing scroll position on back navigation.'],
      followUps: ['How do you handle new posts arriving at the top?', 'How would you test performance of the feed?'],
      modelAnswer: 'I\'d load pages with a cursor, triggered by an IntersectionObserver near the end of the list, making sure only one request is in flight and results are deduplicated by id. Posts would live in a shallowRef or a normalized store, appended immutably. Rendering would be virtualized with a library that measures variable heights, keyed by post id, so only posts near the viewport exist in the DOM. Images get explicit dimensions and lazy loading to avoid layout shift; videos pause when off-screen. For back navigation I\'d keep the loaded pages and scroll position, and for very long sessions I might evict distant pages. Then I\'d measure memory and scroll smoothness on a low-end phone.',
    },
    {
      id: 'large-lists-coding-virtual',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 12,
      question: 'Complete the simplified virtual list in **VirtualList.vue**: render only the rows in view plus overscan. Rows are 30 px, the viewport 300 px, overscan 3, and there are 1,000 items. The viewport has `class="viewport"`, the spacer `class="spacer"` (its height must cover all rows), and rows `class="row"`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import VirtualList from './VirtualList.vue'

const items = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, label: 'Item ' + (i + 1) }))
</script>

<template>
  <VirtualList :items="items" :row-height="30" :height="300" :overscan="3" />
</template>`,
          'VirtualList.vue': `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  rowHeight: { type: Number, required: true },
  height: { type: Number, required: true },
  overscan: { type: Number, default: 3 },
})

const viewport = ref(null)
const scrollTop = ref(0)

function onScroll() {
  scrollTop.value = viewport.value.scrollTop
}

// TODO: compute start/end from scrollTop and render only that slice
const start = computed(() => 0)
const end = computed(() => props.items.length)

const visible = computed(() => props.items.slice(start.value, end.value))
</script>

<template>
  <div ref="viewport" class="viewport" :style="{ height: height + 'px', overflowY: 'auto' }" @scroll="onScroll">
    <div class="spacer" :style="{ height: items.length * rowHeight + 'px' }">
      <div :style="{ transform: 'translateY(' + start * rowHeight + 'px)' }">
        <div v-for="item in visible" :key="item.id" class="row" :style="{ height: rowHeight + 'px' }">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'renders 13 rows at the top (10 visible + 3 overscan)', code: `expect(findAll('.row')).toHaveLength(13); expect(findAll('.row')[0].textContent.trim()).toBe('Item 1')` },
        { name: 'the spacer covers all rows', code: `expect(attr('.spacer', 'style')).toContain('height: 30000px')` },
        {
          name: 'after scrolling to row 100, renders rows 98–113',
          code: `const vp = find('.viewport')
vp.scrollTop = 3000
await trigger('.viewport', 'scroll')
const rows = findAll('.row')
expect(rows).toHaveLength(16)
expect(rows[0].textContent.trim()).toBe('Item 98')
expect(rows[15].textContent.trim()).toBe('Item 113')`,
        },
        {
          name: 'at the very end, clamps to the last item',
          code: `const vp = find('.viewport')
vp.scrollTop = 29700
await trigger('.viewport', 'scroll')
const rows = findAll('.row')
expect(rows[rows.length - 1].textContent.trim()).toBe('Item 1000')
expect(rows.length).toBeLessThan(20)`,
        },
      ],
      hints: [
        'The first row in view is `Math.floor(scrollTop / rowHeight)`; the number that fit is `Math.ceil(height / rowHeight)`.',
        'Subtract the overscan for `start` (not below 0) and add visible + overscan for `end` (not above `items.length`).',
        '`start = Math.max(0, first - overscan)`; `end = Math.min(items.length, first + visibleCount + overscan)`.',
      ],
      answer: 'Derive start and end from scrollTop with fixed-height maths, clamp them, and render items.slice(start, end) translated to start × rowHeight.',
      solution: {
        files: {
          'App.vue': `<script setup>
import VirtualList from './VirtualList.vue'

const items = Array.from({ length: 1000 }, (_, i) => ({ id: i + 1, label: 'Item ' + (i + 1) }))
</script>

<template>
  <VirtualList :items="items" :row-height="30" :height="300" :overscan="3" />
</template>`,
          'VirtualList.vue': `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  items: { type: Array, required: true },
  rowHeight: { type: Number, required: true },
  height: { type: Number, required: true },
  overscan: { type: Number, default: 3 },
})

const viewport = ref(null)
const scrollTop = ref(0)

function onScroll() {
  scrollTop.value = viewport.value.scrollTop
}

const first = computed(() => Math.floor(scrollTop.value / props.rowHeight))
const visibleCount = computed(() => Math.ceil(props.height / props.rowHeight))
const start = computed(() => Math.max(0, first.value - props.overscan))
const end = computed(() => Math.min(props.items.length, first.value + visibleCount.value + props.overscan))

const visible = computed(() => props.items.slice(start.value, end.value))
</script>

<template>
  <div ref="viewport" class="viewport" :style="{ height: height + 'px', overflowY: 'auto' }" @scroll="onScroll">
    <div class="spacer" :style="{ height: items.length * rowHeight + 'px' }">
      <div :style="{ transform: 'translateY(' + start * rowHeight + 'px)' }">
        <div v-for="item in visible" :key="item.id" class="row" :style="{ height: rowHeight + 'px' }">
          {{ item.label }}
        </div>
      </div>
    </div>
  </div>
</template>`,
        },
      },
      explanation: 'With fixed heights, positions are pure arithmetic. `start`/`end` are computeds, so scrolling within the same row doesn\'t re-slice (3.4+ computed stability), and rows are keyed by id so rows that stay in view keep their DOM. This is simplified: production versions handle variable heights, throttle to animation frames and add accessibility.',
      whyAsked: 'Implementing windowing shows understanding of scrolling, layout maths and Vue rendering together.',
      mistakes: ['Forgetting to clamp start/end.', 'Translating by scrollTop instead of start × rowHeight (rows jitter).', 'Keying rows by their index within the slice.'],
      followUps: ['How would you support variable row heights?', 'How would you throttle scroll handling?', 'What ARIA attributes would you add?'],
      modelAnswer: 'With fixed row heights, the first visible index is scrollTop divided by the row height, floored, and the number of visible rows is the viewport height over the row height, rounded up. I subtract the overscan for start and add the visible count plus overscan for end, clamping both to the list. I render only that slice inside a spacer that\'s as tall as all rows, translated down by start times row height, and key rows by id so rows that stay visible keep their DOM. For production I\'d throttle with requestAnimationFrame, support measured heights and add ARIA position attributes.',
    },
  ],

  takeaways: [
    'Big lists cost DOM nodes, component instances and (if deep) reactive proxies — measure which one hurts.',
    'Key list items by stable unique ids; index keys move row state to the wrong items.',
    'Render less: pagination, infinite scroll (with limits) or virtual scrolling.',
    'A virtual list renders only visible rows + overscan inside a full-height spacer (simplified here: fixed heights).',
    'Keep big read-only data in `shallowRef` or frozen objects and update by replacement.',
    'Virtualization has accessibility and complexity costs — use maintained libraries and don\'t virtualize short lists.',
  ],
}
