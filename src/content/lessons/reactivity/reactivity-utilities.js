// Lesson: readonly, toRef, toRefs, unref, toValue & the is* checks.
// See CONTENT_GUIDE.md for every field.

const profileApp = `<script setup>
import { toRefs } from 'vue'
import { useProfile } from './useProfile.js'
import { useInitials } from './useInitials.js'

const { profile, rename, toggleTheme } = useProfile()
const { name, theme } = toRefs(profile)
const initials = useInitials(name)

function writeDirectly() {
  profile.name = 'Mallory' // readonly: blocked (a warning in development)
}
</script>

<template>
  <h2 class="greeting">Hello, {{ name }}!</h2>
  <p class="initials">Initials: {{ initials }}</p>
  <p class="theme">Theme: {{ theme }}</p>
  <button class="rename" @click="rename('Grace Hopper')">Rename</button>
  <button class="toggle" @click="toggleTheme">Toggle theme</button>
  <button class="cheat" @click="writeDirectly">Write directly</button>
</template>`

const profileStore = `import { reactive, readonly } from 'vue'

// One shared profile for the whole app (module-level state).
const state = reactive({
  name: 'Ada Lovelace',
  theme: 'light',
})

export function useProfile() {
  function rename(newName) {
    state.name = newName
  }

  function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light'
  }

  // Components get a read-only VIEW of the state,
  // plus the actions that are allowed to change it.
  return { profile: readonly(state), rename, toggleTheme }
}`

const initialsFile = `import { computed } from 'vue'

// Turns "Ada Lovelace" into "AL".
// Right now it only accepts a ref, because it reads source.value.
export function useInitials(source) {
  return computed(() =>
    source.value
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0].toUpperCase())
      .join('')
  )
}`

const scoreApp = `<script setup>
import { useScore } from './useScore.js'

// Do not change this line — fix useScore.js instead.
const { points, streak, answer } = useScore()
</script>

<template>
  <p>Points: <span class="points">{{ points }}</span></p>
  <p>Streak: <span class="streak">{{ streak }}</span></p>
  <button class="right" @click="answer(true)">Correct answer</button>
  <button class="wrong" @click="answer(false)">Wrong answer</button>
</template>`

const scoreStarter = `import { reactive } from 'vue'

export function useScore() {
  const state = reactive({ points: 0, streak: 0 })

  function answer(correct) {
    if (correct) {
      state.streak++
      state.points += 10 * state.streak // streak bonus: 10, then 20, then 30…
    } else {
      state.streak = 0
    }
  }

  // BUG: spreading copies the CURRENT numbers (0 and 0).
  // The caller's variables are no longer connected to state.
  return { ...state, answer }
}`

const scoreSolution = `import { reactive, toRefs } from 'vue'

export function useScore() {
  const state = reactive({ points: 0, streak: 0 })

  function answer(correct) {
    if (correct) {
      state.streak++
      state.points += 10 * state.streak
    } else {
      state.streak = 0
    }
  }

  // toRefs turns each property into a ref that stays linked to state,
  // so callers can destructure safely.
  return { ...toRefs(state), answer }
}`

const todoApp = `<script setup>
import { ref } from 'vue'
import { useTodos } from './todoStore.js'

const { state, remaining, add, toggle } = useTodos()
const draft = ref('')

function submit() {
  add(draft.value)
  draft.value = ''
}
</script>

<template>
  <form @submit.prevent="submit">
    <input class="new-todo" v-model="draft" placeholder="What needs doing?" />
    <button class="add">Add</button>
  </form>
  <ul>
    <li
      v-for="todo in state.todos"
      :key="todo.id"
      class="todo"
      :class="{ done: todo.done }"
      @click="toggle(todo.id)"
    >
      {{ todo.text }}
    </li>
  </ul>
  <p class="remaining">{{ remaining }} left</p>
</template>`

const todoStoreStarter = `import { reactive, computed } from 'vue'

const state = reactive({
  todos: [
    { id: 1, text: 'Learn readonly()', done: false },
    { id: 2, text: 'Write a tiny store', done: true },
  ],
})
let nextId = 3

export function useTodos() {
  const remaining = computed(() => state.todos.filter((t) => !t.done).length)

  function add(text) {
    const clean = text.trim()
    if (!clean) return
    state.todos.push({ id: nextId++, text: clean, done: false })
  }

  function toggle(id) {
    const todo = state.todos.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }

  // TODO: components must not be able to change state directly
  return { state, remaining, add, toggle }
}`

const todoStoreSolution = `import { reactive, readonly, computed } from 'vue'

const state = reactive({
  todos: [
    { id: 1, text: 'Learn readonly()', done: false },
    { id: 2, text: 'Write a tiny store', done: true },
  ],
})
let nextId = 3

export function useTodos() {
  const remaining = computed(() => state.todos.filter((t) => !t.done).length)

  function add(text) {
    const clean = text.trim()
    if (!clean) return
    state.todos.push({ id: nextId++, text: clean, done: false })
  }

  function toggle(id) {
    const todo = state.todos.find((t) => t.id === id)
    if (todo) todo.done = !todo.done
  }

  // Deep read-only view: reads are reactive, writes are refused.
  // Only add() and toggle() (which use the real state) can change it.
  return { state: readonly(state), remaining, add, toggle }
}`

const charCountApp = `<script setup>
import { ref } from 'vue'
import { useCharCount } from './useCharCount.js'

const message = ref('Hello')
const max = ref(10)
const { count, remaining } = useCharCount(message, max)
</script>

<template>
  <textarea class="message" v-model="message"></textarea>
  <p class="count">{{ count }}</p>
  <p class="remaining">{{ remaining }}</p>
</template>`

