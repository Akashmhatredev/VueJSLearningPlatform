// Lesson: Transition & TransitionGroup.

const wisdomApp = `<script setup>
import { ref } from 'vue'

const showTip = ref(false)
const quotes = [
  'Simplicity is prerequisite for reliability. — Edsger W. Dijkstra',
  'Make it work, make it right, make it fast. — Kent Beck',
  'Programs must be written for people to read. — Harold Abelson',
]
const index = ref(0)

function nextQuote() {
  index.value = (index.value + 1) % quotes.length
}
</script>

<template>
  <h2 class="title">Daily dev wisdom</h2>

  <button class="toggle-tip" @click="showTip = !showTip">
    {{ showTip ? 'Hide' : 'Show' }} tip
  </button>
  <Transition name="fade">
    <p v-if="showTip" class="tip">Name things after what they mean.</p>
  </Transition>

  <section class="quotes">
    <Transition name="fade">
      <blockquote :key="index" class="quote">{{ quotes[index] }}</blockquote>
    </Transition>
    <button class="next" @click="nextQuote">Next quote</button>
  </section>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.tip {
  background: #eef1ff;
  border-left: 4px solid #1d3bf0;
  padding: 8px 12px;
}
.quotes {
  min-height: 130px;
}
.quote {
  font-style: italic;
  margin: 12px 0;
}
</style>`

