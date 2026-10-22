// Lesson: The Options API (for existing codebases)

const taskApp = `<script>
import TaskItem from './TaskItem.vue'
import { timestampMixin } from './timestampMixin.js'

export default {
  components: { TaskItem },
  mixins: [timestampMixin],
  data() {
    return {
      newTask: '',
      filter: 'all',
      tasks: [
        { id: 1, title: 'Read the Options API lesson', done: true },
        { id: 2, title: 'Fix the legacy dashboard', done: false },
      ],
    }
  },
  computed: {
    visibleTasks() {
      if (this.filter === 'open') return this.tasks.filter((t) => !t.done)
      if (this.filter === 'done') return this.tasks.filter((t) => t.done)
      return this.tasks
    },
    remaining() {
      return this.tasks.filter((t) => !t.done).length
    },
    allDone: {
      get() {
        return this.tasks.length > 0 && this.remaining === 0
      },
      set(value) {
        this.tasks.forEach((t) => (t.done = value))
      },
    },
  },
  watch: {
    // Vue 3: without deep: true this runs only when the array is REPLACED
    tasks(list) {
      localStorage.setItem('tasks', JSON.stringify(list))
      console.log('saved', list.length, 'tasks')
    },
  },
  methods: {
    addTask() {
      const title = this.newTask.trim()
      if (!title) return
      this.tasks.push({ id: Date.now(), title, done: false })
      this.newTask = ''
    },
    removeTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
    },
  },
  created() {
    console.log('created: data is ready,', this.tasks.length, 'tasks')
  },
  mounted() {
    this.$refs.input.focus()
    console.log('mounted: the DOM exists, input focused')
  },
}
</script>

<template>
  <h2>Tasks <small>opened {{ formatTime(openedAt) }}</small></h2>
  <form @submit.prevent="addTask">
    <input ref="input" v-model="newTask" class="new-task" placeholder="New task" />
    <button class="add">Add</button>
  </form>
  <label><input v-model="allDone" type="checkbox" class="all-done" /> Mark all done</label>
  <select v-model="filter" class="filter">
    <option value="all">All</option>
    <option value="open">Open</option>
    <option value="done">Done</option>
  </select>
  <ul>
    <TaskItem
      v-for="task in visibleTasks"
      :key="task.id"
      :task="task"
      @toggle="task.done = !task.done"
      @remove="removeTask(task.id)"
    />
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`

const taskItem = `<script>
export default {
  props: {
    task: { type: Object, required: true },
  },
  emits: ['toggle', 'remove'],
  computed: {
    classes() {
      return { task: true, done: this.task.done }
    },
  },
}
</script>

<template>
  <li :class="classes">
    <label>
      <input type="checkbox" :checked="task.done" @change="$emit('toggle')" />
      {{ task.title }}
    </label>
    <button class="remove" @click="$emit('remove')">✕</button>
  </li>
</template>

<style scoped>
.done { text-decoration: line-through; opacity: 0.6; }
</style>`

const timestampMixin = `// A typical Vue 2-era mixin. Nothing in App.vue says where
// \`openedAt\` or \`formatTime\` come from — you have to know.
export const timestampMixin = {
  data() {
    return { openedAt: Date.now() }
  },
  methods: {
    formatTime(ts) {
      return new Date(ts).toLocaleTimeString()
    },
  },
  created() {
    console.log('[mixin] created runs before the component\\'s own created')
  },
}`

const taskAppSolved = taskApp
  .replace(
    `    tasks(list) {
      localStorage.setItem('tasks', JSON.stringify(list))
      console.log('saved', list.length, 'tasks')
    },`,
    `    tasks: {
      handler(list) {
        localStorage.setItem('tasks', JSON.stringify(list))
        console.log('saved', list.length, 'tasks')
      },
      deep: true,
    },`,
  )
  .replace(
    `    removeTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
    },`,
    `    removeTask(id) {
      this.tasks = this.tasks.filter((t) => t.id !== id)
    },
    clearDone() {
      this.tasks = this.tasks.filter((t) => !t.done)
    },`,
  )
  .replace(
    `    remaining() {
      return this.tasks.filter((t) => !t.done).length
    },`,
    `    remaining() {
      return this.tasks.filter((t) => !t.done).length
    },
    remainingLabel() {
      if (this.remaining === 0) return 'All done!'
      return this.remaining === 1 ? '1 task left' : this.remaining + ' tasks left'
    },`,
  )
  .replace(`<p class="remaining">{{ remaining }} left</p>`, `<p class="remaining">{{ remainingLabel }}</p>
  <button class="clear-done" @click="clearDone">Clear done</button>`)

