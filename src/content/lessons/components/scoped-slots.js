// Lesson: Scoped slots & slot props

const scopedApp = `<script setup>
import { ref } from 'vue'
import DataList from './DataList.vue'

const products = ref([
  { id: 1, name: 'Ceramic Mug', price: 12, stock: 4 },
  { id: 2, name: 'Notebook', price: 8, stock: 0 },
  { id: 3, name: 'Desk Plant', price: 20, stock: 9 },
])
</script>

<template>
  <h3>Plain rows (fallback)</h3>
  <DataList :items="products" />

  <h3>Custom rows</h3>
  <DataList :items="products" v-slot="{ item, index }">
    <span class="pos">{{ index + 1 }}.</span>
    <strong class="name">{{ item.name }}</strong>
    <span class="price">\${{ item.price }}</span>
  </DataList>
</template>`

const dataList = `<script setup>
defineProps({
  items: { type: Array, required: true },
})
</script>

<template>
  <ul class="data-list">
    <li v-for="(item, index) in items" :key="item.id" class="row">
      <!-- hand each item UP to the parent's slot content -->
      <slot :item="item" :index="index">
        {{ item.name }}
      </slot>
    </li>
  </ul>
</template>

<style scoped>
.data-list { list-style: none; padding: 0; margin: 4px 0 12px; max-width: 340px; }
.row { display: flex; gap: 8px; align-items: center; padding: 4px 8px; border-bottom: 1px dashed #bbb; }
</style>`

const tableApp = `<script setup>
import SimpleTable from './SimpleTable.vue'

const columns = ['name', 'price', 'stock']
const rows = [
  { id: 1, name: 'Ceramic Mug', price: 12, stock: 4 },
  { id: 2, name: 'Notebook', price: 8, stock: 0 },
]
</script>

<template>
  <SimpleTable class="plain" :columns="columns" :rows="rows" />

  <SimpleTable class="fancy" :columns="columns" :rows="rows">
    <template #cell="{ column, value }">
      <span v-if="column === 'price'" class="money">\${{ value.toFixed(2) }}</span>
      <span v-else-if="column === 'stock' && value === 0" class="sold-out">Sold out</span>
      <template v-else>{{ value }}</template>
    </template>
  </SimpleTable>
</template>`

const filterApp = `<script setup>
import FilterList from './FilterList.vue'

const books = [
  { id: 1, title: 'Dune' },
  { id: 2, title: 'Emma' },
  { id: 3, title: 'Dracula' },
]
</script>

<template>
  <FilterList :items="books">
    <template #item="{ item }">
      <span class="title">{{ item.title }}</span>
    </template>
    <template #footer="{ shown, total }">
      <p class="summary">{{ shown }} of {{ total }} shown</p>
    </template>
  </FilterList>
</template>`

