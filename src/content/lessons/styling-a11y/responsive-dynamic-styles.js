// Lesson: Responsive design & dynamic styling.

const useMediaQueryJs = `import { ref, onScopeDispose } from 'vue'

// A reactive wrapper around window.matchMedia().
// Simplified: production versions also accept refs/getters as the query
// and read the value only after mount when the app is server-rendered.
export function useMediaQuery(query) {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches // no support: treat as "doesn't match"
  }

  const mql = window.matchMedia(query)
  matches.value = mql.matches

  const onChange = (event) => {
    matches.value = event.matches
  }
  mql.addEventListener('change', onChange)
  onScopeDispose(() => mql.removeEventListener('change', onChange))

  return matches
}`

const appVue = `<script setup>
import { ref } from 'vue'
import TaskCard from './components/TaskCard.vue'
import { useMediaQuery } from './composables/useMediaQuery.js'

const isWide = useMediaQuery('(min-width: 700px)')

const tasks = ref([
  { id: 1, title: 'Fix login redirect', priority: 'high', done: false, notes: 'Users land on /home instead of the page they asked for.' },
  { id: 2, title: 'Write release notes', priority: 'low', done: true, notes: 'Summarise the three new features.' },
  { id: 3, title: 'Server is down in EU region', priority: 'urgent', done: false, notes: 'Health checks failing since 09:40.' },
  { id: 4, title: 'Review design tokens PR', priority: 'medium', done: false, notes: 'Check colour contrast of the new greys.' },
])
</script>

<template>
  <header class="board-header">
    <h1 class="board-title">Sprint board</h1>
    <p class="layout-label">{{ isWide ? 'Wide layout' : 'Phone layout' }}</p>
  </header>

  <ul class="board">
    <li v-for="task in tasks" :key="task.id" class="board-item">
      <TaskCard :task="task" @toggle="task.done = !task.done" />
    </li>
  </ul>
</template>

<style scoped>
.board-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
}

/* Fluid type: grows with the viewport, but never below 1.4rem or above 2.2rem */
.board-title {
  font-size: clamp(1.4rem, 1rem + 2vw, 2.2rem);
}

/* Mobile first: one column by default... */
.board {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 12px;
}

/* ...two columns once the viewport has room */
@media (min-width: 700px) {
  .board {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Each list item is a size container its card can query */
.board-item {
  container-type: inline-size;
}
</style>`

const taskCardVue = `<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  task: { type: Object, required: true },
})
defineEmits(['toggle'])

// Variant map: priority -> modifier class (unknown values fall back to medium)
const priorityClass = {
  low: 'task--low',
  medium: 'task--medium',
  high: 'task--high',
}

const cardClasses = computed(() => [
  'task',
  priorityClass[props.task.priority] ?? 'task--medium',
  { 'is-done': props.task.done },
])

const showNotes = ref(false)
</script>

<template>
  <article :class="cardClasses" :data-task="task.id">
    <label class="task-main">
      <input type="checkbox" class="task-check" :checked="task.done" @change="$emit('toggle')" />
      <span class="task-title">{{ task.title }}</span>
    </label>
    <span class="task-priority">{{ task.priority }}</span>
    <button class="toggle-notes" :aria-expanded="showNotes" @click="showNotes = !showNotes">
      {{ showNotes ? 'Hide notes' : 'Notes' }}
    </button>
    <p v-if="showNotes" class="notes">{{ task.notes }}</p>
  </article>
</template>

<style scoped>
.task {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 2px solid #1a1a1a;
  border-left-width: 8px;
  border-radius: 8px;
  background: white;
  transition: opacity 0.2s ease, border-color 0.2s ease;
}

/* In a roomy container: title, priority and button share one row */
@container (min-width: 360px) {
  .task {
    grid-template-columns: 1fr auto auto;
    align-items: center;
  }
  .notes {
    grid-column: 1 / -1;
  }
}

.task--low { border-left-color: #16a34a; }
.task--medium { border-left-color: #f59e0b; }
.task--high { border-left-color: #dc2626; }

.is-done { opacity: 0.55; }
.is-done .task-title { text-decoration: line-through; }

.task-priority {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.notes {
  margin: 0;
  color: #444;
}
</style>`

const CSS = `const css = [...document.querySelectorAll('style[data-sandbox-module]')].map((s) => s.textContent).join('\\n')`

const strengthStarter = `<script setup>
import { ref } from 'vue'

const password = ref('')
// TODO: score, meter classes, --strength and label
</script>

<template>
  <label>
    New password
    <input v-model="password" type="password" class="password" />
  </label>

  <div class="meter">
    <div class="meter-fill"></div>
  </div>
  <p class="meter-label">Enter a password</p>
</template>

<style scoped>
.meter { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.meter-fill { height: 100%; width: 0; background: #999; }
</style>`

const strengthSolution = `<script setup>
import { computed, ref } from 'vue'

const password = ref('')

const score = computed(() => {
  const p = password.value
  return [p.length >= 8, /\\d/.test(p), /[A-Z]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length
})

const level = computed(() => {
  if (!password.value) return 'empty'
  if (score.value <= 1) return 'weak'
  if (score.value <= 3) return 'fair'
  return 'strong'
})

const labels = { empty: 'Enter a password', weak: 'Weak', fair: 'Fair', strong: 'Strong' }

const meterClasses = computed(() => ['meter', 'meter--' + level.value])
const meterStyle = computed(() => ({ '--strength': score.value * 25 + '%' }))
</script>

<template>
  <label>
    New password
    <input v-model="password" type="password" class="password" />
  </label>

  <div :class="meterClasses" :style="meterStyle">
    <div class="meter-fill"></div>
  </div>
  <p class="meter-label" aria-live="polite">{{ labels[level] }}</p>
</template>

<style scoped>
.meter { height: 8px; background: #eee; border-radius: 4px; overflow: hidden; }
.meter-fill {
  height: 100%;
  width: var(--strength, 0%);
  background: var(--meter-color, #999);
  transition: width 0.2s ease;
}
.meter--weak { --meter-color: #dc2626; }
.meter--fair { --meter-color: #f59e0b; }
.meter--strong { --meter-color: #16a34a; }

@media (prefers-reduced-motion: reduce) {
  .meter-fill { transition: none; }
}
</style>`

const mqApp = `<script setup>
import { ref } from 'vue'
import LayoutBadge from './LayoutBadge.vue'

const showBadge = ref(false)
</script>

<template>
  <button class="toggle-badge" @click="showBadge = !showBadge">Toggle badge</button>
  <LayoutBadge v-if="showBadge" />
</template>`

const mqBadge = `<script setup>
import { useMediaQuery } from './useMediaQuery.js'

const isWide = useMediaQuery('(min-width: 700px)')
</script>

<template>
  <p class="badge">{{ isWide ? 'Wide' : 'Narrow' }}</p>
</template>`

const priceTagStarter = `<script setup>
defineProps({
  amount: { type: Number, required: true },
  change: { type: Number, default: 0 },
  size: { type: String, default: 'md' },
})
</script>

<template>
  <span class="price-tag" data-test="tag">
    {{ amount.toFixed(2) }}
    <small class="change">{{ change }}%</small>
  </span>
</template>`

