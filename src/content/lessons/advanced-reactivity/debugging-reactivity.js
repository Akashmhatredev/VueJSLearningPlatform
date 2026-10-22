// Lesson: Debugging reactivity & its limits (Level 11 — Advanced Reactivity & Internals)

const whyApp = `<script setup>
import { reactive, ref, onRenderTriggered } from 'vue'

const user = reactive({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  lastSeen: 0, // updated by presence pings — never shown on screen
})
const logEl = ref(null)

// DEV-ONLY: called with the dependency that caused each re-render.
// In production builds this hook never fires.
onRenderTriggered((e) => {
  const line = 're-render caused by ' + e.type + ' "' + String(e.key) + '"'
  console.log(line)
  if (!logEl.value) return
  const li = document.createElement('li')
  li.textContent = line
  logEl.value.appendChild(li)
})

function ping() {
  user.lastSeen++ // a "presence ping" from the server
}

function rename() {
  user.name = user.name === 'Ada Lovelace' ? 'Ada King' : 'Ada Lovelace'
}
</script>

<template>
  <h2>Why did it render?</h2>
  <div class="card" :title="JSON.stringify(user)">
    <p class="name">{{ user.name }}</p>
    <p class="email">{{ user.email }}</p>
  </div>
  <button class="ping" @click="ping">Presence ping</button>
  <button class="rename" @click="rename">Rename</button>
  <h3>Render log</h3>
  <ol ref="logEl" class="log"></ol>
</template>`

