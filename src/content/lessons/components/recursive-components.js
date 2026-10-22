// Lesson: Recursive components

const treeApp = `<script setup>
import TreeItem from './TreeItem.vue'

const tree = {
  name: 'my-app',
  children: [
    {
      name: 'src',
      children: [
        { name: 'App.vue' },
        {
          name: 'components',
          children: [{ name: 'Button.vue' }, { name: 'Card.vue' }],
        },
      ],
    },
    { name: 'package.json' },
    { name: 'README.md' },
  ],
}
</script>

<template>
  <ul class="tree">
    <TreeItem :node="tree" />
  </ul>
</template>

<style>
.tree, .tree ul { list-style: none; padding-left: 0; margin: 0; }
.label { cursor: pointer; display: inline-block; padding: 2px 0; }
</style>`

const treeItem = `<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
})

const isFolder = computed(() => Array.isArray(props.node.children))
const open = ref(true) // each folder remembers its own open/closed state
</script>

<template>
  <li class="tree-item">
    <span class="label" @click="open = !open">
      {{ isFolder ? (open ? '▾' : '▸') : '•' }} {{ node.name }}
    </span>

    <!-- the recursion: a TreeItem renders more TreeItems -->
    <ul v-if="isFolder && open">
      <TreeItem
        v-for="child in node.children"
        :key="child.name"
        :node="child"
      />
    </ul>
  </li>
</template>`

const threadApp = `<script setup>
import CommentItem from './CommentItem.vue'

const comments = [
  {
    id: 1, author: 'Ada', text: 'Recursion is elegant.',
    replies: [
      { id: 2, author: 'Alan', text: 'Until you forget the base case.', replies: [
        { id: 3, author: 'Ada', text: 'Ha! True.', replies: [] },
      ] },
      { id: 4, author: 'Grace', text: 'Trees everywhere.', replies: [] },
    ],
  },
  { id: 5, author: 'Linus', text: 'Show me the code.', replies: [] },
]
</script>

<template>
  <ul class="thread">
    <CommentItem v-for="c in comments" :key="c.id" :comment="c" />
  </ul>
</template>`

const menuApp = `<script setup>
import { ref } from 'vue'
import MenuItem from './MenuItem.vue'

const menu = [
  { id: 'home', label: 'Home' },
  {
    id: 'settings', label: 'Settings', children: [
      { id: 'profile', label: 'Profile' },
      { id: 'account', label: 'Account', children: [
        { id: 'billing', label: 'Billing' },
        { id: 'security', label: 'Security' },
      ] },
    ],
  },
]

const selectedId = ref(null)
const selectedLabel = ref('none')

function onSelect(item) {
  selectedId.value = item.id
  selectedLabel.value = item.label
}
</script>

<template>
  <ul class="menu">
    <MenuItem
      v-for="item in menu"
      :key="item.id"
      :item="item"
      :selected-id="selectedId"
      @select="onSelect"
    />
  </ul>
  <p class="current">Current: {{ selectedLabel }}</p>
</template>`

const orgFiles = {
  'App.vue': `<script setup>
import EmployeeNode from './EmployeeNode.vue'

const ceo = {
  name: 'Maya', reports: [
    { name: 'Tom', reports: [{ name: 'Ines', reports: [] }, { name: 'Raj', reports: [] }] },
    { name: 'Lea', reports: [] },
  ],
}
</script>

<template>
  <ul class="org">
    <EmployeeNode :person="ceo" />
  </ul>
</template>`,
}