export default {
  id: 'transitions',
  title: 'Transition & TransitionGroup',
  summary: 'Animate elements as they enter, leave and move — Vue applies CSS classes at exactly the right moments, or calls your JavaScript hooks.',
  difficulty: 'intermediate',
  minutes: 40,
  prerequisites: ['conditional-rendering', 'list-rendering', 'class-style-bindings'],
  related: ['teleport', 'keep-alive', 'dynamic-components', 'accessibility-fundamentals', 'runtime-performance'],
  tags: ['transition', 'TransitionGroup', 'animation', 'enter', 'leave', 'v-enter-from', 'mode out-in', 'appear', 'JavaScript hooks', 'FLIP', 'v-move', 'prefers-reduced-motion'],
  apis: [
    { name: '<Transition>', summary: 'Animates a single element or component when it is inserted or removed (v-if, v-show, dynamic component, key change).' },
    { name: 'name', summary: 'Prefix for the transition classes: `name="fade"` → `fade-enter-from`, `fade-leave-active`, …' },
    { name: 'mode', summary: '`"out-in"` waits for the old element to leave before the new one enters; `"in-out"` does the reverse.' },
    { name: 'appear', summary: 'Also run the enter transition on the initial render.' },
    { name: '@before-enter / @enter / @after-enter / @leave …', summary: 'JavaScript hooks called during the transition; `enter` and `leave` receive a `done` callback.' },
    { name: ':css="false"', summary: 'Skip CSS detection entirely; the JavaScript hooks fully control timing.' },
    { name: '<TransitionGroup>', summary: 'Animates items of a `v-for` list as they are added, removed and reordered (`*-move` class).' },
  ],
  docs: [
    { label: 'Vue Guide — Transition', url: 'https://vuejs.org/guide/built-ins/transition.html' },
    { label: 'Vue Guide — TransitionGroup', url: 'https://vuejs.org/guide/built-ins/transition-group.html' },
    { label: 'API — <Transition> and <TransitionGroup>', url: 'https://vuejs.org/api/built-in-components.html#transition' },
    { label: 'MDN — prefers-reduced-motion', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion' },
  ],

  intro: `
\`<Transition>\` and \`<TransitionGroup>\` are built-in components that animate things **appearing, disappearing and moving**.

You wrap an element, and when Vue inserts or removes it, Vue adds a series of CSS classes at precisely timed moments. You write ordinary CSS for those classes — "start invisible", "fade over 0.25 s", "end visible" — and Vue does the bookkeeping: waiting for the animation to finish before actually removing the element, cancelling cleanly if the user toggles again halfway, and moving list items smoothly when they reorder.

If CSS isn't enough, the same components call **JavaScript hooks** so you can drive an animation library instead.
`,

  why: `
Without help, removing an element is instant: \`v-if\` turns false, and the element is gone in the very next render. You can't fade out something that no longer exists.

To animate removal by hand you would have to: keep the element in the DOM a little longer, add a "leaving" class, listen for \`transitionend\`, remember to handle the case where it never fires, *then* remove the element — and also deal with the user clicking again mid-animation. For every animated element. For lists, you'd also have to measure every item before and after a change to animate them to their new positions.

Good motion has a purpose: it shows **where things came from and went to**, so users don't lose their place when content changes. \`<Transition>\` makes that cheap enough to do properly, with plain CSS and no animation library.
`,

  eli15: `
Think of a theatre. When an actor enters, they don't teleport to centre stage — they walk on from the wings. When they leave, they walk off before the next scene starts.

Vue is the stage manager. You put an element inside \`<Transition>\` and tell Vue the name of the routine, like \`fade\`. When the element should appear, Vue whispers to it, step by step:

1. "Stand in your starting spot" — the \`fade-enter-from\` class (say, invisible).
2. "Now walk on" — the \`fade-enter-active\` class says *how* to move (fade over a quarter second).
3. "This is where you end up" — \`fade-enter-to\` (fully visible).

Leaving works the same way, backwards. And here's the clever bit: Vue **waits for the actor to finish walking off** before taking them off the cast list. That's the part you can't easily do yourself.
`,

  analogy: {
    title: 'The stage manager\'s cue sheet',
    body: `
A stage manager doesn't act. They hold a cue sheet and call each cue at the right moment: "lights fade", "actor enters", "curtain". The performers (your CSS) know *how* to do each cue.

\`<Transition name="fade">\` hands Vue a cue sheet called "fade". Vue calls the cues — adds and removes classes — and your stylesheet performs them. With \`mode="out-in"\`, the stage manager waits for one actor to fully exit before cueing the next actor on, so they never collide on stage.
`,
    mapping: [
      ['the stage manager', '`<Transition>` / `<TransitionGroup>`'],
      ['the name of the cue sheet', 'the `name` prop, which prefixes every class'],
      ['performers who know their moves', 'your CSS rules for `*-enter-active`, `*-leave-to`, …'],
      ['waiting in the wings before removing an actor', 'Vue keeps a leaving element until its transition ends'],
      ['"one actor off before the next comes on"', '`mode="out-in"`'],
      ['a chorus line shuffling places', '`<TransitionGroup>` move animations'],
    ],
  },

  visual: {
    type: 'rendering-lab',
    props: { mode: 'transition' },
    title: 'Transition, live',
    caption: 'Toggle the element and watch the classes Vue adds and removes on the real DOM node, frame by frame.',
    alt: 'An interactive demo: a button toggles an element wrapped in a Transition. A class inspector lists the classes on the element as it enters and leaves — enter-from and enter-active, then enter-to, then none; and leave-from and leave-active, then leave-to, before the element is removed.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'The class timeline',
    props: {
      width: 760,
      height: 300,
      nodes: [
        { id: 'show', label: 'v-if → true', note: 'element created', tone: 'paper', x: 90, y: 70 },
        { id: 'enter1', label: 'enter-from + enter-active', note: 'inserted with these', tone: 'acid', x: 300, y: 70 },
        { id: 'enter2', label: 'enter-to + enter-active', note: 'next frame', tone: 'acid', x: 510, y: 70 },
        { id: 'entered', label: 'classes removed', note: 'transitionend', tone: 'cobalt', x: 690, y: 70 },
        { id: 'hide', label: 'v-if → false', note: 'element kept for now', tone: 'paper', x: 90, y: 220 },
        { id: 'leave1', label: 'leave-from + leave-active', note: 'immediately', tone: 'red', x: 300, y: 220 },
        { id: 'leave2', label: 'leave-to + leave-active', note: 'next frame', tone: 'red', x: 510, y: 220 },
        { id: 'removed', label: 'element removed', note: 'transitionend', tone: 'ink', x: 690, y: 220 },
      ],
      edges: [
        { from: 'show', to: 'enter1' },
        { from: 'enter1', to: 'enter2', label: 'one frame' },
        { from: 'enter2', to: 'entered' },
        { from: 'hide', to: 'leave1' },
        { from: 'leave1', to: 'leave2', label: 'one frame' },
        { from: 'leave2', to: 'removed' },
      ],
      steps: [
        { focus: ['show', 'enter1'], edges: ['show->enter1'], text: 'When the element should appear, Vue creates it and inserts it **already wearing** `fade-enter-from` (the start state, e.g. `opacity: 0`) and `fade-enter-active` (the `transition` rule).' },
        { focus: ['enter2'], edges: ['enter1->enter2'], text: 'On the next animation frame Vue swaps `enter-from` for `enter-to`. The browser sees the style change and animates from the start state to the normal state, as described by `enter-active`.' },
        { focus: ['entered'], edges: ['enter2->entered'], text: 'When the CSS transition (or animation) ends, Vue removes the remaining classes. The element is now just a normal element.' },
        { focus: ['hide', 'leave1'], edges: ['hide->leave1'], text: 'When `v-if` turns false, Vue does **not** remove the element yet. It adds `leave-from` and `leave-active`.' },
        { focus: ['leave2'], edges: ['leave1->leave2'], text: 'Next frame: `leave-from` is swapped for `leave-to` (e.g. `opacity: 0`), so the browser animates out.' },
        { focus: ['removed'], edges: ['leave2->removed'], text: 'Only when the leave transition ends does Vue remove the element from the DOM. Toggle again halfway and Vue cancels the leave cleanly.' },
      ],
    },
    caption: 'Six classes, applied in two timelines. You write the CSS; Vue times it.',
    alt: 'Two rows of boxes. Enter row: v-if true, element inserted with enter-from and enter-active, one frame later enter-to and enter-active, then classes removed when the transition ends. Leave row: v-if false, leave-from and leave-active, one frame later leave-to and leave-active, then the element is removed when the transition ends.',
  },

  syntax: [
    `
#### A basic fade

Wrap **one** element (or one component with a single root) and toggle it with \`v-if\`, \`v-show\`, a dynamic component, or a changing \`key\`:
`,
    {
      code: `<template>
  <button @click="open = !open">Toggle</button>
  <Transition name="fade">
    <p v-if="open">Hello!</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>`,
      lang: 'vue',
      title: 'fade in and out',
    },
    `
The six classes (with \`name="fade"\`; without a name they start with \`v-\`):

| class | when |
|---|---|
| \`fade-enter-from\` | start state; present when inserted, removed one frame later |
| \`fade-enter-active\` | the whole enter phase — put your \`transition\`/\`animation\` here |
| \`fade-enter-to\` | end state; added one frame after insertion, removed when done |
| \`fade-leave-from\` | start of leaving; removed one frame later |
| \`fade-leave-active\` | the whole leave phase |
| \`fade-leave-to\` | end state of leaving; removed when done (with the element) |

#### Options you'll use
`,
    {
      code: `<!-- one element out, THEN the next one in -->
<Transition name="slide" mode="out-in">
  <component :is="currentTab" />
</Transition>

<!-- re-run the transition whenever the key changes -->
<Transition name="bump" mode="out-in">
  <span :key="price">{{ price }} €</span>
</Transition>

<!-- also animate on the first render -->
<Transition name="fade" appear>…</Transition>

<!-- use classes from a CSS library (e.g. Animate.css) -->
<Transition
  enter-active-class="animate__animated animate__bounceIn"
  leave-active-class="animate__animated animate__fadeOut"
>…</Transition>

<!-- explicit durations (ms) when Vue can't detect them, e.g. nested transitions -->
<Transition :duration="{ enter: 300, leave: 500 }">…</Transition>`,
      lang: 'vue',
      title: 'modes, keys, appear, custom classes, duration',
    },
    `
#### JavaScript hooks
`,
    {
      code: `<Transition
  :css="false"
  @before-enter="(el) => (el.style.opacity = 0)"
  @enter="(el, done) => animateIn(el).then(done)"
  @after-enter="onShown"
  @leave="(el, done) => animateOut(el).then(done)"
>
  <div v-if="open" class="panel">…</div>
</Transition>`,
      lang: 'vue',
      title: 'drive the animation from JavaScript',
    },
    {
      callout: 'warn',
      title: 'Call done()',
      text: 'With `:css="false"`, Vue relies on your `enter`/`leave` hooks to say when they are finished. If you never call `done`, the element never finishes entering — or never gets removed. Without `:css="false"`, `done` is optional and Vue also watches for CSS transitions.',
    },
    `
#### Lists: \`<TransitionGroup>\`
`,
    {
      code: `<template>
  <TransitionGroup name="list" tag="ul">
    <li v-for="item in items" :key="item.id">{{ item.text }}</li>
  </TransitionGroup>
</template>

<style>
.list-move,            /* items sliding to new positions */
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-active {
  position: absolute; /* take leaving items out of the flow so others can move */
}
</style>`,
      lang: 'vue',
      title: 'animated list',
    },
    `
**TransitionGroup rules:** every child needs a unique \`key\`; no wrapper element is rendered unless you set \`tag\`; the classes go on **each item**, not the container; \`mode\` isn't available; and reordering gets the \`*-move\` class.
`,
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: wisdomApp,
    intro: 'Two transitions in one small page: one triggered by `v-if`, one by a changing `key`. Step through, then run it in the playground.',
    steps: [
      { lines: [4], text: '`showTip` decides whether the tip exists at all — `v-if` will add or remove it, which is what triggers enter and leave transitions.' },
      { lines: [10, 14], text: '`index` picks the quote. Changing it changes the `key` further down, which makes Vue treat the quote as a brand-new element.' },
      { lines: [23, 25], text: '`<Transition name="fade">` wraps exactly one element. When `showTip` flips, Vue adds `fade-enter-*` or `fade-leave-*` classes and waits for the CSS transition before removing the element.' },
      { lines: [28, 30], text: '`:key="index"`: a new key means "old element leaves, new element enters". Without a `mode`, both happen **at the same time** — briefly two quotes are on screen.' },
      { lines: [36, 43], text: 'The CSS. `*-enter-active` and `*-leave-active` say *how* to animate (opacity over 0.25 s). `*-enter-from` and `*-leave-to` say what the invisible end of the animation looks like.' },
    ],
  },

  playground: {
    title: 'Daily dev wisdom',
    objective: 'Rename a transition, fix overlapping elements with a mode, animate the first render, and use a JavaScript hook.',
    files: { 'App.vue': wisdomApp },
    expected: 'A heading, a **Show tip** button that fades a tip in and out, and a quote with **Next quote**. Click Next quote and watch closely: for a moment **two quotes** are on screen and the button jumps down. (The automated tests check classes and final states — CSS doesn\'t really animate in the test environment.)',
    experiments: [
      {
        id: 'slide-tip',
        task: 'Give the tip its own transition named **slide** that slides in from the left (`transform: translateX(-20px)` plus fading). Keep the quote\'s fade as it is.',
        hint: 'Change only the tip\'s `<Transition name="slide">`, then add `.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }` and `.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateX(-20px); }`.',
        tests: [
          {
            name: 'the tip enters with slide-* classes',
            code: `await click('.toggle-tip')
expect(classes('.tip')).toContain('slide-enter-active')`,
          },
          {
            name: 'the tip leaves with slide-* classes',
            code: `await click('.toggle-tip')
await wait(500)
await click('.toggle-tip')
expect(classes('.tip')).toContain('slide-leave-active')`,
          },
        ],
        explain: 'The `name` is just a class prefix. Vue applied `slide-enter-active` and friends; your CSS decided what they look like. Notice the leaving tip is still in the DOM while it animates — Vue removes it afterwards.',
      },
      {
        id: 'out-in',
        task: 'Stop the two quotes from overlapping: the old quote should finish leaving **before** the new one enters.',
        hint: 'Add `mode="out-in"` to the quote\'s `<Transition>`.',
        tests: [
          {
            name: 'only the old quote is present right after clicking',
            code: `const first = text('.quote')
await click('.next')
expect(findAll('.quote')).toHaveLength(1)
expect(text('.quote')).toBe(first)`,
          },
          {
            name: 'the new quote appears after the old one has left',
            code: `await click('.next')
await wait(700)
expect(findAll('.quote')).toHaveLength(1)
expect(text('.quote')).toContain('Kent Beck')`,
          },
        ],
        explain: 'By default leave and enter run simultaneously, so both elements are in the layout at once. `out-in` sequences them, which is what you want for swapping content in the same spot — tabs, steps, routes.',
      },
      {
        id: 'appear',
        task: 'Make the heading fade in when the page **first loads**.',
        hint: 'Wrap `<h2 class="title">` in `<Transition name="fade" appear>`. Without `appear`, a transition only runs on later changes, not on the initial render.',
        tests: [
          {
            name: 'the heading is entering right after mount',
            code: `expect(classes('.title')).toContain('fade-enter-active')`,
          },
        ],
        explain: '`appear` applies the enter transition on the initial render too. Use it sparingly — animating everything on load mostly delays the content people came for.',
      },
      {
        id: 'after-enter',
        task: 'Count how many times the tip has **finished** appearing. Show the count in `<span class="shown-count">` (just the number), starting at 0.',
        hint: 'Add `const shownCount = ref(0)`, put `@after-enter="shownCount++"` on the tip\'s `<Transition>`, and render `<span class="shown-count">{{ shownCount }}</span>`.',
        tests: [
          {
            name: 'counts completed enter transitions',
            code: `expect(text('.shown-count')).toBe('0')
await click('.toggle-tip')
await wait(500)
expect(text('.shown-count')).toBe('1')
await click('.toggle-tip')
await wait(500)
await click('.toggle-tip')
await wait(500)
expect(text('.shown-count')).toBe('2')`,
          },
        ],
        explain: '`@after-enter` fires once the enter transition has completely finished — the right moment to move focus into newly shown content, start a video, or log analytics, without fighting the animation.',
      },
    ],
  },

  internals: {
    beginner: `
Vue can't animate an element that's already gone, so \`<Transition>\` changes *when* elements are added and removed. On enter it inserts the element wearing "start" classes and swaps them a frame later so the browser animates the change. On leave it keeps the element, adds "leave" classes, waits until the animation is over, and only then removes it.
`,
    technical: [
      `
\`<Transition>\` is a thin DOM layer over a platform-independent \`BaseTransition\` component. It doesn't render an element of its own; it attaches **transition hooks** to its single child vnode, and the renderer calls those hooks around insertion and removal.

**Enter:** before insertion, add \`*-enter-from\` and \`*-enter-active\`; insert; on the next frame (Vue waits for two \`requestAnimationFrame\` callbacks so the start state is really painted) swap \`enter-from\` → \`enter-to\`; then wait for the end.

**Waiting for the end:** Vue reads the element's computed \`transition-duration\`/\`transition-delay\` and \`animation-duration\`/\`animation-delay\`, listens for \`transitionend\`/\`animationend\`, and also sets a timeout slightly longer than the computed duration as a safety net. If no duration is found (\`transition: none\`, or a test environment that doesn't compute styles), it finishes right away.

**Leave:** the renderer asks the transition hooks to perform the removal. The element stays in the DOM until the leave finishes; if the element is shown again mid-leave, the pending leave is cancelled.
`,
      {
        code: `// TransitionGroup move animations use the FLIP technique.
// A simplified model — not Vue's real source.
function animateMoves(children, moveClass) {
  const first = new Map(children.map((el) => [el, el.getBoundingClientRect()])) // F: before update
  // …Vue patches the list (items reorder)…
  for (const el of children) {
    const last = el.getBoundingClientRect()                                    // L: after update
    const dx = first.get(el).left - last.left
    const dy = first.get(el).top - last.top
    if (!dx && !dy) continue
    el.style.transform = \`translate(\${dx}px, \${dy}px)\`                       // I: invert
    el.offsetHeight                                                            // force a reflow
    el.classList.add(moveClass)                                                // *-move has the transition
    el.style.transform = ''                                                    // P: play back to 0
  }
}`,
        lang: 'js',
        title: 'mental model: FLIP move animations',
      },
      `
That's why \`*-leave-active { position: absolute }\` matters for lists: a leaving item that still takes up space would stop the others from moving into its place until it's gone.
`,
    ],
    production: `
- **Animate \`transform\` and \`opacity\`.** They can usually be animated without re-running layout. Animating \`height\`, \`top\` or \`width\` forces layout work every frame. For "expand to auto height", use JS hooks that measure \`scrollHeight\`, or the CSS grid \`grid-template-rows: 0fr → 1fr\` technique.
- **Respect reduced motion.** Some users get dizzy or nauseous from motion. Disable or tone down transitions with \`@media (prefers-reduced-motion: reduce) { .fade-enter-active, .fade-leave-active { transition: none; } }\` — Vue sees no duration and completes immediately.
- **Keep it short and never block.** UI transitions should feel instant-ish; don't make users wait for an animation before they can act.
- **Reuse.** Wrap \`<Transition>\` in your own \`<FadeTransition>\` component (passing the slot through) so the whole app shares the same timings.
- **Big lists:** move animations measure every child with \`getBoundingClientRect()\` before and after each change. That's fine for dozens of items, but expensive for thousands — combine with [virtual scrolling](lesson:large-lists) carefully, or skip move animations there.
- **Testing:** test what users can rely on — the final state after the transition — not exact frames. Many test setups stub \`<Transition>\` to render instantly.
`,
  },

  mistakes: [
    {
      title: 'Wrapping two conditional siblings in one Transition',
      wrong: { code: `<Transition name="fade">\n  <p v-if="saved">Saved!</p>\n  <p v-if="failed">Failed.</p>\n</Transition>`, lang: 'vue' },
      right: { code: `<Transition name="fade" mode="out-in">\n  <p v-if="saved" key="saved">Saved!</p>\n  <p v-else-if="failed" key="failed">Failed.</p>\n</Transition>`, lang: 'vue' },
      explanation: '`<Transition>` supports a single element at a time. Use `v-if`/`v-else-if`/`v-else` so only one can render — or `<TransitionGroup>` if several can coexist.',
    },
    {
      title: 'CSS class names that don\'t match the transition name',
      wrong: { code: `<Transition name="slide">…</Transition>\n\n.fade-enter-active { transition: opacity 0.25s; }`, lang: 'vue' },
      right: { code: `<Transition name="slide">…</Transition>\n\n.slide-enter-active { transition: opacity 0.25s; }`, lang: 'vue' },
      explanation: 'Vue applies `slide-*` classes, so `fade-*` rules never match and the element just pops in. Check the classes on the element in devtools while it enters.',
    },
    {
      title: 'Expecting a transition when nothing is inserted or removed',
      wrong: { code: `<Transition name="fade">\n  <p :class="{ active: isActive }">Status</p>\n</Transition>`, lang: 'vue' },
      right: { code: `<!-- class changes: plain CSS transition -->\n<p class="status" :class="{ active: isActive }">Status</p>\n\n.status { transition: background-color 0.25s; }`, lang: 'vue' },
      explanation: '`<Transition>` reacts to elements entering and leaving: `v-if`, `v-show`, dynamic components and `key` changes. For a property change on an element that stays, a normal CSS `transition` on the element is all you need.',
    },
    {
      title: 'Index keys in a TransitionGroup',
      wrong: { code: `<TransitionGroup name="list" tag="ul">\n  <li v-for="(todo, i) in todos" :key="i">{{ todo.text }}</li>\n</TransitionGroup>`, lang: 'vue' },
      right: { code: `<TransitionGroup name="list" tag="ul">\n  <li v-for="todo in todos" :key="todo.id">{{ todo.text }}</li>\n</TransitionGroup>`, lang: 'vue' },
      explanation: 'Remove the first todo and every index shifts: Vue thinks the *last* key disappeared, so the wrong row animates out while the others just change text. Keys must identify the item, not its position.',
    },
    {
      title: 'Forgetting done() with :css="false"',
      wrong: { code: `function onLeave(el) {\n  el.animate([{ opacity: 1 }, { opacity: 0 }], 250)\n} // element stays in the DOM`, lang: 'js' },
      right: { code: `function onLeave(el, done) {\n  el.animate([{ opacity: 1 }, { opacity: 0 }], 250).onfinish = done\n}`, lang: 'js' },
      explanation: 'With `:css="false"`, Vue only knows the leave is over when you call `done`. Until then the element is never removed.',
    },
  ],

  debugging: [
    {
      symptom: 'The element appears and disappears instantly, with no animation.',
      cause: 'The class prefix doesn\'t match `name`, the CSS has no `transition`/`animation` in the `*-active` class, or the change doesn\'t insert/remove anything.',
      fix: 'Inspect the element while it enters: you should see `<name>-enter-active`. Make sure the duration lives in the `*-active` rule and the trigger is `v-if`, `v-show`, a dynamic component or a `key` change.',
    },
    {
      symptom: '`[Vue warn]: <transition> can only be used on a single element or component.`',
      cause: 'Several children (or a component with multiple root nodes) inside `<Transition>`.',
      fix: 'Use `v-if`/`v-else`, give the child component a single root element, or switch to `<TransitionGroup>` for lists.',
    },
    {
      symptom: 'During a switch, both old and new content are visible and the layout jumps.',
      cause: 'Default mode runs leave and enter at the same time.',
      fix: 'Add `mode="out-in"`, or position the two elements on top of each other (e.g. a grid with both in the same cell).',
    },
    {
      symptom: 'List items snap into place instead of sliding when one is removed.',
      cause: 'The leaving item still occupies space until it is removed, so the others can\'t move yet — or there is no `*-move` rule.',
      fix: 'Add `.list-leave-active { position: absolute; }` and include `.list-move` in your transition rule.',
    },
    {
      symptom: 'An element stays on screen forever after being hidden.',
      cause: 'A JavaScript `leave` hook with `:css="false"` never called `done` (or an exception happened before it).',
      fix: 'Call `done` from the animation\'s finish callback, and handle errors so it always gets called.',
    },
  ],

  bestPractices: [
    'Use motion to explain change (where something came from or went), not as decoration.',
    'Animate `transform` and `opacity`; avoid animating layout properties like `height` or `top`.',
    'Support `prefers-reduced-motion` by disabling or simplifying transitions.',
    'Use `mode="out-in"` when swapping content in the same place.',
    'Give every `<TransitionGroup>` child a stable, unique key — never the index.',
    'Wrap your standard transitions in small reusable components so timings stay consistent.',
    'Use `@after-enter` for follow-up work such as moving focus into revealed content.',
  ],

  useCases: [
    'Fading notifications, tips and validation messages in and out.',
    'Sliding a side panel, dropdown or accordion open and closed.',
    'Swapping tabs, wizard steps or routed pages with `mode="out-in"`.',
    'Animating a number or badge when its value changes (`:key="value"`).',
    'Todo lists, carts and search results where items are added, removed and reordered (`<TransitionGroup>`).',
    'Driving GSAP or the Web Animations API from JavaScript hooks.',
  ],

  whenToUse: {
    use: [
      'An element or component is inserted or removed and the change would otherwise be jarring.',
      'Content is swapped in place and users need to notice that it changed.',
      'List items are added, removed or reordered and you want users to track them.',
    ],
    avoid: [
      'A property changes on an element that stays — a plain CSS `transition` is simpler.',
      'Very large or rapidly updating lists where measuring every item is costly.',
      'Motion that delays users or carries no information.',
    ],
  },

  comparison: {
    title: 'Choosing an animation tool',
    headers: ['', '`<Transition>`', '`<TransitionGroup>`', 'plain CSS `transition`', 'JS hooks + a library'],
    rows: [
      ['Animates insertion / removal?', 'yes (one element)', 'yes (each list item)', 'no — the element must already exist', 'yes'],
      ['Animates reordering?', 'no', 'yes (`*-move`, FLIP)', 'no', 'yes, if you write it'],
      ['`mode` (out-in / in-out)?', 'yes', 'no', 'n/a', 'via `<Transition>` modes'],
      ['Who controls timing?', 'CSS (Vue detects it)', 'CSS (Vue detects it)', 'CSS', 'your code calls `done()`'],
      ['Best for', 'toggles, swaps, key changes', 'lists', 'state changes on a persistent element', 'complex, sequenced or physics-based motion'],
    ],
    note: 'Transitions combine with [KeepAlive](lesson:keep-alive) and dynamic components: `<Transition mode="out-in"><KeepAlive><component :is="tab" /></KeepAlive></Transition>`.',
  },

  quiz: [
    {
      id: 'transitions-q1',
      type: 'mcq',
      prompt: 'Which of these changes does **not** trigger a `<Transition>` on its child?',
      options: [
        { text: 'Toggling `v-if` on the child', why: '`v-if` inserts/removes the element — the classic trigger.' },
        { text: 'Toggling `v-show` on the child', why: '`v-show` is supported: Vue animates before/after toggling `display`.' },
        { text: 'Changing a `:class` binding on the child' },
        { text: 'Changing the child\'s `key`', why: 'A new key means a new element: the old one leaves, the new one enters.' },
        { text: 'Switching the component in `<component :is>`', why: 'Dynamic components are a supported trigger.' },
      ],
      answer: 2,
      explanation: '`<Transition>` animates elements entering and leaving. A class change on an element that stays put is just a style change — use a CSS `transition` on the element for that.',
    },
    {
      id: 'transitions-q2',
      type: 'output',
      prompt: '`show` becomes `true`. Which classes does the `<p>` have **at the moment it is inserted**?',
      code: {
        lang: 'vue',
        code: `<Transition name="slide">
  <p v-if="show">Hi</p>
</Transition>`,
      },
      options: [
        '`slide-enter-from` and `slide-enter-active`',
        { text: '`v-enter-from` and `v-enter-active`', why: 'With `name="slide"`, the prefix is `slide-`, not `v-`.' },
        { text: '`slide-enter-to` only', why: '`enter-to` is added one frame later, when `enter-from` is removed.' },
        { text: 'No classes until the next frame', why: 'The start classes must be there from the first paint, otherwise there would be nothing to animate from.' },
      ],
      answer: 0,
      explanation: 'The element is inserted with the start state (`enter-from`) and the transition rule (`enter-active`). One frame later, `enter-from` is swapped for `enter-to`.',
    },
    {
      id: 'transitions-q3',
      type: 'bug',
      prompt: 'Vue warns that `<transition>` can only be used on a single element. Click the line to change.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const status = ref('idle')
</script>

<template>
  <Transition name="fade" mode="out-in">
    <p v-if="status === 'saving'">Saving…</p>
    <p v-if="status === 'saved'">Saved!</p>
  </Transition>
</template>`,
      },
      answerLine: 9,
      explanation: 'Two independent `v-if`s mean Vue can\'t guarantee a single child. Make the second one `v-else-if` so the branches are mutually exclusive.',
    },
    {
      id: 'transitions-q4',
      type: 'fill',
      prompt: 'Complete the CSS for `<Transition name="fade">`.',
      code: {
        lang: 'css',
        code: `.fade-___-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-___ {
  opacity: 0;
}`,
      },
      answer: [['enter'], ['to']],
      explanation: 'The `*-active` classes carry the transition; `enter-from` and `leave-to` are the invisible ends of the animation.',
    },
    {
      id: 'transitions-q5',
      type: 'mcq',
      prompt: 'What does `mode="out-in"` do when the child is swapped?',
      options: [
        { text: 'The new element enters, then the old one leaves', why: 'That is `in-out`.' },
        { text: 'The old element finishes leaving before the new one is inserted and enters' },
        { text: 'Both animate at the same time', why: 'That is the default (no mode).' },
        { text: 'It disables the leave animation', why: 'Both animations still run — just one after the other.' },
      ],
      answer: 1,
      explanation: '`out-in` sequences the swap: leave first, then enter. That keeps only one element in the layout at a time.',
    },
    {
      id: 'transitions-q6',
      type: 'mcq',
      prompt: 'Which statements about `<TransitionGroup>` are true? **Select all that apply.**',
      options: [
        { text: 'Every child must have a unique `key`.' },
        { text: 'It supports `mode="out-in"`.', why: 'Modes don\'t apply — list items aren\'t alternating, mutually exclusive elements.' },
        { text: 'It renders no wrapper element unless you set `tag`.' },
        { text: 'Transition classes are applied to each item, not to the container.' },
        { text: 'Reordered items receive a `*-move` class.' },
      ],
      answer: [0, 2, 3, 4],
      explanation: 'TransitionGroup animates individual keyed items, can render a wrapper via `tag`, has no modes, and animates reorders with the move class (FLIP).',
    },
    {
      id: 'transitions-q7',
      type: 'short',
      prompt: 'Why must you call `done` in an `@enter` or `@leave` hook when using `:css="false"`?',
      answer: 'With :css="false" Vue doesn\'t look at CSS durations or transitionend events at all, so the only signal that the animation is finished is your call to done. Without it, an entering element is never marked as entered (after-enter never fires) and a leaving element is never removed from the DOM.',
    },
  ],

  exercises: [
    {
      id: 'wizard-out-in',
      title: 'A sliding sign-up wizard',
      difficulty: 'intermediate',
      prompt: `
The wizard already navigates between three steps, but steps snap from one to the next. Animate it:

- Wrap the step in \`<Transition name="slide" mode="out-in">\`.
- The step element is \`<section class="step">\`. Give it \`:key="step"\` so each step is a new element.
- Add CSS for the \`slide\` classes (for example: slide in from the right, slide out to the left, ≤ 0.25 s).

The **Next** (\`.next\`) and **Back** (\`.back\`) buttons and the \`.step-title\` heading already exist.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const steps = ['Account', 'Profile', 'Done']
const step = ref(0)
</script>

<template>
  <section class="step">
    <h3 class="step-title">{{ steps[step] }}</h3>
    <p>Step {{ step + 1 }} of {{ steps.length }}</p>
  </section>

  <button class="back" :disabled="step === 0" @click="step--">Back</button>
  <button class="next" :disabled="step === steps.length - 1" @click="step++">Next</button>
</template>`,
      },
      hints: [
        'A `<Transition>` only reacts when its child is inserted or removed. The step section is always there — so give it `:key="step"`, making each step a different element.',
        'Wrap it: `<Transition name="slide" mode="out-in"><section :key="step" class="step">…</section></Transition>`.',
        'CSS: `.slide-enter-active, .slide-leave-active { transition: all 0.25s ease; }`, `.slide-enter-from { opacity: 0; transform: translateX(30px); }`, `.slide-leave-to { opacity: 0; transform: translateX(-30px); }`.',
      ],
      solution: {
        explanation: 'The key turns "same section, new text" into "old section leaves, new section enters", which is what Transition animates. `out-in` keeps a single step in the layout at any moment, so the buttons never jump. Different `enter-from` and `leave-to` transforms give the sense of moving forward.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const steps = ['Account', 'Profile', 'Done']
const step = ref(0)
</script>

<template>
  <Transition name="slide" mode="out-in">
    <section :key="step" class="step">
      <h3 class="step-title">{{ steps[step] }}</h3>
      <p>Step {{ step + 1 }} of {{ steps.length }}</p>
    </section>
  </Transition>

  <button class="back" :disabled="step === 0" @click="step--">Back</button>
  <button class="next" :disabled="step === steps.length - 1" @click="step++">Next</button>
</template>

<style>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>`,
        },
      },
      tests: [
        { name: 'starts on Account', code: `expect(text('.step-title')).toBe('Account')` },
        {
          name: 'the old step leaves with slide-* classes',
          code: `await click('.next')
expect(classes('.step')).toContain('slide-leave-active')`,
        },
        {
          name: 'out-in: only one step exists during the switch',
          code: `await click('.next')
expect(findAll('.step')).toHaveLength(1)
expect(text('.step-title')).toBe('Account')
await wait(700)
expect(findAll('.step')).toHaveLength(1)
expect(text('.step-title')).toBe('Profile')`,
        },
        {
          name: 'Back returns to the previous step',
          code: `await click('.next')
await wait(700)
await click('.back')
await wait(700)
expect(text('.step-title')).toBe('Account')`,
        },
      ],
    },
    {
      id: 'animated-todos',
      title: 'An animated todo list',
      difficulty: 'intermediate',
      prompt: `
Turn the plain list into an animated one and finish its features.

- Replace the \`<ul class="todo-list">\` with a \`<TransitionGroup name="list" tag="ul" class="todo-list">\`; each item is \`<li class="todo">\` keyed by its \`id\`.
- **Add** already works (it puts the new todo at the top).
- Each todo has a \`<button class="remove">\` that removes **that** todo.
- \`<button class="sort">\` sorts the todos alphabetically by text.
- Add CSS for \`list-enter-*\`, \`list-leave-*\` and \`list-move\` (≤ 0.25 s), with \`position: absolute\` on leaving items.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const todos = ref([
  { id: 1, text: 'Water the plants' },
  { id: 2, text: 'Call grandma' },
  { id: 3, text: 'Buy oat milk' },
])
const draft = ref('')
let nextId = 4

function add() {
  const text = draft.value.trim()
  if (!text) return
  todos.value.unshift({ id: nextId++, text })
  draft.value = ''
}

// TODO: remove(id) and sortByText()
</script>

<template>
  <form @submit.prevent="add">
    <input v-model="draft" class="new-todo" placeholder="New todo" />
    <button class="add">Add</button>
  </form>
  <button class="sort">Sort A–Z</button>

  <ul class="todo-list">
    <li v-for="todo in todos" :key="todo.id" class="todo">
      {{ todo.text }}
      <button class="remove">✕</button>
    </li>
  </ul>
</template>`,
      },
      hints: [
        '`remove(id)`: `todos.value = todos.value.filter((t) => t.id !== id)`. Sorting: `todos.value = [...todos.value].sort((a, b) => a.text.localeCompare(b.text))`.',
        'Swap `<ul class="todo-list">…</ul>` for `<TransitionGroup name="list" tag="ul" class="todo-list">…</TransitionGroup>` — the `v-for` and keys stay the same.',
        'CSS: `.list-move, .list-enter-active, .list-leave-active { transition: all 0.25s ease; }`, `.list-enter-from, .list-leave-to { opacity: 0; transform: translateX(30px); }`, `.list-leave-active { position: absolute; }`.',
      ],
      solution: {
        explanation: '`tag="ul"` keeps valid list markup, and the `id` keys let Vue track exactly which item entered, left or moved. When an item leaves, `position: absolute` takes it out of the flow so the others can glide up (via `list-move`) while it fades away.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const todos = ref([
  { id: 1, text: 'Water the plants' },
  { id: 2, text: 'Call grandma' },
  { id: 3, text: 'Buy oat milk' },
])
const draft = ref('')
let nextId = 4

function add() {
  const text = draft.value.trim()
  if (!text) return
  todos.value.unshift({ id: nextId++, text })
  draft.value = ''
}

function remove(id) {
  todos.value = todos.value.filter((t) => t.id !== id)
}

function sortByText() {
  todos.value = [...todos.value].sort((a, b) => a.text.localeCompare(b.text))
}
</script>

<template>
  <form @submit.prevent="add">
    <input v-model="draft" class="new-todo" placeholder="New todo" />
    <button class="add">Add</button>
  </form>
  <button class="sort" @click="sortByText">Sort A–Z</button>

  <TransitionGroup name="list" tag="ul" class="todo-list">
    <li v-for="todo in todos" :key="todo.id" class="todo">
      {{ todo.text }}
      <button class="remove" @click="remove(todo.id)">✕</button>
    </li>
  </TransitionGroup>
</template>

<style>
.list-move,
.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}
.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
.list-leave-active {
  position: absolute;
}
</style>`,
        },
      },
      tests: [
        { name: 'renders the list as ul.todo-list', code: `expect(exists('ul.todo-list')).toBe(true); expect(findAll('.todo')).toHaveLength(3)` },
        {
          name: 'a new todo enters at the top with list-* classes',
          code: `await type('.new-todo', 'Fix the bike')
await submit('form')
const first = findAll('.todo')[0]
expect(first.textContent).toContain('Fix the bike')
expect(first.classList.contains('list-enter-active')).toBe(true)`,
        },
        {
          name: 'remove animates out the right item, then deletes it',
          code: `const target = findAll('.todo')[1]
expect(target.textContent).toContain('Call grandma')
await click(target.querySelector('.remove'))
expect(target.classList.contains('list-leave-active')).toBe(true)
await wait(700)
expect(findAll('.todo')).toHaveLength(2)
expect(text('.todo-list')).not.toContain('Call grandma')`,
        },
        {
          name: 'sort orders the todos alphabetically',
          code: `await click('.sort')
await wait(700)
expect(findAll('.todo').map((li) => li.textContent.replace('✕', '').trim())).toEqual(['Buy oat milk', 'Call grandma', 'Water the plants'])`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'transitions-class-lifecycle',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Walk me through what `<Transition name="fade">` does when its child is toggled with `v-if`.',
      answer: 'On enter, Vue inserts the element with `fade-enter-from` and `fade-enter-active`, swaps `enter-from` for `enter-to` on the next frame so the browser animates, and removes the classes when the transition ends. On leave, it keeps the element, adds `fade-leave-from` and `fade-leave-active`, swaps to `fade-leave-to` on the next frame, and removes the element only when the transition ends. You write CSS for those classes; Vue handles timing, waiting and cancellation.',
      explanation: 'The `-active` classes carry the transition definition; `-from`/`-to` are the start and end states.',
      whyAsked: 'Checks that you understand the mechanism rather than copy-pasting CSS — essential for debugging "why doesn\'t it animate?".',
      mistakes: ['Thinking Vue animates with JavaScript by default.', 'Putting the `transition` property in `enter-from` instead of `enter-active`.', 'Not knowing that the element is kept until the leave ends.'],
      followUps: ['What triggers a transition besides `v-if`?', 'How does Vue know when the CSS transition is over?'],
      modelAnswer: 'Transition doesn\'t animate anything itself — it times CSS classes. When the element enters, it\'s inserted with `fade-enter-from`, the start state, and `fade-enter-active`, which holds the `transition` rule. A frame later Vue swaps `enter-from` for `enter-to`, so the browser animates, and when it detects the end it removes the classes. Leaving is the mirror image, except Vue keeps the element in the DOM until the leave finishes and only then removes it. It also cancels cleanly if the user toggles mid-way.',
    },
    {
      id: 'transitions-swap-jump',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Tabs are wrapped in `<Transition name="fade">`. When switching tabs, the page briefly shows both tabs\' contents stacked and everything below jumps. What is happening and what are your options?',
      options: [
        'Add `mode="out-in"` so the old tab leaves before the new one enters',
        'Switch to `<TransitionGroup>`',
        'Add `appear` to the Transition',
        'Remove the `key` from the component',
      ],
      correctOption: 0,
      answer: 'Without a mode, leave and enter run simultaneously, so both elements are in the layout at once. Add `mode="out-in"` to sequence them, or keep the default mode but stack the elements in the same spot (for example both in one CSS grid cell, or the leaving one absolutely positioned) for a cross-fade.',
      explanation: 'Simultaneous enter/leave is fine for overlapping elements, but in normal flow two elements take up two spaces.',
      whyAsked: 'A very common real-world issue; tests knowledge of modes and layout during transitions.',
      mistakes: ['Reaching for TransitionGroup, which has no modes.', 'Adding timeouts to delay rendering the new tab.', 'Not knowing `in-out` exists or what it does.'],
      followUps: ['When would you prefer a cross-fade over `out-in`?', 'How does this interact with `<KeepAlive>`?'],
      modelAnswer: 'By default Transition runs the leave and the enter at the same time, so for a moment both tabs are in normal flow and the content below jumps. The quick fix is `mode="out-in"`: the old tab fully leaves, then the new one enters, so only one occupies space. If I want a true cross-fade instead, I keep simultaneous mode and stack them in the same grid cell or absolutely position the leaving one. If the tabs are cached, the order is Transition outside, KeepAlive inside.',
    },
    {
      id: 'transitions-index-keys',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'In an animated list (`<TransitionGroup>`), deleting the first notification makes the **last** one fade out, while the others just change text. What\'s the bug?',
      code: {
        lang: 'vue',
        code: `<TransitionGroup name="list" tag="ul">
  <li v-for="(n, i) in notifications" :key="i">{{ n.message }}</li>
</TransitionGroup>`,
      },
      answer: 'The items are keyed by index. After deleting item 0, the remaining items get keys 0..n-2, so from Vue\'s point of view the key that disappeared is the last one: it animates the last `<li>` out and patches the text of the rest. Key by a stable identity such as `n.id`.',
      explanation: 'Keys tell Vue which DOM element belongs to which data item. Index keys describe position, not identity — and transitions make that mistake visible.',
      whyAsked: 'It connects list keys (a fundamentals topic) to a visible bug, testing real understanding of the diff.',
      mistakes: ['Blaming the CSS.', 'Generating random keys on every render (everything re-enters).', 'Saying "keys are only for performance".'],
      followUps: ['What happens if keys are `Math.random()`?', 'What if the data has no id at all?'],
      modelAnswer: 'The `key` is the index, so keys describe positions. Delete the first notification and the remaining items shift down to keys 0, 1, …, which means the key that vanished is the highest one. Vue therefore animates the last `<li>` out and just updates the text in the others. The fix is to key by identity, like `n.id`; if the data has none, I\'d assign an id when the item is created — not a random key on every render, which would make everything re-enter.',
    },
    {
      id: 'transitions-js-hooks',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use Transition\'s JavaScript hooks instead of CSS classes, and what changes when you set `:css="false"`?',
      answer: 'Use hooks when the animation needs logic CSS can\'t express: measuring `scrollHeight` for an auto-height expand, staggering by index, sequencing, spring physics, or driving GSAP/Web Animations. Hooks run alongside CSS by default. With `:css="false"`, Vue skips CSS detection and class application, and relies entirely on you calling `done` in `@enter`/`@leave`; it also avoids CSS rules accidentally interfering.',
      explanation: 'CSS is declarative and cheap; hooks are imperative and flexible. `:css="false"` makes the JavaScript the single source of truth for timing.',
      whyAsked: 'Shows whether you can pick the right level of tooling and know the `done` contract.',
      mistakes: ['Using JS hooks for a simple fade.', 'Forgetting `done`, leaving elements stuck.', 'Not knowing `@after-enter` exists for follow-up work like focus.'],
      followUps: ['How would you animate to `height: auto`?', 'How would you stagger a list with hooks?'],
      modelAnswer: 'I default to CSS classes — fades, slides and scales are declarative and cheap. I reach for the hooks when I need logic: measuring an element to animate its height, staggering list items by index, or handing the element to GSAP. Setting `:css="false"` tells Vue not to look for CSS durations at all, so my `enter` and `leave` hooks must call `done` when they finish — otherwise the element never finishes entering or never gets removed. I also use `after-enter` for things like moving focus.',
    },
    {
      id: 'transitions-motion-guidelines',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'You\'re asked to "add animations everywhere" in a large dashboard. What guidelines and building blocks would you put in place?',
      answer: 'Purpose first: animate changes that need explaining (things appearing, swapping, moving), not everything. Provide a few reusable transition components (`FadeTransition`, `SlideTransition`, `ListTransition`) with shared duration/easing tokens. Animate only `transform`/`opacity`; use JS-measured or grid-based techniques for height. Honour `prefers-reduced-motion` globally. Never block input or delay content; keep durations short. Avoid move animations on very large lists. Use `@after-enter` for focus management. Test final states and stub transitions in unit tests.',
      explanation: 'Motion is a design-system concern: consistent, accessible, cheap, and owned centrally rather than reinvented per component.',
      whyAsked: 'Senior candidates are expected to think about consistency, performance and accessibility, not just the API.',
      mistakes: ['Ignoring reduced-motion preferences.', 'Animating layout properties everywhere.', 'Copy-pasting per-component CSS with different timings.', 'Using TransitionGroup on huge tables.'],
      followUps: ['How would you implement reduced motion globally?', 'How do you keep animations from slowing down tests?'],
      modelAnswer: 'I\'d start from purpose: animate what helps users follow a change — panels opening, content swapping, items moving — and skip decorative motion. Then I\'d create a handful of reusable transition components with shared duration and easing tokens, so the whole app moves consistently. Animations stick to `transform` and `opacity`, with a grid or measured technique for height. A global `prefers-reduced-motion` rule turns transitions off for people who need that. I\'d avoid move animations on very large lists, use `after-enter` for focus, and stub transitions in unit tests while asserting final states.',
    },
    {
      id: 'transitions-not-animating',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate wrapped a component in `<Transition name="fade">` with correct CSS, but it still pops in and out. Name the likely causes you would check.',
      answer: 'Check that the trigger inserts/removes something (`v-if`, `v-show`, a dynamic component or a key change) rather than just changing props or classes; that the child component renders a **single root element** (multi-root children can\'t be animated); that the CSS prefix matches `name` and the duration is in the `*-active` class; that styles aren\'t overridden (e.g. `transition: none`, reduced-motion rules); and that the Transition wraps the element directly rather than living inside the toggled element.',
      explanation: 'Most "it doesn\'t animate" bugs are one of: no enter/leave happening, wrong child shape, or CSS not matching.',
      whyAsked: 'A practical debugging question — it reveals a mental checklist.',
      mistakes: ['Only checking the CSS.', 'Putting `v-if` on the `<Transition>` itself.', 'Not inspecting the element\'s classes in devtools.'],
      followUps: ['How would you confirm in devtools that Vue is applying the classes?'],
      modelAnswer: 'First I\'d confirm something is actually entering or leaving — a `v-if`, `v-show`, dynamic component or key change, not just a prop update. Then the child: a component with multiple root nodes can\'t be animated, so it needs a single root. Then the CSS: does the prefix match `name`, and is the `transition` in the `-active` class? Finally I\'d inspect the element while toggling to see whether the `fade-enter-active` class appears, and look for overriding rules like `transition: none`.',
    },
    {
      id: 'transitions-coding-stagger',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 10,
      question: 'Search results should appear with a **staggered** fade using TransitionGroup JavaScript hooks: each `<li class="result">` has `:data-index="i"`; `@before-enter` sets `el.style.opacity = \'0\'`; `@enter` waits `index × 60 ms`, then sets `el.style.opacity = \'1\'` and calls `done`. Use `:css="false"` and `tag="ul"` with `class="results"`.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const fruits = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry']