export default {
  id: 'debugging-reactivity',
  title: 'Debugging reactivity & its limits',
  summary: 'Find out exactly why something did or didn\'t update with Vue\'s dev-only debug hooks and Devtools — and learn the places where reactivity simply can\'t reach.',
  difficulty: 'advanced',
  minutes: 40,
  prerequisites: ['dependency-tracking', 'scheduling-flush'],
  related: ['shallow-and-raw', 'arrays-objects-reactivity', 'reactivity-utilities', 'render-optimization', 'measuring-performance'],
  tags: ['debugging', 'onTrack', 'onTrigger', 'onRenderTracked', 'onRenderTriggered', 'renderTriggered', 'devtools', 'toRaw', 'markRaw', 'limits', 'private fields', 'performance traps'],
  apis: [
    { name: 'onTrack / onTrigger', summary: 'Debug options for computed(), watch() and watchEffect(): called when a dependency is tracked / triggers the effect. Development builds only.' },
    { name: 'onRenderTracked()', summary: 'Component hook called for every reactive dependency the render tracks. Development builds only.' },
    { name: 'onRenderTriggered()', summary: 'Component hook called with the dependency that caused a re-render. Development builds only.' },
    { name: 'renderTracked / renderTriggered', summary: 'The Options API equivalents of the two render debug hooks.' },
    { name: 'isRef / isReactive / isReadonly / isProxy / isShallow', summary: 'Ask what kind of reactive value you are holding.' },
    { name: 'toRaw()', summary: 'Get the plain object behind a proxy, e.g. for logging or one-off untracked reads.' },
    { name: 'markRaw()', summary: 'Keep an object (e.g. a third-party class instance) out of reactivity entirely.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity in Depth: Reactivity Debugging', url: 'https://vuejs.org/guide/extras/reactivity-in-depth.html#reactivity-debugging' },
    { label: 'API — onRenderTracked() / onRenderTriggered()', url: 'https://vuejs.org/api/composition-api-lifecycle.html#onrendertracked' },
    { label: 'API — Reactivity: Utilities', url: 'https://vuejs.org/api/reactivity-utilities.html' },
    { label: 'Vue Guide — Performance: Reduce Reactivity Overhead for Large Immutable Structures', url: 'https://vuejs.org/guide/best-practices/performance.html#reduce-reactivity-overhead-for-large-immutable-structures' },
    { label: 'Vue Devtools', url: 'https://devtools.vuejs.org/' },
  ],

  intro: `
Every reactivity bug is one of two stories:

1. **"It didn't update."** Something that should have been a dependency wasn't — the read wasn't tracked, or the write never went through Vue.
2. **"It updated when it shouldn't have."** Something you didn't mean to depend on *was* a dependency, or a value looked new when it wasn't.

Guessing at these is slow. Vue gives you tools that **answer the question directly**: debug hooks that report every dependency an effect tracks and the exact write that triggered it, plus Vue Devtools to inspect live state. This lesson teaches those tools, then maps out the edges where reactivity can't help you at all — and when you shouldn't use deep reactivity in the first place.
`,

  why: `
Without tools, debugging reactivity looks like this: add \`console.log\` everywhere, sprinkle \`nextTick\`, try \`deep: true\`, and eventually something works — for reasons nobody can explain.

With tools, it looks like this:

> *"The card re-rendered because of a \`set\` on \`lastSeen\`. Which part of the template reads \`lastSeen\`? Oh — \`JSON.stringify(user)\` in a tooltip."*

That's one log line and one minute. The same tools explain stale computeds, watchers that never fire and runaway re-renders. And knowing the **limits** — values Vue can't proxy, mutations it can't see — stops you from hunting for bugs that are really design decisions.
`,

  eli15: `
Think of a doorbell camera on your front door.

Without it, you only know *someone* rang. With it, you get a recording: "**who** rang, **when**, and **why**". Vue's debug hooks are doorbell cameras for your components and computeds.

\`onRenderTracked\` is the log of everyone the component "looked at" while drawing itself. \`onRenderTriggered\` is the clip of exactly who rang the bell and made it redraw.

Some visitors can't be recorded at all: they come in through the back door (code that changes data Vue doesn't watch), or they wear an invisibility cloak (things like \`Date\` objects that Vue can't wrap). Knowing about those back doors is half of debugging.

And the camera only exists in **development**. When you ship the app, it's removed to keep things fast — so you debug *before* shipping.
`,

  analogy: {
    title: 'The doorbell camera',
    body: `
A doorbell camera turns "someone rang" into "this person rang at 14:02". It's installed only while you're investigating, and it can't see people who never use the front door.
`,
    mapping: [
      ['the camera\'s visitor log', '`onRenderTracked` / `onTrack`: every dependency read'],
      ['the clip of who rang', '`onRenderTriggered` / `onTrigger`: the write that caused a run'],
      ['pausing the clip to look closely', 'a `debugger` statement inside the hook'],
      ['the back door', 'writes that bypass the proxy (raw objects, third-party code)'],
      ['an invisibility cloak', 'values Vue can\'t proxy: `Date`, frozen or `markRaw` objects'],
      ['removing the camera after the investigation', 'debug hooks are stripped from production builds'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A debugging decision tree',
    caption: 'Two symptoms, two questions each. Every branch ends at a tool that answers it.',
    alt: 'A decision tree. "Something looks wrong" branches into "UI did not update" and "Re-rendered unexpectedly". The first branch asks whether the value is reactive (isRef, isReactive) and whether it was read inside the effect (onRenderTracked, onTrack), leading to lost-reactivity causes. The second branch asks who triggered it (onRenderTriggered, onTrigger with debugger), leading to extra dependencies or unstable values.',
    props: {
      width: 760,
      height: 330,
      nodes: [
        { id: 'start', label: 'Something looks wrong', x: 380, y: 40, tone: 'ink' },
        { id: 'stale', label: 'UI did not update', x: 190, y: 120, tone: 'kraft' },
        { id: 'extra', label: 'Re-rendered unexpectedly', x: 570, y: 120, tone: 'kraft' },
        { id: 'isreactive', label: 'Is the value reactive?', note: 'isRef / isReactive / Devtools', x: 90, y: 210, tone: 'cobalt' },
        { id: 'tracked', label: 'Was it read by the effect?', note: 'onRenderTracked / onTrack', x: 290, y: 210, tone: 'cobalt' },
        { id: 'who', label: 'Who triggered it?', note: 'onRenderTriggered / onTrigger + debugger', x: 570, y: 210, tone: 'cobalt' },
        { id: 'lost', label: 'Lost reactivity', note: 'destructured, replaced, raw, after await', x: 190, y: 295, tone: 'red' },
        { id: 'fixextra', label: 'Extra dependency', note: 'read less · stable values', x: 570, y: 295, tone: 'acid' },
      ],
      edges: [
        { from: 'start', to: 'stale' },
        { from: 'start', to: 'extra' },
        { from: 'stale', to: 'isreactive' },
        { from: 'stale', to: 'tracked' },
        { from: 'isreactive', to: 'lost', label: 'no' },
        { from: 'tracked', to: 'lost', label: 'no' },
        { from: 'extra', to: 'who' },
        { from: 'who', to: 'fixextra' },
      ],
      steps: [
        { focus: ['start'], text: 'Name the symptom first. "Didn\'t update" and "updated too much" have different causes and different tools.' },
        { focus: ['stale', 'isreactive'], edges: ['start->stale', 'stale->isreactive'], text: '**Didn\'t update?** Check what you are actually holding: `isRef(x)`, `isReactive(x)`, or inspect it in Vue Devtools. A copied number or a raw object can\'t notify anyone.' },
        { focus: ['tracked'], edges: ['stale->tracked'], text: 'If it is reactive, was it **read during the effect\'s run**? `onRenderTracked` (components) or `onTrack` (computed/watch) lists every dependency. Missing from the list = never tracked.' },
        { focus: ['lost'], edges: ['isreactive->lost', 'tracked->lost'], text: 'Usual causes: destructuring, replacing a reactive object, reading through `toRaw`, reading after `await`, or a value Vue cannot proxy.' },
        { focus: ['extra', 'who'], edges: ['start->extra', 'extra->who'], text: '**Updated too much?** `onRenderTriggered` / `onTrigger` report the exact `type` and `key` of the write. Put `debugger` inside to see the stack of the code that wrote it.' },
        { focus: ['fixextra'], edges: ['who->fixextra'], text: 'Usual causes: the render reads more than it shows (whole-object reads, `JSON.stringify`), or a value that is "new" every time (fresh objects/arrays). Read less, keep values stable.' },
      ],
    },
  },

  syntax: [
    `
#### Debug hooks on computeds and watchers
`,
    {
      code: `import { computed, watch, watchEffect } from 'vue'

const total = computed(() => cart.items.reduce((s, i) => s + i.price, 0), {
  onTrack(e) { console.log('total tracked', e.type, e.key) },     // each dependency
  onTrigger(e) { console.log('total triggered', e.type, e.key) }, // each relevant write
})

watch(source, callback, {
  onTrigger(e) {
    debugger // pause here: the call stack shows the line that wrote the value
  },
})

watchEffect(effectFn, { onTrack: (e) => console.log(e) })`,
      lang: 'js',
      title: 'onTrack / onTrigger',
    },
    `
The event object (a *debugger event*) has: \`effect\` (the effect being tracked/triggered), \`target\` (the raw object — or the ref itself), \`type\` (\`'get' | 'has' | 'iterate'\` when tracking, \`'set' | 'add' | 'delete' | 'clear'\` when triggering), \`key\`, and for triggers \`newValue\` / \`oldValue\` where they apply. For a ref, \`key\` is \`'value'\`. Iteration dependencies show up with a special **Symbol** key; its exact description is an implementation detail.

#### Debug hooks on component renders
`,
    {
      code: `import { onRenderTracked, onRenderTriggered } from 'vue'

onRenderTracked((e) => {
  // called for EVERY dependency the render reads, on every render
  console.log('render read', e.type, e.key)
})

onRenderTriggered((e) => {
  // called with the write that caused THIS re-render
  console.log('re-render caused by', e.type, e.key, e.oldValue, '→', e.newValue)
})

// Options API: renderTracked(e) { … } and renderTriggered(e) { … }`,
      lang: 'js',
      title: 'onRenderTracked / onRenderTriggered',
    },
    {
      callout: 'warn',
      title: 'Development builds only',
      text: '`onTrack`, `onTrigger`, `onRenderTracked` and `onRenderTriggered` (and `renderTracked`/`renderTriggered`) only work in **development builds**. In production builds they are no-ops — the debug code is compiled out — and the render hooks are also not called during server-side rendering. Never put app logic in them. (This sandbox runs Vue\'s development build, so they work here.)',
    },
    `
#### Inspecting what you hold
`,
    {
      code: `import { isRef, isReactive, isReadonly, isProxy, isShallow, toRaw } from 'vue'

isRef(count)          // is it a ref (needs .value in JS)?
isReactive(state)     // a reactive() proxy?
isProxy(state)        // any proxy from reactive/readonly/shallow…?
isShallow(list)       // a shallowRef / shallowReactive?

console.log(toRaw(state)) // log the plain object instead of a Proxy wrapper`,
      lang: 'js',
      title: 'reactivity utilities',
    },
    `
Logging a reactive object in the browser console shows a \`Proxy\` wrapper. Use \`toRaw()\`, or turn on **custom formatters** in Chrome DevTools settings — Vue's development build registers formatters that print refs and reactive objects readably. **Vue Devtools** (a browser extension, also available as a Vite plugin) lets you inspect each component's state, props and computed values live, edit state, and follow events on a timeline.

#### The limits: where reactivity can't reach

| Situation | What happens | What to do |
|---|---|---|
| \`const { count } = state\` | a copy; no link back | \`toRefs(state)\` / \`toRef(state, 'count')\` |
| \`state = reactive({...})\` (reassigning a variable) | not a reactive write: nothing re-renders, and code holding the old object keeps it | \`Object.assign(state, …)\`, or use a \`ref\` |
| \`reactive(5)\` | not reactive; dev warning | \`ref(5)\` |
| \`reactive(new Date())\`, frozen or \`markRaw\` objects | returned **as-is**, no proxy | store in a \`ref\` and replace the value |
| class with \`#private\` fields inside reactive state | methods throw a \`TypeError\` (private fields don't work through a Proxy) | \`markRaw()\` it, or keep it in a \`shallowRef\` |
| a library mutates the raw object it was given | Vue never sees the write | mutate through the proxy, or replace / \`triggerRef\` |
| read after \`await\` in an effect | not tracked | read sources before the \`await\` |
`,
    {
      callout: 'note',
      title: 'Public API vs internals',
      text: 'The hooks, the debugger-event fields listed above and the `is*`/`toRaw`/`markRaw` utilities are public. Internal flag properties on proxies (like `__v_raw`, `__v_skip`), the effect objects you can reach through `e.effect`, and Devtools\' internal hooks are not — inspect them while debugging, but never build on them.',
    },
  ],

  walkthrough: {
    title: 'App.vue (why did it render?)',
    lang: 'vue',
    code: whyApp,
    intro: 'The playground component. It has one deliberate problem: a re-render nobody asked for. The hook tells you which write caused it.',
    steps: [
      { lines: [4, 8], text: 'A reactive user. `lastSeen` changes on every presence ping, but it is **never displayed** — so in theory pings should never re-render anything.' },
      { lines: [11, 20], text: '`onRenderTriggered` receives a debugger event for the write that caused each re-render: its `type` (`set`, `add`…) and `key`. We log it to the console and into a plain DOM list (not reactive state, so logging can\'t cause renders).' },
      { lines: [22, 24], text: '`ping()` changes `lastSeen`. Click **Presence ping** and read the log: `re-render caused by set "lastSeen"`.' },
      { lines: [33], text: 'The culprit. `JSON.stringify(user)` reads **every** property of `user` during render — including `lastSeen` — so each one became a dependency. A debugging leftover turned into a performance bug.' },
      { lines: [34, 35], text: 'What the user actually sees: only `name` and `email`.' },
    ],
  },

  playground: {
    title: 'Why did it render?',
    objective: 'Use onRenderTriggered to find an unexpected re-render, fix it, then add tracking and computed debug hooks.',
    files: { 'App.vue': whyApp },
    expected: `
A profile card (name and email), two buttons and an empty render log. Click **Presence ping** three times: the log fills with \`re-render caused by set "lastSeen"\` — although nothing on screen changed. Click **Rename**: \`set "name"\`, which is expected.
`,
    experiments: [
      {
        id: 'read-the-log',
        task: 'Click **Presence ping** and read the log. Which template expression reads `lastSeen`? Hover the card to see its tooltip.',
        hint: 'Look at every binding in the template, including attributes like `:title`.',
        explain: '`JSON.stringify(user)` touches every key of `user`, making each one a dependency of the render. The hook turned a mystery into a one-line answer.',
      },
      {
        id: 'fix-extra-dependency',
        task: 'Stop presence pings from re-rendering the card. Keep a tooltip, but make it show only the **email**.',
        hint: 'Replace `:title="JSON.stringify(user)"` with `:title="user.email"`.',
        tests: [
          {
            name: 'pings no longer re-render; rename still does',
            code: `await click('.ping')
await click('.ping')
await click('.ping')
expect(logs.filter((l) => l.includes('re-render caused by')).length).toBe(0)
expect(attr('.card', 'title')).toBe('ada@example.com')
await click('.rename')
expect(logs.some((l) => l.includes('"name"'))).toBe(true)`,
          },
        ],
        explain: 'The render now reads `name` and `email` only, so `lastSeen` is no longer a dependency. Fine-grained tracking rewards reading exactly what you display.',
      },
      {
        id: 'track-log',
        task: 'Add an `onRenderTracked` hook that logs `\'tracked: \' + String(e.key)` for every dependency the render reads.',
        hint: 'Import `onRenderTracked` from `\'vue\'` and call it next to `onRenderTriggered`.',
        tests: [
          {
            name: 'the render\'s dependencies are logged',
            code: `expect(logs.some((l) => l === 'tracked: name')).toBe(true)
expect(logs.some((l) => l === 'tracked: email')).toBe(true)`,
          },
        ],
        explain: 'With the original template you would also see `tracked: lastSeen` — the extra dependency, visible before anything even changes. `onRenderTracked` is the tool for "why doesn\'t this update?": if a key is missing from the list, the render never read it.',
      },
      {
        id: 'computed-debug',
        task: 'Add `const initials = computed(() => user.name.split(\' \').map((w) => w[0]).join(\'\'), { onTrigger: (e) => console.log(\'initials triggered by \' + String(e.key)) })` and show `{{ initials }}` in an element with `class="initials"`.',
        hint: 'Import `computed` too. The computed must be displayed: a computed only listens to its sources while something reads it.',
        tests: [
          {
            name: 'renaming triggers the computed and updates the initials',
            code: `expect(text('.initials')).toBe('AL')
await click('.rename')
expect(logs.some((l) => l.includes('initials triggered by name'))).toBe(true)
expect(text('.initials')).toBe('AK')`,
          },
        ],
        explain: '`onTrigger` on a computed reports which write invalidated it. Pings don\'t appear — `lastSeen` isn\'t a dependency of `initials`. Remember: these hooks only fire in development builds.',
      },
    ],
  },

  animation: {
    type: 'dependency-tracker',
    props: { preset: 'cart' },
    title: 'See which effects re-run',
    caption: 'This is what the debug hooks report, drawn as a graph: edit a value and see exactly which computeds and effects depend on it.',
    alt: 'An interactive dependency tracker for a cart. Each state value is connected to the computeds and effects that read it; editing a value highlights only the connected effects as they re-run.',
  },

  internals: {
    beginner: `
In development builds, every time Vue records "this effect read that value" or "this write affects that effect", it also packs a little note: which object, which key, what kind of operation. If you've attached a debug hook, Vue hands you that note.

In production builds Vue skips writing the notes entirely. That's why the hooks cost nothing in production — and also why they do nothing there.
`,
    technical: [
      `
**Where the events come from.** Tracking and triggering go through the same internal functions described in [the dependency tracking lesson](lesson:dependency-tracking). In development builds those functions receive debug info — \`{ target, type, key }\` for tracking, plus \`newValue\`/\`oldValue\` for triggers — and call the effect's \`onTrack\`/\`onTrigger\` if present. For components, Vue wires \`onRenderTracked\`/\`onRenderTriggered\` hooks onto the component's render effect. These code paths are wrapped in development-only checks, so production bundles drop them.

**When \`onTrigger\` fires.** It fires when a write notifies the effect — before the effect actually re-runs (which happens later, batched). For a computed, it fires when a source invalidates it; a computed only subscribes to its sources while something is reading it, so an unused computed reports nothing.

**What \`key\` you'll see.** A property name for objects, \`'value'\` for refs, an index for array writes (\`add "0"\` for a push), and a Symbol for iteration (\`v-for\`, \`Object.keys\`). One write can trigger several keys — a \`push\` adds an index and changes \`length\`.
`,
      {
        code: `// A SIMPLIFIED model of how debug hooks are fed — not Vue's source
function track(target, key) {
  // …record the dependency…
  if (__DEV__ && activeEffect.onTrack) {
    activeEffect.onTrack({ effect: activeEffect, target, type: 'get', key })
  }
}

function trigger(target, key, newValue, oldValue) {
  for (const effect of subscribersOf(target, key)) {
    if (__DEV__ && effect.onTrigger) {
      effect.onTrigger({ effect, target, type: 'set', key, newValue, oldValue })
    }
    schedule(effect)
  }
}
// In production builds __DEV__ is false, so a bundler removes these branches.`,
        lang: 'js',
        title: 'mental model',
      },
      {
        callout: 'warn',
        title: 'Implementation detail',
        text: 'Which internal objects carry the debug info (since 3.5: `Dep` objects with linked subscribers), the iteration Symbols\' descriptions, and the exact order hooks fire when one write triggers several keys are internal and have changed between versions. Read the `type` and `key` fields; don\'t parse anything else.',
      },
    ],
    production: `
- **Reproduce in development.** Debug hooks don't exist in production builds. Capture enough context (state snapshots, user steps) from production errors to reproduce locally.
- **Remove debug hooks before merging** or gate them behind a dev check (\`if (import.meta.env.DEV)\` in Vite apps) — they're no-ops in production, but noise in code review.
- **Don't deep-react to what you don't render.** Huge immutable datasets, API payloads you replace wholesale, editor/canvas models and SDK instances (maps, charts, players) belong in \`shallowRef\`, behind \`markRaw\`, or outside Vue state entirely.
- **High-frequency data** (pointer positions at 60 fps, audio levels) through deep reactive state means a render per update. Batch it, throttle it, or draw it directly with \`requestAnimationFrame\` and keep only summary values reactive.
- **Profile, don't guess.** When "too many renders" is a performance problem, confirm with the Performance panel and Devtools on a production build — see [measuring performance](lesson:measuring-performance).
`,
  },

  mistakes: [
    {
      title: 'Destructuring reactive state',
      wrong: { code: `const state = reactive({ count: 0 })\nconst { count } = state // a plain number, frozen in time`, lang: 'js' },
      right: { code: `const { count } = toRefs(state) // refs linked to state.count\n// or read state.count where you need it`, lang: 'js' },
      explanation: 'Destructuring reads the property once and copies the primitive. `toRefs`/`toRef` create refs that forward to the reactive object.',
    },
    {
      title: 'Replacing a reactive object',
      wrong: { code: `let form = reactive({ title: 'Draft' })\nfunction reset() {\n  form = reactive({ title: '' }) // a plain variable assignment: nothing re-renders\n}`, lang: 'js' },
      right: { code: `const form = reactive({ title: 'Draft' })\nfunction reset() {\n  Object.assign(form, { title: '' })\n}`, lang: 'js' },
      explanation: 'Assigning a new object to a variable is not a reactive write — no proxy or ref sees it — so nothing tells the component to re-render, and any code that captured the old object keeps using it. Mutate the existing reactive object in place, or keep the object in a `ref` and assign `.value`.',
    },
    {
      title: 'Putting a class with private fields into reactive state',
      wrong: { code: `class Player { #volume = 1; louder() { this.#volume++ } }\nconst state = reactive({ player: new Player() })\nstate.player.louder() // TypeError: Cannot read private member…`, lang: 'js' },
      right: { code: `const state = reactive({ player: markRaw(new Player()) })\nstate.player.louder() // works: the instance is never proxied`, lang: 'js' },
      explanation: 'Private fields belong to the real instance; when a method runs with a Proxy as `this`, the lookup fails. Third-party instances usually shouldn\'t be deeply reactive anyway.',
    },
    {
      title: 'Relying on debug hooks in app logic',
      wrong: { code: `onRenderTriggered(() => analytics.track('render')) // silently does nothing in production`, lang: 'js' },
      right: { code: `// debug hooks: development only, for investigating\n// app logic: watch / lifecycle hooks`, lang: 'js' },
      explanation: 'Debug hooks are compiled out of production builds. Anything that must run for real belongs in a watcher or a lifecycle hook.',
    },
    {
      title: 'Mutating a Date and expecting an update',
      wrong: { code: `const due = ref(new Date())\nfunction postpone() {\n  due.value.setDate(due.value.getDate() + 1) // the Date isn't proxied: no trigger\n}`, lang: 'js' },
      right: { code: `function postpone() {\n  const next = new Date(due.value)\n  next.setDate(next.getDate() + 1)\n  due.value = next // replacing .value triggers\n}`, lang: 'js' },
      explanation: 'Vue only proxies plain objects, arrays and Map/Set/WeakMap/WeakSet. A Date\'s internal state changes invisibly; replace the value instead.',
    },
  ],

  debugging: [
    {
      symptom: 'A component re-renders and you don\'t know why.',
      cause: 'Some write triggered a dependency of its render — often one it doesn\'t visibly use.',
      fix: 'Add `onRenderTriggered((e) => console.log(e.type, e.key, e))` (dev only), or put `debugger` in it and read the call stack to find the code that wrote the value.',
    },
    {
      symptom: 'A computed or watcher never re-runs.',
      cause: 'The value it should depend on was never tracked: not reactive, read from a copy, read after `await`, or read through `toRaw`.',
      fix: 'Add `onTrack` to list its dependencies. Fix the read so it goes through a ref or reactive proxy inside the effect.',
    },
    {
      symptom: '`TypeError: Cannot read private member #x from an object whose class did not declare it`.',
      cause: 'An instance of a class with private fields is inside reactive state, so its methods run with a Proxy as `this`.',
      fix: 'Wrap it with `markRaw()` or store it in a `shallowRef`, and expose the values you need as separate refs.',
    },
    {
      symptom: '`[Vue warn] value cannot be made reactive: 5`.',
      cause: '`reactive()` was called with a primitive (or something else it can\'t proxy).',
      fix: 'Use `ref()` for primitives.',
    },
    {
      symptom: 'The console shows `Proxy {…}` and you can\'t read the data easily.',
      cause: 'You are logging the reactive proxy.',
      fix: 'Log `toRaw(value)`, enable custom formatters in Chrome DevTools, or inspect the component in Vue Devtools.',
    },
  ],

  bestPractices: [
    'Name the symptom first: "didn\'t update" vs "updated too much".',
    'Use `onRenderTriggered` / `onTrigger` with `debugger` to find who wrote a value.',
    'Use `onRenderTracked` / `onTrack` to check whether something was read at all.',
    'Remember debug hooks are dev-only no-ops in production — never put logic in them.',
    'Keep third-party class instances out of deep reactivity with `markRaw` or `shallowRef`.',
    'Replace `Date`s and other non-proxyable values instead of mutating them.',
    'Don\'t make huge or high-frequency data deeply reactive; measure before and after.',
  ],

  useCases: [
    'Finding the write behind an unexpected re-render.',
    'Proving a computed is (or isn\'t) tracking a value.',
    'Diagnosing "UI doesn\'t update" after destructuring or object replacement.',
    'Integrating SDK objects (maps, charts, editors) safely with `markRaw`.',
    'Deciding which state should be shallow or non-reactive in a large app.',
  ],

  whenToUse: {
    use: [
      '`onRenderTriggered` when a component renders more often than expected.',
      '`onTrack`/`onTrigger` when a specific computed or watcher misbehaves.',
      'Vue Devtools for a quick look at live state, props and component structure.',
    ],
    avoid: [
      'Leaving debug hooks in committed code — they are noise and do nothing in production.',
      'Debugging by adding `deep: true` or `nextTick` until it works — find the actual dependency.',
      'Deep reactivity for data you never mutate or never render.',
    ],
  },

  comparison: {
    title: 'Which debugging tool answers which question?',
    headers: ['', '`onRenderTracked` / `onTrack`', '`onRenderTriggered` / `onTrigger`', 'Vue Devtools', 'Browser Performance panel'],
    rows: [
      ['Answers', 'what does this effect depend on?', 'which write made it run?', 'what is the state right now?', 'where is the time going?'],
      ['Scope', 'one component / computed / watcher', 'one component / computed / watcher', 'whole app', 'whole page'],
      ['Works in production builds', 'no', 'no', 'no by default (can be enabled with a build flag)', 'yes'],
      ['Best for', '"didn\'t update"', '"updated too much"', 'inspecting and editing state', 'confirming a real performance cost'],
    ],
    note: 'Performance tooling is covered in [Measuring: devtools, profiling & Web Vitals](lesson:measuring-performance). The production Devtools flag is `__VUE_PROD_DEVTOOLS__`.',
  },

  quiz: [
    {
      id: 'debugging-reactivity-q1',
      type: 'mcq',
      prompt: 'What do `onTrack`, `onTrigger` and `onRenderTriggered` do in a **production** build?',
      options: [
        { text: 'Nothing — they are development-only and compiled out' },
        { text: 'The same as in development, but slower', why: 'They are removed from production builds entirely.' },
        { text: 'They log to the server', why: 'Vue never sends anything anywhere.' },
        { text: 'They throw an error', why: 'They are silent no-ops, which is why app logic in them is a bug.' },
      ],
      answer: 0,
      explanation: 'Debug hooks only work in development builds. Investigate locally, never rely on them in shipped logic.',
    },
    {
      id: 'debugging-reactivity-q2',
      type: 'output',
      prompt: 'The template is `<p :title="JSON.stringify(user)">{{ user.name }}</p>`. You run `user.lastSeen++`. What does `onRenderTriggered` report?',
      code: {
        lang: 'js',
        code: `const user = reactive({ name: 'Ada', lastSeen: 0 })

onRenderTriggered((e) => console.log(e.type, e.key))

user.lastSeen++`,
      },
      options: [
        { text: '`set lastSeen`' },
        { text: 'Nothing — `lastSeen` isn\'t displayed', why: '`JSON.stringify` reads every property during render, so `lastSeen` is a dependency.' },
        { text: '`set name`', why: 'Only `lastSeen` was written.' },
        { text: '`get lastSeen`', why: '`get` is a tracking type (onRenderTracked). Triggers are `set`, `add`, `delete` or `clear`.' },
      ],
      answer: 0,
      explanation: 'Stringifying the object in the template reads all of its keys, so a write to any of them re-renders the component.',
    },
    {
      id: 'debugging-reactivity-q3',
      type: 'bug',
      prompt: 'The counter never updates when `store.increment()` runs. Click the line that breaks reactivity.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { reactive } from 'vue'

const store = reactive({ count: 0, increment() { this.count++ } })
const { count } = store
</script>

<template>
  <p>{{ count }}</p>
  <button @click="store.increment()">+1</button>
</template>`,
      },
      answerLine: 5,
      explanation: 'Destructuring copies the number 0 into a plain variable. Use `toRef(store, \'count\')`, `toRefs(store)`, or `{{ store.count }}`.',
    },
    {
      id: 'debugging-reactivity-q4',
      type: 'fill',
      prompt: 'Fill the blanks: a component hook that reports **what caused** a re-render, and the computed option that reports **what invalidated** it.',
      code: {
        lang: 'js',
        code: `onRender___((e) => console.log(e.type, e.key))

const total = computed(getTotal, {
  ___: (e) => console.log('total invalidated by', e.key),
})`,
      },
      answer: [['Triggered'], ['onTrigger']],
      explanation: '`onRenderTriggered` for components, `onTrigger` for computeds and watchers. Their "what did I read?" counterparts are `onRenderTracked` and `onTrack`.',
    },
    {
      id: 'debugging-reactivity-q5',
      type: 'mcq',
      prompt: 'Which of these does `reactive()` return **as-is**, without a proxy? (Select all that apply.)',
      options: [
        { text: '`new Date()`' },
        { text: '`Object.freeze({ a: 1 })`' },
        { text: '`new Map()`', why: 'Map (and Set/WeakMap/WeakSet) are supported: Vue wraps their methods.' },
        { text: '`markRaw({ chart: {} })`' },
        { text: 'an instance of a class with `#private` fields', why: 'It *is* proxied — which is exactly why its methods throw. Use markRaw to prevent it.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Only plain objects, arrays and Map/Set/WeakMap/WeakSet are proxied, and only if they are extensible and not marked raw. Class instances are proxied like objects, which breaks private fields.',
    },
    {
      id: 'debugging-reactivity-q6',
      type: 'output',
      prompt: 'What does this log?',
      code: {
        lang: 'js',
        code: `const raw = { id: 1 }
const p = reactive(raw)
console.log(p === raw, toRaw(p) === raw)`,
      },
      options: [
        { text: '`false true`' },
        { text: '`true true`', why: 'A proxy is a different object from its target.' },
        { text: '`false false`', why: '`toRaw` returns the original object.' },
        { text: '`true false`', why: 'Both halves are reversed.' },
      ],
      answer: 0,
      explanation: 'The proxy wraps the raw object; identity comparisons between them are false. `toRaw` unwraps it.',
    },
    {
      id: 'debugging-reactivity-q7',
      type: 'short',
      prompt: 'A teammate says "the component re-renders constantly". Describe, step by step, how you would find out why.',
      answer: 'Reproduce it in a development build. Add `onRenderTriggered((e) => console.log(e.type, e.key, e))` to the component (or `debugger` inside it) and trigger the behaviour. The event names the key that was written; the call stack shows the code that wrote it. Then find where the render reads that key — often a whole-object read or an unstable prop — and either stop reading it or make the value stable. Confirm with the hook (and the Performance panel if it\'s a performance issue) that the extra renders are gone.',
    },
  ],

  exercises: [
    {
      id: 'fix-lost-reactivity',
      title: 'Three ways to lose reactivity',
      difficulty: 'intermediate',
      prompt: `
This task card has **three** reactivity bugs. Fix them so every button updates the screen.

- \`class="count"\` shows **Done: N** from the shared \`store\`; \`class="done"\` calls \`store.complete()\`.
- \`class="title"\` shows the form title; \`class="reset"\` must clear it to an empty title (**Title:**).
- \`class="due"\` shows the due date (\`toDateString()\`); \`class="postpone"\` moves it one day later.
- Keep using \`store.js\` as it is.
`,
      files: {
        'store.js': `import { reactive } from 'vue'

export const store = reactive({
  done: 0,
  complete() {
    this.done++
  },
})`,
        'App.vue': `<script setup>
import { reactive } from 'vue'
import { store } from './store.js'

const { done } = store

let form = reactive({ title: 'Write report' })
function reset() {
  form = reactive({ title: '' })
}

const due = reactive(new Date(2030, 0, 1))
function postpone() {
  due.setDate(due.getDate() + 1)
}
</script>

<template>
  <p class="count">Done: {{ done }}</p>
  <button class="done" @click="store.complete()">Complete one</button>

  <p class="title">Title: {{ form.title }}</p>
  <button class="reset" @click="reset">Reset form</button>

  <p class="due">{{ due.toDateString() }}</p>
  <button class="postpone" @click="postpone">Postpone a day</button>
</template>`,
      },
      hints: [
        'One bug is a copy, one is a replaced object, and one is a value Vue cannot proxy.',
        '`toRef(store, \'done\')` keeps a link to the store. `Object.assign(form, { title: \'\' })` mutates the object the template already uses.',
        'Store the date in a `ref` and replace it: copy with `new Date(due.value)`, call `setDate` on the copy, then assign `due.value = copy`.',
      ],
      solution: {
        explanation: '`toRef` creates a ref that reads and writes `store.done`, so the template tracks the store. Reassigning the `let form` variable was not a reactive write, so nothing re-rendered; `Object.assign` writes through the proxy the render is already tracking. `Date` objects can\'t be proxied, so mutating one is invisible; putting it in a `ref` and **replacing** the value is a write Vue sees.',
        files: {
          'store.js': `import { reactive } from 'vue'

export const store = reactive({
  done: 0,
  complete() {
    this.done++
  },
})`,
          'App.vue': `<script setup>
import { reactive, ref, toRef } from 'vue'
import { store } from './store.js'

const done = toRef(store, 'done')

const form = reactive({ title: 'Write report' })
function reset() {
  Object.assign(form, { title: '' })
}

const due = ref(new Date(2030, 0, 1))
function postpone() {
  const next = new Date(due.value)
  next.setDate(next.getDate() + 1)
  due.value = next
}
</script>

<template>
  <p class="count">Done: {{ done }}</p>
  <button class="done" @click="store.complete()">Complete one</button>

  <p class="title">Title: {{ form.title }}</p>
  <button class="reset" @click="reset">Reset form</button>

  <p class="due">{{ due.toDateString() }}</p>
  <button class="postpone" @click="postpone">Postpone a day</button>
</template>`,
        },
      },
      tests: [
        { name: 'completing updates the count', code: `await click('.done'); await click('.done'); expect(text('.count')).toBe('Done: 2')` },
        { name: 'reset clears the title', code: `expect(text('.title')).toBe('Title: Write report'); await click('.reset'); expect(text('.title')).toBe('Title:')` },
        { name: 'postpone moves the date by one day', code: `const before = text('.due'); await click('.postpone'); expect(text('.due')).not.toBe(before); expect(text('.due')).toContain('Jan 02 2030')` },
      ],
    },
    {
      id: 'third-party-instance',
      title: 'Keep an SDK object out of reactivity',
      difficulty: 'advanced',
      prompt: `
\`Stopwatch\` (in **stopwatch.js**) is a "third-party" class that uses **private fields**. Clicking **Lap** crashes with a \`TypeError\`.

- Make **Lap** (\`class="lap"\`) record a lap; \`class="laps"\` shows **Laps: N**.
- Don't change **stopwatch.js** — treat it as library code.
- No errors may be logged.
`,
      files: {
        'stopwatch.js': `// Pretend this comes from an npm package. Don't edit it.
export class Stopwatch {
  #laps = []

  lap(time) {
    this.#laps.push(time)
  }

  get lapCount() {
    return this.#laps.length
  }
}`,
        'App.vue': `<script setup>
import { reactive, ref } from 'vue'
import { Stopwatch } from './stopwatch.js'

const state = reactive({
  label: 'Morning run',
  stopwatch: new Stopwatch(),
})
const laps = ref(0)

function lap() {
  state.stopwatch.lap(Date.now())
  laps.value = state.stopwatch.lapCount
}
</script>

<template>
  <h2>{{ state.label }}</h2>
  <p class="laps">Laps: {{ laps }}</p>
  <button class="lap" @click="lap">Lap</button>
</template>`,
      },
      hints: [
        'Read the error: private fields (`#laps`) can\'t be reached when a method runs with a Proxy as `this`.',
        'Reading `state.stopwatch` returns a reactive proxy of the instance. You need the real instance instead.',
        'Wrap it: `stopwatch: markRaw(new Stopwatch())` (import `markRaw`). The display already comes from the `laps` ref.',
      ],
      solution: {
        explanation: '`markRaw()` flags the instance so Vue never wraps it, so `state.stopwatch` returns the real object and private fields work. The UI stays reactive through a separate `laps` ref we update after each call — the usual pattern for SDK objects: keep the instance raw, mirror the values you display into refs. A `shallowRef` holding the instance plus `triggerRef` would work too.',
        files: {
          'stopwatch.js': `// Pretend this comes from an npm package. Don't edit it.
export class Stopwatch {
  #laps = []

  lap(time) {
    this.#laps.push(time)
  }

  get lapCount() {
    return this.#laps.length
  }
}`,
          'App.vue': `<script setup>
import { reactive, ref, markRaw } from 'vue'
import { Stopwatch } from './stopwatch.js'

const state = reactive({
  label: 'Morning run',
  stopwatch: markRaw(new Stopwatch()), // never proxied
})
const laps = ref(0)

function lap() {
  state.stopwatch.lap(Date.now())
  laps.value = state.stopwatch.lapCount
}
</script>

<template>
  <h2>{{ state.label }}</h2>
  <p class="laps">Laps: {{ laps }}</p>
  <button class="lap" @click="lap">Lap</button>
</template>`,
        },
      },
      tests: [
        { name: 'laps are recorded', code: `await click('.lap'); await click('.lap'); expect(text('.laps')).toBe('Laps: 2')` },
        { name: 'no errors are logged', code: `await click('.lap'); expect(logs.some((l) => /private|TypeError/i.test(l))).toBe(false)` },
      ],
    },
  ],

  interview: [
    {
      id: 'debugging-reactivity-unexpected-rerender',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'How would you debug a component that re-renders when you don\'t expect it to?',
      answer: 'Reproduce it in a development build and add `onRenderTriggered` to the component, logging `e.type`, `e.key` and `e.target` (or putting `debugger` inside to see the call stack of the write). That names the exact dependency and the code that changed it. Then find where the render reads it — common culprits are whole-object reads (`JSON.stringify`, spreading), props that receive a new object/array every parent render, or state that changes more often than it\'s displayed. Fix by reading less, passing stable/primitive props, or moving fast-changing state into a smaller component. Confirm with the hook, and with the Performance panel if speed was the concern.',
      explanation: 'The hook turns guessing into one log line. The fix is usually "read less" or "keep values stable".',
      code: {
        lang: 'js',
        code: `onRenderTriggered((e) => {
  console.log('re-render because of', e.type, e.key, e.target)
  // debugger
})`,
      },
      whyAsked: 'A classic: it shows whether the candidate has real tools for reactivity problems or just tries things until they work.',
      mistakes: ['Suggesting `v-once` or `v-memo` before finding the cause.', 'Not knowing the hooks are development-only.', 'Assuming the parent always re-renders children.'],
      followUps: ['What if the trigger comes from a parent passing new props?', 'How would you count renders without the hook?', 'When is an extra render actually not worth fixing?'],
      modelAnswer: 'First I reproduce it in development, because the debug hooks only exist there. I add onRenderTriggered to the component and log the event\'s type and key — or drop a debugger inside so the call stack shows exactly which line wrote the value. That tells me which dependency caused the render. Then I look at where the template or its computeds read that key; typical culprits are reading a whole object, like JSON.stringify in a binding, or a parent passing a freshly created object as a prop. I fix it by reading only what\'s displayed or keeping the value stable, and I verify the extra renders are gone — and only bother if it actually matters for performance.',
    },
    {
      id: 'debugging-reactivity-production-hooks',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Can you use `onTrack`, `onTrigger`, `onRenderTracked` or `onRenderTriggered` to log re-renders in production?',
      answer: 'No. They are development-only debugging hooks; production builds compile the debug code out, so they never fire (the render hooks are also not called during SSR). To understand production behaviour, capture context and reproduce in development, or use production-safe measurement such as the browser Performance panel and real-user monitoring.',
      explanation: 'Dev-only by design, so they cost nothing in shipped apps.',
      whyAsked: 'Checks practical knowledge of the dev/prod split, which matters for debugging and for not shipping broken logic.',
      mistakes: ['Putting analytics or logic in debug hooks.', 'Thinking production Vue just "hides" the logs.'],
      followUps: ['How would you investigate a production-only performance issue?', 'What does `__VUE_PROD_DEVTOOLS__` do?'],
      modelAnswer: 'No — those hooks only work in development builds. The tracking and triggering code paths that feed them are wrapped in development checks and removed from production bundles, so in production they silently do nothing. For production issues I gather reproduction steps and state from error reports and reproduce locally, and for performance I use the browser\'s Performance panel and real-user metrics. Anything that must run in production goes into a watcher or lifecycle hook.',
    },
    {
      id: 'debugging-reactivity-not-updating',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A form shows stale data after you "reset" it, and a counter from a shared store doesn\'t update. Give a systematic checklist for "the UI doesn\'t update".',
      answer: '1) Is the value reactive at all (`isRef`/`isReactive`, Devtools)? 2) Is it a copy — destructured from reactive state, or a reassigned reactive object that the template no longer references? 3) Was it read inside the effect — not after an `await`, not through `toRaw`? `onRenderTracked`/`onTrack` show the actual dependencies. 4) Did the write go through Vue — through the proxy or `.value`, not a raw object or a library mutating its own copy; not a `Date` mutated in place? 5) For shallow state, did you replace the value or call `triggerRef`?',
      explanation: 'Every "didn\'t update" bug is either an untracked read or an unseen write.',
      whyAsked: 'Checks whether the candidate has a mental model, not just a bag of tricks.',
      mistakes: ['Jumping to `nextTick` or `$forceUpdate`.', 'Adding `deep: true` everywhere.', 'Not distinguishing reads from writes.'],
      followUps: ['Which tool shows the dependencies of a computed?', 'How do `toRefs` and `storeToRefs` relate to this?'],
      modelAnswer: 'I split it into reads and writes. On the read side: is the thing reactive at all, is the template reading the reactive object or a destructured copy, and was it read inside the render or computed — not after an await? onRenderTracked or onTrack tells me what\'s actually tracked. On the write side: did the change go through the proxy or .value, or did someone mutate a raw object, replace a reactive object variable, or mutate a Date in place? For the reset I\'d use Object.assign or a ref; for the store counter, toRefs or storeToRefs instead of destructuring.',
    },
    {
      id: 'debugging-reactivity-private-fields',
      difficulty: 'advanced',
      type: 'debugging',
      minutes: 3,
      question: 'After storing a map SDK instance in `reactive()` state, calling its methods throws `TypeError: Cannot read private member #map from an object whose class did not declare it`. Explain and fix.',
      answer: 'Reactive state wraps the instance in a Proxy. Calling a method through the proxy makes `this` the proxy, but JavaScript private fields are only accessible on the real instance, so the lookup throws. Fix with `markRaw(instance)` (or keep it in `shallowRef`) so Vue never proxies it, and mirror the values you need in the UI into ordinary refs. Large SDK objects shouldn\'t be deeply reactive anyway.',
      explanation: 'Proxies and private fields are fundamentally incompatible; the fix is to keep such objects raw.',
      whyAsked: 'A real integration bug with modern libraries; tests understanding of how proxies work.',
      mistakes: ['Suggesting `toRaw` at every call site instead of marking it once.', 'Patching the library.', 'Not mentioning the performance benefit of keeping SDK objects raw.'],
      followUps: ['What is the difference between `markRaw` and `shallowRef` here?', 'How do you keep the UI in sync with the SDK\'s state?'],
      modelAnswer: 'Putting the instance in reactive state means reading it returns a Proxy, and methods called on it get the proxy as this. Private class fields are stored on the real instance, so accessing #map through the proxy throws. I\'d mark the instance with markRaw when creating it, or hold it in a shallowRef, so Vue never wraps it. Then I\'d subscribe to the SDK\'s own events and copy the few values the UI needs — zoom, center — into refs. That also avoids the cost of proxying a huge object graph.',
    },
    {
      id: 'debugging-reactivity-deep-state',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'When should you NOT put data into deep reactive state? Give concrete examples and alternatives.',
      answer: 'Avoid deep reactivity for: large immutable datasets you replace wholesale (API payloads, lookup tables) → `shallowRef`/`Object.freeze`; third-party instances (maps, charts, editors, players) → `markRaw`; very high-frequency data (pointer positions, audio levels) → keep outside Vue and render with `requestAnimationFrame`, exposing throttled summaries; data never displayed or never mutated → plain variables; state owned by another system → wrap with an event-driven `shallowRef` or `customRef`. Measure before and after.',
      explanation: 'Deep reactivity costs proxies and tracking proportional to what you touch. Spend it where it buys you automatic UI updates.',
      whyAsked: 'Distinguishes engineers who understand the cost model of reactivity from those who wrap everything in `reactive()`.',
      mistakes: ['Saying reactivity is free.', 'Recommending `markRaw` everywhere without measuring.', 'Forgetting that shallow state needs replacement or `triggerRef`.'],
      followUps: ['How would you measure the overhead?', 'How does `shallowRef` change how you update the data?'],
      modelAnswer: 'Deep reactivity is great for small, mutable UI state, but it costs proxies and tracking for everything it touches. For large immutable data I replace wholesale, like API pages or reference tables, I use shallowRef or freeze the objects. For SDK instances such as map or chart objects I use markRaw and mirror a few values into refs. For very high-frequency streams, like pointer positions, I keep the data outside Vue and draw with requestAnimationFrame, exposing throttled summary values. And I confirm any change with profiling on a production build rather than assuming.',
    },
    {
      id: 'debugging-reactivity-identity',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'A list is stored with `const items = reactive([])`. You push an object fetched from an API, then check `items[0] === fetched`. What is the result, and why?',
      code: {
        lang: 'js',
        code: `const items = reactive([])
const fetched = { id: 7, name: 'Lamp' }
items.push(fetched)

console.log(items[0] === fetched)
console.log(items.includes(fetched))`,
      },
      options: ['true, true', 'false, true', 'false, false', 'true, false'],
      correctOption: 1,
      answer: '`false`, then `true`. Reading `items[0]` returns a reactive proxy of the object, which is a different object from `fetched`. Vue patches `includes`/`indexOf` on reactive arrays to search for both the raw object and its proxy, so `includes` finds it.',
      explanation: 'Proxy identity ≠ raw identity; Vue compensates in some array methods but not in your own comparisons.',
      whyAsked: 'Identity bugs appear in selection logic and caches; this checks awareness of proxies.',
      mistakes: ['Answering true/true.', 'Not knowing about the array method instrumentation.'],
      followUps: ['How would you implement "is this item selected?" robustly?', 'What happens with a plain `Set` of raw objects?'],
      modelAnswer: 'The first log is false: indexing into a reactive array returns a proxy of the object, not the object I pushed. The second is true, because Vue instruments includes, indexOf and lastIndexOf on reactive arrays to also look for the raw version. My own === checks, plain Sets and Map keys don\'t get that help, so for selection I compare ids, and only use toRaw when I really need identity.',
    },
    {
      id: 'debugging-reactivity-coding-why',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 6,
      question: 'Write a composable `useWhyRender(name)` in **useWhyRender.js** that, using `onRenderTriggered`, logs `[name] re-render: <type> <key>` for every re-render of the component that calls it. The counter app already calls `useWhyRender(\'Counter\')`.',
      starter: {
        files: {
          'useWhyRender.js': `import { onRenderTriggered } from 'vue'

// TODO: log "[name] re-render: <type> <key>" on every re-render (development only)
export function useWhyRender(name) {
}`,
          'App.vue': `<script setup>
import { ref, reactive } from 'vue'
import { useWhyRender } from './useWhyRender.js'

useWhyRender('Counter')

const count = ref(0)
const todo = reactive({ text: 'Buy milk' })
</script>

<template>
  <p class="count">{{ count }}</p>
  <p class="todo">{{ todo.text }}</p>
  <button class="inc" @click="count++">+1</button>
  <button class="edit" @click="todo.text = 'Buy oat milk'">Edit todo</button>
</template>`,
        },
      },
      tests: [
        { name: 'a ref write is reported', code: `await click('.inc'); expect(logs).toContain('[Counter] re-render: set value')` },
        { name: 'a reactive property write is reported', code: `await click('.edit'); expect(logs).toContain('[Counter] re-render: set text')` },
        { name: 'one log per re-render', code: `await click('.inc'); await click('.inc'); expect(logs.filter((l) => l.startsWith('[Counter] re-render')).length).toBe(2)` },
      ],
      hints: [
        'Composables can call lifecycle hooks — they register on the component whose setup is running.',
        'Inside: `onRenderTriggered((e) => console.log(...))`.',
        'Build the message as `\'[\' + name + \'] re-render: \' + e.type + \' \' + String(e.key)`.',
      ],
      answer: 'Register `onRenderTriggered` inside the composable and log the event\'s type and key with the given name.',
      solution: {
        files: {
          'useWhyRender.js': `import { onRenderTriggered } from 'vue'

// Development-only helper: onRenderTriggered never fires in production builds.
export function useWhyRender(name) {
  onRenderTriggered((e) => {
    console.log('[' + name + '] re-render: ' + e.type + ' ' + String(e.key))
  })
}`,
          'App.vue': `<script setup>
import { ref, reactive } from 'vue'
import { useWhyRender } from './useWhyRender.js'

useWhyRender('Counter')

const count = ref(0)
const todo = reactive({ text: 'Buy milk' })
</script>

<template>
  <p class="count">{{ count }}</p>
  <p class="todo">{{ todo.text }}</p>
  <button class="inc" @click="count++">+1</button>
  <button class="edit" @click="todo.text = 'Buy oat milk'">Edit todo</button>
</template>`,
        },
      },
      explanation: 'Lifecycle hooks called in a composable during setup attach to the calling component, so one line in any component turns on render tracing. Because the hook is development-only, leaving the call in costs nothing in production — but it is still good practice to remove it after debugging. `String(e.key)` matters because iteration keys are Symbols.',
      whyAsked: 'Shows the candidate can turn debugging knowledge into a reusable tool.',
      mistakes: ['Calling the hook outside setup (e.g. in a click handler).', 'Concatenating a Symbol key directly, which throws.', 'Expecting it to work in production.'],
      followUps: ['How would you also log the old and new value?', 'How could you make it a no-op unless a debug flag is set?'],
      modelAnswer: 'The composable just registers onRenderTriggered; because it\'s called during setup, the hook attaches to the calling component. In the callback I log the name with the event\'s type and key, converting the key with String because iteration keys are Symbols. It\'s a development-only tool — the hook never fires in production builds — so I\'d also gate it behind import.meta.env.DEV to keep intent clear, and maybe include oldValue and newValue for set events.',
    },
  ],

  takeaways: [
    'Two bug families: "didn\'t update" (untracked read or unseen write) and "updated too much" (extra dependency or unstable value).',
    '`onRenderTriggered` / `onTrigger` tell you which write caused a run; add `debugger` to see who wrote it.',
    '`onRenderTracked` / `onTrack` list what an effect actually depends on.',
    'All four (and `renderTracked`/`renderTriggered`) are development-only no-ops in production builds.',
    'Reactivity can\'t reach copies, replaced objects, `Date`s, frozen/`markRaw` objects or writes to raw data.',
    'Class instances with `#private` fields break inside reactive state — use `markRaw` or `shallowRef`.',
    'Don\'t deep-react to big immutable, third-party or high-frequency data; measure the real cost.',
  ],
}