export default {
  id: 'recursive-components',
  title: 'Recursive components',
  summary: 'Render tree-shaped data — folders, comment threads, menus — with a component that renders itself, and learn the base case, event and state patterns that keep it sane.',
  difficulty: 'intermediate',
  minutes: 25,
  prerequisites: ['props', 'emits'],
  related: ['provide-inject', 'list-rendering', 'large-lists', 'scoped-slots', 'render-functions'],
  tags: ['recursive components', 'self-reference', 'tree', 'nested data', 'base case', 'file tree', 'comments thread', 'menu'],
  apis: [
    { name: 'self-reference by file name', summary: 'An SFC named `TreeItem.vue` can render `<TreeItem>` inside its own template without importing itself.' },
    { name: 'name option', summary: 'Options API / non-SFC components need an explicit `name` to refer to themselves.' },
  ],
  docs: [
    { label: 'Vue — SFC <script setup>: recursive components', url: 'https://vuejs.org/api/sfc-script-setup.html#recursive-components' },
    { label: 'Vue Examples — Tree View', url: 'https://vuejs.org/examples/#tree' },
  ],

  intro: `
Some data is shaped like a **tree**: a folder contains files *and other folders*; a comment has replies, which have replies; a menu item can open a sub-menu.

A **recursive component** is a component that uses **itself** in its own template. \`TreeItem\` shows one node and, if that node has children, renders a \`TreeItem\` for each child — which may render more \`TreeItem\`s, and so on, as deep as the data goes.

In a single-file component, this needs no import: a file named \`TreeItem.vue\` can simply write \`<TreeItem />\` in its template.
`,

  why: `
You could try to render a file tree with nested \`v-for\` loops:

\`\`\`vue
<li v-for="a in tree.children">
  {{ a.name }}
  <ul><li v-for="b in a.children">
    {{ b.name }}
    <ul><li v-for="c in b.children">…</li></ul>   <!-- how deep do we go? -->
  </li></ul>
</li>
\`\`\`

But you'd have to guess the maximum depth, and every level duplicates the same markup. Real trees don't have a fixed depth.

A recursive component describes **one level** — "show this node, then do the same for each child" — and lets the data decide how deep it goes. As a bonus, every node becomes its own component instance, so each folder can remember whether *it* is open or closed.
`,

  eli15: `
Think of Russian nesting dolls. Each doll has the same design, and when you open it, there might be a smaller doll inside — with the same design again. You don't need a different instruction manual for every size: "open it; if there's a doll inside, do the same thing again".

A recursive component is that instruction: "show this item; if it has children, show each child **the same way**".

The important part is knowing when to **stop**. The smallest doll is solid — nothing inside. In code, that's the **base case**: a file with no children just shows its name and doesn't render any more \`TreeItem\`s.
`,

  analogy: {
    title: 'Russian nesting dolls',
    body: `
Every doll follows one design. Opening a doll may reveal another doll that follows the same design, until you reach the smallest solid doll. The set can be as deep as the maker likes; the design never changes.
`,
    mapping: [
      ['the doll design', 'the recursive component (`TreeItem.vue`)'],
      ['a doll inside a doll', 'a `<TreeItem>` rendered inside `TreeItem`\'s template'],
      ['"do the same thing again"', 'passing each child as the `node` prop to another `TreeItem`'],
      ['the smallest, solid doll', 'the base case: a node with no children'],
      ['each doll is its own object', 'each node is its own component instance with its own state'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The component tree mirrors the data tree',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'root', label: 'TreeItem', note: 'my-app (folder)', tone: 'ink', x: 380, y: 40 },
        { id: 'src', label: 'TreeItem', note: 'src (folder)', tone: 'cobalt', x: 200, y: 140 },
        { id: 'pkg', label: 'TreeItem', note: 'package.json', x: 470, y: 140 },
        { id: 'readme', label: 'TreeItem', note: 'README.md', x: 650, y: 140 },
        { id: 'app', label: 'TreeItem', note: 'App.vue', x: 90, y: 250 },
        { id: 'comps', label: 'TreeItem', note: 'components (folder)', tone: 'cobalt', x: 300, y: 250 },
        { id: 'btn', label: '… Button.vue, Card.vue', note: 'base cases', tone: 'acid', x: 560, y: 285 },
      ],
      edges: [
        { from: 'root', to: 'src', label: 'node' },
        { from: 'root', to: 'pkg' },
        { from: 'root', to: 'readme' },
        { from: 'src', to: 'app' },
        { from: 'src', to: 'comps', label: 'node' },
        { from: 'comps', to: 'btn' },
      ],
      steps: [
        { focus: ['root'], text: 'App renders **one** `TreeItem` and gives it the whole tree as its `node` prop.' },
        { focus: ['src', 'pkg', 'readme'], edges: ['root->src', 'root->pkg', 'root->readme'], text: 'That node is a folder, so it renders a `TreeItem` for each child — the **same component**, with a smaller piece of data.' },
        { focus: ['pkg', 'readme'], text: '`package.json` and `README.md` have no `children`: they show their name and render nothing more. That\'s the **base case** that stops the recursion.' },
        { focus: ['comps', 'app'], edges: ['src->app', 'src->comps'], text: '`src` is a folder too, so the pattern repeats one level deeper.' },
        { focus: ['btn'], edges: ['comps->btn'], text: 'The recursion ends when every branch reaches a file. The depth was decided by the **data**, not by the template.' },
      ],
    },
    caption: 'Each data node gets its own `TreeItem` instance; files are the base case.',
    alt: 'A tree diagram of TreeItem component instances that mirrors a file tree: my-app at the top with children src, package.json and README.md; src has App.vue and components; components ends with Button.vue and Card.vue, labelled as base cases.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Props go down every level — events must climb back up',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'app', label: 'App', note: 'selected = ?', tone: 'acid', x: 130, y: 50 },
        { id: 'l0', label: 'TreeItem (my-app)', x: 130, y: 135 },
        { id: 'l1', label: 'TreeItem (src)', x: 130, y: 210 },
        { id: 'l2', label: 'TreeItem (Card.vue)', note: 'clicked', tone: 'red', x: 130, y: 285 },
        { id: 'inject', label: 'provide / inject', note: 'shortcut for deep trees', tone: 'cobalt', x: 520, y: 170 },
      ],
      edges: [
        { from: 'app', to: 'l0', label: ':node' },
        { from: 'l0', to: 'l1', label: ':node' },
        { from: 'l1', to: 'l2', label: ':node' },
        { from: 'l2', to: 'inject', label: 'select(file)', dashed: true },
        { from: 'inject', to: 'app', dashed: true },
      ],
      steps: [
        { focus: ['app', 'l0', 'l1', 'l2'], edges: ['app->l0', 'l0->l1', 'l1->l2'], text: 'Data flows **down** level by level: each `TreeItem` passes one child to the next as the `node` prop.' },
        { focus: ['l2'], text: 'The user clicks `Card.vue`, three levels deep. It emits `select`.' },
        { focus: ['l1', 'l0', 'app'], text: 'Component events don\'t bubble, so **every** `TreeItem` must listen and re-emit: `@select="(f) => emit(\'select\', f)"`. Forget one level and the event dies there.' },
        { focus: ['inject', 'app'], edges: ['l2->inject', 'inject->app'], text: 'For deep trees, the root can `provide` a `select` function (or the selection state) and any level can `inject` it — no re-emitting chain.' },
      ],
    },
    caption: 'Passing data down a recursive tree is natural; passing events up needs re-emitting at every level, or provide/inject.',
    alt: 'A vertical chain App → TreeItem (my-app) → TreeItem (src) → TreeItem (Card.vue) with arrows labelled :node going down. A dashed path from the clicked Card.vue node goes through a provide/inject box straight to App, bypassing the intermediate levels.',
  },

  syntax: [
    `
**Self-reference.** In a single-file component, the file name is the component's name, so \`TreeItem.vue\` can use \`<TreeItem>\` inside its own template — no import:
`,
    {
      code: `<!-- TreeItem.vue -->
<script setup>
import { computed } from 'vue'
const props = defineProps({ node: Object })
const isFolder = computed(() => Array.isArray(props.node.children))
</script>

<template>
  <li>
    {{ node.name }}
    <!-- base case: files (no children) stop here -->
    <ul v-if="isFolder">
      <!-- progress: each child gets a SMALLER piece of data -->
      <TreeItem
        v-for="child in node.children"
        :key="child.id ?? child.name"
        :node="child"
      />
    </ul>
  </li>
</template>`,
      lang: 'vue',
      title: 'TreeItem.vue renders itself',
    },
    `
**The three rules of a healthy recursive component:**

1. **A base case** — something that stops the recursion (a node with no children, \`v-if\`, a maximum depth).
2. **Progress** — each level must pass a *smaller* part of the data (\`child\`, never the same \`node\`), or it never ends.
3. **Stable keys** among siblings, like any \`v-for\`.

**Naming notes:**

- The self-reference has **lower priority than imports**: if you import another component called \`TreeItem\` in the same file, that wins. Import it under an alias if you must.
- Outside SFCs (or with an Options API object that isn't in a named file), a component needs an explicit \`name\` option to refer to itself. With \`<script setup>\` you can set one with \`defineOptions({ name: 'TreeItem' })\` (3.3+), but it's rarely needed.

**Passing extra information down** — like the current depth:
`,
    {
      code: `<script setup>
const props = defineProps({
  node: Object,
  depth: { type: Number, default: 0 },
})
</script>

<template>
  <li :style="{ paddingLeft: depth * 16 + 'px' }">
    {{ node.name }}
    <ul v-if="node.children">
      <TreeItem v-for="child in node.children" :key="child.name" :node="child" :depth="depth + 1" />
    </ul>
  </li>
</template>`,
      lang: 'vue',
      title: 'tracking depth',
    },
    `
**Sending events up.** Events only reach the direct parent, so each level re-emits what it hears from its children:
`,
    {
      code: `<script setup>
defineProps({ node: Object })
const emit = defineEmits(['select'])
</script>

<template>
  <li>
    <span @click="emit('select', node)">{{ node.name }}</span>
    <ul v-if="node.children">
      <TreeItem
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        @select="(n) => emit('select', n)"
      />
    </ul>
  </li>
</template>`,
      lang: 'vue',
      title: 're-emitting through every level',
    },
    {
      callout: 'tip',
      text: 'For deep trees, [provide/inject](lesson:provide-inject) avoids the re-emit chain: the root provides a `select` function or the selection state, and every level injects it.',
    },
  ],

  walkthrough: {
    title: 'TreeItem.vue',
    lang: 'vue',
    code: treeItem,
    intro: 'The whole recursion lives in one small file.',
    steps: [
      { lines: [4, 6], text: 'Each instance receives **one node** of the tree. The root instance gets the whole tree; deeper instances get smaller subtrees.' },
      { lines: [8], text: 'A folder is any node with a `children` array. Files are the **base case**.' },
      { lines: [9], text: 'Local state, per instance: every folder has its own `open` ref because every node is a separate component instance.' },
      { lines: [14, 16], text: 'Show this node. Clicking toggles *this* folder only.' },
      { lines: [19], text: 'The base case, made explicit: files (`isFolder` is false) never render another level, and closed folders skip theirs. What guarantees the recursion ends is that every branch of the data eventually reaches a node without children — cyclic data would never stop.' },
      { lines: [20, 24], text: 'The recursion: `<TreeItem>` inside `TreeItem.vue`, resolved by file name. Each child gets its own instance with a smaller `node`.' },
    ],
  },

  playground: {
    title: 'A collapsible file tree',
    objective: 'Render nested data with a self-referencing component, then pass depth down, compute recursively, and send events back up through every level.',
    files: { 'App.vue': treeApp, 'TreeItem.vue': treeItem },
    expected: 'A file tree starting at **my-app**. Clicking a folder name collapses or expands just that folder.',
    experiments: [
      {
        id: 'depth-indent',
        task: 'Indent each level: add a `depth` prop (default `0`), pass `:depth="depth + 1"` to the children, and give the `.label` an inline `padding-left` of `depth × 16px`.',
        hint: '`<span class="label" :style="{ paddingLeft: depth * 16 + \'px\' }" …>`.',
        tests: [
          {
            name: 'Button.vue (depth 3) is indented by 48px',
            code: `const label = findAll('.label').find((el) => el.textContent.includes('Button.vue'))
expect(label.style.paddingLeft).toBe('48px')`,
          },
          {
            name: 'the root is not indented',
            code: `const root = findAll('.label')[0]
expect(['', '0px']).toContain(root.style.paddingLeft)`,
          },
        ],
        explain: 'Each level knows nothing about the levels above except what it receives. Passing `depth + 1` down is how information accumulates through a recursion.',
      },
      {
        id: 'file-count',
        task: 'Next to each **folder**, show how many files it contains at any depth, in `<span class="count">`, e.g. **(5)** for my-app and **(3)** for src.',
        hint: 'Write a recursive *function*: `const countFiles = (n) => n.children ? n.children.reduce((sum, c) => sum + countFiles(c), 0) : 1`, then `computed(() => countFiles(props.node))`.',
        tests: [
          {
            name: 'folders show their file counts',
            code: `const counts = findAll('.count').map((el) => el.textContent.trim())
expect(counts[0]).toBe('(5)')
expect(counts[1]).toBe('(3)')
expect(counts[2]).toBe('(2)')`,
          },
          {
            name: 'files show no count',
            code: `expect(findAll('.count')).toHaveLength(3)`,
          },
        ],
        explain: 'Recursive *data* invites recursive *functions*. The component recursion renders levels; the function recursion computes across them.',
      },
      {
        id: 'select-file',
        task: 'Clicking a **file** should report it to `App`: emit `select` with the file name from `TreeItem`, **re-emit** it from every level, and in `App.vue` show `<p class="selected">Selected: Card.vue</p>`.',
        hint: 'In `TreeItem`: `const emit = defineEmits([\'select\'])`; on the label `@click="isFolder ? (open = !open) : emit(\'select\', node.name)"`; on the child `<TreeItem … @select="(name) => emit(\'select\', name)" />`. In App: `const selected = ref(\'\')` and `@select="(name) => (selected = name)"`.',
        tests: [
          {
            name: 'a single TreeItem emits select for a file',
            code: `const item = mountFile('TreeItem.vue', { node: { name: 'notes.txt' } })
await click(item.find('.label'))
expect(item.emitted('select')).toEqual([['notes.txt']])`,
          },
          {
            name: 'a deep file reaches App',
            code: `const label = findAll('.label').find((el) => el.textContent.includes('Card.vue'))
await click(label)
expect(text('.selected')).toBe('Selected: Card.vue')`,
          },
        ],
        explain: 'Card.vue sits three levels below the root `TreeItem`. Its event had to be re-emitted by `components`, `src` and `my-app` before App heard it — that\'s why deep trees often use provide/inject instead.',
      },
      {
        id: 'lost-state',
        task: 'Collapse **components**. Now collapse **src** and open it again. Is **components** still collapsed?',
        explain: 'No — it is open again. Collapsing `src` removed its children with `v-if`, which **unmounted** their instances and destroyed their local `open` state. Re-opening created fresh instances. To remember expansion across collapses, keep the state outside the instances (for example a `Set` of open paths in the root, provided to every level) or use `v-show`.',
      },
    ],
  },

  internals: {
    beginner: `
Vue doesn't do anything magic for recursion. When \`TreeItem\` renders and meets \`<TreeItem>\` in its own template, it creates a new instance — exactly as it would for any child component. That instance renders, maybe meets \`<TreeItem>\` again, and so on, until a node has no children. You end up with a tree of component instances shaped exactly like your data.
`,
    technical: [
      `
Because \`TreeItem\` isn't imported in its own file, the compiler can't reference it as a variable. Instead it emits a name lookup with a "maybe self-reference" flag:
`,
      {
        code: `// Simplified idea of TreeItem.vue's compiled render function
const _component_TreeItem = resolveComponent('TreeItem', /* maybeSelfReference */ true)
// 1. look in locally/globally registered components
// 2. otherwise, if the current component's own name is 'TreeItem'
//    (inferred from the file name TreeItem.vue), use the component itself`,
        lang: 'js',
        title: 'how self-reference resolves (simplified)',
      },
      `
Every level is a full component instance with its own props, state and render effect, so a change to one folder's \`open\` re-renders only that folder. Mounting is itself recursive — rendering a parent mounts its children inside the same call — so each level adds to the JavaScript call stack. Real-world trees are rarely deep enough for that to matter, but **cyclic data** (a node that contains one of its ancestors) never reaches a base case and ends in a stack overflow.

\`v-if\` on the children list means collapsed branches aren't rendered at all: their instances don't exist. That's great for performance and the reason local state is lost on collapse.
`,
    ],
    production: `
- **Centralise shared state**: selection, expanded paths and checked items usually belong to the root (or a store) and are passed down or [provided](lesson:provide-inject). Per-node \`ref\`s are fine for purely visual, disposable state.
- **Huge trees** (thousands of nodes) are slow as thousands of component instances. Render only expanded branches, load children lazily from the server, or flatten the visible tree into a list with \`depth\` and use [virtual scrolling](lesson:large-lists).
- **Guard against bad data**: user- or server-supplied trees can contain cycles. Track visited ids or enforce a maximum depth.
- **Accessibility**: tree widgets need \`role="tree"\` / \`role="treeitem"\`, \`aria-expanded\` and keyboard navigation (arrow keys) — see [accessible components](lesson:accessible-components).
- **Customisable rendering**: a recursive component can forward a [scoped slot](lesson:scoped-slots) to its children (\`<TreeItem …><template #default="p"><slot v-bind="p" /></template></TreeItem>\`) so the page decides how each node looks.
`,
  },

  mistakes: [
    {
      title: 'Passing the same node down (no progress)',
      wrong: { code: `<!-- passes the same node again! -->\n<TreeItem\n  v-for="child in node.children"\n  :key="child.name"\n  :node="node"\n/>`, lang: 'vue' },
      right: { code: `<TreeItem\n  v-for="child in node.children"\n  :key="child.name"\n  :node="child"\n/>`, lang: 'vue' },
      explanation: 'Each level must receive a smaller piece of the data. Passing the same node renders the same folder inside itself forever, until the stack overflows.',
    },
    {
      title: 'Per-node selection state',
      wrong: { code: `// TreeItem.vue\nconst selected = ref(false)   // every node decides on its own\n// → several nodes can be "selected" at once`, lang: 'js' },
      right: { code: `// root owns the selection; each node compares\ndefineProps({ node: Object, selectedId: String })\n// :class="{ active: node.id === selectedId }"`, lang: 'js' },
      explanation: 'State that must be consistent across the whole tree ("only one selected") belongs to the root or a store, not to each instance.',
    },
    {
      title: 'Forgetting to re-emit at one level',
      wrong: { code: `<TreeItem v-for="child in node.children" :key="child.name" :node="child" />\n<!-- no @select listener: events from deeper levels stop here -->`, lang: 'vue' },
      right: { code: `<TreeItem\n  v-for="child in node.children"\n  :key="child.name"\n  :node="child"\n  @select="(n) => emit('select', n)"\n/>`, lang: 'vue' },
      explanation: 'Component events don\'t bubble. Every level must forward them, or use provide/inject to skip the chain.',
    },
    {
      title: 'An import that shadows the self-reference',
      wrong: { code: `<!-- TreeItem.vue -->\n<script setup>\nimport TreeItem from './legacy/TreeItem.vue' // now <TreeItem> means THIS one\n</script>`, lang: 'vue' },
      right: { code: `<script setup>\nimport LegacyTreeItem from './legacy/TreeItem.vue'\n</script>`, lang: 'vue' },
      explanation: 'Imported components take priority over the implicit self-reference. Alias imports that share the file\'s name.',
    },
  ],

  debugging: [
    {
      symptom: '`RangeError: Maximum call stack size exceeded` while rendering a tree.',
      cause: 'No base case is reached: the same node is passed down, or the data contains a cycle.',
      fix: 'Pass `child`, not `node`; check the data for cycles; add a depth limit as a safety net.',
    },
    {
      symptom: '`Failed to resolve component: TreeItem` inside TreeItem itself.',
      cause: 'The tag doesn\'t match the file name (e.g. the file is `Node.vue` but the template says `<TreeItem>`), or it\'s an Options API / non-SFC component without a `name`.',
      fix: 'Match the tag to the file name, or set a `name` (`defineOptions({ name })` in 3.3+).',
    },
    {
      symptom: 'Clicking a deep node does nothing in the root.',
      cause: 'One level doesn\'t re-emit the event.',
      fix: 'Add the re-emitting listener on the recursive child tag, or switch to provide/inject.',
    },
    {
      symptom: 'Sub-folders forget whether they were open after their parent is collapsed.',
      cause: '`v-if` unmounts the children, destroying their local state.',
      fix: 'Store expanded ids in the root (provided down), or use `v-show` if the branches are small.',
    },
    {
      symptom: 'The tree becomes sluggish with thousands of nodes.',
      cause: 'Thousands of component instances are rendered at once.',
      fix: 'Render only expanded branches, lazy-load children, or flatten + virtualize the visible rows.',
    },
  ],

  bestPractices: [
    'Always have a clear base case and always pass a smaller piece of data down.',
    'Use stable, unique keys among siblings (ids rather than indexes).',
    'Keep tree-wide state (selection, expanded paths) in the root or a store; keep only disposable UI state per node.',
    'Re-emit events at each level for shallow trees; use provide/inject for deep ones.',
    'Render children only when expanded, and consider flattening + virtualization for big trees.',
    'Validate untrusted tree data for cycles or excessive depth.',
  ],

  useCases: [
    'File and folder explorers.',
    'Nested comment threads and replies.',
    'Multi-level navigation menus and sitemaps.',
    'Organisation charts and category trees.',
    'JSON / object viewers and nested settings panels.',
  ],

  whenToUse: {
    use: [
      'The data is a tree whose depth isn\'t fixed.',
      'Every level looks and behaves the same way.',
      'Each node benefits from its own instance (local open/closed state).',
    ],
    avoid: [
      'The depth is fixed and small (two levels) — plain nested `v-for` is simpler.',
      'Very large trees that must render all at once — flatten and virtualize instead.',
      'Each level looks completely different — separate components are clearer.',
    ],
  },

  comparison: {
    title: 'Rendering tree data',
    headers: ['', 'Nested `v-for`', 'Recursive component', 'Flattened list + depth'],
    rows: [
      ['Handles any depth?', 'no — fixed in the template', 'yes', 'yes'],
      ['Per-node state', 'awkward', 'natural (one instance per node)', 'kept in a central map'],
      ['Events to the root', 'direct', 're-emit per level or provide/inject', 'direct'],
      ['Very large trees', 'n/a', 'many instances — can get slow', 'works with virtual scrolling'],
      ['Best for', '1–2 known levels', 'most trees in UIs', 'thousands of rows'],
    ],
  },

  quiz: [
    {
      id: 'recursive-components-q1',
      type: 'mcq',
      prompt: 'How can `TreeItem.vue` (using `<script setup>`) render a nested `<TreeItem>`?',
      options: [
        { text: 'It must `import TreeItem from \'./TreeItem.vue\'` inside itself.', why: 'Not needed: an SFC can refer to itself by its file name.' },
        { text: 'It can just write `<TreeItem>` — an SFC can refer to itself by its file name.' },
        { text: 'Recursion requires a render function.', why: 'Templates support recursion fine.' },
        { text: 'It must be registered globally first.', why: 'Self-reference works without any registration.' },
      ],
      answer: 1,
      explanation: 'Vue infers the component\'s name from the file name and resolves `<TreeItem>` to the component itself (unless an import of the same name exists).',
    },
    {
      id: 'recursive-components-q2',
      type: 'output',
      prompt: 'Every folder starts open. How many `<li class="tree-item">` elements are rendered?',
      code: {
        lang: 'js',
        code: `const tree = {
  name: 'docs',
  children: [
    { name: 'intro.md' },
    { name: 'guide', children: [{ name: 'a.md' }, { name: 'b.md' }] },
  ],
}
// App: <ul><TreeItem :node="tree" /></ul>
// Each TreeItem renders one <li class="tree-item"> plus its children`,
      },
      options: [
        { text: '3', why: 'Count every node, including the folders: docs, intro.md, guide, a.md, b.md.' },
        { text: '4', why: 'Don\'t forget the root folder itself.' },
        { text: '5' },
        { text: '2', why: 'Only top-level items? Recursion renders every level.' },
      ],
      answer: 2,
      explanation: 'One `TreeItem` (and one `<li>`) per node: docs, intro.md, guide, a.md and b.md.',
    },
    {
      id: 'recursive-components-q3',
      type: 'bug',
      prompt: 'Rendering this tree crashes with "Maximum call stack size exceeded". Which line is wrong?',
      code: {
        lang: 'vue',
        code: `<template>
  <li>
    {{ node.name }}
    <ul v-if="node.children">
      <TreeItem
        v-for="child in node.children"
        :key="child.id"
        :node="node"
      />
    </ul>
  </li>
</template>`,
      },
      answerLine: 8,
      explanation: 'It passes the same `node` instead of `child`, so every level renders the same folder again — the recursion never reaches a base case.',
    },
    {
      id: 'recursive-components-q4',
      type: 'fill',
      prompt: 'Complete the recursive call inside `CommentItem.vue`.',
      code: {
        lang: 'vue',
        code: `<ul v-if="comment.replies.length">
  <___
    v-for="reply in comment.replies"
    :key="reply.id"
    :comment="___"
  />
</ul>`,
      },
      answer: [['CommentItem'], ['reply']],
      explanation: 'The component renders itself by its file name and passes each reply as the next level\'s `comment`.',
    },
    {
      id: 'recursive-components-q5',
      type: 'mcq',
      prompt: 'A node four levels deep emits `select`. The root component listens with `@select`. Under what condition does the root receive it?',
      options: [
        { text: 'Always — events bubble up the component tree.', why: 'Component events only reach the direct parent.' },
        { text: 'Only if every level in between re-emits `select` (or the tree uses provide/inject instead).' },
        { text: 'Only if `select` is declared in the root\'s `defineEmits`.', why: 'The root listens; declaring emits in the root changes nothing for receiving.' },
        { text: 'Only with the `.capture` modifier.', why: 'Component events have no capture phase.' },
      ],
      answer: 1,
      explanation: 'Each recursive level is a separate parent/child pair, so the event must be forwarded at each step — or bypass the chain with provide/inject.',
    },
    {
      id: 'recursive-components-q6',
      type: 'mcq',
      prompt: 'You collapse sub-folder **B**, then collapse and reopen its parent **A**. B is open again. Why?',
      options: [
        { text: 'Vue resets all refs on every re-render.', why: 'Refs keep their values across re-renders of the same instance.' },
        { text: 'Collapsing A removed its children with `v-if`, unmounting B\'s instance and its local state; reopening created a fresh B.' },
        { text: 'The `key` changed.', why: 'Keys are stable here; the instance was destroyed because it left the DOM.' },
        { text: 'It\'s a Vue bug.', why: 'It\'s expected behaviour of conditional rendering.' },
      ],
      answer: 1,
      explanation: 'Local state lives as long as the instance. Keep expansion state outside the instances (or use `v-show`) to remember it.',
    },
    {
      id: 'recursive-components-q7',
      type: 'short',
      prompt: 'What are the two things every recursive component needs so that rendering terminates?',
      answer: 'A base case — a condition where it stops rendering itself (e.g. a node without children, or `v-if`) — and progress: each recursive call must receive a smaller part of the data (a child, not the same node), so every branch eventually reaches the base case. Cyclic data breaks the second rule.',
    },
  ],

  exercises: [
    {
      id: 'comment-thread',
      title: 'A nested comment thread',
      difficulty: 'intermediate',
      prompt: `
Finish \`CommentItem.vue\` so it renders a comment and, recursively, all its replies.

- Root: \`<li class="comment">\` with an extra class \`depth-N\`, where N is a \`depth\` prop (default **0**) — e.g. \`class="comment depth-2"\`.
- Show \`<strong class="author">\` and \`<p class="text">\`.
- If there are replies, render \`<ul class="replies">\` with a \`CommentItem\` per reply (\`depth + 1\`).
- A \`<button class="toggle">\` (only when there are replies) hides/shows that comment's replies.
`,
      files: {
        'App.vue': threadApp,
        'CommentItem.vue': `<script setup>
// TODO: comment and depth props, a show/hide state
</script>

<template>
  <li class="comment">
    <!-- TODO -->
  </li>
</template>`,
      },
      hints: [
        'Props: `comment: { type: Object, required: true }` and `depth: { type: Number, default: 0 }`; state: `const showReplies = ref(true)`.',
        'Classes: `class="comment" :class="\'depth-\' + depth"`.',
        'Recursion: `<ul v-if="comment.replies.length && showReplies" class="replies"><CommentItem v-for="r in comment.replies" :key="r.id" :comment="r" :depth="depth + 1" /></ul>`.',
      ],
      solution: {
        explanation: 'Each comment is an instance that knows its depth and owns its own show/hide state. The recursion stops at comments with an empty `replies` array.',
        files: {
          'App.vue': threadApp,
          'CommentItem.vue': `<script setup>
import { ref } from 'vue'

const props = defineProps({
  comment: { type: Object, required: true },
  depth: { type: Number, default: 0 },
})

const showReplies = ref(true)
</script>

<template>
  <li class="comment" :class="'depth-' + depth">
    <strong class="author">{{ comment.author }}</strong>
    <p class="text">{{ comment.text }}</p>
    <button
      v-if="comment.replies.length"
      class="toggle"
      @click="showReplies = !showReplies"
    >
      {{ showReplies ? 'Hide' : 'Show' }} replies
    </button>
    <ul v-if="comment.replies.length && showReplies" class="replies">
      <CommentItem
        v-for="reply in comment.replies"
        :key="reply.id"
        :comment="reply"
        :depth="depth + 1"
      />
    </ul>
  </li>
</template>`,
        },
      },
      tests: [
        { name: 'renders all five comments', code: `expect(findAll('.comment')).toHaveLength(5)` },
        {
          name: 'depth classes follow nesting',
          code: `const deepest = findAll('.comment').find((el) => el.querySelector('.text').textContent === 'Ha! True.')
expect(classes(deepest)).toContain('depth-2')
expect(classes(findAll('.comment')[0])).toContain('depth-0')`,
        },
        {
          name: 'toggle hides only that comment\'s replies',
          code: `expect(findAll('.toggle')).toHaveLength(2)
await click(findAll('.toggle')[0])
expect(findAll('.comment')).toHaveLength(2)
expect(text()).toContain('Show me the code.')`,
        },
      ],
    },
    {
      id: 'menu-select',
      title: 'A recursive menu with one selected item',
      difficulty: 'intermediate',
      prompt: `
Finish \`MenuItem.vue\` for a multi-level menu. \`App.vue\` owns the selection and is done.

- Props: \`item\` (required) and \`selectedId\` (\`String\`, may be \`null\`).
- Render \`<li>\` containing \`<button class="menu-label">\` with the item's label. The button gets the class \`active\` when \`item.id === selectedId\`.
- Clicking a label emits a declared \`select\` event with the **item object**.
- If the item has \`children\`, render \`<ul>\` with a \`MenuItem\` per child, passing \`selectedId\` down and **re-emitting** \`select\` up.
`,
      files: {
        'App.vue': menuApp,
        'MenuItem.vue': `<script setup>
// TODO
</script>

<template>
  <li>
    <!-- TODO -->
  </li>
</template>`,
      },
      hints: [
        '`defineProps({ item: { type: Object, required: true }, selectedId: { type: String, default: null } })` and `const emit = defineEmits([\'select\'])`.',
        'Label: `<button class="menu-label" :class="{ active: item.id === selectedId }" @click="emit(\'select\', item)">`.',
        'Children: `<MenuItem v-for="child in item.children" :key="child.id" :item="child" :selected-id="selectedId" @select="(i) => emit(\'select\', i)" />` inside `<ul v-if="item.children">`.',
      ],
      solution: {
        explanation: 'Selection is tree-wide state, so it lives in App and flows down as `selectedId`; each item only compares. Clicks travel up through every level by re-emitting — so exactly one item can be active.',
        files: {
          'App.vue': menuApp,
          'MenuItem.vue': `<script setup>
defineProps({
  item: { type: Object, required: true },
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select'])
</script>

<template>
  <li>
    <button
      class="menu-label"
      :class="{ active: item.id === selectedId }"
      @click="emit('select', item)"
    >
      {{ item.label }}
    </button>
    <ul v-if="item.children">
      <MenuItem
        v-for="child in item.children"
        :key="child.id"
        :item="child"
        :selected-id="selectedId"
        @select="(selected) => emit('select', selected)"
      />
    </ul>
  </li>
</template>`,
        },
      },
      tests: [
        {
          name: 'a single MenuItem emits select with its item',
          code: `const m = mountFile('MenuItem.vue', { item: { id: 'x', label: 'X' }, selectedId: null })
await click(m.find('.menu-label'))
expect(m.emitted('select')[0][0].id).toBe('x')`,
        },
        {
          name: 'a deep item reaches App',
          code: `const billing = findAll('.menu-label').find((b) => b.textContent.trim() === 'Billing')
await click(billing)
expect(text('.current')).toBe('Current: Billing')`,
        },
        {
          name: 'exactly one item is active',
          code: `await click(findAll('.menu-label').find((b) => b.textContent.trim() === 'Security'))
await click(findAll('.menu-label').find((b) => b.textContent.trim() === 'Profile'))
const active = findAll('.menu-label.active')
expect(active).toHaveLength(1)
expect(active[0].textContent.trim()).toBe('Profile')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'recursive-components-how',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you build a recursive component in Vue 3, and what must you watch out for?',
      answer: 'A component renders itself in its template — an SFC can refer to itself by its file name (`<TreeItem>` in `TreeItem.vue`); Options API/non-SFC components need a `name`. It needs a base case (e.g. `v-if` on children) and must pass a smaller piece of data to each recursive call. Watch out for cyclic data, keys among siblings, events that must be re-emitted at every level, local state that disappears when branches unmount, and performance on huge trees.',
      explanation: 'One level\'s template, applied as deep as the data goes.',
      whyAsked: 'Trees appear in most real apps; it tests recursion and component knowledge together.',
      mistakes: ['Forgetting the base case.', 'Thinking an import is required.', 'Ignoring event propagation through levels.'],
      followUps: ['How do events get to the root?', 'Where would you keep the selected node?', 'How would you handle 10,000 nodes?'],
      modelAnswer: 'I write one component that renders a node and, if it has children, renders itself for each child — in an SFC the file name is enough for self-reference. Termination needs a base case, like `v-if="node.children"`, and progress, meaning I pass `child`, never the same node. Then the practical issues: events don\'t bubble, so I re-emit per level or use provide/inject; tree-wide state like selection lives in the root; and for very large trees I render only expanded branches or flatten and virtualize.',
    },
    {
      id: 'recursive-components-events',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'In a recursive category tree, clicking any category must update a filter panel outside the tree. What are your options?',
      answer: 'Re-emit `select` at every level up to the tree root, which emits to its parent (fine for shallow trees). Or have the tree root `provide` a `select` function / the selected id and each level `inject` it — no chain, works at any depth. Or put the filter state in a Pinia store that both the tree and the filter panel use, which also suits the panel living elsewhere in the app.',
      explanation: 'Choose based on depth and on who else needs the state.',
      whyAsked: 'Tests knowledge of communication patterns in a structure where emits get tedious.',
      mistakes: ['Assuming events bubble.', 'Using `$parent` chains.', 'Mutating a shared prop object from deep nodes.'],
      followUps: ['What are the trade-offs of provide/inject here?', 'When is a store clearly better?'],
      modelAnswer: 'The direct approach is re-emitting `select` at every level, which works but is noisy and easy to break in deep trees. I\'d usually have the tree root provide a `select` function and the current selection, so any level can inject them. Since the filter panel lives outside the tree, if other parts of the app also react to the filter, I\'d put it in a Pinia store and have the nodes call a store action.',
    },
    {
      id: 'recursive-components-stack-overflow',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 2,
      question: 'A comment thread works in development but crashes in production with "Maximum call stack size exceeded" for one post. The code passes `:comment="reply"` correctly. What could be happening?',
      answer: 'The data for that post likely contains a cycle — a reply that (directly or indirectly) references one of its ancestors, e.g. through a bad join or a self-referencing `parentId`. The recursion never reaches a base case. Fix the data source, and defensively track visited ids or cap the depth when building or rendering the tree.',
      explanation: 'Correct code plus cyclic data still recurses forever.',
      whyAsked: 'Checks whether you think beyond code to data integrity.',
      mistakes: ['Only re-checking the template.', 'Raising the stack size instead of fixing the data.'],
      followUps: ['How would you build a tree from a flat list with `parentId`s safely?'],
      modelAnswer: 'If the template passes the reply correctly, the next suspect is the data: a cycle, where a reply ends up as a descendant of itself, maybe from a bad `parentId` or a join that duplicates nodes. Recursion over a cycle never ends. I\'d fix it where the tree is built, keep a visited set of ids there, and add a max-depth guard in the component as a safety net.',
    },
    {
      id: 'recursive-components-large-tree',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A file explorer must handle folders with tens of thousands of nodes. The recursive `TreeItem` approach is slow. How do you redesign it?',
      answer: 'Stop rendering one component per node for the whole tree. Keep the tree data (or a flat map by id) in a store, keep expanded ids in a `Set`, and compute a **flattened list of visible rows** (`{ id, name, depth }`) in a computed. Render it with a virtual scroller so only the rows on screen exist in the DOM; indent by `depth`. Load children lazily when a folder is expanded, and use `shallowRef`/`markRaw` for large immutable data to avoid deep reactivity.',
      explanation: 'Flatten + virtualize turns a deep tree into a fast list.',
      whyAsked: 'A classic performance-architecture question.',
      mistakes: ['Micro-optimising the recursive component instead of changing the approach.', 'Making the whole huge tree deeply reactive.'],
      followUps: ['How do you keep keyboard navigation working in a virtualized tree?', 'What changes for drag-and-drop?'],
      modelAnswer: 'Recursive components mean one instance per rendered node, which doesn\'t scale to tens of thousands. I\'d store nodes in a flat map, track expanded ids in a Set, and derive a flat array of visible rows with their depth. That list goes into a virtual scroller, so only a screenful of rows exist at once, indented by depth. Children load lazily on expand, and big immutable data lives in a `shallowRef` to avoid deep proxying.',
    },
    {
      id: 'recursive-components-expanded-state',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'Product wants the tree to remember which folders are open across collapses — and even across page reloads. How do you change the design?',
      answer: 'Move expansion state out of the node instances: keep a `Set` (or object) of expanded ids/paths in the tree root or a store, provide it (plus `toggle`) to every level, and have nodes compute `open` from it. For reloads, persist that set (e.g. to `localStorage` or the URL) and restore it on startup. Per-node `ref(false)` can\'t work because collapsed branches are unmounted.',
      explanation: 'State that must outlive an instance can\'t live in the instance.',
      whyAsked: 'Shows understanding of component lifetimes and state ownership.',
      mistakes: ['Switching everything to `v-show` (renders all nodes, doesn\'t survive reloads).', 'Keeping state in each node and trying to "restore" it.'],
      followUps: ['Paths or ids — which keys are safer?', 'How would you expand to a specific file on load?'],
      modelAnswer: 'Local refs disappear when a branch unmounts, so expansion has to live higher. I\'d keep a reactive Set of expanded ids in the tree root or a small store and provide it with a toggle function; each node computes whether it\'s open from that set. Persisting the set to localStorage or the URL makes it survive reloads. I prefer stable ids over paths, since renames change paths.',
    },
    {
      id: 'recursive-components-coding-org',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Implement `EmployeeNode.vue` for an org chart: render `<li class="employee">` with `<span class="name">` and `<span class="reports">` showing the number of **direct** reports, then recursively render each report inside `<ul>`.',
      starter: {
        files: {
          ...orgFiles,
          'EmployeeNode.vue': `<script setup>
defineProps({ person: { type: Object, required: true } })
</script>

<template>
  <li class="employee">
    <span class="name">{{ person.name }}</span>
  </li>
</template>`,
        },
      },
      tests: [
        { name: 'renders everyone', code: `expect(findAll('.employee')).toHaveLength(5)` },
        {
          name: 'shows direct report counts',
          code: `const counts = findAll('.employee').map((el) => el.querySelector('.name').textContent + ':' + el.querySelector('.reports').textContent.trim())
expect(counts).toEqual(['Maya:2', 'Tom:2', 'Ines:0', 'Raj:0', 'Lea:0'])`,
        },
        {
          name: 'nests reports inside their manager',
          code: `const tom = findAll('.employee').find((el) => el.querySelector('.name').textContent === 'Tom')
expect(tom.querySelectorAll('.employee')).toHaveLength(2)`,
        },
      ],
      hints: ['Show `{{ person.reports.length }}` in `.reports`.', 'Recurse: `<ul v-if="person.reports.length"><EmployeeNode v-for="r in person.reports" :key="r.name" :person="r" /></ul>`.'],
      answer: 'Display the direct-report count and render `<EmployeeNode>` for each report inside a `<ul>`, stopping when `reports` is empty.',
      solution: {
        files: {
          ...orgFiles,
          'EmployeeNode.vue': `<script setup>
defineProps({ person: { type: Object, required: true } })
</script>

<template>
  <li class="employee">
    <span class="name">{{ person.name }}</span>
    <span class="reports">{{ person.reports.length }}</span>
    <ul v-if="person.reports.length">
      <EmployeeNode
        v-for="report in person.reports"
        :key="report.name"
        :person="report"
      />
    </ul>
  </li>
</template>`,
        },
      },
      explanation: 'The component renders one person and recurses into their reports; an empty `reports` array is the base case.',
      whyAsked: 'A compact check of self-reference, base case and keys.',
      mistakes: ['Passing `person` instead of `report`.', 'Rendering an empty `<ul>` for people without reports.'],
      followUps: ['How would you show the total team size (all levels) instead of direct reports?', 'How would you collapse a team?'],
      modelAnswer: 'The node renders the person\'s name and `reports.length`, then, if there are reports, a `<ul>` with an `EmployeeNode` per report — self-referenced by file name, keyed by something unique among siblings. An empty array is the base case. For total team size I\'d add a recursive count function in a computed.',
    },
  ],

  takeaways: [
    'A recursive component renders itself; an SFC can refer to itself by its file name.',
    'Every recursion needs a base case and progress (pass `child`, never the same node).',
    'Each node is its own instance — great for local UI state, but that state dies when a branch unmounts.',
    'Events must be re-emitted at every level; provide/inject or a store avoids the chain in deep trees.',
    'Keep tree-wide state (selection, expansion) at the root; flatten + virtualize very large trees.',
  ],
}