export default {
  id: 'reactivity-utilities',
  title: 'readonly, toRef, toRefs, unref & friends',
  summary: 'The small helpers that keep reactivity connected when you pass state around: read-only views, linked refs, and safe ways to unwrap "maybe a ref" values.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['reactive'],
  related: ['arrays-objects-reactivity', 'shallow-and-raw', 'composables-intro', 'props', 'using-stores'],
  tags: ['reactivity', 'readonly', 'toRef', 'toRefs', 'unref', 'toValue', 'isRef', 'isReactive', 'isReadonly', 'isProxy', 'composables', 'destructuring'],
  apis: [
    { name: 'readonly()', summary: 'Returns a deep read-only proxy of an object or ref. Reads are reactive; writes are refused with a dev warning.' },
    { name: 'toRef()', summary: 'Creates a ref linked to one property of a reactive object; since 3.3 also turns getters and plain values into refs.' },
    { name: 'toRefs()', summary: 'Converts a reactive object into a plain object of refs, each linked to the original property.' },
    { name: 'unref()', summary: 'Returns `x.value` if `x` is a ref, otherwise `x` itself.' },
    { name: 'toValue()', summary: 'Vue 3.3+: like `unref()`, but also calls getter functions. Normalises "ref, getter or value" inputs.' },
    { name: 'isRef() / isReactive() / isReadonly() / isProxy()', summary: 'Type checks for refs and reactive/readonly proxies.' },
  ],
  docs: [
    { label: 'API — Reactivity Utilities (toRef, toRefs, unref, toValue, is*)', url: 'https://vuejs.org/api/reactivity-utilities.html' },
    { label: 'API — readonly()', url: 'https://vuejs.org/api/reactivity-core.html#readonly' },
    { label: 'Vue Guide — Composables: input arguments', url: 'https://vuejs.org/guide/reusability/composables.html#input-arguments' },
    { label: 'Vue Guide — Composables: return values', url: 'https://vuejs.org/guide/reusability/composables.html#return-values' },
    { label: 'Vue Guide — Props: passing destructured props into functions', url: 'https://vuejs.org/guide/components/props.html#passing-destructured-props-into-functions' },
  ],

  intro: `
Reactive state is only useful while it stays **connected**: the screen updates because it is reading the *real* reactive object, not a copy of it. The moment you copy a value out — by destructuring, by spreading, by passing \`state.count\` into a function — the copy is just a number. Vue can't see it any more.

This lesson is about the small, everyday helpers that keep the connection alive when state travels around your app:

- \`readonly()\` — a live, read-only **view** of some state.
- \`toRef()\` / \`toRefs()\` — refs that are **linked** to properties of a reactive object, so you can destructure and pass them around safely.
- \`unref()\` / \`toValue()\` — read "maybe a ref" values in one line, which makes composables flexible.
- \`isRef()\`, \`isReactive()\`, \`isReadonly()\`, \`isProxy()\` — ask "what kind of thing is this?".
`,

  why: `
You met the problem in [reactive()](lesson:reactive): destructuring a reactive object breaks reactivity.

\`\`\`js
const state = reactive({ points: 0, streak: 0 })

const { points } = state  // points is the number 0 — a copy
state.points = 50         // state changes… points is still 0
\`\`\`

That's not a bug in Vue; it's how JavaScript works. \`const { points } = state\` reads the property **once** and stores the plain number. Reactivity lives in *property access on the proxy*, and a copied number has no proxy behind it.

But you *want* to pass state around: return it from a composable, hand one property to a helper, let a component read shared state without letting it scribble over it. These utilities exist so you can do that **without losing the connection** — and, with \`readonly()\`, without losing control of who may change what.
`,

  eli15: `
Think of a shared online document that your whole class can open.

- **Copying** is like taking a **screenshot** of one paragraph. It looks right now, but when someone edits the document, your screenshot doesn't change. Destructuring a reactive object is a screenshot.
- **\`toRef\` / \`toRefs\`** is like making a **live link** to a paragraph. Open the link any time and you see the current text. Edit through the link and the real document changes.
- **\`readonly()\`** is a **view-only share link**. You always see the latest version, but you can't type into it. Only people with edit rights (the "actions") can change it.
- **\`unref\` / \`toValue\`** means "**read it out loud right now**" — whether you were handed the document, a link to it, or a sticky note with the text. You get the words *as they are at this moment*.
- **\`isRef\` / \`isReactive\`** is just checking: "is this a live link, or a screenshot?"
`,

  analogy: {
    title: 'Live links vs screenshots of a shared document',
    body: `
A team keeps its plans in one shared online document. That document is the **single source of truth** — the reactive object.

Some teammates keep **screenshots** of the parts they care about. Screenshots are quick, but the day someone edits the plan, every screenshot is silently out of date. That is plain destructuring.

Smarter teammates keep **live links** to sections. A link never holds its own copy of the text; it always shows the document's current text, and editing through it edits the document. That is \`toRef()\` — and \`toRefs()\` is "give me a live link to *every* section".

Interns get a **view-only link**: always current, but the edit button is disabled. If they want something changed, they ask someone with edit rights. That is \`readonly()\` plus actions.

Finally, \`toValue()\` is reading the current text aloud — handy, but it is a moment in time. If you want to *stay* up to date, you have to read it again whenever it changes (inside a \`computed\` or a watcher).
`,
    mapping: [
      ['the shared document', 'a `reactive()` object (the source of truth)'],
      ['a screenshot', 'a destructured / spread / copied value — not reactive'],
      ['a live link to one section', '`toRef(state, \'key\')`'],
      ['live links to every section', '`toRefs(state)`'],
      ['a view-only share link', '`readonly(state)`'],
      ['teammates with edit rights', 'the actions that change the real state'],
      ['reading the text aloud', '`unref()` / `toValue()` — one read, right now'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Links, views and copies',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'actions', label: 'rename() · toggleTheme()', note: 'the only writers', tone: 'red', x: 130, y: 70 },
        { id: 'state', label: 'reactive state', note: "{ name: 'Ada', theme: 'light' }", tone: 'acid', x: 400, y: 70 },
        { id: 'view', label: 'readonly(state)', note: 'live, read-only view', tone: 'cobalt', x: 400, y: 170 },
        { id: 'nameRef', label: 'name — a ref', note: 'toRefs → view.name', tone: 'paper', x: 200, y: 270 },
        { id: 'themeRef', label: 'theme — a ref', note: 'toRefs → view.theme', tone: 'paper', x: 420, y: 270 },
        { id: 'copy', label: "const { theme } = view", note: "'light' forever", tone: 'kraft', x: 640, y: 270 },
      ],
      edges: [
        { from: 'actions', to: 'state', label: 'writes' },
        { from: 'view', to: 'state', label: 'reads through' },
        { from: 'nameRef', to: 'view', label: '.value' },
        { from: 'themeRef', to: 'view', label: '.value' },
        { from: 'copy', to: 'view', label: 'copied once', dashed: true },
      ],
      steps: [
        { focus: ['state'], text: 'One `reactive()` object holds the profile. It is the single source of truth.' },
        { focus: ['actions'], edges: ['actions->state'], text: 'Only the composable\'s **actions** write to the real state. That makes every change easy to find.' },
        { focus: ['view'], edges: ['view->state'], text: '`readonly(state)` is a proxy *in front of* the state. Reads pass through (and are tracked); writes are refused with a warning in development. It is a **view, not a copy** — when an action changes the state, the view shows it immediately.' },
        { focus: ['nameRef', 'themeRef'], edges: ['nameRef->view', 'themeRef->view'], text: '`toRefs(profile)` makes one ref per property. Each ref\'s `.value` simply reads `profile[key]` — a **live link**. That is why `const { name, theme } = toRefs(profile)` is safe to destructure.' },
        { focus: ['copy'], edges: ['copy->view'], text: 'Plain destructuring reads the property **once** and keeps the string. `\'light\'` stays `\'light\'` forever. This is the reactivity loss `toRefs()` fixes.' },
      ],
    },
    caption: 'A reactive object, a read-only view in front of it, refs linked to the view, and a plain copy that has lost its connection.',
    alt: 'Diagram. At the top, "rename() · toggleTheme() — the only writers" has an arrow labelled "writes" to "reactive state { name, theme }". Below it, "readonly(state) — live, read-only view" has an arrow labelled "reads through" up to the state. At the bottom, two refs "name" and "theme" point at the readonly view via ".value", while a third box "const { theme } = view — light forever" connects with a dashed arrow labelled "copied once".',
  },

  syntax: [
    `
#### readonly()

Wrap an object (reactive or plain) or a ref. You get a **deep** read-only proxy: nested objects are read-only too.
`,
    {
      code: `import { reactive, readonly } from 'vue'

const state = reactive({ count: 0, user: { name: 'Ada' } })
const view = readonly(state)

state.count++          // ✅ the source can still change…
console.log(view.count) // 1 — …and the view reflects it

view.count++           // ❌ refused: warning in dev, value stays 1
view.user.name = 'Bo'  // ❌ nested objects are read-only too`,
      lang: 'js',
      title: 'readonly(): a live, read-only view',
    },
    `
#### toRef() and toRefs()

\`toRef(obj, 'key')\` makes **one** ref linked to a property. \`toRefs(obj)\` does it for **every** property and returns a plain object of refs — perfect for destructuring.
`,
    {
      code: `import { reactive, toRef, toRefs } from 'vue'

const state = reactive({ points: 0, streak: 0 })

const points = toRef(state, 'points') // ref ↔ state.points
points.value = 10                     // writes state.points
state.points = 20                     // points.value is now 20

const { streak } = toRefs(state)      // safe destructuring
streak.value++                        // state.streak is 1

// Vue 3.3+: toRef() also normalises values and getters
toRef(existingRef)        // returns the same ref
toRef(() => props.userId) // a READ-ONLY ref that calls the getter on .value
toRef(42)                 // same as ref(42)`,
      lang: 'js',
      title: 'linked refs',
    },
    `
#### unref() and toValue()

Both read "maybe a ref" values. \`toValue()\` also **calls getters**, which makes it the go-to for composable inputs.
`,
    {
      code: `import { ref, unref, toValue } from 'vue'

const count = ref(3)

unref(count)        // 3
unref(7)            // 7
unref(() => 7)      // the function itself — unref doesn't call it

toValue(count)      // 3
toValue(7)          // 7
toValue(() => 7)    // 7  (Vue 3.3+)`,
      lang: 'js',
      title: 'unwrapping',
    },
    `
#### The is* checks
`,
    {
      code: `import { ref, reactive, readonly, computed, isRef, isReactive, isReadonly, isProxy } from 'vue'

isRef(ref(1))                         // true
isRef(computed(() => 1))              // true — computeds are refs
isReactive(reactive({}))              // true
isReactive(ref({}))                   // false — the ref isn't a proxy…
isReactive(ref({}).value)             // true  — …but its object value is
isReadonly(readonly({}))              // true
isReadonly(computed(() => 1))         // true — a computed without a setter
isProxy(readonly({}))                 // true — reactive OR readonly proxy
isProxy(ref(1))                       // false — refs are not Proxies`,
      lang: 'js',
      title: 'type checks',
    },
    `
**The rules:**

1. Destructuring or spreading a reactive object copies values. Use \`toRefs()\` (all properties) or \`toRef()\` (one) to keep a live link.
2. \`toRefs()\` only creates refs for properties that exist **when you call it**. For a property that may appear later, use \`toRef(obj, 'key')\` — it works even if the key doesn't exist yet.
3. \`readonly()\` is a view, not a frozen copy: changes to the source show through. Only *direct writes through the view* are blocked.
4. \`unref()\` and \`toValue()\` read **once**. To stay reactive, call them *inside* a \`computed\`, \`watch\` getter or \`watchEffect\`.
5. These helpers are about **reactivity**, not security — see the production notes.
`,
    {
      callout: 'version',
      title: 'Version notes',
      text: '`readonly`, `toRef(obj, key)`, `toRefs`, `unref` and the `is*` helpers exist in every Vue 3 release. `toValue()` and the getter/value forms of `toRef()` were added in **Vue 3.3**. `shallowReadonly()` (only the top level is read-only) is covered in [shallowRef & friends](lesson:shallow-and-raw).',
    },
    {
      callout: 'note',
      title: 'Not Vue core: storeToRefs()',
      text: 'Pinia ships its own `storeToRefs(store)` for destructuring a store\'s state and getters. It is part of **Pinia**, not Vue — see [Using stores](lesson:using-stores).',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: profileApp,
    intro: 'A profile card backed by a small composable. `useProfile.js` exposes a read-only view plus actions; `useInitials.js` derives initials. Step through how the component keeps every value connected.',
    steps: [
      { lines: [2], text: 'We import `toRefs` — the helper that lets us destructure reactive state without losing reactivity.' },
      { lines: [3, 4], text: 'Two composables from local files. Open the `useProfile.js` tab: its state is module-level, so every component calling `useProfile()` shares it.' },
      { lines: [6], text: '`profile` is `readonly(state)` — a live view. `rename` and `toggleTheme` are the only functions allowed to change the real state.' },
      { lines: [7], text: '`toRefs(profile)` returns `{ name: Ref, theme: Ref }`. Each ref reads `profile.name` / `profile.theme` on demand, so destructuring keeps the link.' },
      { lines: [8], text: 'We pass the `name` **ref** (not a string) to `useInitials`, so the composable can react when the name changes.' },
      { lines: [10, 12], text: 'An attempt to write through the read-only view. Vue refuses it: nothing changes, and in development you get a "target is readonly" warning in the console.' },
      { lines: [16, 18], text: 'Top-level refs are unwrapped in the template, so `{{ name }}` and `{{ theme }}` show current values.' },
      { lines: [19, 21], text: 'Rename and Toggle go through actions and work. Write directly is blocked — click all three and watch the console.' },
    ],
  },

  playground: {
    title: 'Profile card with a read-only store',
    objective: 'See the difference between linked refs and copies, respect a readonly view, and make a composable accept refs, getters and plain values.',
    files: { 'App.vue': profileApp, 'useProfile.js': profileStore, 'useInitials.js': initialsFile },
    entry: 'App.vue',
    expected: 'A card reading **Hello, Ada Lovelace!**, **Initials: AL** and **Theme: light**. **Rename** switches to Grace Hopper (initials GH), **Toggle theme** flips light/dark, and **Write directly** does nothing except log a Vue warning.',
    experiments: [
      {
        id: 'lost-link',
        task: 'Break it on purpose: change line 7 to `const { name, theme } = profile` (no `toRefs`). Click **Toggle theme** and **Rename**. Then put `toRefs` back.',
        hint: 'Watch the heading and the theme line. The state really does change (check the **Reactive state** tab) — the screen just isn\'t connected to it any more.',
        explain: 'Without `toRefs`, `name` and `theme` are plain strings copied at setup time — screenshots. The store keeps changing, but the template is reading the copies. `toRefs` gives you refs whose `.value` reads the store every time.',
      },
      {
        id: 'readonly-guard',
        task: 'Click **Write directly** and check the console: the write is refused. Now fix `writeDirectly()` so it renames the user to **Mallory** the *allowed* way.',
        hint: 'You cannot write through `profile`, but you already have an action that changes the name: `rename(\'Mallory\')`.',
        tests: [
          {
            name: 'Write directly now renames to Mallory',
            code: `await click('.cheat')
expect(text('.greeting')).toBe('Hello, Mallory!')`,
          },
        ],
        explain: '`readonly()` turns "anyone can change anything" into "changes go through actions". The view still updates live, because it reads through to the real state the action changed.',
      },
      {
        id: 'initials-getter',
        task: 'Make `useInitials` accept a **ref, a getter function or a plain string**. For example, `useInitials(\'Grace Hopper\')` and `useInitials(() => \'Alan Turing\')` should both work.',
        hint: 'In `useInitials.js`, import `toValue` from `\'vue\'` and replace `source.value` with `toValue(source)` — inside the `computed`, so it is still tracked.',
        tests: [
          {
            name: 'accepts plain strings and getters (and still refs)',
            code: `const { useInitials } = requireModule('useInitials.js')
expect(withSetup(() => useInitials('Grace Hopper')).value).toBe('GH')
expect(withSetup(() => useInitials(() => 'Alan Mathison Turing')).value).toBe('AMT')
await click('.rename')
expect(text('.initials')).toBe('Initials: GH')`,
          },
        ],
        explain: '`toValue()` normalises all three shapes: refs are unwrapped, getters are called, plain values are returned as-is. Because it runs *inside* the computed, reading a ref or calling a getter that reads reactive state is tracked — so the result updates when the source changes.',
      },
      {
        id: 'notifications',
        task: 'Add a `notifications: true` setting to the profile state and a `toggleNotifications()` action in `useProfile.js`. In `App.vue`, show `<p class="notifications">Notifications: on</p>` (or `off`) and a `<button class="notify">` that toggles it.',
        hint: 'Add the property to `reactive({…})`, write the action, return it, then add `notifications` to the `toRefs` destructuring (or read `profile.notifications` directly). Display it with `{{ notifications ? \'on\' : \'off\' }}`.',
        tests: [
          {
            name: 'notifications toggle on and off',
            code: `expect(text('.notifications')).toBe('Notifications: on')
await click('.notify')
expect(text('.notifications')).toBe('Notifications: off')
await click('.notify')
expect(text('.notifications')).toBe('Notifications: on')`,
          },
        ],
        explain: 'Same pattern, one more property: the state lives in one place, an action changes it, the component gets a read-only view and destructures it with `toRefs`. Notice that `toRefs` only creates refs for properties that exist when it is called — the property must be in the initial state.',
      },
    ],
  },

  internals: {
    beginner: `
None of these helpers is magic. A ref made by \`toRef\` is a tiny object whose \`.value\` simply reads (or writes) one property of the reactive object — the reactive object does the tracking. \`readonly()\` is a guard standing in front of an object: it lets reads through and turns writes away. \`unref\` and \`toValue\` are one-line functions that "open the box if it is a box". The \`is…\` helpers look for hidden markers Vue puts on refs and proxies.
`,
    technical: [
      `
Here are simplified models that behave like the real helpers for everyday purposes:
`,
      {
        code: `// Simplified models — NOT Vue's real source
function toRef(object, key) {
  return {
    __v_isRef: true,                      // what isRef() looks for
    get value() { return object[key] },   // tracking happens in the reactive object
    set value(v) { object[key] = v },     // so does triggering
  }
}

function toRefs(object) {
  const result = {}                       // a PLAIN object…
  for (const key in object) result[key] = toRef(object, key) // …full of refs
  return result
}

const unref = (x) => (isRef(x) ? x.value : x)
const toValue = (x) => (typeof x === 'function' ? x() : unref(x))

function readonly(target) {
  return new Proxy(target, {
    get(t, key) {
      const v = Reflect.get(t, key)
      return v !== null && typeof v === 'object' ? readonly(v) : v // deep
    },
    set(t, key) {
      console.warn('Set operation on key "' + String(key) + '" failed: target is readonly.')
      return true                         // refuse quietly, don't throw
    },
    deleteProperty() { return true },     // also refused (with a warning in Vue)
  })
}`,
        lang: 'js',
        title: 'mental models (simplified)',
      },
      `
Consequences worth knowing:

- **A \`toRef\` is only as reactive as its source.** The ref itself does no tracking; it forwards to \`object[key]\`. On a \`reactive()\` object that access is tracked. On a *plain* object it isn't — \`toRef(plainObj, 'x')\` stays in sync when read, but changing it never updates the screen. (\`toRefs()\` on a plain object even logs a dev warning: *"toRefs() expects a reactive object but received a plain one."*)
- **\`readonly()\` of a reactive object is reactive; \`readonly()\` of a plain object is not.** In Vue's implementation a readonly proxy doesn't track reads itself, since nothing can change *through* it. Wrapping a reactive object means each read goes through the reactive proxy underneath, which does track. That's why the classic pattern is \`readonly(reactiveState)\`.
- **\`isReactive(readonly(reactive(x)))\` is \`true\`.** Vue looks through the readonly layer to the reactive object beneath. \`isReadonly\` is also true for a \`computed\` without a setter.
- **A getter \`toRef(() => …)\` has no setter.** Assigning to its \`.value\` throws a \`TypeError\` in strict-mode code (which every ES module is).
- **Unwrapping is a one-time read.** \`toValue(source)\` returns whatever the source holds *now*. Called inside a computed or effect, the reads it performs are tracked; called once at the top of a composable, you get a frozen snapshot.

In Vue's source, the refs created by \`toRef(obj, key)\` and \`toRef(getter)\` are separate small classes, and the \`is*\` helpers check internal flag properties. Those names and flags are implementation details that may change — only the documented behaviour is public API.
`,
    ],
    production: `
- **Composables return a plain object of refs.** It is the convention the Vue docs recommend: callers can destructure safely, and if they prefer \`result.x\` access they can wrap it in \`reactive()\` to get unwrapping. If your composable keeps state in a \`reactive()\` object internally, return \`{ ...toRefs(state), ...actions }\`.
- **Composables accept refs, getters or plain values.** Type the parameter as \`MaybeRefOrGetter\` (TypeScript, 3.3+) and call \`toValue()\` *inside* a \`computed\`, \`watch\` getter or \`watchEffect\`. Then \`useX(someRef)\`, \`useX(() => props.id)\` and \`useX(5)\` all work.
- **Shared state: expose \`readonly(state)\` plus actions.** All writes then go through named functions you can log, validate and test. Pinia applies the same idea with its own API — see [Using stores](lesson:using-stores).
- **\`readonly()\` is a guard rail, not security.** It prevents *accidental* writes in your code. Anyone can change memory in the browser (devtools, \`toRaw()\`), so it protects nothing from a user. Frontend checks never replace backend authorization — the server must validate every change.
- **Passing a prop into a composable:** pass \`toRef(props, 'id')\` or a getter \`() => props.id\`, never \`props.id\` (a snapshot). With reactive props destructure (Vue 3.5+), \`const { id } = defineProps()\` is reactive inside the component, but passing \`id\` to a function still passes the current value — wrap it: \`useX(() => id)\`.
- **Avoid \`isRef\` branches everywhere.** Normalise once with \`toValue()\` or \`toRef()\` and write the rest of the code against one shape. The \`is*\` helpers are mostly for generic library code and debugging.
- **\`toRefs\` cost is small** (one tiny ref object per property, created when you call it), but it only covers keys that exist at that moment. Prefer \`toRef\` for optional keys.
`,
  },

  mistakes: [
    {
      title: 'Destructuring a reactive object (or readonly view) directly',
      wrong: {
        code: `const { profile } = useProfile()
const { name, theme } = profile   // two plain strings — never update`,
        lang: 'js',
      },
      right: {
        code: `const { profile } = useProfile()
const { name, theme } = toRefs(profile) // two linked refs`,
        lang: 'js',
      },
      explanation: 'Destructuring reads each property once and keeps the value. Reactivity lives in property access on the proxy, so you need refs that *do* that access every time: `toRefs()`. More cases (spreading, arrays, function arguments) in [Reactivity with arrays, objects & destructuring](lesson:arrays-objects-reactivity).',
    },
    {
      title: 'Unwrapping once at the top of a composable',
      wrong: {
        code: `export function useDoubled(source) {
  const n = toValue(source)       // read ONCE, at setup time
  return computed(() => n * 2)    // never changes
}`,
        lang: 'js',
      },
      right: {
        code: `export function useDoubled(source) {
  return computed(() => toValue(source) * 2) // read on every evaluation
}`,
        lang: 'js',
      },
      explanation: '`toValue()` and `unref()` return the value *right now*. Do the read inside the computed (or watcher) so that it happens — and is tracked — every time the result is recalculated.',
    },
    {
      title: 'Using toRefs on a plain object',
      wrong: {
        code: `const settings = { volume: 5, muted: false }
const { volume } = toRefs(settings) // dev warning; volume isn't reactive`,
        lang: 'js',
      },
      right: {
        code: `const settings = reactive({ volume: 5, muted: false })
const { volume } = toRefs(settings) // linked AND reactive`,
        lang: 'js',
      },
      explanation: 'The linked refs forward to the source object. If the source is not reactive, nothing is tracked, so changes never reach the screen. Make the source `reactive()` first.',
    },
    {
      title: 'Treating readonly() as a frozen copy (or as security)',
      wrong: {
        code: `const snapshot = readonly(state)
state.total = 99
console.log(snapshot.total) // surprised it is 99?`,
        lang: 'js',
      },
      right: {
        code: `// a view that follows the state
const view = readonly(state)
// an actual frozen snapshot, if you need one
const snapshot = Object.freeze(structuredClone(toRaw(state)))`,
        lang: 'js',
      },
      explanation: '`readonly()` blocks writes *through the view*, but it always shows the current source. If you need a point-in-time copy, copy the data. And remember: it is a development guard rail — it does not stop a user from changing anything in their own browser.',
    },
    {
      title: 'Passing a prop value into a composable',
      wrong: {
        code: `const props = defineProps({ userId: Number })
const { user } = useUser(props.userId) // the number, right now`,
        lang: 'js',
      },
      right: {
        code: `const props = defineProps({ userId: Number })
const { user } = useUser(() => props.userId)  // or toRef(props, 'userId')`,
        lang: 'js',
      },
      explanation: '`props.userId` is evaluated immediately and passes a plain number. A getter or `toRef` passes something the composable can re-read (with `toValue`) whenever the prop changes.',
    },
  ],

  debugging: [
    {
      symptom: 'Console: `Set operation on key "name" failed: target is readonly.`',
      cause: 'Code is writing through a `readonly()` view (or a ref obtained from one with `toRefs`).',
      fix: 'Call the action that owns the state (e.g. `rename()`), or write to the original reactive object inside the module that owns it.',
    },
    {
      symptom: 'Console: `toRefs() expects a reactive object but received a plain one.`',
      cause: '`toRefs()` was called on a plain object, so the resulting refs are not reactive.',
      fix: 'Create the object with `reactive()` (or use separate `ref()`s) before calling `toRefs()`.',
    },
    {
      symptom: 'A destructured value shows the initial state and never updates.',
      cause: 'It was destructured or spread from a reactive object, creating a plain copy.',
      fix: 'Destructure from `toRefs(obj)`, use `toRef(obj, \'key\')`, or keep accessing `obj.key`.',
    },
    {
      symptom: 'A composable shows the right value at first but ignores later changes to its argument.',
      cause: 'The caller passed a plain value (e.g. `props.id`), or the composable unwrapped the argument once outside any computed/watcher.',
      fix: 'Pass a ref or getter, and call `toValue()` inside `computed`/`watch`/`watchEffect`.',
    },
    {
      symptom: '`isReactive(myRef)` is `false` even though the ref holds an object.',
      cause: 'A ref is not a proxy — only the object in its `.value` is.',
      fix: 'Check `isRef(myRef)`, or `isReactive(myRef.value)`.',
    },
    {
      symptom: '`TypeError: Cannot set property value of #<GetterRefImpl> which has only a getter`.',
      cause: 'Assigning to a ref created with `toRef(() => …)`, which is read-only.',
      fix: 'Write to the underlying source instead, or use `toRef(obj, \'key\')` if you need a writable link.',
    },
  ],

  bestPractices: [
    'Return a plain object of refs from composables; use `{ ...toRefs(state), ...actions }` when state is a reactive object.',
    'Accept "ref, getter or value" inputs and normalise them with `toValue()` inside a computed or watcher.',
    'Expose shared state as `readonly(state)` with named actions for every change.',
    'Use `toRef(obj, \'key\')` for a single property, especially one that may not exist yet.',
    'Pass props into composables as getters (`() => props.id`) or `toRef(props, \'id\')`, never as `props.id`.',
    'Remember `readonly()` is a guard rail for your code, not a security boundary.',
    'Normalise inputs once instead of sprinkling `isRef()` checks through your code.',
  ],

  useCases: [
    'Returning state from a composable so callers can write `const { x, y } = useMouse()`.',
    'A shared module or store that exposes a read-only view and actions (`useCart()`, `useAuth()`).',
    'Passing one property of a reactive form object to a child composable with `toRef(form, \'email\')`.',
    'Composables like `useTitle(source)` or `useFetch(url)` that accept a string, a ref or a getter via `toValue()`.',
    'Passing a prop reactively into a composable: `useUser(() => props.userId)`.',
    'Generic utilities that must handle both refs and plain values (`unref`, `isRef`).',
  ],

  whenToUse: {
    use: [
      'You need to destructure or pass around parts of a reactive object and keep them reactive.',
      'Several components share state and only specific functions should change it.',
      'You are writing a composable that should accept refs, getters and plain values.',
    ],
    avoid: [
      'The value is used once and never needs to update — a plain read (`state.x`) is clearer.',
      'You want a frozen snapshot — copy the data instead of using `readonly()`.',
      'You want to protect data from users — that needs server-side validation, not `readonly()`.',
      'You are converting huge objects with `toRefs` just to read one field — use `toRef` or read it directly.',
    ],
  },

  comparison: {
    title: 'Which helper does what?',
    headers: ['Utility', 'Takes', 'Returns', 'Stays linked to the source?', 'Typical use'],
    rows: [
      ['`readonly(x)`', 'an object (reactive or plain) or a ref', 'a deep read-only proxy', 'yes — shows source changes (reactively, if the source is reactive)', 'expose shared state; block direct writes'],
      ['`toRef(obj, key)`', 'a reactive object and a key', 'a ref ↔ `obj[key]` (read & write)', 'yes', 'pass one property around'],
      ['`toRef(() => x)` (3.3+)', 'a getter', 'a read-only ref', 'yes — re-runs the getter on each read', 'turn a prop or expression into a ref'],
      ['`toRefs(obj)`', 'a reactive object', 'a plain object of linked refs', 'yes (keys present at call time)', 'destructure; return from composables'],
      ['`unref(x)`', 'a ref or a value', 'the value', 'no — a one-time read', 'read "maybe a ref" once'],
      ['`toValue(x)` (3.3+)', 'a ref, a getter or a value', 'the value', 'no — a one-time read (call it inside computed/watch)', 'normalise composable inputs'],
      ['`isRef` / `isReactive` / `isReadonly` / `isProxy`', 'anything', 'a boolean', '—', 'generic code, debugging'],
    ],
    note: 'Linked helpers (`readonly`, `toRef`, `toRefs`) keep a connection. Unwrapping helpers (`unref`, `toValue`) read once — put them where re-reading happens. Shallow versions and `toRaw` are in [shallowRef, triggerRef, markRaw & toRaw](lesson:shallow-and-raw).',
  },

  quiz: [
    {
      id: 'reactivity-utilities-q1',
      type: 'mcq',
      prompt: 'What does `toRefs(state)` return, where `state = reactive({ a: 1, b: 2 })`?',
      options: [
        { text: 'A plain object `{ a: Ref, b: Ref }` whose refs are linked to `state.a` and `state.b`.' },
        { text: 'A new reactive copy of `state`.', why: 'It is not a copy — and not reactive itself. It is a plain object holding refs that forward to the original.' },
        { text: 'A single ref whose `.value` is the whole object.', why: 'That would be `ref(state)` or `toRef(…)`. `toRefs` makes one ref per property.' },
        { text: '`{ a: 1, b: 2 }` — the current values.', why: 'That is what plain destructuring/spreading gives you, and those values are not reactive.' },
      ],
      answer: 0,
      explanation: 'Each property becomes a ref whose `.value` reads and writes the original reactive property, so you can destructure the result without losing reactivity.',
    },
    {
      id: 'reactivity-utilities-q2',
      type: 'output',
      prompt: 'What do the two `console.log` calls print?',
      code: {
        lang: 'js',
        code: `const state = reactive({ count: 1 })
const { count } = state
const countRef = toRef(state, 'count')

state.count = 5
console.log(count, countRef.value)

countRef.value = 9
console.log(state.count)`,
      },
      options: [
        { text: '`5 5` then `9`', why: '`count` was copied when it was destructured, while `count` was still 1.' },
        { text: '`1 5` then `9`' },
        { text: '`1 1` then `1`', why: '`toRef` is a live link: it reads the current `state.count`, and writing it writes the source.' },
        { text: '`1 5` then `5`', why: 'Writing `countRef.value` writes `state.count` — the link goes both ways.' },
      ],
      answer: 1,
      explanation: 'The destructured `count` is a snapshot (1). `countRef` forwards to `state.count`, so it reads 5 — and assigning 9 to it updates `state.count`.',
    },
    {
      id: 'reactivity-utilities-q3',
      type: 'bug',
      prompt: '`useDoubled(count)` shows the right value at first, but never updates when `count` changes. Click the line that causes the bug.',
      code: {
        lang: 'js',
        code: `import { computed, toValue } from 'vue'

// Accepts a ref, a getter or a plain number
export function useDoubled(source) {
  const n = toValue(source)
  return computed(() => n * 2)
}`,
      },
      answerLine: 5,
      explanation: '`toValue(source)` runs once, when the composable is called, and stores a plain number. Move it inside the computed — `computed(() => toValue(source) * 2)` — so the read happens (and is tracked) on every evaluation.',
    },
    {
      id: 'reactivity-utilities-q4',
      type: 'fill',
      prompt: 'Fill the blanks: destructure the store safely, and normalise an input that may be a ref, a getter or a plain value.',
      code: {
        lang: 'js',
        code: `import { computed, ___, ___ } from 'vue'

const { name, theme } = ___(profile)

export function useTitle(source) {
  return computed(() => 'Vue/Zero — ' + ___(source))
}`,
      },
      answer: [['toRefs', 'toValue'], ['toValue', 'toRefs'], ['toRefs'], ['toValue']],
      explanation: '`toRefs(profile)` gives linked refs you can destructure. `toValue(source)` unwraps refs, calls getters and passes plain values through — inside the computed so it stays reactive.',
    },
    {
      id: 'reactivity-utilities-q5',
      type: 'mcq',
      prompt: 'What is logged?',
      code: {
        lang: 'js',
        code: `const state = reactive({ count: 0 })
const view = readonly(state)

state.count++
view.count++
console.log(view.count)`,
      },
      options: [
        { text: '`1`' },
        { text: '`2`', why: 'The write through `view` is refused, so only the first increment happened.' },
        { text: '`0`', why: '`readonly()` is a live view, not a copy — it shows the change made to `state`.' },
        { text: 'It throws a `TypeError`.', why: 'Vue\'s readonly proxy refuses the write and (in development) logs a warning instead of throwing.' },
      ],
      answer: 0,
      explanation: '`state.count++` changes the source to 1, and the view reflects it. `view.count++` is refused (with a dev warning), so the value stays 1.',
    },
    {
      id: 'reactivity-utilities-q6',
      type: 'mcq',
      prompt: 'Which of these return `true`? (Select all that apply.)',
      options: [
        { text: '`isRef(computed(() => 1))`' },
        { text: '`isReactive(ref({ a: 1 }))`', why: 'The ref itself is not a reactive proxy — only its `.value` object is. `isReactive(r.value)` would be true.' },
        { text: '`isReadonly(readonly(reactive({})))`' },
        { text: '`isProxy(ref(1))`', why: 'Refs are objects with a getter/setter, not Proxies. `isProxy` is for reactive/readonly proxies.' },
      ],
      answer: [0, 2],
      explanation: 'Computeds are refs. A readonly wrapper is readonly no matter what it wraps. A ref is never a proxy, even when it holds an object.',
    },
    {
      id: 'reactivity-utilities-q7',
      type: 'short',
      prompt: 'In two or three sentences: what is the difference between `unref()` and `toValue()`, and why must both be called inside a computed or watcher to stay reactive?',
      answer: '`unref(x)` returns `x.value` for refs and `x` otherwise; `toValue(x)` (3.3+) does the same but also calls getter functions. Both perform a single read and return the current value, so to react to changes the read has to happen inside something that re-runs and tracks it — a `computed`, a `watch` getter or a `watchEffect`.',
    },
  ],

  exercises: [
    {
      id: 'score-refs',
      title: 'Fix the composable that loses reactivity',
      difficulty: 'beginner',
      prompt: `
\`useScore()\` tracks points and a streak in a \`reactive()\` object. \`App.vue\` destructures its result — but the numbers on screen never change.

Fix **\`useScore.js\`** (leave the destructuring line in \`App.vue\` as it is):

- \`<span class="points">\` and \`<span class="streak">\` must update when answers are given.
- \`<button class="right">\` adds a correct answer: the streak goes up by 1 and points go up by \`10 × streak\` (10, then 20, then 30…).
- \`<button class="wrong">\` resets the streak to 0 but keeps the points.
- \`useScore()\` must return \`points\` and \`streak\` as **refs**.
`,
      files: { 'App.vue': scoreApp, 'useScore.js': scoreStarter },
      hints: [
        'The scoring logic is fine. The problem is the last line: `{ ...state }` copies the current numbers.',
        'You need each property as a ref that stays linked to `state`. Which helper converts a whole reactive object into refs?',
        'Import `toRefs` and return `{ ...toRefs(state), answer }`.',
      ],
      solution: {
        explanation: '`toRefs(state)` returns `{ points: Ref, streak: Ref }`, each forwarding to the reactive object. Spreading *that* object copies the refs (not the numbers), so the caller can destructure and still be connected. The template unwraps the top-level refs automatically.',
        files: { 'App.vue': scoreApp, 'useScore.js': scoreSolution },
      },
      tests: [
        { name: 'starts at 0 points, 0 streak', code: `expect(text('.points')).toBe('0'); expect(text('.streak')).toBe('0')` },
        { name: 'two correct answers: streak 2, points 30', code: `await click('.right'); await click('.right'); expect(text('.streak')).toBe('2'); expect(text('.points')).toBe('30')` },
        { name: 'a wrong answer resets the streak but keeps points', code: `await click('.right'); await click('.right'); await click('.wrong'); expect(text('.streak')).toBe('0'); expect(text('.points')).toBe('30')` },
        {
          name: 'useScore() returns refs',
          code: `const { useScore } = requireModule('useScore.js')
const s = withSetup(() => useScore())
s.answer(true)
expect(s.points.value).toBe(10)
expect(s.streak.value).toBe(1)`,
        },
      ],
    },
    {
      id: 'readonly-todos',
      title: 'A todo store that can\'t be scribbled on',
      difficulty: 'intermediate',
      prompt: `
\`todoStore.js\` keeps a shared todo list. Right now any component can push into \`state.todos\` or flip \`done\` directly, bypassing the store's rules (like trimming text).

Change **\`todoStore.js\`** so that:

- \`useTodos()\` returns \`state\` as a **deep read-only view** — direct writes such as \`state.todos.push(…)\` or \`state.todos[0].done = true\` must have **no effect**.
- Adding and toggling still work through the \`add(text)\` and \`toggle(id)\` actions.
- The UI keeps working: the form's input has \`class="new-todo"\`, each item is an \`<li class="todo">\` (with the class \`done\` when completed — clicking it toggles), and the count is in \`<p class="remaining">\` as \`N left\`.
`,
      files: { 'App.vue': todoApp, 'todoStore.js': todoStoreStarter },
      hints: [
        'The actions already use the real `state` — leave them alone. Only what you *return* needs to change.',
        'Vue has a helper that returns a deep read-only proxy which still updates when the source changes.',
        'Import `readonly` and return `{ state: readonly(state), remaining, add, toggle }`.',
      ],
      solution: {
        explanation: 'The actions close over the real reactive `state`, so they can still change it. Components receive `readonly(state)`: reads go through to the reactive object (so the list and count stay live), while writes through the view are refused — with a warning in development. Every change now has to go through `add()` or `toggle()`, where the rules live. (It is a guard rail for your own code, not security: anything sent to a server must still be validated there.)',
        files: { 'App.vue': todoApp, 'todoStore.js': todoStoreSolution },
      },
      tests: [
        {
          name: 'adding through the form works',
          code: `await type('.new-todo', '  Buy milk  ')
await submit('form')
expect(findAll('.todo')).toHaveLength(3)
expect(text('.todo:last-child')).toBe('Buy milk')
expect(text('.remaining')).toBe('2 left')`,
        },
        {
          name: 'toggling through the action works',
          code: `expect(text('.remaining')).toBe('1 left')
await click('.todo')
expect(classes('.todo')).toContain('done')
expect(text('.remaining')).toBe('0 left')`,
        },
        {
          name: 'direct writes through the returned state are blocked',
          code: `const { useTodos } = requireModule('todoStore.js')
const store = useTodos()
store.state.todos.push({ id: 99, text: 'Sneaky', done: false })
store.state.todos[0].done = true
await flush()
expect(store.state.todos.length).toBe(2)
expect(store.state.todos[0].done).toBe(false)
expect(findAll('.todo')).toHaveLength(2)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'reactivity-utilities-torefs-composables',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Why do composables usually return a plain object of refs — and when do you need `toRefs()` for that?',
      answer: 'Because callers almost always destructure the result (`const { x, y } = useMouse()`), and refs survive destructuring while values copied out of a reactive object don\'t. If the composable keeps its state in a `reactive()` object, return `{ ...toRefs(state), ...actions }` so each property becomes a linked ref.',
      explanation: 'Destructuring a ref copies the *box*, which is still connected. Destructuring a reactive object copies the *contents*, which aren\'t.',
      code: {
        lang: 'js',
        code: `export function usePointer() {
  const state = reactive({ x: 0, y: 0 })
  // …update state.x / state.y on pointer events…
  return { ...toRefs(state) }   // caller: const { x, y } = usePointer()
}`,
      },
      whyAsked: 'Composables are the main unit of reuse in Vue 3; returning the wrong shape is a classic source of "it doesn\'t update" bugs.',
      mistakes: [
        'Returning `{ ...state }` and wondering why values are frozen.',
        'Returning the whole reactive object and expecting callers to never destructure it.',
        'Not knowing callers can wrap the result in `reactive()` for unwrapped property access.',
      ],
      followUps: [
        'What if the caller prefers `mouse.x` instead of destructuring?',
        'What happens to a property added to `state` after `toRefs()` is called?',
        'How does Pinia\'s `storeToRefs()` relate to this?',
      ],
      modelAnswer: 'The convention is to return a plain object whose properties are refs, because the caller will usually destructure it, and refs keep their connection when destructured — you copy the ref object itself. If I keep the state in a `reactive()` object, plain spreading would copy the current values and lose reactivity, so I return `{ ...toRefs(state), ...actions }`, which turns each property into a ref linked to the original. If a caller prefers object-style access, they can wrap the result in `reactive()` to get the refs unwrapped. One caveat: `toRefs` only covers properties that exist when it is called.',
    },
    {
      id: 'reactivity-utilities-destructure-debug',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'This cart badge always shows 0 even after items are added. Find the bug and fix it.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { useCart } from './cart.js' // returns reactive({ items: [], count: 0 })

const cart = useCart()
const { count } = cart
</script>

<template>
  <span class="badge">{{ count }}</span>
</template>`,
      },
      answer: '`const { count } = cart` copies the number 0 out of the reactive object, so the template shows a plain value that never changes. Use `const { count } = toRefs(cart)`, `toRef(cart, \'count\')`, or just write `{{ cart.count }}` in the template.',
      explanation: 'Reactivity is property access on the proxy. Destructuring does that access once, at setup time.',
      whyAsked: 'Probably the single most common reactivity bug in Vue 3 code bases — interviewers want to see you spot it instantly.',
      mistakes: [
        'Suggesting `nextTick()` or `forceUpdate`.',
        'Blaming the cart store instead of the destructuring.',
        'Fixing it with a `watch` that copies values into a ref.',
      ],
      followUps: [
        'Would `ref()` state in the store have avoided this?',
        'What does Pinia recommend for destructuring stores?',
      ],
      modelAnswer: 'The destructuring line is the bug. `cart` is a reactive proxy, and reactivity works through property access on it; `const { count } = cart` reads `count` once and stores the number 0, so the badge is bound to a plain value. I would either keep the access on the proxy — `cart.count` in the template — or destructure from `toRefs(cart)`, which gives me a ref linked to the property. For Pinia stores the equivalent is `storeToRefs()`.',
    },
    {
      id: 'reactivity-utilities-tovalue-vs-unref',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Compare `unref()` and `toValue()`. Which would you use to read a composable\'s input, and where in the composable?',
      answer: '`unref(x)` returns `x.value` for refs and `x` otherwise. `toValue(x)` (Vue 3.3+) also calls getter functions, so it accepts refs, getters and plain values. For composable inputs use `toValue()`, and call it inside a `computed`, `watch` getter or `watchEffect` so the read is tracked and repeated.',
      explanation: 'Getters became a common way to pass reactive expressions (`() => props.id`) — `unref` would return the function itself.',
      code: {
        lang: 'js',
        code: `unref(() => 1)    // the function
toValue(() => 1)  // 1

export function useTitle(source) {
  watchEffect(() => {
    document.title = toValue(source)  // re-read on every change
  })
}`,
      },
      whyAsked: 'Shows whether you can write flexible, idiomatic composables — and whether you understand that unwrapping is a one-time read.',
      mistakes: [
        'Saying they are identical.',
        'Calling `toValue()` once at the top of the composable.',
        'Forgetting the 3.3 version requirement.',
      ],
      followUps: [
        'What is the `MaybeRefOrGetter` type?',
        'How would you accept an input that should be *written* to, not just read?',
      ],
      modelAnswer: 'Both unwrap "maybe a ref" values: `unref` returns `.value` for refs and the value otherwise. `toValue`, added in 3.3, additionally calls getters, so it handles refs, getters and plain values — which matters because passing `() => props.id` is now the idiomatic way to hand a reactive expression to a composable. I type the parameter as `MaybeRefOrGetter` and call `toValue` inside a computed or watcher, because unwrapping only reads the current value; doing it once at the top would freeze the input.',
    },
    {
      id: 'reactivity-utilities-readonly-store',
      difficulty: 'intermediate',
      type: 'architecture',
      minutes: 4,
      question: 'Several components share some state. How would you let them read it reactively but change it only through well-defined functions — without a state library? What does `readonly()` guarantee, and what doesn\'t it?',
      answer: 'Keep the reactive state private in a module, export a function that returns `readonly(state)` plus action functions that mutate the private state. Components get a live, deep read-only view and must call actions to change anything. `readonly()` guarantees that writes *through the view* are refused (with dev warnings); it doesn\'t freeze the data, doesn\'t stop code that has the original object, and isn\'t security — anything users can do in their browser, they can do, so the server must validate every change.',
      explanation: 'It is the "view-only link + editors" pattern — and the same idea Pinia formalises with stores and actions.',
      code: {
        lang: 'js',
        code: `// cart.js
const state = reactive({ items: [] })

export function useCart() {
  function add(product) { /* validate, then */ state.items.push(product) }
  function remove(id) { state.items = state.items.filter((i) => i.id !== id) }
  return { cart: readonly(state), add, remove }
}`,
      },
      whyAsked: 'Probes architectural thinking about state ownership and whether you confuse a developer guard rail with security.',
      mistakes: [
        'Exporting the raw reactive object and hoping nobody mutates it.',
        'Believing `readonly()` makes data tamper-proof.',
        'Using `Object.freeze()`, which also stops the actions and kills reactivity.',
      ],
      followUps: [
        'When would you move this to Pinia instead?',
        'How does module-level state behave with SSR?',
        'How is `readonly()` different from `Object.freeze()`?',
      ],
      modelAnswer: 'I would keep a `reactive` object private to a module and export a `useX()` function returning `readonly(state)` together with actions that mutate the private state. Components can read the view reactively — it reflects every change — but writes through it are refused with a warning in development, so every change goes through an action where I can validate or log it. `readonly` is a guard rail for our own code, not security: it does not freeze the data, and a user can change anything in their own browser, so the backend still validates every request. When the app grows — devtools, plugins, SSR-safe instances — I would move the same pattern into Pinia.',
    },
    {
      id: 'reactivity-utilities-is-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'What does this log?',
      code: {
        lang: 'js',
        code: `const state = reactive({ user: { name: 'Ada' } })
const nameRef = toRef(state.user, 'name')
const view = readonly(state)

console.log(
  isReactive(state.user),
  isRef(nameRef),
  isReadonly(view.user),
  isReactive(toRefs(state)),
)`,
      },
      options: [
        'true true true false',
        'false true true false',
        'true true false true',
        'true false true true',
      ],
      correctOption: 0,
      answer: '`true true true false`. Nested objects of a reactive object are reactive too; `toRef` returns a ref; `readonly` is deep, so `view.user` is a readonly proxy; and `toRefs()` returns a **plain** object holding refs.',
      explanation: 'Deep conversion applies to both `reactive()` and `readonly()`. `toRefs` produces a plain container — reactivity lives in the refs inside it.',
      whyAsked: 'Quick check of the mental model: what is a proxy, what is a ref, and what is a plain object holding refs.',
      mistakes: [
        'Thinking nested objects are not reactive.',
        'Thinking `readonly` is shallow.',
        'Assuming the object returned by `toRefs` is reactive.',
      ],
      followUps: [
        'What would `isReactive(view)` return?',
        'How would `shallowReactive` change the first answer?',
      ],
      modelAnswer: 'It logs true, true, true, false. `reactive()` converts nested objects lazily on access, so `state.user` is a reactive proxy. `toRef` always returns a ref. `readonly()` is deep, so reading `view.user` gives a readonly proxy. And `toRefs()` returns a plain object whose properties are refs — the object itself is not reactive, which is exactly why it can be spread and destructured safely.',
    },
    {
      id: 'reactivity-utilities-prop-to-composable',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'A `UserCard` receives an optional `userId` prop and passes it to `useUser(id)`, which should refetch whenever the prop changes. Today it only ever loads the first user. How do you fix both the component and the composable? Does Vue 3.5\'s reactive props destructure change anything?',
      answer: 'The component passes `props.userId` — a plain value read once. Pass something re-readable instead: a getter `useUser(() => props.userId)` or `useUser(toRef(props, \'userId\'))` (which works even while the prop is undefined). In the composable, read the input with `toValue(id)` inside a `watch` getter or `watchEffect` so it is tracked. With 3.5 props destructure (`const { userId } = defineProps(…)`), `userId` is reactive inside the component\'s own code, but passing `userId` to a function still passes the current value — you still wrap it: `useUser(() => userId)`.',
      explanation: 'Reactivity can\'t travel through a plain value. Hand over a getter or a ref, and unwrap it where re-reading happens.',
      code: {
        lang: 'js',
        code: `// UserCard.vue (script setup)
const props = defineProps({ userId: Number })
const { user, loading } = useUser(() => props.userId)

// useUser.js
export function useUser(id) {
  const user = ref(null)
  const loading = ref(false)
  watch(
    () => toValue(id),                 // tracked source
    async (current, _old, onCleanup) => {
      let stale = false
      onCleanup(() => (stale = true))
      if (current == null) return (user.value = null)
      loading.value = true
      const data = await fetchUser(current)
      if (!stale) { user.value = data; loading.value = false }
    },
    { immediate: true }
  )
  return { user, loading }
}`,
      },
      whyAsked: 'Passing props into composables correctly is a daily task in Vue 3 — and the 3.5 destructure change makes it a popular senior-level follow-up.',
      mistakes: [
        'Passing `props.userId` and adding a watcher in the component to "re-call" the composable.',
        'Calling `toValue()` once at the top of the composable.',
        'Claiming 3.5 destructured props can be passed to functions directly and stay reactive.',
        'Ignoring stale responses when the id changes quickly.',
      ],
      followUps: [
        'Why does `toRef(props, \'userId\')` work for an optional prop that is undefined?',
        'What does the compiler do with destructured props in 3.5?',
        'How would you test `useUser` in isolation?',
      ],
      modelAnswer: 'The bug is that `props.userId` is evaluated in the component and the composable just receives a number. I would pass a getter, `() => props.userId`, or `toRef(props, \'userId\')`; both let the composable re-read the current prop. Inside `useUser` I accept a ref, getter or value and read it with `toValue` in a watch source, with `immediate: true` and a cleanup to ignore stale responses. Vue 3.5\'s reactive props destructure makes `userId` reactive inside the component because the compiler rewrites it to `props.userId`, but handing `userId` to a function still passes its current value, so the getter is still needed: `useUser(() => userId)`.',
    },
    {
      id: 'reactivity-utilities-coding-charcount',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'Finish `useCharCount(source, limit = 280)` in `useCharCount.js`. It returns `{ count, remaining }` as computed refs. Both `source` (the text) and `limit` may be a **ref, a getter or a plain value**. The app shows `.count` and `.remaining` for a textarea with `class="message"`.',
      starter: {
        files: {
          'App.vue': charCountApp,
          'useCharCount.js': `import { computed } from 'vue'

// TODO: accept a ref, a getter or a plain value for BOTH
// source and limit.
export function useCharCount(source, limit = 280) {
  const count = computed(() => source.value.length)
  const remaining = computed(() => limit - count.value)
  return { count, remaining }
}`,
        },
      },
      tests: [
        {
          name: 'counts a ref source and updates while typing',
          code: `expect(text('.count')).toBe('5')
await type('.message', 'Hello there')
expect(text('.count')).toBe('11')`,
        },
        {
          name: 'remaining uses a ref limit',
          code: `expect(text('.remaining')).toBe('5')
await type('.message', 'Hello there')
expect(text('.remaining')).toBe('-1')`,
        },
        {
          name: 'accepts getters and plain values',
          code: `const { useCharCount } = requireModule('useCharCount.js')
const a = withSetup(() => useCharCount(() => 'abc', () => 5))
expect(a.count.value).toBe(3)
expect(a.remaining.value).toBe(2)
const b = withSetup(() => useCharCount('hello world'))
expect(b.remaining.value).toBe(269)`,
        },
      ],
      hints: [
        'One helper turns "a ref, a getter or a value" into a plain value.',
        'Use `toValue(source)` and `toValue(limit)` — inside the computeds, so the reads are tracked.',
        '`computed(() => toValue(source).length)` and `computed(() => toValue(limit) - count.value)`.',
      ],
      answer: 'Import `toValue` and unwrap both inputs inside the computeds: `count = computed(() => toValue(source).length)`, `remaining = computed(() => toValue(limit) - count.value)`.',
      solution: {
        files: {
          'App.vue': charCountApp,
          'useCharCount.js': `import { computed, toValue } from 'vue'

export function useCharCount(source, limit = 280) {
  const count = computed(() => toValue(source).length)
  const remaining = computed(() => toValue(limit) - count.value)
  return { count, remaining }
}`,
        },
      },
      explanation: '`toValue()` unwraps refs, calls getters and passes plain values through, so one line handles every input shape. Calling it inside each computed means a ref or a getter that reads reactive state is tracked, and the results update as the user types or the limit changes.',
      whyAsked: 'A realistic composable task: flexible inputs, derived refs as outputs, and the "unwrap inside the computed" rule.',
      mistakes: [
        'Unwrapping once at the top of the function.',
        'Using `unref()`, which returns getter functions unchanged.',
        'Returning plain numbers instead of computed refs.',
      ],
      followUps: [
        'How would you type the parameters in TypeScript?',
        'How would you add an `isOverLimit` flag?',
        'How would you test it without a component?',
      ],
      modelAnswer: 'I would import `toValue` and normalise both inputs inside computeds: `count` is `computed(() => toValue(source).length)` and `remaining` is `computed(() => toValue(limit) - count.value)`. `toValue` unwraps refs, calls getters and passes plain values through, and because it runs inside the computed the underlying reactive reads are tracked. In TypeScript I would type both parameters as `MaybeRefOrGetter<string>` and `MaybeRefOrGetter<number>`.',
    },
  ],

  takeaways: [
    'Destructuring or spreading a reactive object copies values; `toRefs()` / `toRef()` give you refs that stay linked to the source.',
    '`readonly(state)` is a live, deep, read-only view — pair it with actions so every change goes through named functions.',
    '`readonly()` guards against accidental writes in your code; it is not security, and the server must still validate.',
    '`unref()` unwraps refs; `toValue()` (3.3+) also calls getters. Both read once — call them inside computed/watch to stay reactive.',
    'Composables: accept refs, getters or values (normalise with `toValue`) and return a plain object of refs.',
    'Pass props to composables as getters or `toRef(props, \'key\')` — even with 3.5 props destructure.',
  ],
}