const query = ref('')
const results = computed(() =>
  fruits.filter((f) => f.toLowerCase().startsWith(query.value.toLowerCase()))
)
</script>

<template>
  <input v-model="query" class="q" placeholder="Search fruit…" />
  <ul class="results">
    <li v-for="(fruit, i) in results" :key="fruit" class="result">{{ fruit }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        {
          name: 'renders ul.results with data-index on each item',
          code: `expect(exists('ul.results')).toBe(true)
expect(findAll('.result').map((li) => li.getAttribute('data-index'))).toEqual(['0', '1', '2', '3', '4', '5'])`,
        },
        {
          name: 'items entering after a search end fully visible',
          code: `await type('.q', 'a')
await type('.q', 'b')
await wait(500)
const items = findAll('.result')
expect(items).toHaveLength(2)
expect(items.every((li) => li.style.opacity === '1')).toBe(true)`,
        },
        {
          name: 'before-enter hides new items at first',
          code: `await type('.q', 'zz')
await type('.q', 'c')
const li = find('.result')
expect(li.textContent).toBe('Cherry')
expect(['0', '1']).toContain(li.style.opacity)
await wait(300)
expect(li.style.opacity).toBe('1')`,
        },
      ],
      hints: [
        'Replace the `<ul>` with `<TransitionGroup tag="ul" class="results" :css="false" @before-enter="onBeforeEnter" @enter="onEnter">`.',
        'Add `:data-index="i"` to each `<li>` and read it in the hook with `Number(el.dataset.index)`.',
        '`function onEnter(el, done) { setTimeout(() => { el.style.opacity = \'1\'; done() }, Number(el.dataset.index) * 60) }`.',
      ],
      answer: 'Use TransitionGroup with `:css="false"`, hide items in `before-enter`, and in `enter` reveal each one after a delay derived from its `data-index`, then call `done`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const fruits = ['Apple', 'Apricot', 'Avocado', 'Banana', 'Blueberry', 'Cherry']