export default {
  id: 'responsive-dynamic-styles',
  title: 'Responsive design & dynamic styling',
  summary: 'Build layouts that adapt to any screen or container with modern CSS, and let Vue switch classes, custom properties and transitions as your state changes.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['class-style-bindings', 'styling-in-vue'],
  related: ['transitions', 'composables-intro', 'composable-recipes', 'accessibility-fundamentals', 'design-systems'],
  tags: ['responsive design', 'media queries', 'container queries', 'clamp', 'mobile first', 'matchMedia', 'useMediaQuery', 'class binding', 'style binding', 'css transitions', 'Transition classes', 'prefers-reduced-motion'],
  apis: [
    { name: '@media (min-width: …)', summary: 'CSS media query: apply rules when the viewport matches a condition.' },
    { name: '@container (min-width: …)', summary: 'CSS container query: apply rules based on the size of the nearest ancestor size container.' },
    { name: 'clamp(min, preferred, max)', summary: 'A CSS value that scales with the preferred expression but stays within bounds.' },
    { name: 'window.matchMedia()', summary: 'Browser API that evaluates a media query in JavaScript and fires change events.' },
    { name: ':class / :style', summary: 'Vue bindings that accept strings, arrays and objects and merge them with static attributes.' },
    { name: '<Transition name="x">', summary: 'Adds x-enter-from / x-enter-active / x-enter-to (and leave) classes while an element enters or leaves.' },
  ],
  docs: [
    { label: 'Vue Guide — Class and Style Bindings', url: 'https://vuejs.org/guide/essentials/class-and-style.html' },
    { label: 'Vue Guide — Transition', url: 'https://vuejs.org/guide/built-ins/transition.html' },
    { label: 'MDN — Using media queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries' },
    { label: 'MDN — Container queries', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries' },
    { label: 'MDN — Window.matchMedia()', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia' },
    { label: 'MDN — prefers-reduced-motion', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion' },
  ],

  intro: `
Two kinds of change happen to every interface:

- **The space changes.** The same page is opened on a phone, a laptop and a giant monitor — and the same component might sit in a narrow sidebar or a wide main column. *Responsive design* means the layout adapts.
- **The state changes.** A task gets marked done, a password gets stronger, a panel opens. *Dynamic styling* means the look follows the data.

The golden rule of this lesson: **CSS handles space, Vue handles state.** Media queries, container queries and \`clamp()\` let the browser adapt layouts on its own. Vue's \`:class\` and \`:style\` bindings — and \`<Transition>\` — connect your reactive state to that CSS.
`,

  why: `
Without responsive CSS you get one of two bad pages: a desktop layout squeezed onto a phone (tiny text, sideways scrolling) or a phone layout stretched across a monitor (one lonely column of giant buttons).

Without Vue's bindings, dynamic styling turns into manual DOM work that's easy to get wrong:

\`\`\`js
// Plain JavaScript: you must remember every class, every time
checkbox.addEventListener('change', () => {
  card.classList.toggle('is-done', checkbox.checked)
  card.classList.remove('task--low', 'task--medium', 'task--high')
  card.classList.add('task--' + task.priority)
})
\`\`\`

Forget one \`remove\` and the card is "low" *and* "high" at the same time. With Vue you **describe** which classes should be on the element for the current state, and Vue makes the DOM match — every render, automatically.
`,

  eli15: `
Think of water. Pour it into a glass and it's glass-shaped; pour it into a bowl and it's bowl-shaped. Responsive design is making your page behave like water: it takes the shape of whatever screen (or box) it's poured into.

You tell the browser rules like "**if** there's at least 700 pixels of room, use two columns". That's a *media query*. A *container query* is the same idea but asks "how big is **my box**?" instead of "how big is the whole screen?" — handy for a card that might be in a skinny sidebar or a wide page.

Dynamic styling is like a mood ring. The ring's colour follows your mood; your element's classes follow your data. You don't paint the ring — you just write \`:class="{ 'is-done': task.done }"\` and Vue keeps the class in sync whenever \`task.done\` changes.

And transitions are the difference between a light switch and a dimmer: instead of a panel *popping* into view, it fades or slides in.
`,

  analogy: {
    title: 'A theatre production',
    body: `
A touring theatre show plays in huge halls and tiny clubs. The **set** is designed to fold and rearrange depending on the stage — that's responsive layout. Some pieces adapt to the whole venue (media queries); others adapt to the corner of the stage they stand in (container queries).

During the show, **lighting cues** change with the script: "when the villain enters, red light". The lighting desk doesn't care how the lamps work — it just switches cues. That's \`:class\` following state.

And the lighting operator uses **faders**, not just on/off switches, so changes feel smooth — that's CSS transitions and \`<Transition>\`. For audience members sensitive to flashing and motion, the crew can switch to calm cues — \`prefers-reduced-motion\`.
`,
    mapping: [
      ['the venue size', 'the viewport (media queries)'],
      ['the corner of the stage a prop stands in', 'the container (container queries)'],
      ['lighting cues in the script', 'state-driven `:class` / `:style`'],
      ['faders', 'CSS transitions and Vue `<Transition>` classes'],
      ['calm cues for sensitive viewers', '`@media (prefers-reduced-motion: reduce)`'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'class' },
    title: 'Class bindings, live',
    caption: 'Toggle the inputs and inspect the real `class` attribute Vue produces. Static classes and bound classes merge into one attribute.',
    alt: 'An interactive lab: toggling state values changes a :class binding, and the panel shows the resulting class attribute on the real DOM element.',
  },

  syntax: [
    `
#### 1. Mobile-first media queries
Write the **small-screen** layout as the default, then *add* rules as space grows with \`min-width\`. Each breakpoint only describes what changes.
`,
    {
      code: `.board { display: grid; gap: 12px; }          /* phones: one column */

@media (min-width: 700px) {                     /* more room: two columns */
  .board { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1100px) {                    /* lots of room: three */
  .board { grid-template-columns: repeat(3, 1fr); }
}`,
      lang: 'css',
      title: 'mobile first',
    },
    `
#### 2. Container queries
A component often cares about **its own box**, not the screen. Mark an ancestor as a size container, then query it. The rules apply to elements *inside* the container.
`,
    {
      code: `.board-item { container-type: inline-size; }   /* the container */

@container (min-width: 360px) {                  /* styles its descendants */
  .task { grid-template-columns: 1fr auto auto; }
}`,
      lang: 'css',
      title: 'container queries',
    },
    `
#### 3. Fluid values
\`clamp(min, preferred, max)\` lets a size grow smoothly with the viewport but stay within limits — often fewer breakpoints needed.
`,
    { code: `.board-title { font-size: clamp(1.4rem, 1rem + 2vw, 2.2rem); }`, lang: 'css' },
    `
#### 4. Dynamic classes and styles at scale
\`:class\` accepts a string, an **object** (\`{ class: condition }\`) or an **array** mixing both. Static \`class\` and bound \`:class\` merge. When the logic grows, move it into a \`computed\` and use a **variant map** instead of nested ternaries.
`,
    {
      code: `<script setup>
import { computed } from 'vue'
const props = defineProps({ task: Object })

const priorityClass = { low: 'task--low', medium: 'task--medium', high: 'task--high' }

const cardClasses = computed(() => [
  'task',
  priorityClass[props.task.priority] ?? 'task--medium',   // variant map + fallback
  { 'is-done': props.task.done },                         // conditional class
])
</script>

<template>
  <article :class="cardClasses" :style="{ '--accent': task.color }">…</article>
</template>`,
      lang: 'vue',
      title: 'computed classes + a custom property',
    },
    `
\`:style\` takes an object with camelCase or quoted kebab-case keys (\`{ fontSize: '14px' }\`, \`{ 'font-size': '14px' }\`), custom properties (\`{ '--accent': color }\`), or an array of objects merged left to right.

#### 5. When JavaScript needs to know: \`matchMedia\`
CSS can't decide *which component to render*. When you need that, wrap \`window.matchMedia()\` in a composable that listens for \`change\` and cleans up.
`,
    { code: useMediaQueryJs, lang: 'js', title: 'composables/useMediaQuery.js' },
    `
#### 6. Transitions
Changing a class can animate with a plain CSS \`transition\`. For elements that **enter or leave** (\`v-if\`, \`v-show\`), wrap them in \`<Transition name="slide">\` and Vue adds classes at the right moments:

- **Entering:** \`slide-enter-from\` (start state, first frame) → \`slide-enter-active\` (the whole enter phase — put \`transition\` here) → \`slide-enter-to\` (end state).
- **Leaving:** \`slide-leave-from\` (start state, first frame) → \`slide-leave-active\` (the whole leave phase) → \`slide-leave-to\` (end state).

Without a \`name\`, the prefix is \`v-\` (\`v-enter-from\`…). Deep dive: [Transition & TransitionGroup](lesson:transitions).
`,
    {
      code: `.slide-enter-active, .slide-leave-active { transition: opacity 0.2s, transform 0.2s; }
.slide-enter-from, .slide-leave-to { opacity: 0; transform: translateY(-4px); }

@media (prefers-reduced-motion: reduce) {
  .slide-enter-active, .slide-leave-active { transition: none; }
}`,
      lang: 'css',
      title: 'transition classes + reduced motion',
    },
    {
      callout: 'version',
      text: 'Vue 3 renamed the transition classes: Vue 2\'s `v-enter` / `v-leave` became `v-enter-from` / `v-leave-from`. `onScopeDispose()` is available since Vue 3.2. Container queries and `clamp()` are browser features, supported by all current major browsers — check your own support targets.',
    },
  ],

  walkthrough: {
    title: 'components/TaskCard.vue',
    lang: 'vue',
    code: taskCardVue,
    intro: 'The card from the playground: state-driven classes on top, size-driven CSS at the bottom.',
    steps: [
      { lines: [4, 7], text: 'The card receives a `task` and emits `toggle` — the parent owns the data, as usual.' },
      { lines: [9, 14], text: 'A **variant map**: one place that lists every allowed priority and its class. Adding a variant is one line, and a typo can\'t produce a random class.' },
      { lines: [16, 20], text: 'A computed array of classes: a static class, the mapped variant (with a fallback), and an object for the conditional `is-done`. Vue normalises all of it into one `class` attribute.' },
      { lines: [26], text: '`:class="cardClasses"` keeps the template readable. The `data-task` attribute gives tests and styles a stable hook.' },
      { lines: [32, 34], text: '`:aria-expanded` reflects the same state that shows the notes, so screen reader users know whether the panel is open.' },
      { lines: [40, 49], text: 'A CSS `transition` on the card means class changes (like `is-done` changing opacity) animate smoothly — no JavaScript animation code.' },
      { lines: [51, 60], text: 'A **container query**: when the card\'s container is at least 360px wide, title, priority and button share a row. In a narrow sidebar the same component stacks.' },
      { lines: [62, 67], text: 'The variant and state classes only set what differs — the border colour, opacity, strike-through.' },
    ],
  },

  playground: {
    title: 'Responsive sprint board',
    objective: 'Resize the preview to watch CSS adapt, then add a variant, an enter/leave transition and a reduced-motion rule.',
    files: {
      'App.vue': appVue,
      'components/TaskCard.vue': taskCardVue,
      'composables/useMediaQuery.js': useMediaQueryJs,
    },
    expected: 'A **Sprint board** with four task cards and a label saying *Phone layout* or *Wide layout* depending on the preview width. Done tasks are faded with a strike-through; ticking a checkbox animates the change. Each card has a coloured left border for its priority — except the urgent one, which falls back to the medium (amber) style.',
    experiments: [
      {
        id: 'urgent-variant',
        task: 'The **Server is down** task has priority `urgent`, but there\'s no variant for it, so it falls back to medium. Add an `urgent` entry to the variant map (class `task--urgent`) and give `.task--urgent` a style — e.g. a red border and a light red background.',
        hint: 'In TaskCard.vue add `urgent: \'task--urgent\'` to `priorityClass`, then a `.task--urgent { … }` rule in the scoped style.',
        tests: [
          {
            name: 'the urgent task gets the task--urgent class',
            code: `const cls = classes('[data-task="3"]')
expect(cls).toContain('task--urgent')
expect(cls).not.toContain('task--medium')`,
          },
        ],
        explain: 'One new map entry, one new rule — no template changes. Variant maps scale far better than chains like `priority === \'high\' ? … : priority === \'low\' ? … : …`.',
      },
      {
        id: 'notes-transition',
        task: 'Make the notes **slide in** instead of popping. Wrap `<p v-if="showNotes" class="notes">` in `<Transition name="slide">` and add the four `slide-*` rules from the syntax section to TaskCard\'s style.',
        hint: 'Put `transition: opacity 0.2s, transform 0.2s` on `.slide-enter-active, .slide-leave-active`, and `opacity: 0; transform: translateY(-4px)` on `.slide-enter-from, .slide-leave-to`.',
        tests: [
          {
            name: 'opening the notes adds slide-enter-* classes',
            code: `await click('.toggle-notes')
expect(exists('.notes')).toBe(true)
expect(classes('.notes').some((c) => c.startsWith('slide-enter'))).toBe(true)`,
          },
        ],
        explain: 'When `v-if` inserts the paragraph, `<Transition>` adds `slide-enter-from` + `slide-enter-active`, swaps `enter-from` for `enter-to` on the next frame, and removes everything when the CSS transition ends. Your CSS defines what those states look like.',
      },
      {
        id: 'reduced-motion',
        task: 'Some people get dizzy or nauseous from motion. Add a `@media (prefers-reduced-motion: reduce)` block to TaskCard\'s style that turns off the card\'s transition and the slide transition (`transition: none`).',
        hint: '`@media (prefers-reduced-motion: reduce) { .task, .slide-enter-active, .slide-leave-active { transition: none; } }`',
        tests: [
          {
            name: 'the styles include a prefers-reduced-motion: reduce block',
            code: `${CSS}
expect(css).toMatch(/prefers-reduced-motion:\\s*reduce/)`,
          },
        ],
        explain: 'The operating system exposes the user\'s "reduce motion" setting, and CSS can read it. The content still appears — it just doesn\'t move. More in [Accessibility fundamentals](lesson:accessibility-fundamentals).',
      },
      {
        id: 'resize',
        task: 'Drag the preview narrower and wider (or resize your browser window). Watch four separate mechanisms: the board switches between 1 and 2 columns at 700px (**media query**), each card rearranges when *its own* box passes 360px (**container query**), the title scales smoothly (**clamp**), and the label flips between *Phone* and *Wide* (**useMediaQuery** in JavaScript).',
        hint: 'The preview pane\'s width is the viewport for the sandboxed page.',
        explain: 'Only the label needed JavaScript. Everything else is pure CSS — it works before JavaScript loads, costs no re-renders and can\'t get out of sync.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'What <Transition> does to an entering element',
    props: {
      layout: 'row',
      nodes: [
        { id: 'insert', label: 'v-if becomes true', note: 'element inserted', tone: 'paper' },
        { id: 'from', label: 'Frame 1', note: 'slide-enter-from + slide-enter-active', tone: 'acid' },
        { id: 'to', label: 'Next frame', note: 'enter-from removed, slide-enter-to added', tone: 'cobalt' },
        { id: 'end', label: 'transitionend', note: 'all slide-* classes removed', tone: 'ink' },
      ],
      edges: [
        { from: 'insert', to: 'from' },
        { from: 'from', to: 'to', label: 'next frame' },
        { from: 'to', to: 'end', label: 'CSS transition runs' },
      ],
      steps: [
        { focus: ['insert'], text: '`showNotes` becomes `true`, so `v-if` creates the `<p>`. Because it\'s wrapped in `<Transition name="slide">`, Vue intercepts the insertion.' },
        { focus: ['from'], edges: ['insert->from'], text: 'Before the element is painted, Vue adds `slide-enter-from` (your start state: transparent, shifted up) and `slide-enter-active` (where your `transition` property lives).' },
        { focus: ['to'], edges: ['from->to'], text: 'On the next animation frame Vue removes `slide-enter-from` and adds `slide-enter-to`. The browser sees the properties change and starts the CSS transition.' },
        { focus: ['end'], edges: ['to->end'], text: 'When the browser fires `transitionend` (or the computed duration passes), Vue removes the remaining classes. Leaving works the same way with `slide-leave-*` — and Vue waits for it before removing the element.' },
      ],
    },
    caption: 'Vue only toggles classes at the right moments; the browser does the animating.',
    alt: 'Four steps in a row: the element is inserted by v-if; on the first frame it gets slide-enter-from and slide-enter-active; on the next frame enter-from is replaced by slide-enter-to and the CSS transition runs; on transitionend all slide classes are removed.',
  },

  internals: {
    beginner: `
Vue never animates anything and never measures the screen for layout. For responsive layout, the browser evaluates your media and container queries on its own. For dynamic styles, Vue just recomputes which classes and inline styles the element should have and updates the attribute. For transitions, Vue adds and removes classes at the right moments — the browser runs the animation.
`,
    technical: [
      `
**Class and style normalisation.** Before patching, Vue normalises bindings: \`normalizeClass()\` turns strings, arrays and objects into one space-separated string (falsy object values are skipped), and the static \`class\` is merged in. The renderer then sets \`el.className\` only when the string changed. \`normalizeStyle()\` merges objects and arrays; the style patcher calls \`style.setProperty()\` for custom properties (\`--accent\`), converts camelCase names, and — for properties that need a vendor prefix in the current browser — adds the prefix automatically. Removed keys are cleared.
`,
      {
        code: `// What Vue does for :class="['task', map[p], { 'is-done': done }]"  (simplified)
normalizeClass(['task', 'task--high', { 'is-done': true }])
// → 'task task--high is-done'
// The renderer compares with the previous string and patches el.className only if different.`,
        lang: 'js',
        title: 'normalisation (mental model)',
      },
      `
**Transitions.** \`<Transition>\` wraps a single element or component and hooks into its insert/remove. On enter it adds \`*-enter-from\` and \`*-enter-active\`, waits for the next frame (Vue uses a double \`requestAnimationFrame\`), swaps \`enter-from\` for \`enter-to\`, then listens for \`transitionend\`/\`animationend\` — or uses the durations from computed styles, or the \`duration\` prop — before cleaning up. On leave it delays the actual DOM removal until the leave transition finishes.

**matchMedia.** \`window.matchMedia(query)\` returns a \`MediaQueryList\` whose \`matches\` is evaluated by the browser and which fires a \`change\` event when the result flips. The composable copies that into a ref; \`onScopeDispose\` removes the listener when the owning component (or effect scope) is torn down.

**Container queries.** \`container-type: inline-size\` turns on size containment on that axis, which is what lets the browser resolve the container's width independently of its contents — and why an element can't query its own size, only an ancestor container's.
`,
    ],
    production: `
- **Prefer CSS for layout decisions.** CSS responds instantly, before hydration, with no re-renders. Use \`matchMedia\` in JS only when the *component tree* must differ (e.g. a drawer vs a sidebar with different behaviour).
- **Server rendering:** \`window\` doesn't exist on the server, and the server can't know the viewport. Read \`matchMedia\` after mount (or accept a default) to avoid hydration mismatches — see [Hydration](lesson:hydration).
- **Prefer container queries for reusable components** (cards, widgets) that appear in different layouts; keep media queries for page-level structure.
- **Animate cheap properties.** Transitions on \`transform\` and \`opacity\` usually avoid re-running layout; animating \`width\`, \`height\` or \`top\` forces layout work every frame. Measure with the browser\'s performance tools before optimising.
- **Respect \`prefers-reduced-motion\`** for every non-essential animation, including Vue transitions.
- **Keep variants in maps/computeds**, not in long template expressions — easier to test, review and extend. Shared breakpoints belong in one place (design tokens or a constants module); note that custom properties **can't** be used inside media query conditions.
`,
  },

  mistakes: [
    {
      title: 'Desktop-first max-width overrides',
      wrong: { code: `.board { grid-template-columns: repeat(3, 1fr); }\n@media (max-width: 1100px) { .board { grid-template-columns: repeat(2, 1fr); } }\n@media (max-width: 700px)  { .board { grid-template-columns: 1fr; } }`, lang: 'css' },
      right: { code: `.board { grid-template-columns: 1fr; }\n@media (min-width: 700px)  { .board { grid-template-columns: repeat(2, 1fr); } }\n@media (min-width: 1100px) { .board { grid-template-columns: repeat(3, 1fr); } }`, lang: 'css' },
      explanation: 'Both work, but desktop-first makes phones download and then *undo* the complex layout, and overrides pile up. Mobile-first starts simple and only adds — easier to read and reason about.',
    },
    {
      title: 'Using Vue 2 transition class names',
      wrong: { code: `.fade-enter, .fade-leave-to { opacity: 0; }`, lang: 'css' },
      right: { code: `.fade-enter-from, .fade-leave-to { opacity: 0; }`, lang: 'css' },
      explanation: 'Vue 3 renamed `v-enter` to `v-enter-from` (and `v-leave` to `v-leave-from`). The old name silently matches nothing, so elements appear without animating.',
    },
    {
      title: 'Building class strings by hand',
      wrong: { code: `<li :class="'task ' + (done ? 'is-done ' : '') + 'task--' + priority">`, lang: 'vue' },
      right: { code: `<li :class="['task', 'task--' + priority, { 'is-done': done }]">`, lang: 'vue' },
      explanation: 'String concatenation is fragile (missing spaces, stray "undefined"). Array/object syntax lets Vue handle spacing and falsy values. For many variants, move the logic into a computed with a variant map.',
    },
    {
      title: 'Reading matchMedia once without listening (or without cleaning up)',
      wrong: { code: `const isWide = ref(window.matchMedia('(min-width: 700px)').matches)\n// never updates; crashes where window is missing (SSR)`, lang: 'js' },
      right: { code: `const isWide = useMediaQuery('(min-width: 700px)')\n// listens for 'change', removes the listener on unmount, feature-detects`, lang: 'js' },
      explanation: 'A one-time read becomes stale as soon as the user rotates the phone or resizes the window. And a listener without cleanup keeps running after the component is gone.',
    },
    {
      title: 'Hiding with CSS what should not be rendered at all',
      wrong: { code: `<HeavyDataTable class="desktop-only" />\n<MobileCardList class="mobile-only" />\n<!-- both mount, fetch and render on every device -->`, lang: 'vue' },
      right: { code: `<HeavyDataTable v-if="isWide" />\n<MobileCardList v-else />`, lang: 'vue' },
      explanation: '`display: none` still creates both component trees. When two layouts are genuinely different *components* with real costs, choose with `v-if` and `useMediaQuery`. When only the arrangement differs, plain CSS is better.',
    },
  ],

  debugging: [
    {
      symptom: 'Media queries work in desktop DevTools but a real phone shows a tiny zoomed-out desktop page.',
      cause: 'The page is missing the viewport meta tag, so mobile browsers lay it out on a wide virtual viewport and scale it down.',
      fix: 'Add `<meta name="viewport" content="width=device-width, initial-scale=1">` to `index.html` (Vite\'s templates include it).',
    },
    {
      symptom: 'An `@container` rule never applies.',
      cause: 'No ancestor has `container-type` set — or you set it on the very element you are trying to style (an element can\'t query its own size).',
      fix: 'Put `container-type: inline-size` on a wrapper and style its descendants. DevTools shows container badges on elements that are containers.',
    },
    {
      symptom: '`<Transition>` content appears and disappears instantly.',
      cause: 'Vue 2 class names, no `transition` property on the `-active` class, the child isn\'t toggled with `v-if`/`v-show`/a key change, or the slot has more than one root element.',
      fix: 'Use `*-enter-from` / `*-leave-to`, put the `transition` on `*-enter-active` / `*-leave-active`, and wrap exactly one element that is conditionally rendered.',
    },
    {
      symptom: 'The element literally has `class="{ active: isActive }"` in the DOM.',
      cause: 'The colon is missing: `class="…"` is a plain string, only `:class="…"` is evaluated.',
      fix: 'Write `:class="{ active: isActive }"`.',
    },
    {
      symptom: 'A `useMediaQuery` value never changes after the first render.',
      cause: 'The composable reads `matches` once and never subscribes to the `change` event.',
      fix: 'Add `mql.addEventListener(\'change\', handler)` and update the ref in the handler; remove it in `onScopeDispose`/`onUnmounted`.',
    },
  ],

  bestPractices: [
    'Write mobile-first CSS: a simple default, then `min-width` additions.',
    'Use container queries for reusable components and media queries for page structure.',
    'Prefer fluid values (`clamp()`, `minmax()`, `auto-fill`) over many fixed breakpoints.',
    'Let CSS decide layout; use JavaScript media queries only when the component tree must change.',
    'Keep class logic in computeds and variant maps; keep templates short.',
    'Use custom properties (via `:style`) for continuous values like percentages and user colours; use classes for discrete states.',
    'Animate `transform` and `opacity` where possible, and respect `prefers-reduced-motion`.',
  ],

  useCases: [
    'Dashboards that go from one column on phones to multi-column grids on desktops.',
    'A product card that stacks in a sidebar and spreads out in the main column (container queries).',
    'Status-driven styling: done tasks, failed payments, unread messages, selected rows.',
    'Meters and progress bars driven by a percentage custom property.',
    'Drawers, accordions, toasts and dropdowns that fade or slide in with `<Transition>`.',
    'Swapping a desktop data table for a mobile card list with `useMediaQuery` + `v-if`.',
  ],

  whenToUse: {
    use: [
      'CSS media/container queries for anything that is purely about arrangement and sizing.',
      '`:class` objects/arrays for discrete states and variants.',
      '`:style` custom properties for continuous, data-driven values.',
      '`useMediaQuery` when different screen sizes need different components or behaviour.',
    ],
    avoid: [
      'JavaScript resize listeners to switch CSS layouts — CSS does it better.',
      'Inline styles for static values that belong in the stylesheet.',
      'Long ternary chains in templates — move them to a computed variant map.',
      'Motion that can\'t be turned off for users who prefer reduced motion.',
    ],
  },

  comparison: {
    title: 'Tools for adapting to space',
    headers: ['', 'Media queries', 'Container queries', '`clamp()` / fluid values', '`useMediaQuery` (JS)'],
    rows: [
      ['Responds to', 'the viewport (and user preferences)', 'the nearest size container', 'the viewport or container units', 'a media query, evaluated in JS'],
      ['Needs JavaScript?', 'no', 'no', 'no', 'yes'],
      ['Can change which components render?', 'no (only hide)', 'no (only hide)', 'no', 'yes (`v-if`)'],
      ['Best for', 'page-level layout, reduced motion, dark mode', 'reusable components in varied layouts', 'type, spacing, gaps', 'genuinely different components or behaviour'],
      ['Server rendering', 'works', 'works', 'works', 'unknown on the server — read after mount'],
    ],
    note: 'Most interfaces combine all four, with JavaScript as the rare exception. Design tokens for breakpoints and spacing are covered in [Design systems](lesson:design-systems).',
  },

  quiz: [
    {
      id: 'responsive-dynamic-styles-q1',
      type: 'mcq',
      prompt: 'Which media query belongs in a **mobile-first** stylesheet?',
      options: [
        { text: '`@media (min-width: 48rem) { … }`' },
        { text: '`@media (max-width: 48rem) { … }`', why: 'That overrides a desktop default for smaller screens — the desktop-first pattern.' },
        { text: '`@media screen { … }`', why: 'This matches all screens; it has nothing to do with size.' },
        { text: '`@container (min-width: 48rem) { … }`', why: 'That\'s a container query — it depends on a container, not on the mobile-first viewport strategy.' },
      ],
      answer: 0,
      explanation: 'Mobile-first means the default styles target small screens and `min-width` queries add enhancements as space grows.',
    },
    {
      id: 'responsive-dynamic-styles-q2',
      type: 'output',
      prompt: 'With `isActive = true`, `hasError = false`, `size = \'lg\'`, what is the final `class` attribute?',
      code: { lang: 'vue', code: `<button\n  class="btn"\n  :class="[{ active: isActive, 'has-error': hasError }, 'btn--' + size]"\n>Save</button>` },
      options: ['btn active btn--lg', 'active btn--lg', 'btn active has-error btn--lg', 'btn [object Object] btn--lg'],
      answer: 0,
      explanation: 'The static `class` merges with the bound one. In the object, only truthy entries are kept; the array adds `btn--lg`.',
    },
    {
      id: 'responsive-dynamic-styles-q3',
      type: 'bug',
      prompt: 'The toast appears instantly instead of fading in. Click the line with the bug.',
      code: {
        lang: 'vue',
        code: `<template>
  <Transition name="fade">
    <p v-if="visible" class="toast">Saved!</p>
  </Transition>
</template>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter,
.fade-leave-to {
  opacity: 0;
}
</style>`,
      },
      answerLine: 12,
      explanation: '`.fade-enter` is the Vue 2 name. In Vue 3 the start state of entering is `.fade-enter-from`, so the element starts at full opacity and nothing animates.',
    },
    {
      id: 'responsive-dynamic-styles-q4',
      type: 'fill',
      prompt: 'Complete the container query setup so the card rearranges when its wrapper is at least 360px wide.',
      code: { lang: 'css', code: `.card-wrapper {\n  container-type: ___;\n}\n\n@___ (min-width: 360px) {\n  .card { grid-template-columns: 1fr auto; }\n}` },
      answer: [['inline-size', 'size'], ['container']],
      explanation: '`container-type: inline-size` makes the wrapper a size container on its inline axis (width in horizontal writing). `@container` queries it and styles its descendants.',
    },
    {
      id: 'responsive-dynamic-styles-q5',
      type: 'mcq',
      prompt: 'When is a JavaScript media query (`matchMedia` / `useMediaQuery`) the better tool than CSS?',
      options: [
        { text: 'When the phone and desktop versions need different components or behaviour.' },
        { text: 'When you want two columns on wide screens.', why: 'Pure layout — a CSS media or container query does this without JavaScript.' },
        { text: 'When you want font sizes to scale with the screen.', why: '`clamp()` with viewport units handles this in CSS.' },
        { text: 'Always — it is more precise than CSS.', why: 'It evaluates exactly the same media queries; it only adds JavaScript cost and server-rendering concerns.' },
      ],
      answer: 0,
      explanation: 'CSS can rearrange and hide, but only JavaScript can choose which component tree to create. Use the JS version only for that.',
    },
    {
      id: 'responsive-dynamic-styles-q6',
      type: 'mcq',
      prompt: 'Select **all** valid `:style` bindings.',
      options: [
        { text: '`:style="{ fontSize: size + \'px\' }"`' },
        { text: '`:style="{ \'--progress\': pct + \'%\' }"`' },
        { text: '`:style="[baseStyles, overrides]"`' },
        { text: '`:style="{ font-size: \'12px\' }"`', why: 'Unquoted `font-size` isn\'t a valid JavaScript object key (it reads as `font - size`). Use `fontSize` or `\'font-size\'`.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Style objects use camelCase or quoted kebab-case keys, custom properties are quoted `--` keys, and arrays merge several objects.',
    },
    {
      id: 'responsive-dynamic-styles-q7',
      type: 'short',
      prompt: 'Explain in two or three sentences what `prefers-reduced-motion` is and what you should do with it.',
      answer: 'It is a media feature that reflects the user\'s operating-system setting to reduce motion — used by people for whom animation causes discomfort, dizziness or distraction. Under `@media (prefers-reduced-motion: reduce)` you remove or tone down non-essential animations and transitions, while keeping the content and state changes themselves.',
    },
  ],

  exercises: [
    {
      id: 'password-strength-meter',
      title: 'Password strength meter',
      difficulty: 'intermediate',
      prompt: `
Build a strength meter that is styled entirely through **state-driven classes and a custom property**.

- The input is \`<input type="password" class="password">\` bound with \`v-model\`.
- **Score** = how many of these rules are met (0–4): at least 8 characters; contains a digit; contains an uppercase letter; contains a symbol (anything that isn't a letter or digit).
- The \`.meter\` element always has class \`meter\` plus **exactly one** level class:
  - \`meter--empty\` when the password is empty,
  - \`meter--weak\` for a score of 0–1, \`meter--fair\` for 2–3, \`meter--strong\` for 4.
- \`.meter\` gets the custom property \`--strength\` set to \`score × 25\` percent (e.g. \`'50%'\`) via \`:style\`.
- \`.meter-label\` shows \`Enter a password\`, \`Weak\`, \`Fair\` or \`Strong\`.
- Bonus: colour the fill per level using custom properties, and add \`aria-live="polite"\` to the label.
`,
      files: { 'App.vue': strengthStarter },
      hints: [
        'Compute the score with an array of booleans: `[p.length >= 8, /\\d/.test(p), /[A-Z]/.test(p), /[^A-Za-z0-9]/.test(p)].filter(Boolean).length`.',
        'Compute a `level` string (`empty` / `weak` / `fair` / `strong`) and build the classes as `[\'meter\', \'meter--\' + level.value]`.',
        'Bind `:style="{ \'--strength\': score * 25 + \'%\' }"` on `.meter` and read it in CSS with `width: var(--strength)` on the fill. Use a `labels` map for the text.',
      ],
      solution: {
        explanation: 'Two computeds (`score`, `level`) describe the state; the template only maps them to one class and one custom property. CSS turns those into width and colour — so a designer can restyle every level without touching JavaScript.',
        files: { 'App.vue': strengthSolution },
      },
      tests: [
        {
          name: 'empty password → meter--empty only',
          code: `const cls = classes('.meter')
expect(cls).toContain('meter')
expect(cls).toContain('meter--empty')
expect(cls.filter((c) => c.startsWith('meter--'))).toHaveLength(1)
expect(text('.meter-label')).toBe('Enter a password')`,
        },
        {
          name: '"abc" is weak at 0%',
          code: `await type('.password', 'abc')
expect(classes('.meter')).toContain('meter--weak')
expect(find('.meter').style.getPropertyValue('--strength').trim()).toBe('0%')
expect(text('.meter-label')).toBe('Weak')`,
        },
        {
          name: '"abcdefgh1" is fair at 50%',
          code: `await type('.password', 'abcdefgh1')
expect(classes('.meter')).toContain('meter--fair')
expect(classes('.meter')).not.toContain('meter--weak')
expect(find('.meter').style.getPropertyValue('--strength').trim()).toBe('50%')
expect(text('.meter-label')).toBe('Fair')`,
        },
        {
          name: '"Abcdefg1!" is strong at 100%',
          code: `await type('.password', 'Abcdefg1!')
expect(classes('.meter')).toContain('meter--strong')
expect(find('.meter').style.getPropertyValue('--strength').trim()).toBe('100%')
expect(text('.meter-label')).toBe('Strong')`,
        },
        {
          name: 'exactly one level class at a time',
          code: `await type('.password', 'Abcdefg1!')
await type('.password', 'ab')
expect(classes('.meter').filter((c) => c.startsWith('meter--'))).toEqual(['meter--weak'])`,
        },
      ],
    },
    {
      id: 'use-media-query',
      title: 'A production-grade useMediaQuery',
      difficulty: 'advanced',
      prompt: `
Write \`useMediaQuery.js\` exporting \`useMediaQuery(query)\`:

- \`query\` may be a **string, a ref or a getter** — read it with \`toValue()\` (Vue 3.3+).
- Returns a **ref** holding \`true\`/\`false\`: the current \`matches\` of \`window.matchMedia(query)\`.
- Updates the ref when the media query list fires a \`change\` event (use \`addEventListener('change', …)\`).
- When the query changes, stop listening to the old media query list and start on the new one.
- When the component that called it unmounts, remove the listener.
- If \`window.matchMedia\` doesn't exist, return a ref with \`false\` and don't throw.

\`App.vue\` and \`LayoutBadge.vue\` are provided: the **Toggle badge** button (\`.toggle-badge\`) mounts and unmounts a component that uses your composable. The tests replace \`window.matchMedia\` with a fake to simulate screen changes.
`,
      files: {
        'App.vue': mqApp,
        'LayoutBadge.vue': mqBadge,
        'useMediaQuery.js': `import { ref } from 'vue'

// TODO: react to "change" events, accept refs/getters,
// survive a missing matchMedia and clean up after itself.
export function useMediaQuery(query) {
  return ref(window.matchMedia(query).matches)
}`,
      },
      hints: [
        'Feature-detect first: `if (typeof window === \'undefined\' || typeof window.matchMedia !== \'function\') return matches`.',
        '`watchEffect((onCleanup) => { … })` re-runs when `toValue(query)` changes, and `onCleanup` runs before each re-run **and** when the owning component unmounts.',
        'Inside the effect: create the list with `window.matchMedia(toValue(query))`, copy `mql.matches` into the ref, add a `change` listener, and remove it in `onCleanup`.',
      ],
      solution: {
        explanation: '`watchEffect` gives you both requirements for free: it re-runs when the query (read through `toValue`) changes, and its cleanup callback runs before every re-run and when the component\'s scope is disposed on unmount. The feature check keeps it safe in old browsers and on the server.',
        files: {
          'App.vue': mqApp,
          'LayoutBadge.vue': mqBadge,
          'useMediaQuery.js': `import { ref, toValue, watchEffect } from 'vue'

export function useMediaQuery(query) {
  const matches = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return matches
  }

  watchEffect((onCleanup) => {
    const mql = window.matchMedia(toValue(query))
    matches.value = mql.matches

    const onChange = (event) => {
      matches.value = event.matches
    }
    mql.addEventListener('change', onChange)
    onCleanup(() => mql.removeEventListener('change', onChange))
  })

  return matches
}`,
        },
      },
      tests: [
        {
          name: 'returns the current match and follows change events',
          code: `const listeners = []
const original = window.matchMedia
window.matchMedia = (q) => ({
  matches: true, media: q,
  addEventListener: (t, fn) => listeners.push(fn),
  removeEventListener: (t, fn) => { const i = listeners.indexOf(fn); if (i > -1) listeners.splice(i, 1) },
})
try {
  const { useMediaQuery } = requireModule('useMediaQuery.js')
  const isWide = withSetup(() => useMediaQuery('(min-width: 700px)'))
  expect(isWide.value).toBe(true)
  listeners.slice().forEach((fn) => fn({ matches: false }))
  expect(isWide.value).toBe(false)
} finally {
  window.matchMedia = original
}`,
        },
        {
          name: 'returns false without throwing when matchMedia is missing',
          code: `const original = window.matchMedia
window.matchMedia = undefined
try {
  const { useMediaQuery } = requireModule('useMediaQuery.js')
  const result = withSetup(() => useMediaQuery('(min-width: 700px)'))
  expect(result.value).toBe(false)
} finally {
  window.matchMedia = original
}`,
        },
        {
          name: 'accepts a getter and switches listeners when the query changes',
          code: `const { ref } = requireModule('vue')
const active = new Map()
const original = window.matchMedia
window.matchMedia = (q) => ({
  matches: String(q).includes('500'), media: q,
  addEventListener: (t, fn) => active.set(q, fn),
  removeEventListener: (t, fn) => { if (active.get(q) === fn) active.delete(q) },
})
try {
  const { useMediaQuery } = requireModule('useMediaQuery.js')
  const bp = ref(500)
  const result = withSetup(() => useMediaQuery(() => '(min-width: ' + bp.value + 'px)'))
  expect(result.value).toBe(true)
  bp.value = 900
  await flush()
  expect(result.value).toBe(false)
  expect(active.has('(min-width: 500px)')).toBe(false)
  expect(active.has('(min-width: 900px)')).toBe(true)
} finally {
  window.matchMedia = original
}`,
        },
        {
          name: 'removes its listener when the component unmounts',
          code: `let listening = 0
const original = window.matchMedia
window.matchMedia = (q) => ({
  matches: true, media: q,
  addEventListener: () => { listening++ },
  removeEventListener: () => { listening-- },
})
try {
  await click('.toggle-badge')
  expect(text('.badge')).toBe('Wide')
  expect(listening).toBe(1)
  await click('.toggle-badge')
  expect(exists('.badge')).toBe(false)
  expect(listening).toBe(0)
} finally {
  window.matchMedia = original
}`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'responsive-dynamic-styles-mobile-first',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does "mobile-first" mean in CSS, and why do many teams prefer it?',
      answer: 'Mobile-first means the default styles target small screens and `min-width` media queries progressively add layout for larger screens. It keeps the base simple, avoids undoing complex desktop rules on phones, and forces you to prioritise content for the most constrained screen first.',
      explanation: 'Start with the simplest layout and only *add* complexity as space appears.',
      code: { lang: 'css', code: `.nav { display: none; }\n@media (min-width: 48rem) { .nav { display: flex; } }` },
      whyAsked: 'A baseline check of responsive design knowledge.',
      mistakes: ['Saying mobile-first means "build a separate mobile site".', 'Confusing `min-width` and `max-width` direction.', 'Thinking it is about touch support only.'],
      followUps: ['How would you choose breakpoints?', 'How do container queries change this approach?'],
      modelAnswer: 'Mobile-first means my default CSS is the small-screen layout, and I layer on enhancements with `min-width` queries as space grows. The base stays simple, each breakpoint only describes what changes, and phones don\'t download and then override a complex desktop layout. It also forces content priorities early. I pick breakpoints where the content starts to look wrong, not around specific devices.',
    },
    {
      id: 'responsive-dynamic-styles-container-vs-media',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When would you use a container query instead of a media query?',
      answer: 'Use a container query when a component\'s layout should depend on the space *it* is given — a card that appears in a sidebar and in a wide main column. Media queries respond to the viewport, so they suit page-level structure and user preferences (reduced motion, colour scheme). Container queries need an ancestor with `container-type` and style that container\'s descendants.',
      explanation: 'Viewport-based vs box-based responsiveness.',
      whyAsked: 'Container queries changed how reusable components are built; interviewers want to see you know when they fit.',
      mistakes: ['Saying container queries replace media queries entirely.', 'Forgetting that the element can\'t query itself.', 'Not mentioning `container-type`.'],
      followUps: ['What does `container-type: inline-size` do?', 'How would you name containers to query a specific ancestor?'],
      modelAnswer: 'Media queries answer "how big is the screen?", container queries answer "how big is my box?". For reusable components like cards or widgets that appear in different layouts, container queries are the right tool, because the same viewport can give the component very different widths. I set `container-type: inline-size` on a wrapper and style descendants with `@container`. Page structure and preferences like reduced motion stay media queries.',
    },
    {
      id: 'responsive-dynamic-styles-table-or-cards',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Desktop users see an orders data table; on phones the designers want a list of cards with different actions. How would you implement the switch?',
      answer: 'Because they are different components with different behaviour, render one or the other with `v-if` driven by a `useMediaQuery` composable — so only one tree mounts and fetches. If the difference were only visual arrangement of the same markup, I\'d use CSS instead. With SSR, the server can\'t know the viewport, so I\'d pick a sensible default and switch after mount (or use CSS for the first paint) to avoid hydration mismatches.',
      explanation: 'Different trees → JS decision; same tree, different arrangement → CSS.',
      whyAsked: 'Tests judgement between CSS and JS approaches, plus awareness of SSR and performance.',
      mistakes: ['Rendering both and hiding one with CSS — both trees still mount, fetch data and run their logic.', 'Using a `resize` listener without cleanup.', 'Ignoring SSR mismatches.'],
      followUps: ['How would you share data between the two views?', 'How would you test both layouts?'],
      modelAnswer: 'If the phone and desktop versions are genuinely different components, I choose with `v-if` and a `useMediaQuery` composable that wraps `matchMedia`, listens for changes and cleans up. That way only one tree mounts. Both views read the same data from a composable or store, so switching is cheap. If the content were the same and only the arrangement differed, I\'d stay in CSS. For SSR I\'d render a default and switch after mount, because the server has no viewport.',
    },
    {
      id: 'responsive-dynamic-styles-transition-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate migrated a Vue 2 component to Vue 3 and now its dropdown appears instantly instead of fading. What do you check?',
      answer: 'First the class names: Vue 3 renamed `.v-enter` / `.v-leave` to `.v-enter-from` / `.v-leave-from`, so old CSS stops matching. Then: the `transition` property must be on the `-active` classes, the `<Transition>` must wrap exactly one element that is toggled by `v-if`/`v-show` (or a changing `key`), and the `name` must match the class prefix.',
      explanation: 'Silent class mismatches are the most common migration regression for transitions.',
      code: { lang: 'css', code: `/* Vue 2 */ .fade-enter, .fade-leave-to { opacity: 0; }\n/* Vue 3 */ .fade-enter-from, .fade-leave-to { opacity: 0; }` },
      whyAsked: 'A practical migration bug that reveals whether you know the transition class lifecycle.',
      mistakes: ['Assuming Transition is broken and rewriting with JS animations.', 'Checking only the JavaScript.', 'Not knowing the class rename.'],
      followUps: ['What are the six transition classes?', 'How do you make transitions respect reduced motion?'],
      modelAnswer: 'I\'d inspect the element during the transition to see which classes Vue adds, then compare with the CSS. The classic cause after a Vue 2 migration is the rename of `v-enter` to `v-enter-from`, so the start state never matches. I\'d also confirm the `transition` property is on the active classes, that the transition wraps a single conditionally rendered element, and that the `name` prefix matches. Finally I\'d add a reduced-motion override.',
    },
    {
      id: 'responsive-dynamic-styles-class-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What `class` attribute does this render when `selected = false`, `status = \'failed\'`?',
      code: { lang: 'vue', code: `<tr class="row" :class="{ 'is-selected': selected, ['row--' + status]: true }">` },
      options: ['row is-selected row--failed', 'row row--failed', 'row--failed', 'row false row--failed'],
      correctOption: 1,
      answer: '`row row--failed`. The static class stays; in the object, `is-selected` is dropped because its value is `false`, and the computed key `row--failed` is kept because its value is `true`.',
      explanation: 'Object syntax keeps keys whose values are truthy. Computed keys (`[expr]`) work like in any JavaScript object.',
      whyAsked: 'Quick check of class binding mechanics.',
      mistakes: ['Thinking `:class` replaces the static `class`.', 'Expecting `false` to be printed.'],
      followUps: ['How would you write this with a variant map instead?'],
      modelAnswer: 'It renders `row row--failed`. Vue merges the static class with the bound one, keeps only truthy entries from the object, and the computed key evaluates to `row--failed`. For several statuses I\'d move that into a computed variant map.',
    },
    {
      id: 'responsive-dynamic-styles-variants-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'A component has 4 visual variants, 3 sizes, and loading/disabled/active states. Its template has grown long `:class` ternaries. How would you organise its dynamic styling?',
      answer: 'Move class logic into computeds built from explicit maps (`variantClass[variant]`, `sizeClass[size]`) plus an object for boolean states; validate props against the map keys. Use custom properties for continuous values and let variant classes set those properties, so CSS stays declarative. Keep states that are also semantic as attributes (`disabled`, `aria-busy`, `aria-pressed`) and style them via attribute selectors. Unit-test the class computation; document variants in the design system.',
      explanation: 'Maps + computeds + custom properties + semantic attributes = readable, testable, extensible styling.',
      code: {
        lang: 'js',
        code: `const variantClass = { primary: 'btn--primary', secondary: 'btn--secondary', danger: 'btn--danger', ghost: 'btn--ghost' }
const sizeClass = { sm: 'btn--sm', md: 'btn--md', lg: 'btn--lg' }

const classes = computed(() => [
  'btn',
  variantClass[props.variant] ?? variantClass.primary,
  sizeClass[props.size] ?? sizeClass.md,
  { 'is-loading': props.loading },
])`,
      },
      whyAsked: 'Shows whether you can keep UI code maintainable as design requirements grow.',
      mistakes: ['Inline-styling every variant.', 'Generating class names from unvalidated strings.', 'Duplicating state as both a class and an attribute that can drift apart.'],
      followUps: ['How would a design system share these variants across components?', 'How would you test this?'],
      modelAnswer: 'I\'d pull the logic out of the template into computeds backed by maps — one for variant, one for size — plus an object for boolean states, and validate the props against those maps. Variant classes would mostly set custom properties like `--btn-bg`, so the base rule reads `var(--btn-bg)` and stays simple. Semantic states go on real attributes — `disabled`, `aria-busy` — and CSS styles them with attribute selectors, so the visual and accessible state can\'t drift. The class computation is easy to unit-test, and the variants get documented in the design system.',
    },
    {
      id: 'responsive-dynamic-styles-price-tag',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Finish `PriceTag.vue`. Its root (`data-test="tag"`) always has `price-tag`, plus `price-tag--up` when `change > 0`, `price-tag--down` when `change < 0`, `price-tag--flat` when `change === 0`, and `price-tag--lg` when `size === \'lg\'`. The `.change` element shows the change with a sign: `+3.5%`, `-1.2%`, `0%`.',
      starter: { files: { 'PriceTag.vue': priceTagStarter, 'App.vue': `<script setup>\nimport PriceTag from './PriceTag.vue'\n</script>\n\n<template>\n  <PriceTag :amount="12.5" :change="3.5" size="lg" />\n</template>` } },
      tests: [
        {
          name: 'positive change → up class and + sign',
          code: `const t = mountFile('PriceTag.vue', { amount: 10, change: 3.5 })
const cls = [...t.find('[data-test="tag"]').classList]
expect(cls).toContain('price-tag')
expect(cls).toContain('price-tag--up')
expect(cls).not.toContain('price-tag--down')
expect(t.find('.change').textContent.trim()).toBe('+3.5%')`,
        },
        {
          name: 'negative change → down class',
          code: `const t = mountFile('PriceTag.vue', { amount: 10, change: -1.2 })
expect([...t.find('[data-test="tag"]').classList]).toContain('price-tag--down')
expect(t.find('.change').textContent.trim()).toBe('-1.2%')`,
        },
        {
          name: 'zero change → flat class',
          code: `const t = mountFile('PriceTag.vue', { amount: 10, change: 0 })
expect([...t.find('[data-test="tag"]').classList]).toContain('price-tag--flat')
expect(t.find('.change').textContent.trim()).toBe('0%')`,
        },
        {
          name: 'size lg adds price-tag--lg and classes update with props',
          code: `const t = mountFile('PriceTag.vue', { amount: 10, change: 1, size: 'lg' })
expect([...t.find('[data-test="tag"]').classList]).toContain('price-tag--lg')
await t.setProps({ change: -2, size: 'md' })
const cls = [...t.find('[data-test="tag"]').classList]
expect(cls).toContain('price-tag--down')
expect(cls).not.toContain('price-tag--up')
expect(cls).not.toContain('price-tag--lg')`,
        },
      ],
      hints: ['Create a `computed` that returns `[\'price-tag\', directionClass, { \'price-tag--lg\': props.size === \'lg\' }]`.', 'For the label: `(props.change > 0 ? \'+\' : \'\') + props.change + \'%\'`.'],
      answer: 'A computed returns the class array (static class, a direction class chosen from the sign, and an object for size); a second computed builds the signed label.',
      solution: {
        files: {
          'App.vue': `<script setup>\nimport PriceTag from './PriceTag.vue'\n</script>\n\n<template>\n  <PriceTag :amount="12.5" :change="3.5" size="lg" />\n</template>`,
          'PriceTag.vue': `<script setup>
import { computed } from 'vue'

const props = defineProps({
  amount: { type: Number, required: true },
  change: { type: Number, default: 0 },
  size: { type: String, default: 'md' },
})

const direction = computed(() => {
  if (props.change > 0) return 'up'
  if (props.change < 0) return 'down'
  return 'flat'
})

const classes = computed(() => [
  'price-tag',
  'price-tag--' + direction.value,
  { 'price-tag--lg': props.size === 'lg' },
])

const changeLabel = computed(() => (props.change > 0 ? '+' : '') + props.change + '%')
</script>

<template>
  <span :class="classes" data-test="tag">
    {{ amount.toFixed(2) }}
    <small class="change">{{ changeLabel }}</small>
  </span>
</template>

<style scoped>
.price-tag { font-weight: 700; }
.price-tag--lg { font-size: 1.5rem; }
.price-tag--up .change { color: #15803d; }
.price-tag--down .change { color: #b91c1c; }
.price-tag--flat .change { color: #57534e; }
</style>`,
        },
      },
      explanation: 'The direction is derived once and reused, so the class and the colour can never disagree. All styling lives in CSS keyed off the classes.',
      whyAsked: 'A small, realistic task that shows whether you keep class logic out of templates and derive state cleanly.',
      mistakes: ['Three separate `v-if` branches with duplicated markup.', 'Forgetting the zero case.', 'Writing class strings by concatenating with spaces.'],
      followUps: ['How would you convey "up" and "down" to screen-reader users without relying on colour?', 'How would you format the amount for different locales?'],
      modelAnswer: 'I\'d derive a `direction` computed from the sign — up, down or flat — and build the class list in another computed: the base class, `price-tag--` plus direction, and an object for the large size. A third computed formats the signed label. The CSS keys colours off those classes. For accessibility I wouldn\'t rely on colour alone: the sign is already in the text, and I could add visually hidden "up"/"down" words. Locale-aware formatting would use `Intl.NumberFormat`.',
    },
  ],

  takeaways: [
    'CSS handles space, Vue handles state: media/container queries and `clamp()` adapt layouts without JavaScript.',
    'Write mobile-first CSS; use container queries for reusable components that live in different layouts.',
    '`:class` / `:style` accept strings, arrays and objects; move growing logic into computeds and variant maps.',
    'Use custom properties via `:style` for continuous values, classes for discrete states.',
    '`useMediaQuery` (matchMedia + change listener + cleanup) is for when the component tree itself must change.',
    '`<Transition>` adds `*-enter-from/active/to` and `*-leave-from/active/to` classes — Vue 3 names — and every animation should respect `prefers-reduced-motion`.',
  ],
}