export default {
  id: 'options-api',
  title: 'The Options API (for existing codebases)',
  summary: 'Read, fix and extend components written with data, computed, watch, methods, lifecycle hooks, this and mixins — the style most legacy Vue code uses.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['composition-vs-options', 'first-component', 'lifecycle-hooks'],
  related: ['setup-and-script-setup', 'composables-intro', 'composable-design', 'legacy-migration', 'watch', 'computed', 'template-refs'],
  tags: ['options api', 'data', 'methods', 'computed', 'watch', 'lifecycle', 'this', 'mixins', 'legacy', 'vue 2', 'migration', '$refs', '$emit'],
  apis: [
    { name: 'data()', summary: 'Function returning the initial reactive state of each component instance.' },
    { name: 'computed', summary: 'Cached derived values; can be read-only functions or `{ get, set }` objects.' },
    { name: 'watch', summary: 'Run side effects when a property changes; supports `deep`, `immediate`, dotted paths and method names.' },
    { name: 'methods', summary: 'Functions bound to the instance, callable from the template and from other options via `this`.' },
    { name: 'mixins', summary: 'Array of option objects merged into the component (legacy reuse mechanism).' },
    { name: 'this.$refs / $emit / $nextTick / $watch', summary: 'Public instance properties available through `this` in the Options API.' },
  ],
  docs: [
    { label: 'API — Options: State', url: 'https://vuejs.org/api/options-state.html' },
    { label: 'API — Options: Lifecycle', url: 'https://vuejs.org/api/options-lifecycle.html' },
    { label: 'API — Options: Composition (mixins)', url: 'https://vuejs.org/api/options-composition.html#mixins' },
    { label: 'Vue 3 Migration Guide', url: 'https://v3-migration.vuejs.org/' },
  ],

  intro: `
Most Vue code written before about 2021 — and plenty written since — uses the **Options API**. If you join a company with an existing Vue app, you'll read and change these components on day one.

An Options API component is an object whose keys ("options") each have a job:

- \`data()\` — the component's own reactive state;
- \`computed\` — values derived from state, cached;
- \`watch\` — side effects that run when something changes;
- \`methods\` — functions for event handlers and logic;
- lifecycle hooks — \`created\`, \`mounted\`, \`unmounted\`, … — code that runs at specific moments;
- \`props\`, \`emits\`, \`components\`, \`mixins\` — how the component connects to others.

Inside all of them, **\`this\`** is the component instance: \`this.tasks\`, \`this.addTask()\`, \`this.$refs.input\`. This lesson teaches each option properly, the \`this\` rules that trip people up, and the **mixin** problems you'll inherit in older code.
`,

  why: `
Why learn an "older" style? Because it isn't going anywhere:

- It is **fully supported in Vue 3** and not deprecated.
- Huge amounts of production code, tutorials, Stack Overflow answers and component libraries use it.
- Vue 2 apps being migrated to Vue 3 are written in it, and migrations happen one component at a time.

Reading it fluently also teaches you *what the Composition API replaced*. When you understand why one feature ends up scattered across \`data\`, \`computed\`, \`watch\` and \`methods\` — and why mixins make \`this.something\` hard to trace — the design of [composables](lesson:composables-intro) makes immediate sense.
`,

  eli15: `
Imagine filling in a **form** to describe a robot:

- *Memory* (\`data\`): "it remembers a list of tasks and the text being typed."
- *Calculations* (\`computed\`): "it can always tell you how many tasks are left."
- *Alarms* (\`watch\`): "whenever the task list changes, save it."
- *Skills* (\`methods\`): "it can add a task, and remove one."
- *Daily schedule* (lifecycle hooks): "when switched on, focus the text box."

Vue reads the form and builds the robot. Inside each box, the robot talks about itself as **\`this\`** — "*my* tasks", "*my* addTask skill".

**Mixins** are like stapling an extra page from another robot's form onto yours. Handy — but later, nobody remembers which page a skill came from, and if both pages define "memory: loading", one silently wins.
`,

  analogy: {
    title: 'A restaurant order form',
    body: `
A restaurant kitchen works from a printed form with fixed sections: *ingredients in stock*, *dishes we can calculate from them*, *alerts* ("if salmon runs out, tell the manager"), *recipes*, and *opening/closing duties*. Every restaurant in the chain uses the same form, so any chef can walk into any kitchen and know where to look.

That predictability is the Options API's strength. Its weakness: the recipe for "salmon special" is split across the ingredients section, the alerts section and the recipes section. And when head office staples a "standard procedures" page (a mixin) onto every form, chefs start wondering where a duty came from.
`,
    mapping: [
      ['ingredients in stock', '`data()` — reactive state'],
      ['dishes calculated from stock', '`computed` — derived, cached values'],
      ['alerts', '`watch` — side effects on change'],
      ['recipes', '`methods` — functions'],
      ['opening/closing duties', 'lifecycle hooks: `created`, `mounted`, `unmounted`'],
      ['a stapled head-office page', 'a mixin merged into the component'],
      ['"this kitchen"', '`this` — the component instance'],
    ],
  },

  visual: {
    type: 'lifecycle',
    props: { withChild: true },
    title: 'Lifecycle hooks, live',
    caption: 'Mount, update and unmount a parent with a child and watch the hooks fire. Note the order: the parent starts first, but the **child finishes mounting first**.',
    alt: 'An interactive timeline. Buttons mount, update and unmount a parent component containing a child component. Each lifecycle hook (beforeCreate, created, beforeMount, mounted, beforeUpdate, updated, beforeUnmount, unmounted) is appended to the timeline as it fires, labelled with the component it belongs to.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'How mixins merge (and collide)',
    caption: 'Step through what Vue does with `mixins: [loadingMixin, formatMixin]`.',
    alt: 'A diagram with two mixins on the left (loadingMixin with data loading and method fetch, formatMixin with data loading and method format), a component in the middle, and a merged options object on the right. Steps show hidden sources, merge rules, a silent name collision on loading, and hooks running mixins first.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'loadingMixin', label: 'loadingMixin', note: 'data: loading · fetch()', tone: 'kraft', x: 120, y: 70 },
        { id: 'formatMixin', label: 'formatMixin', note: 'data: loading · format()', tone: 'kraft', x: 120, y: 245 },
        { id: 'component', label: 'UserList.vue', note: 'uses this.loading, this.fetch()', tone: 'cobalt', x: 390, y: 157 },
        { id: 'merged', label: 'merged options', note: 'one flat `this`', tone: 'acid', x: 640, y: 157 },
      ],
      edges: [
        { from: 'loadingMixin', to: 'component', label: 'mixins[0]', dashed: true },
        { from: 'formatMixin', to: 'component', label: 'mixins[1]', dashed: true },
        { from: 'component', to: 'merged', label: 'Vue merges' },
      ],
      steps: [
        { focus: ['component'], text: 'Reading `UserList.vue`, you see `this.loading` and `this.fetch()` — but neither is defined in the file. **Where do they come from?** You have to open every mixin to find out.' },
        { focus: ['loadingMixin', 'formatMixin'], edges: ['loadingMixin->component', 'formatMixin->component'], text: 'Vue merges each mixin into the component, in array order. Mixins can also silently depend on properties provided by *other* mixins or by the component.' },
        { focus: ['merged'], edges: ['component->merged'], text: 'Merge rules: `data` objects are merged **shallowly** (Vue 3); `methods`, `computed` and `components` are merged by key; for conflicts, a **later mixin beats an earlier one, and the component beats all mixins**.' },
        { focus: ['loadingMixin', 'formatMixin', 'merged'], text: 'Both mixins define `loading`. No error, no warning: `formatMixin` wins, and `loadingMixin` now reads and writes a flag that someone else also uses. This is the classic **name collision**.' },
        { focus: ['merged'], text: 'Lifecycle hooks are **not** overwritten — they are collected into an array, and mixin hooks run **before** the component\'s own hook of the same name.' },
        { focus: ['component', 'merged'], text: 'Result: implicit sources, possible collisions, hidden coupling. These are exactly the problems [composables](lesson:composables-intro) solve with explicit `const { loading, fetch } = useUsers()`.' },
      ],
    },
  },

  syntax: [
    `
#### State: \`data\`
`,
    {
      code: `export default {
  data() {
    return {
      query: '',
      results: [],
      user: { name: 'Ada', address: { city: 'London' } },
    }
  },
}`,
      lang: 'js',
      title: 'data must be a function',
    },
    `
- \`data\` **must be a function** returning a fresh object, so every instance gets its own state. (Vue 2 allowed a plain object on the root instance; Vue 3 never does.)
- Every top-level property becomes reactive and available as \`this.query\` and \`{{ query }}\`. Nested objects are deeply reactive.
- Declare **every** property up front, even as \`null\`. Properties added later to \`this\` are not part of \`data\`.
- Names starting with \`$\` or \`_\` are reserved for Vue's internals and are not proxied onto \`this\`.

#### Derived state: \`computed\`
`,
    {
      code: `computed: {
  // read-only: a function
  remaining() {
    return this.tasks.filter((t) => !t.done).length
  },
  // writable: get + set
  fullName: {
    get() { return this.first + ' ' + this.last },
    set(value) {
      const [first, ...rest] = value.split(' ')
      this.first = first
      this.last = rest.join(' ')
    },
  },
},`,
      lang: 'js',
      title: 'computed',
    },
    `
Computed values are **cached**: they re-run only when a reactive property they read changes. Use them for anything you'd otherwise recalculate in the template. Keep getters free of side effects (no API calls, no mutations).

#### Side effects: \`watch\`
`,
    {
      code: `watch: {
  // 1. a function: (newValue, oldValue)
  query(newQuery, oldQuery) { this.search(newQuery) },

  // 2. a dotted path into nested state
  'user.address.city'(city) { console.log('moved to', city) },

  // 3. an options object
  tasks: {
    handler(list) { localStorage.setItem('tasks', JSON.stringify(list)) },
    deep: true,        // react to nested changes (and array mutations)
    immediate: true,   // also run once right away
  },

  // 4. the name of a method
  filter: 'reload',
},`,
      lang: 'js',
      title: 'watch',
    },
    {
      callout: 'warn',
      title: 'Vue 3 changed array watching',
      text: 'In Vue 3, a watcher on an array (without `deep: true`) fires only when the array is **replaced** (`this.tasks = [...]`), not when it is mutated (`push`, `splice`, changing an item). Vue 2 fired on mutations. Legacy code that relied on this silently stops working after migration — add `deep: true`.',
    },
    `
You can also create a watcher at runtime with \`const stop = this.$watch('query', handler)\`; it is stopped automatically when the component unmounts, or earlier by calling \`stop()\`.

#### Behaviour: \`methods\`
`,
    {
      code: `methods: {
  addTask() {
    this.tasks.push({ id: Date.now(), title: this.newTask, done: false })
  },
  // ❌ arrow function: \`this\` is NOT the component
  broken: () => { this.tasks.push({}) },
},`,
      lang: 'js',
      title: 'methods',
    },
    `
Vue **binds every method to the instance**, so \`this\` is correct even when you pass a method around as a callback (\`setTimeout(this.tick, 1000)\`). That binding only works for normal functions — **never use arrow functions** for methods, computed getters, watchers or hooks.

#### Lifecycle hooks
`,
    {
      code: `export default {
  beforeCreate() {},  // instance initialising; no data yet
  created() {},       // data, computed, methods ready; no DOM yet
  beforeMount() {},   // about to render for the first time
  mounted() {},       // DOM exists: this.$el, this.$refs are usable
  beforeUpdate() {},  // state changed, DOM about to be patched
  updated() {},       // DOM patched
  beforeUnmount() {}, // still fully working: clean up here
  unmounted() {},     // gone: listeners and timers must be cleared by now
}`,
      lang: 'js',
      title: 'lifecycle hooks (Options API names)',
    },
    `
#### Talking to other components and the DOM
`,
    {
      code: `export default {
  props: { max: { type: Number, default: 10 } },  // read as this.max
  emits: ['save'],                                  // this.$emit('save', payload)
  components: { TaskItem },                         // local registration
  methods: {
    save() {
      this.$emit('save', this.draft)
      this.$nextTick(() => this.$refs.input.focus())  // after the DOM updates
    },
  },
}`,
      lang: 'js',
      title: 'props, emits, $refs, $nextTick',
    },
    {
      callout: 'version',
      title: 'Vue 2 → Vue 3 changes you will meet in legacy code',
      text: '`beforeDestroy`/`destroyed` were renamed `beforeUnmount`/`unmounted`. `data` must always be a function. Filters (`{{ price | currency }}`) were removed — use methods or computed. `$on`/`$off`/`$once` (event buses) were removed. `$listeners` merged into `$attrs`. `$children` was removed. Array watchers need `deep: true` to see mutations. Mixin `data` is now merged shallowly. See the official migration guide.',
    },
    `
#### Mixins (legacy reuse)
`,
    {
      code: `// paginationMixin.js
export const paginationMixin = {
  data() { return { page: 1 } },
  methods: { nextPage() { this.page++ } },
  created() { console.log('mixin created') },
}

// UserList.vue
export default {
  mixins: [paginationMixin],
  created() { console.log('component created', this.page) },
}`,
      lang: 'js',
      title: 'a mixin',
    },
    `
Merge rules: \`data\` is merged shallowly; \`methods\`, \`computed\`, \`components\` merge by key; on conflict the component wins over mixins, and a later mixin wins over an earlier one; hooks are all kept and **mixin hooks run first**. Vue's own docs say mixins are no longer recommended in Vue 3 — prefer composables for new code.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: taskApp,
    intro: 'The playground\'s task board uses nearly every option. Step through it in order.',
    steps: [
      { lines: [2, 3], text: 'Imports: a child component and a **mixin**. Both are plain JavaScript objects.' },
      { lines: [6, 7], text: '`components` registers `TaskItem` locally. `mixins` merges `timestampMixin` into this component — that is where `openedAt` and `formatTime` (used in the template) come from.' },
      { lines: [8, 17], text: '`data()` returns a **fresh object per instance**. `newTask`, `filter` and `tasks` become reactive and reachable as `this.tasks`.' },
      { lines: [19, 23], text: 'A computed list filtered by the `<select>`. Recalculated only when `filter` or `tasks` change, cached otherwise.' },
      { lines: [27, 34], text: 'A **writable computed**: reading `allDone` checks every task; writing it (via the "Mark all done" checkbox\'s `v-model`) runs `set` and updates every task.' },
      { lines: [36, 42], text: 'A watcher that saves to `localStorage`. In Vue 3 it only fires when `tasks` is **replaced** — `removeTask` replaces it, `addTask` only pushes. That inconsistency is your first experiment.' },
      { lines: [43, 53], text: '`methods` use `this` freely. They are bound to the instance, so they work as event handlers and callbacks. Note they are normal functions, not arrows.' },
      { lines: [54, 60], text: 'Lifecycle: `created` runs when data is ready (no DOM yet); `mounted` runs once the DOM exists, so `this.$refs.input` can be focused.' },
      { lines: [65, 67], text: '`formatTime(openedAt)` comes from the mixin — nothing in this file defines it. `ref="input"` is what `this.$refs.input` reads in `mounted`.' },
      { lines: [77, 83], text: 'The child gets the task as a **prop** and talks back with **events**: `@toggle` and `@remove`, declared in its `emits` option.' },
    ],
  },

  playground: {
    title: 'A legacy task board',
    objective: 'Fix a real Vue 3 migration bug, then extend an Options API component the way you would at work.',
    files: {
      'App.vue': taskApp,
      'TaskItem.vue': taskItem,
      'timestampMixin.js': timestampMixin,
    },
    entry: 'App.vue',
    expected: 'A task list with two tasks, an input (focused on load), "Mark all done", a filter dropdown and "1 left". The console shows the mixin\'s `created` log **before** the component\'s, then the `mounted` log. Adding a task does **not** log "saved" — removing one does.',
    experiments: [
      {
        id: 'deep-watch',
        task: 'Adding or ticking a task is never saved — only removing one is. Fix the `tasks` watcher so **every** change is saved to `localStorage`.',
        hint: 'Turn the watcher into an options object: `tasks: { handler(list) { … }, deep: true }`.',
        tests: [
          {
            name: 'adding and toggling tasks both save',
            code: `await type('.new-task', 'Write tests')
await click('.add')
expect(localStorage.getItem('tasks') || '').toContain('Write tests')
await check('.task input[type=checkbox]', false)
const saved = JSON.parse(localStorage.getItem('tasks'))
expect(saved[0].done).toBe(false)`,
          },
        ],
        explain: 'In Vue 3, watching an array without `deep` only reacts to replacing it. `push` and changing `task.done` are mutations, so they need `deep: true`. Vue 2 behaved differently, which is why this bug appears after migrations.',
      },
      {
        id: 'clear-done',
        task: 'Add a `clearDone()` method and a `<button class="clear-done">Clear done</button>` that removes every completed task.',
        hint: 'In `methods`: `clearDone() { this.tasks = this.tasks.filter((t) => !t.done) }`, then `<button class="clear-done" @click="clearDone">Clear done</button>` in the template.',
        tests: [
          {
            name: 'Clear done removes completed tasks',
            code: `const btn = find('.clear-done')
expect(btn).toBeTruthy()
await click(btn)
expect(findAll('.task')).toHaveLength(1)
expect(text('.task')).toContain('Fix the legacy dashboard')`,
          },
        ],
        explain: 'A method reads and writes state through `this`. Replacing the array (rather than splicing) also triggers the original non-deep watcher — but don\'t rely on that; make the watcher deep.',
      },
      {
        id: 'plural',
        task: 'Make `.remaining` read **1 task left**, **2 tasks left**, or **All done!** when nothing is left. Use a new computed property.',
        hint: 'Add `remainingLabel()` to `computed`, building on `this.remaining`, and show `{{ remainingLabel }}` in the paragraph.',
        tests: [
          {
            name: 'the label is pluralised and celebrates',
            code: `expect(text('.remaining')).toBe('1 task left')
await type('.new-task', 'Plan sprint')
await click('.add')
expect(text('.remaining')).toBe('2 tasks left')
await check('.all-done', true)
expect(text('.remaining')).toBe('All done!')`,
          },
        ],
        explain: 'Computed properties can depend on other computed properties (`remainingLabel` → `remaining` → `tasks`). Ticking "Mark all done" ran the `allDone` setter, which changed every task, which invalidated the whole chain.',
      },
      {
        id: 'mixin-collision',
        task: 'In `timestampMixin.js`, add `newTask: \'from the mixin\'` to the mixin\'s `data()`. Run it: what does the input show? Then rename the mixin\'s `formatTime` to something else and watch the template break.',
        hint: 'Component data wins over mixin data. Renaming a mixin method breaks every component that relied on the old name — with no import to warn you.',
        explain: 'The input stays empty: on conflicts, the component\'s own `data` wins (merged shallowly in Vue 3), silently. And renaming a mixin member breaks consumers with only a runtime error. This invisible coupling is why the Vue team recommends composables over mixins.',
      },
    ],
    variants: [
      {
        id: 'solved',
        label: 'All experiments solved',
        files: { 'App.vue': taskAppSolved, 'TaskItem.vue': taskItem, 'timestampMixin.js': timestampMixin },
      },
    ],
  },

  internals: {
    beginner: `
Vue reads your options object once per component instance and turns each part into the same reactive building blocks the Composition API uses: \`data()\` becomes a reactive object, each computed becomes a cached computed value, each watch entry becomes a watcher, each hook is registered for its moment. \`this\` is a **proxy** — a stand-in object — that looks up names in props, data, computed and methods for you.
`,
    technical: [
      `
**Initialisation order** (inside Vue's \`applyOptions\`): props are resolved first, then \`inject\`, \`methods\`, \`data\`, \`computed\`, \`watch\`, and finally \`provide\`. That's why a \`data()\` function can call a method or read a prop through \`this\`, and why a computed can read data.

**\`this\` is the public instance proxy.** Its \`get\` trap resolves a key by checking, in order: setup bindings, \`data\`, props, then the instance context (methods, computed), then public properties like \`$el\`, \`$refs\`, \`$emit\`, \`$nextTick\`, and finally app-level \`globalProperties\`. Vue caches which bucket each key came from to make repeated access fast.

**Methods are bound once.** During setup Vue does roughly \`ctx[key] = methods[key].bind(publicThis)\`. An arrow function ignores \`bind\` (arrows capture \`this\` from where they were *written* — module scope, where it is \`undefined\`), so arrow methods never see the instance.
`,
      {
        code: `// Simplified — the shape of what Vue does with your options
const publicThis = instance.proxy
for (const key in methods) ctx[key] = methods[key].bind(publicThis)
instance.data = reactive(dataOption.call(publicThis, publicThis))
for (const key in computedOptions) {
  const opt = computedOptions[key]
  const c = computed({
    get: (opt.get || opt).bind(publicThis),
    set: opt.set ? opt.set.bind(publicThis) : () => warn('readonly'),
  })
  Object.defineProperty(ctx, key, { get: () => c.value, set: (v) => (c.value = v) })
}
for (const key in watchOptions) createWatcher(watchOptions[key], ctx, publicThis, key)`,
        lang: 'js',
        title: 'mental model of applyOptions (not the real source)',
      },
      `
**Mixins are resolved before all that.** Vue builds one merged options object per component (cached per component definition) by merging global mixins, then \`extends\`, then each item in \`mixins\`, then the component's own options — using per-option merge strategies: hooks concatenate into arrays, \`methods\`/\`computed\`/\`components\` are \`Object.assign\`-ed (later wins), and \`data\` functions are combined into one function that shallow-merges their results.

**Watchers on arrays.** An Options API watcher on \`tasks\` is effectively \`watch(() => this.tasks, handler)\`. The getter returns the same array object after a \`push\`, so nothing changed by identity — unless \`deep: true\` makes the watcher traverse (and therefore track) every element.
`,
    ],
    production: `
- **Read before you rewrite.** In a legacy codebase, fix bugs in the existing style; don't convert a component halfway in a bug-fix PR.
- **Migration checklist for Vue 2 code:** rename \`beforeDestroy\`/\`destroyed\`, add \`deep: true\` to array watchers that relied on mutations, replace filters with methods/computed, replace \`$on\`/\`$off\` event buses with props/events, provide/inject, or a store (e.g. Pinia), and replace \`$children\` with template refs. The official migration build (\`@vue/compat\`) can flag many of these at runtime.
- **Clean up in \`beforeUnmount\`/\`unmounted\`:** timers, \`window\` listeners and third-party widgets created in \`mounted\` keep running after the component is gone otherwise.
- **Stateful methods are shared.** \`methods: { save: debounce(function () {...}, 300) }\` creates *one* debounced function shared by every instance. Create per-instance versions in \`created()\` (\`this.debouncedSave = debounce(this.save, 300)\`) and cancel them in \`unmounted()\`.
- **Mixins:** don't add new ones. When touching an old mixin, consider extracting a composable and calling it from the component's \`setup()\` option — legacy components can use composables without a full rewrite.
- **Linting:** eslint-plugin-vue has rules for the Options API (e.g. no arrow functions in methods, ordered options) that catch many of the mistakes below.
`,
  },

  mistakes: [
    {
      title: 'Arrow functions in `methods` (or hooks, watchers, computed)',
      wrong: { code: `methods: {\n  add: () => {\n    this.items.push('x')   // TypeError: this is undefined\n  },\n},`, lang: 'js' },
      right: { code: `methods: {\n  add() {\n    this.items.push('x')\n  },\n},`, lang: 'js' },
      explanation: 'Arrow functions take `this` from the surrounding code (the module), not from how they are called, so Vue cannot bind them to the instance. Use method shorthand everywhere in an options object. Arrows are fine *inside* a method (`this.items.filter((i) => i.done)`).',
    },
    {
      title: '`data` as a plain object',
      wrong: { code: `export default {\n  data: { count: 0 },   // Vue 3: warning + the component fails to set up\n}`, lang: 'js' },
      right: { code: `export default {\n  data() {\n    return { count: 0 }\n  },\n}`, lang: 'js' },
      explanation: 'A component can have many instances. If they all used the same object, clicking one counter would change every counter. A function returns a new object for each instance, which is why Vue 3 requires it.',
    },
    {
      title: 'Expecting an array watcher to fire on `push` in Vue 3',
      wrong: { code: `watch: {\n  items(list) { save(list) },   // not called on push / splice\n},`, lang: 'js' },
      right: { code: `watch: {\n  items: { handler(list) { save(list) }, deep: true },\n},`, lang: 'js' },
      explanation: 'Without `deep`, Vue 3 compares the array by identity, so only replacing it triggers the watcher. This changed from Vue 2 and is a top migration bug.',
    },
    {
      title: 'Forgetting `return` in a computed',
      wrong: { code: `computed: {\n  total() {\n    this.items.reduce((s, i) => s + i.price, 0)\n  },\n},`, lang: 'js' },
      right: { code: `computed: {\n  total() {\n    return this.items.reduce((s, i) => s + i.price, 0)\n  },\n},`, lang: 'js' },
      explanation: 'A computed with braces and no `return` evaluates to `undefined`. The template shows nothing and there is no error to point you to it.',
    },
    {
      title: 'Starting timers in `mounted` without clearing them',
      wrong: { code: `mounted() {\n  setInterval(() => this.tick++, 1000)\n},`, lang: 'js' },
      right: { code: `mounted() {\n  this.timer = setInterval(() => this.tick++, 1000)\n},\nbeforeUnmount() {\n  clearInterval(this.timer)\n},`, lang: 'js' },
      explanation: 'The interval keeps running after the component is removed, updating an instance nobody sees — a memory leak and a source of strange errors. Pair every setup in `mounted` with cleanup in `beforeUnmount`/`unmounted`. (The arrow inside `setInterval` is fine: it captures `this` from `mounted`.)',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: Cannot read properties of undefined (reading \'push\')` inside a method.',
      cause: 'The method is an arrow function, so `this` is `undefined`.',
      fix: 'Rewrite it as `name() { … }`.',
    },
    {
      symptom: '`[Vue warn]: The data option must be a function` and the component breaks.',
      cause: '`data` is a plain object (common in code copied from Vue 2 root instances).',
      fix: 'Change it to `data() { return { … } }`.',
    },
    {
      symptom: 'After upgrading to Vue 3, a watcher no longer runs when items are added to a list.',
      cause: 'Vue 3 array watchers only fire on replacement unless `deep: true` is set.',
      fix: 'Use `{ handler, deep: true }`, or watch something that changes by value, like `items.length`.',
    },
    {
      symptom: 'A property used as `this.something` is not defined in the component file.',
      cause: 'It comes from a mixin, `extends`, a global mixin, or `app.config.globalProperties`.',
      fix: 'Search the `mixins` array and app setup; Vue Devtools shows the merged state of the instance. Consider replacing the mixin with a composable for explicit sources.',
    },
    {
      symptom: '`this.$refs.input` is `undefined` in `created`.',
      cause: 'The DOM does not exist until `mounted`.',
      fix: 'Access refs in `mounted` or later, or after `this.$nextTick()` if the element is rendered conditionally.',
    },
  ],

  bestPractices: [
    'Always write `data` as a function and declare every property with an initial value.',
    'Use method shorthand (`save() {}`) for methods, computed getters, watchers and hooks — never arrow functions.',
    'Put derived values in `computed`, side effects in `watch`, event logic in `methods`; keep computed getters pure.',
    'Add `deep: true` to watchers on arrays/objects whose contents change, and remember the Vue 3 change when migrating.',
    'Clean up timers, listeners and widgets in `beforeUnmount`/`unmounted`.',
    'Keep a consistent option order (e.g. name, components, mixins, props, emits, data, computed, watch, hooks, methods) — eslint-plugin-vue can enforce it.',
    'Do not write new mixins; reuse logic with composables (callable from a `setup()` option in legacy components).',
  ],

  useCases: [
    'Maintaining and extending Vue 2 or early Vue 3 applications.',
    'Migrating Vue 2 apps to Vue 3 component by component.',
    'Reading third-party component libraries and older documentation or tutorials.',
    'Small no-build pages that use Vue from a CDN with a plain options object.',
    'Interviews: many companies still ask about `this`, lifecycle hooks and mixins.',
  ],

  whenToUse: {
    use: [
      'The codebase already uses the Options API consistently — match it.',
      'Quick prototypes or CDN-only pages where an options object is the simplest thing.',
      'Teams that value the enforced structure for simple, small components.',
    ],
    avoid: [
      'New large features with lots of shared logic — composables in `<script setup>` organise and reuse it better.',
      'New mixins of any kind.',
      'Half-converting a component in an unrelated change.',
    ],
  },

  comparison: {
    title: 'Options API concepts and their Composition API twins',
    headers: ['Options API', 'What it does', 'Composition API equivalent'],
    rows: [
      ['`data()`', 'reactive per-instance state', '`ref()` / `reactive()`'],
      ['`computed: { x() {} }`', 'cached derived value', '`computed(() => …)`'],
      ['`watch: { x: { handler, deep, immediate } }`', 'side effect on change', '`watch(x, handler, { deep, immediate })`'],
      ['`methods`', 'functions bound to the instance', 'plain functions'],
      ['`created`', 'state ready, no DOM', 'code directly in `setup` / `<script setup>`'],
      ['`mounted` / `beforeUnmount` / `unmounted`', 'DOM ready / cleanup', '`onMounted` / `onBeforeUnmount` / `onUnmounted`'],
      ['`this.$emit` / `this.$refs`', 'events / template refs', '`defineEmits()` / `useTemplateRef()` (3.5+)'],
      ['`mixins`', 'reuse (implicit, merged)', 'composables (explicit imports and return values)'],
    ],
    note: 'Both styles run on the same reactivity system. See [Composition API vs Options API](lesson:composition-vs-options).',
  },

  quiz: [
    {
      id: 'options-api-q1',
      type: 'mcq',
      prompt: 'Which lifecycle hook is the first one where `this.$refs.input` points at a real DOM element?',
      options: [
        { text: '`beforeCreate`', why: 'Nothing is ready yet — not even data.' },
        { text: '`created`', why: 'Data and methods are ready, but the template has not been rendered into the DOM yet.' },
        { text: '`beforeMount`', why: 'The first render is about to happen; the DOM does not exist yet.' },
        { text: '`mounted`' },
      ],
      answer: 3,
      explanation: '`mounted` runs after the component\'s DOM has been created and inserted, so template refs are populated.',
    },
    {
      id: 'options-api-q2',
      type: 'output',
      prompt: 'What does this component log when it is created?',
      code: {
        lang: 'js',
        code: `const greetMixin = {
  data() { return { msg: 'from mixin' } },
  created() { console.log('mixin:', this.msg) },
}

export default {
  mixins: [greetMixin],
  data() { return { msg: 'from component' } },
  created() { console.log('component:', this.msg) },
}`,
      },
      options: [
        { text: '`component: from component` only', why: 'Hooks are not overwritten — both run.' },
        { text: '`mixin: from mixin` then `component: from component`', why: 'There is only one merged `msg`; the mixin hook sees the same value as the component.' },
        { text: '`mixin: from component` then `component: from component`' },
        { text: '`component: from component` then `mixin: from component`', why: 'Mixin hooks run before the component\'s own hooks.' },
      ],
      answer: 2,
      explanation: 'Data merges into one object where the component wins on conflicts, so `this.msg` is "from component" everywhere. Same-named hooks are both kept, and the mixin\'s runs first.',
    },
    {
      id: 'options-api-q3',
      type: 'bug',
      prompt: 'Clicking the button throws `Cannot read properties of undefined`. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `export default {
  data() {
    return { likes: 0 }
  },
  methods: {
    like: () => {
      this.likes++
    },
  },
}`,
      },
      answerLine: 6,
      explanation: '`like` is an arrow function, so `this` is not the component instance. Line 7 is where it crashes, but line 6 is the cause: write `like() { this.likes++ }`.',
    },
    {
      id: 'options-api-q4',
      type: 'fill',
      prompt: 'Complete the watcher so it reacts to nested changes and also runs once immediately.',
      code: {
        lang: 'js',
        code: `watch: {
  settings: {
    handler(value) { saveSettings(value) },
    ___: true,       // react to nested changes
    ___: true,       // run once right away
  },
},`,
      },
      answer: [['deep'], ['immediate']],
      explanation: '`deep: true` traverses nested properties so changes inside `settings` trigger the handler; `immediate: true` runs it once when the watcher is created.',
    },
    {
      id: 'options-api-q5',
      type: 'mcq',
      prompt: 'You are migrating a Vue 2 component to Vue 3. Which hook names must change?',
      options: [
        { text: '`created` → `onCreated`', why: '`created` keeps its name in the Options API (and has no Composition API hook — setup code runs at that point).' },
        { text: '`beforeDestroy` → `beforeUnmount` and `destroyed` → `unmounted`' },
        { text: '`mounted` → `ready`', why: '`ready` was Vue 1. `mounted` is unchanged.' },
        { text: 'None — all Vue 2 hook names are identical in Vue 3.', why: 'The destroy hooks were renamed.' },
      ],
      answer: 1,
      explanation: 'Vue 3 renamed the teardown hooks to match the mount terminology: `beforeUnmount` and `unmounted`.',
    },
    {
      id: 'options-api-q6',
      type: 'mcq',
      prompt: 'Select **all** problems commonly caused by mixins.',
      options: [
        { text: 'It is unclear which mixin a `this.x` property comes from.' },
        { text: 'Two mixins can define the same property name and one silently wins.' },
        { text: 'Mixins can implicitly depend on properties defined by the component or other mixins.' },
        { text: 'Mixins cannot contain lifecycle hooks.', why: 'They can — and those hooks run before the component\'s own.' },
        { text: 'Mixins only work in Vue 2.', why: 'Vue 3 still supports them; they are just no longer recommended.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Unclear sources, namespace collisions and implicit cross-dependencies are the three drawbacks the Vue docs list for mixins.',
    },
    {
      id: 'options-api-q7',
      type: 'short',
      prompt: 'Why can\'t you use an arrow function for an Options API method, but you can use one *inside* a method?',
      answer: 'Arrow functions take `this` from the code around where they are written. A method defined as an arrow in the options object is written at module level, so `this` is not the instance and Vue cannot bind it. An arrow written inside a normal method captures that method\'s `this`, which Vue has bound to the instance, so it works.',
    },
  ],

  exercises: [
    {
      id: 'fix-legacy-cart',
      title: 'Fix a broken legacy cart',
      difficulty: 'intermediate',
      prompt: `
This Options API cart was copied from an old Vue 2 tutorial and doesn't work in Vue 3. It has **three bugs**. Fix them without switching to the Composition API.

Expected behaviour:

- It starts with one item (**Notebook — 12**) and \`<p class="total">\` reads **Total: 12**.
- \`.add-pen\` adds a Pen (3), \`.add-bag\` adds a Backpack (40). Each item is an \`<li class="item">\`.
- \`<p class="over">Over budget!</p>\` appears only when the total is greater than the budget of 50.
`,
      files: {
        'App.vue': `<script>
export default {
  data: {
    items: [{ id: 1, name: 'Notebook', price: 12 }],
    budget: 50,
  },
  computed: {
    total() {
      this.items.reduce((sum, item) => sum + item.price, 0)
    },
  },
  methods: {
    add: (name, price) => {
      this.items.push({ id: Date.now() + Math.random(), name, price })
    },
  },
}
</script>

<template>
  <button class="add-pen" @click="add('Pen', 3)">Add pen (3)</button>
  <button class="add-bag" @click="add('Backpack', 40)">Add backpack (40)</button>
  <ul>
    <li v-for="item in items" :key="item.id" class="item">{{ item.name }} — {{ item.price }}</li>
  </ul>
  <p class="total">Total: {{ total }}</p>
  <p v-if="total > budget" class="over">Over budget!</p>
</template>`,
      },
      hints: [
        'Look at the shape of each option. One must be a function that returns an object; one forgot to give back its value; one cannot see the instance.',
        '`data` → `data() { return { … } }`. The computed needs a `return`.',
        'The method is an arrow function, so `this` is `undefined`. Use method shorthand: `add(name, price) { … }`.',
      ],
      solution: {
        explanation: 'Bug 1: Vue 3 requires `data` to be a function (a fresh object per instance). Bug 2: a computed getter must `return` its value. Bug 3: arrow methods cannot be bound to the instance, so `this` was `undefined`. These are the three most common legacy Options API bugs.',
        files: {
          'App.vue': `<script>
export default {
  data() {
    return {
      items: [{ id: 1, name: 'Notebook', price: 12 }],
      budget: 50,
    }
  },
  computed: {
    total() {
      return this.items.reduce((sum, item) => sum + item.price, 0)
    },
  },
  methods: {
    add(name, price) {
      this.items.push({ id: Date.now() + Math.random(), name, price })
    },
  },
}
</script>

<template>
  <button class="add-pen" @click="add('Pen', 3)">Add pen (3)</button>
  <button class="add-bag" @click="add('Backpack', 40)">Add backpack (40)</button>
  <ul>
    <li v-for="item in items" :key="item.id" class="item">{{ item.name }} — {{ item.price }}</li>
  </ul>
  <p class="total">Total: {{ total }}</p>
  <p v-if="total > budget" class="over">Over budget!</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts with the notebook and Total: 12', code: `expect(findAll('.item')).toHaveLength(1)\nexpect(text('.total')).toBe('Total: 12')` },
        { name: 'adding a pen updates the total', code: `await click('.add-pen')\nexpect(findAll('.item')).toHaveLength(2)\nexpect(text('.total')).toBe('Total: 15')\nexpect(exists('.over')).toBe(false)` },
        { name: 'going over 50 shows the warning', code: `await click('.add-pen')\nawait click('.add-bag')\nexpect(text('.total')).toBe('Total: 55')\nexpect(exists('.over')).toBe(true)` },
      ],
    },
    {
      id: 'tweet-box',
      title: 'Build a character-limited tweet box',
      difficulty: 'intermediate',
      prompt: `
Complete \`TweetBox.vue\` using **only the Options API**. \`App.vue\` passes \`:max="20"\` and listens for \`over-limit\`.

- \`data\`: a \`text\` string bound with \`v-model\` to \`<textarea class="tweet" ref="box">\`.
- \`computed\`: \`remaining\` (= \`max - text.length\`) shown in \`<p class="remaining">\`, and \`isOver\` (remaining < 0). Give the paragraph the class \`over\` when \`isOver\` is true.
- \`watch\`: when \`isOver\` changes, emit \`over-limit\` with the new boolean.
- \`methods\`: \`clear()\` empties the text; wire it to \`<button class="clear">\`.
- \`mounted\`: focus the textarea through \`this.$refs\`.
`,
      files: {
        'TweetBox.vue': `<script>
export default {
  props: {
    max: { type: Number, default: 280 },
  },
  emits: ['over-limit'],
  data() {
    return {
      // TODO
    }
  },
  computed: {
    // TODO: remaining, isOver
  },
  watch: {
    // TODO: emit 'over-limit' when isOver changes
  },
  methods: {
    // TODO: clear()
  },
  mounted() {
    // TODO: focus the textarea
  },
}
</script>

<template>
  <textarea class="tweet"></textarea>
  <p class="remaining">0</p>
  <button class="clear">Clear</button>
</template>`,
        'App.vue': `<script>
import TweetBox from './TweetBox.vue'

export default {
  components: { TweetBox },
  data() {
    return { warning: false }
  },
}
</script>

<template>
  <TweetBox :max="20" @over-limit="warning = $event" />
  <p v-if="warning" class="warning">Too long!</p>
</template>`,
      },
      hints: [
        'Start with `data() { return { text: \'\' } }` and `<textarea ref="box" v-model="text" class="tweet">`.',
        '`remaining() { return this.max - this.text.length }`, `isOver() { return this.remaining < 0 }`, and `:class="{ over: isOver }"` on the paragraph.',
        'Watch a computed by name: `watch: { isOver(value) { this.$emit(\'over-limit\', value) } }`. Focus with `mounted() { this.$refs.box.focus() }`.',
      ],
      solution: {
        explanation: 'Each requirement maps to one option: state in `data`, derived numbers in `computed`, the event as a side effect in `watch` (watchers can observe computed properties by name), the action in `methods`, and DOM work in `mounted`, where `$refs` is available.',
        files: {
          'TweetBox.vue': `<script>
export default {
  props: {
    max: { type: Number, default: 280 },
  },
  emits: ['over-limit'],
  data() {
    return {
      text: '',
    }
  },
  computed: {
    remaining() {
      return this.max - this.text.length
    },
    isOver() {
      return this.remaining < 0
    },
  },
  watch: {
    isOver(value) {
      this.$emit('over-limit', value)
    },
  },
  methods: {
    clear() {
      this.text = ''
    },
  },
  mounted() {
    this.$refs.box.focus()
  },
}
</script>

<template>
  <textarea ref="box" v-model="text" class="tweet"></textarea>
  <p class="remaining" :class="{ over: isOver }">{{ remaining }}</p>
  <button class="clear" @click="clear">Clear</button>
</template>`,
          'App.vue': `<script>
import TweetBox from './TweetBox.vue'

export default {
  components: { TweetBox },
  data() {
    return { warning: false }
  },
}
</script>

<template>
  <TweetBox :max="20" @over-limit="warning = $event" />
  <p v-if="warning" class="warning">Too long!</p>
</template>`,
        },
      },
      tests: [
        { name: 'the textarea is focused on mount', code: `expect(document.activeElement).toBe(find('.tweet'))` },
        { name: 'shows remaining characters', code: `expect(text('.remaining')).toBe('20')\nawait type('.tweet', 'hello')\nexpect(text('.remaining')).toBe('15')` },
        {
          name: 'going over the limit marks it and warns the parent',
          code: `await type('.tweet', 'this sentence is far too long')
expect(Number(text('.remaining'))).toBeLessThan(0)
expect(classes('.remaining')).toContain('over')
expect(exists('.warning')).toBe(true)`,
        },
        {
          name: 'clear resets the text and the warning',
          code: `await type('.tweet', 'this sentence is far too long')
await click('.clear')
expect(text('.remaining')).toBe('20')
expect(classes('.remaining')).not.toContain('over')
expect(exists('.warning')).toBe(false)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'options-api-data-function',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why must `data` be a function in a Vue component?',
      answer: 'Because a component definition can be used to create many instances. A function returns a brand-new object for each instance, so their state is independent. A shared object would make every instance read and write the same state. Vue 3 requires a function for all components (Vue 2 allowed a plain object only on the root instance).',
      explanation: 'One recipe, many cakes: each cake needs its own ingredients.',
      code: { lang: 'js', code: `// ✅ each <Counter> gets its own count\nexport default {\n  data() {\n    return { count: 0 }\n  },\n}` },
      whyAsked: 'A classic screening question about component instances and shared mutable state.',
      mistakes: ['Saying "because Vue requires it" without explaining shared state.', 'Thinking it is about performance.'],
      followUps: ['What happens in Vue 3 if you pass an object?', 'Is the same true for `reactive()` at module level in a composable?'],
      modelAnswer: 'A component is a blueprint that can be instantiated many times. If `data` were a single object, every instance would share it, so incrementing one counter would increment them all. Making `data` a function means Vue calls it once per instance and gets a fresh object each time. Vue 3 enforces this for every component and warns if you pass a plain object. The same idea applies to composables: state created inside the function is per-call, state at module level is shared.',
    },
    {
      id: 'options-api-arrow-this',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A method works when written `save() {…}` but throws when rewritten as `save: () => {…}`. Explain exactly why.',
      answer: 'Vue binds each method to the component instance with `bind`. Arrow functions don\'t have their own `this` — they capture it lexically from where they\'re defined (the module, where it is `undefined`) and ignore `bind`. So inside an arrow method `this.anything` throws.',
      explanation: 'Normal functions get `this` from how they are called (and can be bound); arrows get it from where they are written.',
      whyAsked: 'Very common bug in Options API codebases; tests JavaScript fundamentals behind the framework.',
      mistakes: ['Saying arrow functions are "not allowed" without the `this` explanation.', 'Claiming `this` refers to `window` in modules (it is `undefined` in ES modules).'],
      followUps: ['Why is an arrow fine inside a method, e.g. in `.filter()`?', 'Why does `setTimeout(this.tick, 1000)` work with Options API methods?'],
      modelAnswer: 'Vue binds every method to the instance, so `this` is the component even when the method is passed around. Arrow functions don\'t have their own `this`; they take it from the scope they\'re written in, which for an options object is the module, where `this` is `undefined`, and `bind` can\'t change that. So the arrow version crashes on `this.x`. Inside a normal method, arrows are great — they capture the method\'s already-bound `this`.',
    },
    {
      id: 'options-api-mixin-problems',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What are mixins, how does Vue merge them, and what problems do they cause?',
      answer: 'A mixin is an options object merged into a component via `mixins: [...]`. Hooks are concatenated (mixin hooks run first); `methods`, `computed` and `components` are merged by key; `data` is merged shallowly (Vue 3); on conflicts the component wins and later mixins beat earlier ones. Problems: unclear property sources (`this.x` could come from any mixin), silent name collisions, and implicit cross-dependencies between mixins and the component.',
      explanation: 'Everything ends up on one flat `this`, with no imports to tell you where anything came from.',
      whyAsked: 'Legacy codebases are full of mixins; interviewers want to know you can maintain them and understand why the Composition API moved away from them.',
      mistakes: ['Not knowing that hooks are kept from both (not overwritten).', 'Thinking Vue throws an error on collisions.', 'Saying mixins were removed in Vue 3.'],
      followUps: ['In what order do a mixin\'s and a component\'s `created` hooks run?', 'How would you gradually remove a mixin?'],
      modelAnswer: 'A mixin is a reusable options object that Vue merges into the component. Lifecycle hooks from both are kept, with the mixin\'s running first; methods and computed are merged by key with the component winning; and in Vue 3 data is merged shallowly. The problems are threefold: you can\'t tell where `this.loading` comes from without opening every mixin, two mixins can use the same name and one silently overrides the other, and mixins often rely on properties defined elsewhere, which couples them invisibly. That\'s why Vue 3 recommends composables; to migrate, I\'d extract the mixin into a composable and call it from `setup()` in the components that use it.',
    },
    {
      id: 'options-api-hook-order',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A `Parent` renders a `Child`. Both log in `created` and `mounted`. In what order do the four logs appear?',
      options: [
        'Parent created → Parent mounted → Child created → Child mounted',
        'Parent created → Child created → Child mounted → Parent mounted',
        'Child created → Child mounted → Parent created → Parent mounted',
        'Parent created → Child created → Parent mounted → Child mounted',
      ],
      correctOption: 1,
      answer: '**Parent created → Child created → Child mounted → Parent mounted.** The parent is created first, starts rendering, creates and mounts its children during that render, and is only considered mounted once its whole subtree is in the DOM.',
      explanation: 'Creation goes top-down; mounting completes bottom-up.',
      whyAsked: 'Shows understanding of the render process — relevant when parents access children in `mounted`.',
      mistakes: ['Assuming the parent is mounted before its children.', 'Forgetting `beforeMount` of the parent happens before the child is created.'],
      followUps: ['Where does the parent\'s `beforeMount` fit?', 'Is a child\'s template ref available in the parent\'s `mounted`?'],
      modelAnswer: 'Parent created, child created, child mounted, parent mounted. The parent initialises first, then during its first render it creates and mounts each child. The parent\'s `mounted` only fires once the whole subtree is in the DOM, which is why a parent can safely use template refs to its children in `mounted`.',
    },
    {
      id: 'options-api-array-watch',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After migrating from Vue 2 to Vue 3, `watch: { cart(items) { this.saveCart(items) } }` stops saving when products are added with `this.cart.push(product)`. Why, and what are the fixes?',
      answer: 'In Vue 3, a watcher on an array fires only when the array is replaced, not when it is mutated, unless `deep: true` is set (Vue 2 fired on mutation). Fixes: `cart: { handler(items) { … }, deep: true }`, or replace the array (`this.cart = [...this.cart, product]`), or watch a derived value like `cart.length` if that is all you need.',
      explanation: 'The watcher compares the same array object before and after `push`, so it sees no change.',
      whyAsked: 'A real migration pitfall listed in the official migration guide; shows hands-on upgrade experience.',
      mistakes: ['Blaming reactivity being "broken" for arrays in Vue 3.', 'Using `$forceUpdate`.'],
      followUps: ['What does `deep` cost on a big array?', 'How would you write this with the Composition API?'],
      modelAnswer: 'Vue 3 changed array watching: without `deep`, the watcher only triggers when the array itself is replaced. `push` mutates the same array, so nothing fires — Vue 2 used to fire on mutations. I\'d add `deep: true`, or switch to immutable updates if the codebase prefers them. If I only cared about the count, I\'d watch `cart.length`. With a large array, I\'d remember that `deep` traverses every element on each check.',
    },
    {
      id: 'options-api-stateful-method',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'A list renders 20 `<SearchBox>` components. Each uses `methods: { onInput: debounce(function () { this.search() }, 300) }`. Typing in one box sometimes cancels another box\'s search. Why?',
      answer: 'The debounced function is created once, when the options object is defined, so all 20 instances share one debounce timer. Typing in box B resets the timer started by box A. Create a per-instance debounced function in `created()` (`this.debouncedSearch = debounce(this.search, 300)`) and cancel it in `unmounted()`.',
      explanation: 'Options objects are shared blueprints; anything stateful you put directly in them is shared too.',
      whyAsked: 'A subtle, real production bug that tests understanding of definitions vs instances.',
      mistakes: ['Blaming the debounce library.', 'Moving the debounce into `data()` without understanding why it works there.', 'Forgetting to cancel pending calls on unmount.'],
      followUps: ['How does a composable avoid this by design?', 'What could go wrong if you don\'t cancel on unmount?'],
      modelAnswer: 'The `methods` object belongs to the component definition, so `debounce(...)` runs once and every instance shares that single debounced function and its timer. When box B calls it, it resets the pending call from box A. The fix from the Vue docs is to create the debounced function per instance in `created`, store it on `this`, and cancel it in `unmounted` so a pending search can\'t fire after the component is gone. A composable avoids this naturally because each component call creates its own timer.',
    },
    {
      id: 'options-api-coding-fullname',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Make `fullName` a **writable computed** in this Options API component so that typing a full name into `input.full` updates `first` and `last` (shown in `.first` and `.last`). Everything before the first space is the first name; the rest (possibly empty) is the last name.',
      starter: {
        files: {
          'App.vue': `<script>
export default {
  data() {
    return { first: 'Ada', last: 'Lovelace' }
  },
  computed: {
    fullName() {
      return this.first + ' ' + this.last
    },
  },
}
</script>

<template>
  <input v-model="fullName" class="full" />
  <p>First: <span class="first">{{ first }}</span></p>
  <p>Last: <span class="last">{{ last }}</span></p>
</template>`,
        },
      },
      tests: [
        { name: 'shows the initial full name', code: `expect(find('.full').value).toBe('Ada Lovelace')` },
        { name: 'typing splits first and last name', code: `await type('.full', 'Grace Brewster Hopper')\nexpect(text('.first')).toBe('Grace')\nexpect(text('.last')).toBe('Brewster Hopper')` },
        { name: 'a single word clears the last name', code: `await type('.full', 'Cher')\nexpect(text('.first')).toBe('Cher')\nexpect(text('.last')).toBe('')` },
      ],
      hints: ['A computed can be an object with `get()` and `set(value)`.', 'In `set`, split on spaces: `const [first, ...rest] = value.trim().split(\' \')`.'],
      solution: {
        files: {
          'App.vue': `<script>
export default {
  data() {
    return { first: 'Ada', last: 'Lovelace' }
  },
  computed: {
    fullName: {
      get() {
        return (this.first + ' ' + this.last).trim()
      },
      set(value) {
        const [first, ...rest] = value.trim().split(' ')
        this.first = first || ''
        this.last = rest.join(' ')
      },
    },
  },
}
</script>

<template>
  <input v-model="fullName" class="full" />
  <p>First: <span class="first">{{ first }}</span></p>
  <p>Last: <span class="last">{{ last }}</span></p>
</template>`,
        },
      },
      answer: 'Replace the function with `{ get() {…}, set(value) {…} }`; the setter splits the string and writes `this.first`/`this.last`, and the getter recombines them.',
      explanation: 'A read-only computed rejects writes (Vue warns that it is readonly). The `set` half turns `v-model` writes into updates of the real source data.',
      whyAsked: 'Checks knowledge of writable computed and the "derive, don\'t duplicate" principle.',
      mistakes: ['Adding a `fullName` data property and syncing it with two watchers.', 'Putting the split logic in the template.'],
      followUps: ['What is the Composition API equivalent?', 'Why not just use a watcher on `fullName`?'],
      modelAnswer: 'I keep `first` and `last` as the source of truth and make `fullName` a computed with `get` and `set`. The getter joins them; the setter splits the input on spaces, writing the first word to `first` and the rest to `last`. `v-model` reads through the getter and writes through the setter, so there\'s no duplicated state to keep in sync. In the Composition API it\'s `computed({ get, set })`.',
    },
  ],

  takeaways: [
    'An Options API component is an object of options — `data`, `computed`, `watch`, `methods`, hooks — and `this` is the instance in all of them.',
    '`data` must be a function; methods/hooks/getters must be normal functions (no arrows) so Vue can bind `this`.',
    'Hooks: `created` = state ready, `mounted` = DOM ready, `beforeUnmount`/`unmounted` = clean up (renamed from Vue 2\'s destroy hooks).',
    'In Vue 3, array watchers fire on mutation only with `deep: true` — a top migration bug.',
    'Mixins merge into one flat `this`: unclear sources, silent collisions, hidden coupling. Prefer composables for new code; legacy components can call them from `setup()`.',
  ],
}