const query = ref('')
const results = computed(() =>
  fruits.filter((f) => f.toLowerCase().startsWith(query.value.toLowerCase()))
)

function onBeforeEnter(el) {
  el.style.opacity = '0'
}

function onEnter(el, done) {
  const delay = Number(el.dataset.index) * 60
  setTimeout(() => {
    el.style.opacity = '1'
    done()
  }, delay)
}
</script>

<template>
  <input v-model="query" class="q" placeholder="Search fruit…" />
  <TransitionGroup
    tag="ul"
    class="results"
    :css="false"
    @before-enter="onBeforeEnter"
    @enter="onEnter"
  >
    <li
      v-for="(fruit, i) in results"
      :key="fruit"
      :data-index="i"
      class="result"
      style="transition: opacity 0.2s"
    >
      {{ fruit }}
    </li>
  </TransitionGroup>
</template>`,
        },
      },
      explanation: 'The hooks receive the real element, so the delay can come from `data-index`. Because `:css="false"` is set, calling `done` is what tells Vue each item has finished entering. (A real implementation might use the Web Animations API or GSAP inside the same hook.)',
      whyAsked: 'Tests JS hooks, the `done` contract and TransitionGroup together, in a pattern that is common in polished UIs.',
      mistakes: ['Forgetting `done`.', 'Computing the delay from a closure variable that is stale by the time the hook runs.', 'Animating with `setInterval` and never cleaning up.'],
      followUps: ['How would you also stagger the leave?', 'How would you skip the stagger for users who prefer reduced motion?'],
      modelAnswer: 'I swap the list for a TransitionGroup with `tag="ul"` and `:css="false"`, since JavaScript controls the timing. Each item gets `data-index`. In `before-enter` I set opacity to 0; in `enter` I read the index, wait index × 60 ms, set opacity to 1 and call `done`, which tells Vue that item finished entering. For reduced motion I\'d check `matchMedia(\'(prefers-reduced-motion: reduce)\')` and use zero delay.',
    },
  ],

  takeaways: [
    '`<Transition>` animates one element or component entering and leaving: `v-if`, `v-show`, dynamic components and `key` changes.',
    'Vue times six classes (`*-enter-from/active/to`, `*-leave-from/active/to`); you write the CSS. Put the `transition` in the `-active` classes.',
    'Leaving elements stay in the DOM until their transition ends; `mode="out-in"` sequences swaps so only one element occupies the layout.',
    'JavaScript hooks (with `done`, and `:css="false"` when JS owns timing) handle animations CSS can\'t express.',
    '`<TransitionGroup>` animates keyed list items — enter, leave and move (FLIP) — with `position: absolute` on leaving items.',
    'Animate `transform`/`opacity`, keep motion short and purposeful, and respect `prefers-reduced-motion`.',
  ],
}