export default {
  id: 'scoped-slots',
  title: 'Scoped slots & slot props',
  summary: 'Let a child hand data back to the slot content the parent wrote — so the child owns the logic and the parent owns the markup.',
  difficulty: 'intermediate',
  minutes: 30,
  prerequisites: ['slots'],
  related: ['slots', 'composables-intro', 'render-functions', 'large-lists', 'design-systems'],
  tags: ['scoped slots', 'slot props', 'v-slot', 'destructuring', 'renderless components', 'data table', 'named scoped slots'],
  apis: [
    { name: '<slot :prop="value">', summary: 'Passes slot props from the child to the slot content.' },
    { name: 'v-slot="{ a, b }"', summary: 'Receives slot props in the parent; any valid function-parameter destructuring works.' },
    { name: '#name="props"', summary: 'Receives slot props for a named scoped slot.' },
  ],
  docs: [
    { label: 'Vue Guide — Scoped Slots', url: 'https://vuejs.org/guide/components/slots.html#scoped-slots' },
    { label: 'Vue Guide — Renderless Components', url: 'https://vuejs.org/guide/components/slots.html#renderless-components' },
    { label: 'API — v-slot', url: 'https://vuejs.org/api/built-in-directives.html#v-slot' },
  ],

  intro: `
In the [slots](lesson:slots) lesson, slot content could only use the **parent's** data. But often the child has data the slot content needs: a list component knows *the current item*, a table knows *the current cell*, a data-fetcher knows *whether it's loading*.

**Scoped slots** solve this. The child passes values to its \`<slot>\` like props — \`<slot :item="item" />\` — and the parent receives them with \`v-slot\`: \`v-slot="{ item }"\`. These values are called **slot props**.

The result is a clean split of jobs: the **child owns the logic** (looping, filtering, state), the **parent owns the markup** (how each item looks).
`,

  why: `
Picture a reusable \`DataList\` that loops over items. With a plain slot, every row would show the same content — the parent has no way to know *which* item it's rendering. With props only, the list would have to guess how each row should look, and you'd be back to prop explosion (\`showPrice\`, \`priceFormat\`, \`badgeWhen\`…).

Scoped slots let each piece do what it knows best:

- The list knows the items, the order, the keys, the empty state.
- The parent knows the page: "on *this* page, rows show a position number, the name in bold and a price".

The same \`DataList\` then serves a product page, a user directory and a search result list without a single new prop. That's why UI libraries lean on scoped slots for tables, lists, dropdowns and virtual scrollers.
`,

  eli15: `
Remember the picture frame with holes? Now imagine a **photo booth** instead.

The booth (the child) does the hard work: it takes a photo of each person in line, one after another. But it lets *you* (the parent) design the printed strip: "put the photo in the middle, the person's name underneath, and a star if it's their birthday".

To do that, the booth hands you each photo **and** the person's name **and** whether it's their birthday. You use those pieces in your design.

That's a scoped slot: the child gives you data (*slot props*) for each thing it renders, and you decide how it looks.
`,

  analogy: {
    title: 'The photo booth and your print template',
    body: `
A photo booth processes a queue of people. For each person it produces a photo plus some details. You supply a print template that says how to lay those details out. The booth runs the queue; your template decides the look of every strip.
`,
    mapping: [
      ['the photo booth', 'the child component (owns the loop, state, logic)'],
      ['each person in the queue', 'each item the child renders'],
      ['the photo + details handed to you', 'slot props: `<slot :item="item" :index="i" />`'],
      ['your print template', 'the parent\'s slot content: `v-slot="{ item, index }"`'],
      ['a booth with no template uses its default print', 'fallback content inside `<slot>`'],
    ],
  },

  visual: {
    type: 'component-flow',
    props: { mode: 'scoped-slots' },
    title: 'Data up into the slot, markup in from the parent',
    caption: 'The child loops over its data and hands each item **up** to the parent\'s slot template, which decides how it looks. Click a component to see its code.',
    alt: 'An animated diagram: the parent provides a slot template; the child iterates over items and, for each one, sends an item packet into the template, which renders a row inside the child\'s list.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'A scoped slot is a function with arguments',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'tpl', label: 'Parent slot template', note: 'v-slot="{ item, index }"', tone: 'acid', x: 150, y: 70 },
        { id: 'fn', label: 'slot function', note: '({ item, index }) => row', tone: 'kraft', x: 400, y: 70 },
        { id: 'loop', label: 'DataList loop', note: 'v-for item in items', tone: 'cobalt', x: 640, y: 70 },
        { id: 'call1', label: 'call #1', note: '{ item: Mug, index: 0 }', x: 520, y: 240 },
        { id: 'call2', label: 'call #2', note: '{ item: Notebook, index: 1 }', x: 720, y: 240 },
        { id: 'rows', label: 'rendered rows', note: '1. Mug $12 / 2. Notebook $8', x: 220, y: 240 },
      ],
      edges: [
        { from: 'tpl', to: 'fn', label: 'compiled into' },
        { from: 'fn', to: 'loop', label: 'passed to child' },
        { from: 'loop', to: 'call1', label: 'slot({ item, index })' },
        { from: 'loop', to: 'call2' },
        { from: 'call1', to: 'rows' },
      ],
      steps: [
        { focus: ['tpl'], text: 'The parent writes a template for **one** row and declares which slot props it wants: `v-slot="{ item, index }"`.' },
        { focus: ['fn'], edges: ['tpl->fn'], text: 'The compiler turns it into a function whose **parameters** are the slot props. Destructuring works exactly like in a JavaScript function signature.' },
        { focus: ['loop'], edges: ['fn->loop'], text: 'The function is handed to `DataList`, which loops over its items.' },
        { focus: ['call1', 'call2'], edges: ['loop->call1', 'loop->call2'], text: 'For every item, the child calls the function with `{ item, index }` — that\'s what `<slot :item="item" :index="index" />` does.' },
        { focus: ['rows'], edges: ['call1->rows'], text: 'Each call returns the parent\'s markup filled with that item\'s data. The child placed them; the parent designed them.' },
      ],
    },
    caption: 'Step through how slot props travel from the child into the parent\'s template.',
    alt: 'A stepped diagram: the parent slot template compiles into a function taking item and index; DataList loops over its items and calls the function once per item with different slot props; the results become rendered rows.',
  },

  syntax: [
    `
**Child: pass slot props** by binding attributes on \`<slot>\` (any value — data, computed results, even functions):
`,
    {
      code: `<!-- DataList.vue -->
<script setup>
defineProps({ items: Array })
</script>

<template>
  <ul>
    <li v-for="(item, index) in items" :key="item.id">
      <slot :item="item" :index="index">
        {{ item.name }}            <!-- fallback -->
      </slot>
    </li>
  </ul>
</template>`,
      lang: 'vue',
      title: 'passing slot props',
    },
    `
**Parent: receive them** with \`v-slot\`. On the component tag (default slot only), or on a \`<template>\`:
`,
    {
      code: `<!-- the whole object -->
<DataList :items="products" v-slot="slotProps">
  {{ slotProps.index }}: {{ slotProps.item.name }}
</DataList>

<!-- destructured (most common) -->
<DataList :items="products" v-slot="{ item, index }">
  {{ index + 1 }}. {{ item.name }}
</DataList>

<!-- renamed + default value, like function parameters -->
<DataList :items="products" v-slot="{ item: product, index = 0 }">
  {{ product.name }}
</DataList>`,
      lang: 'vue',
      title: 'receiving slot props',
    },
    `
**Named scoped slots** — each \`<template #name="props">\` receives that slot's props. The \`name\` attribute on \`<slot>\` is reserved and is *not* passed as a prop:
`,
    {
      code: `<!-- FilterList.vue -->
<li v-for="item in filtered" :key="item.id">
  <slot name="item" :item="item" />
</li>
<slot name="footer" :shown="filtered.length" :total="items.length" />

<!-- parent -->
<FilterList :items="books">
  <template #item="{ item }">
    <span>{{ item.title }}</span>
  </template>
  <template #footer="{ shown, total }">
    <p>{{ shown }} of {{ total }} shown</p>
  </template>
</FilterList>`,
      lang: 'vue',
      title: 'named scoped slots',
    },
    `
**The mixing rule.** \`v-slot\` on the component tag only works when the default slot is the *only* slot. As soon as you also use named slots, write the default one explicitly as \`<template #default="{ item }">\`, so every slot's props have a clear scope:
`,
    {
      code: `<!-- ❌ compile error: v-slot on the component + a nested named template -->
<DataList :items="products" v-slot="{ item }">
  {{ item.name }}
  <template #empty>Nothing here</template>
</DataList>

<!-- ✅ every slot in its own <template> -->
<DataList :items="products">
  <template #default="{ item }">{{ item.name }}</template>
  <template #empty>Nothing here</template>
</DataList>`,
      lang: 'vue',
      title: 'default + named scoped slots',
    },
    `
**Renderless components.** A component can render *nothing but* a scoped slot, sharing only its logic and state:
`,
    {
      code: `<!-- MouseTracker.vue — renders only its slot -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
const x = ref(0), y = ref(0)
const update = (e) => { x.value = e.pageX; y.value = e.pageY }
onMounted(() => window.addEventListener('mousemove', update))
onUnmounted(() => window.removeEventListener('mousemove', update))
</script>

<template>
  <slot :x="x" :y="y" />
</template>

<!-- parent -->
<MouseTracker v-slot="{ x, y }">Mouse is at {{ x }}, {{ y }}</MouseTracker>`,
      lang: 'vue',
      title: 'a renderless component',
    },
    {
      callout: 'tip',
      title: 'Renderless component or composable?',
      text: 'Logic-only reuse is usually simpler as a [composable](lesson:composables-intro) (`const { x, y } = useMouse()`): no extra component instance and no template nesting. Reach for a renderless component when the reuse is genuinely about *template structure* — for example a list that also controls keys, ordering and empty states.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: scopedApp,
    intro: 'The same `DataList` used twice: once with its fallback rows, once with the parent\'s own row template.',
    steps: [
      { lines: [5, 9], text: 'The parent owns the data and passes it down as a normal prop. Scoped slots don\'t replace props — they work alongside them.' },
      { lines: [14], text: 'No slot content → each row shows the child\'s **fallback** (`{{ item.name }}` inside `<slot>`).' },
      { lines: [17], text: '`v-slot="{ item, index }"` receives the slot props `DataList` passes for each row. Because it\'s the only slot, `v-slot` can sit on the component tag.' },
      { lines: [18, 20], text: 'This template runs once **per item**. `item` and `index` come from the child; everything else (classes, markup, formatting) is the parent\'s choice.' },
    ],
  },

  playground: {
    title: 'One list component, many looks',
    objective: 'Receive slot props, use them in your own markup, add a named scoped slot and pass functions through slot props.',
    files: { 'App.vue': scopedApp, 'DataList.vue': dataList },
    expected: 'Two lists of the same three products. The first shows plain names (fallback); the second shows a position, the name in bold and a price — designed by the parent using data from the child.',
    experiments: [
      {
        id: 'sold-out',
        task: 'In the **custom rows**, show `<em class="sold-out">Sold out</em>` for items whose `stock` is `0`.',
        hint: 'Inside the slot template: `<em v-if="item.stock === 0" class="sold-out">Sold out</em>`.',
        tests: [
          {
            name: 'only the notebook row is marked sold out',
            code: `const rows = findAll('.data-list')[1].querySelectorAll('.row')
expect(rows[1].querySelector('.sold-out')).toBeTruthy()
expect(rows[0].querySelector('.sold-out')).toBeNull()
expect(rows[2].querySelector('.sold-out')).toBeNull()`,
          },
        ],
        explain: 'The slot prop `item` is the whole object, so the parent can use any field of it. The child didn\'t need to know that "sold out" was a thing.',
      },
      {
        id: 'empty-slot',
        task: 'Give `DataList` an `empty` slot: when `items` is empty, render `<p class="empty">` containing `<slot name="empty">No items.</slot>` **instead of** the list. Then add a third list in `App.vue`: `<DataList :items="[]">` with `<template #empty>Your wishlist is empty</template>`.',
        hint: 'In `DataList.vue`: `<p v-if="!items.length" class="empty">…</p>` and `v-else` on the `<ul>`.',
        tests: [
          {
            name: 'the empty list shows the custom message',
            code: `expect(exists('.empty')).toBe(true)
expect(text('.empty')).toBe('Your wishlist is empty')`,
          },
          {
            name: 'the other lists still render rows',
            code: `expect(findAll('.data-list')).toHaveLength(2)`,
          },
        ],
        explain: 'Named slots and scoped slots combine freely. The empty state is the child\'s logic ("are there items?"), while the wording is the parent\'s choice.',
      },
      {
        id: 'remove-fn',
        task: 'Slot props can be **functions**. Make `DataList` declare a `remove` event and pass `:remove="() => emit(\'remove\', item.id)"` to its slot. In the custom rows, add `<button class="remove" @click="remove">✕</button>` (destructure `remove` from the slot props) and handle `@remove` in `App.vue` by deleting that product.',
        hint: 'Child: `const emit = defineEmits([\'remove\'])`. Parent: `v-slot="{ item, index, remove }"` and `@remove="(id) => (products = products.filter((p) => p.id !== id))"`.',
        tests: [
          {
            name: 'clicking ✕ removes the product from both lists',
            code: `const before = findAll('.row').length
await click(findAll('.remove')[0])
expect(findAll('.row').length).toBe(before - 2)
expect(text()).not.toContain('Ceramic Mug')`,
          },
        ],
        explain: 'The child exposes an *action* for each row through the slot, and the parent decides where to put the button. The data change still happens in the parent, which owns `products`.',
      },
      {
        id: 'mixing',
        task: 'In the custom-rows list, add `<template #empty>Nothing to show</template>` *inside* the `<DataList … v-slot="{ item, index }">` tag. Read the compile error, then fix it by moving the row markup into `<template #default="{ item, index }">`.',
        explain: 'When several slots are used, `v-slot` on the component tag becomes ambiguous — whose scope do `item` and `index` belong to? Vue requires every slot to be written as its own `<template>` in that case. (Depending on the compiler version the error text can be cryptic, e.g. `Codegen node is missing for element/if/for node` — the cause is the same.)',
      },
    ],
  },

  internals: {
    beginner: `
A normal slot is a function the child calls with no arguments. A scoped slot is the **same function, called with arguments**. \`<slot :item="item" />\` means "call the parent's slot function with \`{ item }\`". \`v-slot="{ item }"\` is the parent saying "my function takes an object and pulls \`item\` out of it".
`,
    technical: [
      {
        code: `// Child: <slot :item="item" :index="index">{{ item.name }}</slot>
// compiles to roughly (simplified):
renderSlot($slots, 'default', { item, index }, () => [toDisplayString(item.name)])

// Parent: <DataList v-slot="{ item, index }">…</DataList>
// compiles to roughly:
h(DataList, { items }, {
  default: withCtx(({ item, index }) => [
    h('span', index + 1 + '.'),
    h('strong', item.name),
  ]),
  _: 1,
})`,
        lang: 'js',
        title: 'scoped slots are functions with parameters (simplified)',
      },
      `
Things that follow from this model:

- \`v-slot="…"\` accepts anything valid as a **function parameter**: destructuring, renaming (\`{ item: product }\`), defaults (\`{ index = 0 }\`).
- The function is called **once per \`<slot>\` render** — in a \`v-for\`, once per item, during the child's render. Reactive reads inside it are tracked by the child's render effect.
- The \`name\` attribute is consumed to pick the slot and is not included in the props object.
- Slot props are passed **by reference**. If the child passes its internal objects, the parent could mutate them — expose actions (functions) instead, and keep mutations with the owner.
`,
    ],
    production: `
- **Tables and lists** are the classic use: a \`DataTable\` with a generic \`cell\` slot, or per-column slots (the child binds \`<slot :name="'cell-' + col.key" :row="row" />\`, a page fills \`<template #cell-price="{ row }">\`), lets every page format columns differently without new props.
- **Expose actions, not internals**: pass \`toggle\`, \`remove\`, \`select\` functions through slot props rather than letting the parent mutate the child's state.
- **Prefer composables for pure logic reuse**; keep renderless components for cases where the component also owns structure (keys, ordering, virtualization, ARIA wiring).
- **Performance**: in long lists the slot function runs per row on each child render. Keep slot props small and avoid creating new objects/functions unnecessarily in very large lists; for thousands of rows, look at [virtual scrolling](lesson:large-lists).
- **Typing**: \`defineSlots()\` (3.3+) and generic components (\`<script setup generic="T">\`, TypeScript only) let editors check slot props. See [typing components](lesson:typing-components).
`,
  },

  mistakes: [
    {
      title: 'Forgetting to receive the slot props',
      wrong: { code: `<DataList :items="products">\n  {{ item.name }}   <!-- item is not defined in the parent -->\n</DataList>`, lang: 'vue' },
      right: { code: `<DataList :items="products" v-slot="{ item }">\n  {{ item.name }}\n</DataList>`, lang: 'vue' },
      explanation: 'Slot props are only available to slot content that declares them with `v-slot`. Without it, `item` is looked up in the parent\'s scope and is undefined.',
    },
    {
      title: 'Mixing v-slot on the component with named templates',
      wrong: { code: `<DataList :items="products" v-slot="{ item }">\n  {{ item.name }}\n  <template #empty>None</template>\n</DataList>`, lang: 'vue' },
      right: { code: `<DataList :items="products">\n  <template #default="{ item }">{{ item.name }}</template>\n  <template #empty>None</template>\n</DataList>`, lang: 'vue' },
      explanation: 'With more than one slot, write each slot as its own `<template>` so every set of slot props has an unambiguous scope.',
    },
    {
      title: 'Name mismatch between slot props and destructuring',
      wrong: { code: `<!-- child -->\n<slot :product="item" />\n\n<!-- parent -->\n<DataList v-slot="{ item }">{{ item.name }}</DataList>`, lang: 'vue' },
      right: { code: `<!-- parent -->\n<DataList v-slot="{ product }">{{ product.name }}</DataList>\n<!-- or rename: v-slot="{ product: item }" -->`, lang: 'vue' },
      explanation: 'Destructuring picks keys by name. The parent must use the names the child binds (or rename them explicitly).',
    },
    {
      title: 'A renderless component where a composable would do',
      wrong: { code: `<MouseTracker v-slot="{ x, y }">\n  <Crosshair :x="x" :y="y" />\n</MouseTracker>`, lang: 'vue' },
      right: { code: `<script setup>\nconst { x, y } = useMouse()\n</script>\n<template>\n  <Crosshair :x="x" :y="y" />\n</template>`, lang: 'vue' },
      explanation: 'If no markup structure is being shared, a composable avoids an extra component instance and template nesting.',
    },
  ],

  debugging: [
    {
      symptom: '`item` (or another slot prop) is `undefined` inside slot content.',
      cause: 'The parent didn\'t declare `v-slot`, the child didn\'t bind `:item`, or the names differ.',
      fix: 'Check that the child binds `<slot :item="…">` and the parent destructures the same name.',
    },
    {
      symptom: 'Compile error when adding a named `<template>` to a component that has `v-slot` on its tag.',
      cause: 'Mixing default-slot `v-slot` on the component with nested named slots is ambiguous.',
      fix: 'Move the default content into `<template #default="…">`.',
    },
    {
      symptom: 'The parent\'s slot template seems to receive a `name` prop of `undefined`.',
      cause: '`name` on `<slot>` is reserved for choosing the slot and is never passed as a slot prop.',
      fix: 'Bind a different key, e.g. `:label="item.name"`.',
    },
    {
      symptom: 'State inside the child changes "by itself" after interacting with slot content.',
      cause: 'The parent mutates an object received through slot props.',
      fix: 'Expose functions (`toggle`, `remove`) through slot props and let the owner perform the change.',
    },
  ],

  bestPractices: [
    'Let the child own logic and iteration; let the parent own markup through scoped slots.',
    'Destructure slot props (`v-slot="{ item }"`) and keep names consistent between child and parent.',
    'Expose actions as functions in slot props instead of letting the parent mutate child state.',
    'Always provide sensible fallback content for scoped slots.',
    'Use `<template #default>` as soon as a component has more than one slot.',
    'Prefer composables for logic-only reuse; use renderless components when structure matters too.',
  ],

  useCases: [
    'Generic lists and tables where each page formats rows/cells differently.',
    'Dropdowns and autocompletes that let the parent render each option.',
    'Virtual scrollers that render only visible items through a slot.',
    'Data-loading components exposing `{ data, loading, error }` to their slot.',
    'Form-field wrappers exposing `{ id, error }` so the parent can render a custom input.',
  ],

  whenToUse: {
    use: [
      'The child has per-item or internal data the parent\'s markup needs.',
      'You want one component to support many visual variations without new props.',
      'You\'re building a library component (table, list, select) used across many pages.',
    ],
    avoid: [
      'The content doesn\'t need any data from the child — a plain slot is enough.',
      'You only want to share logic, not structure — use a composable.',
      'The parent would need to reimplement most of the child\'s markup anyway — the abstraction may not be worth it.',
    ],
  },

  comparison: {
    title: 'Slot, scoped slot, renderless component, composable',
    headers: ['', 'Plain slot', 'Scoped slot', 'Renderless component', 'Composable'],
    rows: [
      ['Who writes the markup?', 'parent', 'parent', 'parent', 'whoever calls it'],
      ['Data from the child?', 'no', 'yes, via slot props', 'yes — that\'s all it provides', 'returned values'],
      ['Extra component instance?', 'n/a', 'n/a', 'yes', 'no'],
      ['Shares template structure?', 'yes', 'yes', 'no (renders only the slot)', 'no'],
      ['Typical', 'card body', 'table cells, list rows', 'mouse/position trackers (older style)', '`useMouse()`, `useFetch()`'],
    ],
    note: 'Since the Composition API, many renderless components are better written as composables.',
  },

  quiz: [
    {
      id: 'scoped-slots-q1',
      type: 'output',
      prompt: '`TodoList` renders `<slot name="footer" :remaining="todos.filter(t => !t.done).length" />` and has 3 todos, 1 of them done. What does the parent render?',
      code: {
        lang: 'vue',
        code: `<TodoList>
  <template #footer="{ remaining }">
    <p>{{ remaining }} left</p>
  </template>
</TodoList>`,
      },
      options: [
        { text: '3 left', why: 'The child computes the number of undone todos, which is 2.' },
        { text: '2 left' },
        { text: '1 left', why: 'That is the number of done todos.' },
        { text: 'undefined left', why: 'The slot prop name matches (`remaining`), so it is defined.' },
      ],
      answer: 1,
      explanation: 'The child passes `remaining` (2) as a slot prop; the parent destructures it and uses it in its own markup.',
    },
    {
      id: 'scoped-slots-q2',
      type: 'mcq',
      prompt: 'What does `v-slot="{ item: product, index = 0 }"` do?',
      options: [
        { text: 'Passes `product` and `index` from the parent into the child.', why: 'Slot props flow from child to slot content, not the other way.' },
        { text: 'Receives the `item` slot prop under the local name `product`, and `index` with a default of 0 if it is undefined.' },
        { text: 'Creates a new slot named `product`.', why: 'Slot names come after `#` / `v-slot:`, not inside the value.' },
        { text: 'It\'s invalid — `v-slot` only accepts a single identifier.', why: '`v-slot` accepts any valid function-parameter expression.' },
      ],
      answer: 1,
      explanation: 'The `v-slot` value is a function parameter, so JavaScript destructuring rules apply: renaming and defaults both work.',
    },
    {
      id: 'scoped-slots-q3',
      type: 'bug',
      prompt: 'This template fails to compile. Which line introduces the problem?',
      code: {
        lang: 'vue',
        code: `<UserTable :users="users" v-slot="{ user }">
  <td>{{ user.name }}</td>
  <td>{{ user.email }}</td>
  <template #empty>
    <p>No users yet.</p>
  </template>
</UserTable>`,
      },
      answerLine: 4,
      explanation: 'Adding a named `<template>` while `v-slot` is on the component tag creates scope ambiguity. Wrap the row cells in `<template #default="{ user }">` instead.',
    },
    {
      id: 'scoped-slots-q4',
      type: 'fill',
      prompt: 'Pass each todo to the slot, and receive it in the parent.',
      code: {
        lang: 'vue',
        code: `<!-- child -->
<li v-for="todo in todos" :key="todo.id">
  <slot name="item" ___="todo" />
</li>

<!-- parent -->
<template #item="___">
  {{ todo.text }}
</template>`,
      },
      answer: [[':todo', 'v-bind:todo'], ['{ todo }', '{todo}']],
      explanation: '`:todo="todo"` binds a slot prop; `#item="{ todo }"` destructures it in the parent.',
    },
    {
      id: 'scoped-slots-q5',
      type: 'mcq',
      prompt: 'You want to reuse "track the mouse position" logic in several components. Each component renders something different. What is usually the simplest choice in Vue 3?',
      options: [
        { text: 'A renderless `MouseTracker` component with a scoped slot.', why: 'It works, but adds a component instance and template nesting for pure logic.' },
        { text: 'A composable, e.g. `useMouse()` returning `{ x, y }`.' },
        { text: 'A global mixin.', why: 'Mixins are discouraged in Vue 3 — unclear sources of properties and name collisions.' },
        { text: 'An event bus broadcasting mouse coordinates.', why: 'Hides data flow and needs manual cleanup; composables are simpler.' },
      ],
      answer: 1,
      explanation: 'Pure logic reuse fits composables best. Renderless components shine when template structure is shared too.',
    },
    {
      id: 'scoped-slots-q6',
      type: 'mcq',
      prompt: 'The child writes `<slot name="row" :user="user" :label="user.name" />`. What does the parent\'s `#row="props"` receive as `props`?',
      options: [
        { text: '`{ name: \'row\', user, label }`', why: 'The reserved `name` attribute selects the slot; it never becomes a slot prop.' },
        { text: '`{ user, label }`' },
        { text: '`{ row: { user, label } }`', why: 'The slot name does not become a key in the props object.' },
        { text: '`{ user }`', why: '`label` is bound on the slot too, so it is passed as well.' },
      ],
      answer: 1,
      explanation: '`name` on `<slot>` is reserved for choosing the slot. Every other bound attribute becomes a slot prop.',
    },
    {
      id: 'scoped-slots-q7',
      type: 'short',
      prompt: 'In your own words: what problem do scoped slots solve that plain slots can\'t?',
      answer: 'Plain slot content can only use the parent\'s data. Scoped slots let the child pass data (and functions) to the slot content — like the current item in a loop — so the child keeps the logic (iteration, filtering, state) while the parent fully controls how each piece is rendered.',
    },
  ],

  exercises: [
    {
      id: 'simple-table',
      title: 'A table with a customisable cell slot',
      difficulty: 'intermediate',
      prompt: `
Finish \`SimpleTable.vue\`:

- Props: \`columns\` (array of keys) and \`rows\` (array of objects with an \`id\`).
- Render \`<table>\` with a header row of \`<th>\` (one per column) and one \`<tr class="data-row">\` per row containing one \`<td>\` per column.
- Each \`<td>\` renders a scoped slot named **\`cell\`** with the slot props \`row\`, \`column\` and \`value\` (= \`row[column]\`). Fallback: the raw \`value\`.

\`App.vue\` renders a plain table and a "fancy" one that formats prices (\`.money\`) and zero stock (\`.sold-out\`).
`,
      files: {
        'App.vue': tableApp,
        'SimpleTable.vue': `<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
})
</script>

<template>
  <table>
    <!-- TODO: header row and data rows with a scoped "cell" slot -->
  </table>
</template>`,
      },
      hints: [
        'Header: `<tr><th v-for="col in columns" :key="col">{{ col }}</th></tr>`.',
        'Rows: `<tr v-for="row in rows" :key="row.id" class="data-row">` with `<td v-for="col in columns" :key="col">` inside.',
        'In each cell: `<slot name="cell" :row="row" :column="col" :value="row[col]">{{ row[col] }}</slot>`.',
      ],
      solution: {
        explanation: 'The table owns iteration and structure; each cell hands `row`, `column` and `value` to the parent\'s template, which can format any column without the table knowing. The fallback keeps simple tables a one-liner.',
        files: {
          'App.vue': tableApp,
          'SimpleTable.vue': `<script setup>
defineProps({
  columns: { type: Array, required: true },
  rows: { type: Array, required: true },
})
</script>

<template>
  <table>
    <thead>
      <tr>
        <th v-for="col in columns" :key="col">{{ col }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="row in rows" :key="row.id" class="data-row">
        <td v-for="col in columns" :key="col">
          <slot name="cell" :row="row" :column="col" :value="row[col]">
            {{ row[col] }}
          </slot>
        </td>
      </tr>
    </tbody>
  </table>
</template>`,
        },
      },
      tests: [
        {
          name: 'renders headers and rows',
          code: `const plain = find('.plain')
expect(plain.querySelectorAll('th')).toHaveLength(3)
expect(plain.querySelectorAll('.data-row')).toHaveLength(2)`,
        },
        {
          name: 'fallback shows raw values',
          code: `const cells = find('.plain').querySelectorAll('.data-row')[0].querySelectorAll('td')
expect(cells[0].textContent.trim()).toBe('Ceramic Mug')
expect(cells[1].textContent.trim()).toBe('12')`,
        },
        {
          name: 'the cell slot receives column and value',
          code: `const fancy = find('.fancy')
expect(fancy.querySelector('.money').textContent.trim()).toBe('$12.00')
expect(fancy.querySelectorAll('.sold-out')).toHaveLength(1)
expect(fancy.querySelectorAll('.data-row')[1].textContent).toContain('Sold out')`,
        },
      ],
    },
    {
      id: 'filter-list',
      title: 'A FilterList with two named scoped slots',
      difficulty: 'intermediate',
      prompt: `
Finish \`FilterList.vue\`. It owns a search box and filters its \`items\` prop by \`title\` (case-insensitive "contains").

- Render \`<input class="query">\` bound to a local \`query\` ref.
- For each **filtered** item render \`<li class="item">\` containing the scoped slot \`item\` with slot prop \`item\`.
- After the list, render the scoped slot \`footer\` with slot props \`shown\` (number of filtered items) and \`total\` (number of all items).

\`App.vue\` is done.
`,
      files: {
        'App.vue': filterApp,
        'FilterList.vue': `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ items: { type: Array, required: true } })
const query = ref('')
// TODO: filtered list
</script>

<template>
  <div class="filter-list">
    <input class="query" placeholder="Filter…" />
    <ul>
      <!-- TODO -->
    </ul>
    <!-- TODO: footer slot -->
  </div>
</template>`,
      },
      hints: [
        '`const filtered = computed(() => props.items.filter((i) => i.title.toLowerCase().includes(query.value.toLowerCase())))`.',
        'Bind the input with `v-model="query"`; loop with `<li v-for="item in filtered" :key="item.id" class="item"><slot name="item" :item="item" /></li>`.',
        '`<slot name="footer" :shown="filtered.length" :total="items.length" />`.',
      ],
      solution: {
        explanation: 'The filtering logic and the query state live in the child; the parent decides how an item and the summary look. Named scoped slots let one component expose different data to different parts of the parent\'s markup.',
        files: {
          'App.vue': filterApp,
          'FilterList.vue': `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ items: { type: Array, required: true } })
const query = ref('')

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.items.filter((item) => item.title.toLowerCase().includes(q))
})
</script>

<template>
  <div class="filter-list">
    <input class="query" v-model="query" placeholder="Filter…" />
    <ul>
      <li v-for="item in filtered" :key="item.id" class="item">
        <slot name="item" :item="item">{{ item.title }}</slot>
      </li>
    </ul>
    <slot name="footer" :shown="filtered.length" :total="items.length" />
  </div>
</template>`,
        },
      },
      tests: [
        { name: 'shows all items initially', code: `expect(findAll('.item')).toHaveLength(3); expect(text('.summary')).toBe('3 of 3 shown')` },
        {
          name: 'filters case-insensitively',
          code: `await type('.query', 'D')
expect(findAll('.title').map((el) => el.textContent)).toEqual(['Dune', 'Dracula'])
expect(text('.summary')).toBe('2 of 3 shown')`,
        },
        { name: 'no matches', code: `await type('.query', 'xyz'); expect(findAll('.item')).toHaveLength(0); expect(text('.summary')).toBe('0 of 3 shown')` },
      ],
    },
  ],

  interview: [
    {
      id: 'scoped-slots-what',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'What are scoped slots and when would you use them?',
      answer: 'Scoped slots let a child pass data to the slot content the parent provides: the child binds attributes on `<slot>` (slot props) and the parent receives them with `v-slot="{ … }"`. Use them when the child owns logic or per-item data (lists, tables, selects, data loaders) but the parent should control the markup.',
      explanation: 'A normal slot is a function with no arguments; a scoped slot passes arguments.',
      whyAsked: 'Common in UI-library and design-system work.',
      mistakes: ['Confusing slot props with component props.', 'Thinking data flows from parent to child through slot props.'],
      followUps: ['How do named scoped slots work?', 'What is a renderless component?', 'How are they compiled?'],
      modelAnswer: 'Normally slot content only sees the parent\'s scope. A scoped slot lets the child pass values to it: `<slot :item="item" />` in the child, `v-slot="{ item }"` in the parent. I use them when the child owns the logic — iterating, filtering, loading — and the parent should decide the presentation, like a table where every page formats cells differently. Under the hood the slot is just a function the child calls with those props.',
    },
    {
      id: 'scoped-slots-renderless-vs-composable',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'Compare renderless components (scoped slots) with composables for sharing logic. Which do you choose and when?',
      answer: 'Both share stateful logic. A renderless component renders only a scoped slot and exposes its state as slot props; it adds a component instance and template nesting, and its state is only available inside that slot. A composable is a function returning reactive state; no extra instance, usable anywhere in `<script setup>`, easy to compose and test. Default to composables; use renderless/scoped-slot components when the reuse includes template structure (keys, ordering, ARIA, virtualization).',
      explanation: 'Composables replaced most renderless components after the Composition API arrived.',
      whyAsked: 'Shows modern Vue judgment and awareness of trade-offs.',
      mistakes: ['Always preferring renderless components out of habit from Vue 2.', 'Saying composables can\'t hold state.'],
      followUps: ['Give an example where a scoped-slot component is clearly better.', 'How do you test each?'],
      modelAnswer: 'A renderless component wraps logic in a component that only renders its scoped slot, so the state is only reachable inside that slot and you pay for an extra instance and nesting. A composable is just a function returning refs — no extra instance, usable in script, composable with other composables and trivial to unit test. So I default to composables. I\'d still pick a scoped-slot component when the reuse includes structure, like a virtual list that controls which rows exist and their keys.',
    },
    {
      id: 'scoped-slots-mixing',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 2,
      question: 'Why does Vue refuse to compile `<List v-slot="{ item }">…<template #empty>…</template></List>`, and how do you fix it?',
      answer: 'When `v-slot` is on the component tag, it defines the default slot\'s scope for all content inside. Nesting a named `<template>` inside makes the scope of `item` ambiguous, so Vue requires that when multiple slots are used, each one is declared with its own `<template>`: `<template #default="{ item }">…</template><template #empty>…</template>`.',
      explanation: 'One `<template>` per slot when there\'s more than one.',
      whyAsked: 'A frequent real error; shows hands-on experience.',
      mistakes: ['Moving `#empty` outside the component.', 'Not knowing `#default` exists.'],
      followUps: ['When is `v-slot` on the component tag allowed?'],
      modelAnswer: '`v-slot` on the component tag declares the default slot and its props for everything inside, so a nested named template would sit inside the default slot\'s scope — ambiguous. Vue enforces the rule that with more than one slot, every slot uses its own `<template>`. I\'d write `<template #default="{ item }">` for the rows and keep `<template #empty>` beside it.',
    },
    {
      id: 'scoped-slots-table-design',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Design a reusable `DataTable` that most pages can use with zero templates, but where any page can customise individual columns, the empty state and row actions.',
      answer: 'Props: `columns` (key, label, optional formatter), `rows`, `rowKey`, `loading`. Slots: a dynamic per-column scoped slot `cell-<key>` with `{ row, value }` and a generic `cell` fallback; `header-<key>` for custom headers; `empty` with fallback text; `actions` scoped slot with `{ row }` rendered in an extra column only when passed; `loading` slot. Expose actions (functions) rather than internal state. Type slots with `defineSlots`.',
      explanation: 'Sensible defaults via props, precise overrides via (dynamic) scoped slots.',
      code: {
        lang: 'vue',
        code: `<!-- DataTable.vue (excerpt) -->
<td v-for="col in columns" :key="col.key">
  <slot :name="'cell-' + col.key" :row="row" :value="row[col.key]">
    <slot name="cell" :row="row" :column="col" :value="row[col.key]">
      {{ col.format ? col.format(row[col.key]) : row[col.key] }}
    </slot>
  </slot>
</td>

<!-- a page -->
<DataTable :columns="cols" :rows="orders">
  <template #cell-total="{ value }"><strong>{{ money(value) }}</strong></template>
  <template #actions="{ row }"><button @click="refund(row.id)">Refund</button></template>
</DataTable>`,
      },
      whyAsked: 'Typical senior/design-system question combining props, slots and API ergonomics.',
      mistakes: ['Only slots (verbose for simple cases).', 'Only props (cannot render custom markup).', 'Letting pages mutate table state through slot props.'],
      followUps: ['How would you handle sorting state?', 'What about very large datasets?'],
      modelAnswer: 'I\'d make the common case zero-template: columns with labels and optional formatters, rows and a row key as props. Then layered scoped slots: a per-column `cell-<key>` slot using dynamic slot names, falling back to a generic `cell` slot, then to the formatter or raw value. An `actions` slot with `{ row }` adds a column only when passed, and an `empty` slot has a friendly fallback. Sorting state lives in the table and is exposed as functions, and for big data I\'d add virtualization.',
    },
    {
      id: 'scoped-slots-actions',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A `TodoList` component owns todo state internally and exposes each todo through a scoped slot. A page wants a checkbox per row. The current page code does `@change="todo.done = !todo.done"` on the slot prop. What\'s wrong and what would you change?',
      answer: 'The parent mutates an object owned by the child, hiding where state changes happen and bypassing any logic the list may need (persisting, sorting, counts). Expose an action instead: `<slot :todo="todo" :toggle="() => toggle(todo.id)" />`, and the page calls `toggle`. Better yet, if the page needs control of the data, lift the todos up and pass them as props.',
      explanation: 'Slot props are references; pass functions for changes.',
      whyAsked: 'Tests understanding of ownership with slots.',
      mistakes: ['Thinking slot props are copies.', 'Recommending emitting from slot content (slot content runs in the parent; it can\'t emit the child\'s events).'],
      followUps: ['Where should the todos live if two components need them?'],
      modelAnswer: 'Slot props are passed by reference, so the page is quietly mutating the list\'s internal state — the list can\'t react, persist or validate the change. I\'d expose an action through the slot, like `toggle`, and have the page call it. If several components need the todos, I\'d lift them into the parent or a store and make the list a presentational component.',
    },
    {
      id: 'scoped-slots-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: '`NumberList` renders `<li v-for="(n, i) in [10, 20, 30]"><slot :n="n" :i="i" /></li>`. The parent writes `<NumberList v-slot="{ n, i }">{{ i }}:{{ n * 2 }}</NumberList>`. What text appears?',
      options: ['10 20 30', '0:20 1:40 2:60', '1:20 2:40 3:60', '0:10 1:20 2:30'],
      correctOption: 1,
      answer: '`0:20 1:40 2:60` — the child passes each number and its zero-based index; the parent doubles the number in its own markup.',
      explanation: 'The slot function runs once per item with that item\'s slot props.',
      whyAsked: 'Quick check that you can trace data from child to slot content.',
      mistakes: ['Forgetting indexes start at 0.', 'Assuming the parent\'s expression runs once.'],
      followUps: ['How would you show a fallback when the parent passes no slot?'],
      modelAnswer: 'It shows "0:20 1:40 2:60". The child calls the slot once per number with `n` and the zero-based index `i`, and the parent\'s template multiplies `n` by two. The child controls iteration, the parent controls output.',
    },
    {
      id: 'scoped-slots-coding-toggle',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 8,
      question: 'Write a renderless `ToggleProvider.vue`: it keeps an `on` boolean (start `false`) and renders **only** its default scoped slot with the slot props `on` and `toggle`. `App.vue` uses it to build an FAQ answer that opens and closes.',
      starter: {
        files: {
          'App.vue': `<script setup>
import ToggleProvider from './ToggleProvider.vue'
</script>

<template>
  <ToggleProvider v-slot="{ on, toggle }">
    <button class="question" @click="toggle">What is Vue? {{ on ? '−' : '+' }}</button>
    <p v-if="on" class="answer">A progressive JavaScript framework.</p>
  </ToggleProvider>
</template>`,
          'ToggleProvider.vue': `<script setup>
// TODO: state + toggle
</script>

<template>
  <div>TODO</div>
</template>`,
        },
      },
      tests: [
        { name: 'starts closed', code: `expect(exists('.answer')).toBe(false); expect(text('.question')).toContain('+')` },
        { name: 'toggle opens and closes', code: `await click('.question'); expect(exists('.answer')).toBe(true); await click('.question'); expect(exists('.answer')).toBe(false)` },
        { name: 'renders no extra wrapper markup', code: `expect(find('#app > div')).toBeNull()` },
      ],
      hints: ['`const on = ref(false)` and `function toggle() { on.value = !on.value }`.', 'The template is just `<slot :on="on" :toggle="toggle" />`.'],
      answer: 'Keep `on` in a ref, define `toggle`, and render only `<slot :on="on" :toggle="toggle" />`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import ToggleProvider from './ToggleProvider.vue'
</script>

<template>
  <ToggleProvider v-slot="{ on, toggle }">
    <button class="question" @click="toggle">What is Vue? {{ on ? '−' : '+' }}</button>
    <p v-if="on" class="answer">A progressive JavaScript framework.</p>
  </ToggleProvider>
</template>`,
          'ToggleProvider.vue': `<script setup>
import { ref } from 'vue'

const on = ref(false)

function toggle() {
  on.value = !on.value
}
</script>

<template>
  <slot :on="on" :toggle="toggle" />
</template>`,
        },
      },
      explanation: 'The component contributes only behaviour; all markup comes from the parent. In real code, a `useToggle()` composable would do the same with less machinery.',
      whyAsked: 'Checks understanding of scoped slots as a logic-sharing mechanism — and invites the composable comparison.',
      mistakes: ['Wrapping the slot in an extra element.', 'Passing `on.value` once (a snapshot) — passing the ref in the template is unwrapped and reactive.'],
      followUps: ['Rewrite it as a `useToggle()` composable. Which would you ship?'],
      modelAnswer: 'I keep `on` in a ref, add a `toggle` function and render only `<slot :on="on" :toggle="toggle" />`, so the component has no markup of its own. The parent receives both through `v-slot` and builds whatever UI it wants. In practice I\'d probably ship a `useToggle()` composable instead — same logic, no extra component instance — unless the provider also needed to own some structure.',
    },
  ],

  takeaways: [
    'Scoped slots let the child pass data to the parent\'s slot content: `<slot :item="item" />` → `v-slot="{ item }"`.',
    'The child owns logic and iteration; the parent owns markup.',
    'The `v-slot` value is a function parameter: destructuring, renaming and defaults all work.',
    'With more than one slot, write each one as `<template #name="props">` — including `#default`.',
    'Pass functions through slot props for actions; keep mutations with the owner.',
    'For logic-only reuse, prefer composables over renderless components.',
  ],
}
