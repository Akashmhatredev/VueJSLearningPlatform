// Lesson: ref() — the reference implementation of the lesson schema.
// See CONTENT_GUIDE.md for every field.

const counterApp = `<script setup>
import { ref } from 'vue'

const score = ref(0)

function increaseScore() {
  score.value++
}
</script>

<template>
  <h2>Score: {{ score }}</h2>
  <button @click="increaseScore">
    Increase Score
  </button>
</template>`

export default {
  id: 'ref',
  title: 'ref(): your first reactive value',
  summary: 'Store a value Vue can watch, so the screen updates by itself whenever the value changes.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['what-is-reactivity'],
  related: ['reactive', 'computed', 'watch', 'reactivity-utilities'],
  tags: ['reactivity', 'state', 'ref', '.value', 'unwrapping'],
  apis: [
    { name: 'ref()', summary: 'Creates a reactive, mutable reference object whose `.value` Vue tracks.' },
    { name: '.value', summary: 'The property you read and write on a ref in JavaScript.' },
    { name: 'isRef()', summary: 'Checks whether a value is a ref.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity Fundamentals: ref()', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html#ref' },
    { label: 'API — ref()', url: 'https://vuejs.org/api/reactivity-core.html#ref' },
  ],

  intro: `
\`ref()\` is the smallest building block of a Vue app's memory. You give it a starting value — a number, a string, an array, anything — and it hands back a little box that holds that value.

The special part: Vue **keeps an eye on the box**. When you put a new value in it, every piece of the screen that showed the old value is updated for you. You never write "find the element and change its text" again.
`,

  why: `
Without something like \`ref()\`, a web page is a photograph: it shows whatever was true when it was drawn. If a variable changes later, the page has no idea.

\`\`\`js
let score = 0
document.querySelector('h2').textContent = 'Score: ' + score

score++ // the variable is 1… but the page still says "Score: 0"
\`\`\`

In plain JavaScript you'd have to remember to update the DOM *every single time* the variable changes — in every function, for every element that shows it. Forget once and the page lies.

\`ref()\` exists so you can **change data and let Vue update the page**. The data becomes the single source of truth; the screen just follows it.
`,

  eli15: `
Imagine a scoreboard at a basketball game. The scorekeeper doesn't repaint the whole scoreboard after every basket — they change *one number*, and everyone in the stadium sees it.

In Vue, \`ref()\` is that number on the scoreboard. You write \`const score = ref(0)\` to say "this is a number the audience is watching, and it starts at 0".

When you want to change it, you write \`score.value++\`. The \`.value\` part means "the number *inside* the box". Vue sees the number change and updates every spot on the screen that shows \`score\`.

That's the whole idea: **change the value, the screen catches up.**
`,

  analogy: {
    title: 'The stadium scoreboard',
    body: `
A scoreboard has a display (what everyone sees) and a control desk (where the scorekeeper presses buttons). The scorekeeper never touches the lights directly — they press "+1" and the board updates itself.

\`ref()\` turns a plain value into that control desk. Your code presses buttons (\`score.value++\`), and Vue drives the lights (the DOM).
`,
    mapping: [
      ['the scoreboard number', 'the value inside the ref'],
      ['the control desk', '`score.value` in your JavaScript'],
      ['the lights people see', 'the rendered HTML (`{{ score }}`)'],
      ['the wiring between them', "Vue's reactivity system"],
    ],
  },

  visual: {
    type: 'scoreboard',
    props: { label: 'score', start: 0 },
    title: 'A ref you can poke',
    caption: 'Press the button: the value inside the ref changes, Vue notices, and only the number on screen is redrawn.',
    alt: 'An interactive scoreboard. A box labelled score.value holds a number. Pressing +1 increases it; an arrow labelled "Vue notices the change" points from the box to the rendered heading, which then shows the new number.',
  },

  syntax: [
    `
**Creating a ref.** Import \`ref\` from \`'vue'\` and call it with a starting value:
`,
    {
      code: `import { ref } from 'vue'

const count = ref(0)          // number
const name = ref('Ada')       // string
const todos = ref([])         // array
const user = ref(null)        // "nothing yet" — filled in later`,
      lang: 'js',
      title: 'creating refs',
    },
    `
**The rules:**

1. In **JavaScript**, read and write through \`.value\`: \`count.value\`, \`count.value = 5\`.
2. In the **template**, write just the name: \`{{ count }}\`. Vue unwraps top-level refs for you.
3. Reassigning the variable itself (\`count = 5\`) breaks the connection — declare refs with \`const\`.
4. A ref can hold *any* type. Objects and arrays put inside a ref are made deeply reactive too.
`,
    {
      callout: 'version',
      text: '`ref()` is part of Vue 3\'s core reactivity API and works in `<script setup>`, `setup()`, composables and plain `.js` modules.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: counterApp,
    intro: 'Here is the whole scoreboard app. Step through it line by line — the highlighted lines are explained on the right.',
    steps: [
      { lines: [2], text: '`import { ref } from \'vue\'` brings Vue\'s `ref` function into this component. Nothing reactive happens without importing it.' },
      { lines: [4], text: '`ref(0)` creates a reactive reference that starts at zero. We keep the box in a `const` because we change what is *inside* it, never the box itself.' },
      { lines: [6, 8], text: 'A normal function. `score.value++` changes the stored value — this is the moment Vue notices a change.' },
      { lines: [12], text: '`{{ score }}` shows the value in the template. No `.value` here: Vue automatically unwraps top-level refs in templates.' },
      { lines: [13, 15], text: '`@click="increaseScore"` runs our function on each click. Click → value changes → Vue re-renders just the text inside `<h2>`.' },
    ],
  },

  playground: {
    title: 'Scoreboard',
    objective: 'Run the counter, then change it in small, deliberate ways and watch how the screen follows the data.',
    files: { 'App.vue': counterApp },
    expected: 'A heading reading **Score: 0** and a button. Every click adds one. Open the **Reactive state** tab: `score` is listed as a `ref` — edit it there and the heading changes without any click.',
    experiments: [
      {
        id: 'start-value',
        task: 'Change the starting value so the score begins at **10** instead of 0. Run it.',
        hint: 'The starting value is the argument you pass to `ref(...)` on line 4.',
        tests: [{ name: 'the score starts at 10', code: `expect(text('h2')).toContain('Score: 10')` }],
        explain: 'The number you pass to `ref()` is only the *initial* value. Everything after that happens through `.value`.',
      },
      {
        id: 'decrease',
        task: 'Add a second button labelled **Decrease** that lowers the score by one.',
        hint: 'Write a `decreaseScore()` function that does `score.value--`, then add `<button @click="decreaseScore">Decrease</button>` to the template.',
        tests: [
          {
            name: 'a Decrease button lowers the score by 1',
            code: `const before = Number(text('h2').match(/-?\\d+/)[0])
const btn = findAll('button').find((b) => /decrease/i.test(b.textContent))
expect(btn).toBeTruthy()
await click(btn)
expect(Number(text('h2').match(/-?\\d+/)[0])).toBe(before - 1)`,
          },
        ],
        explain: 'Both buttons change the same ref, so both update the same heading. One source of truth, many ways to change it.',
      },
      {
        id: 'floor',
        task: 'Stop the score from going **below zero**, no matter how often Decrease is clicked.',
        hint: 'Guard the change: only decrement when `score.value > 0`.',
        tests: [
          {
            name: 'the score never drops below 0',
            code: `const btn = findAll('button').find((b) => /decrease/i.test(b.textContent))
expect(btn).toBeTruthy()
for (let i = 0; i < 30; i++) await click(btn)
expect(Number(text('h2').match(/-?\\d+/)[0])).toBe(0)`,
          },
        ],
        explain: 'Rules about your data belong next to the code that changes it. The template never needed to change — it just shows whatever `score` is.',
      },
      {
        id: 'inspect',
        task: 'Open the **Reactive state** tab under the preview and type a new number for `score`. Watch the heading.',
        hint: 'The inspector writes straight into `score.value` inside the sandbox.',
        explain: 'Nothing re-ran your component code. Vue only re-rendered the part of the template that reads `score`. That is reactivity.',
      },
    ],
  },

  animation: {
    type: 'reactivity',
    props: { preset: 'ref' },
    title: 'Inside a ref update',
    caption: 'Step through what happens between `score.value++` and the new number on screen.',
    alt: 'A step-by-step diagram: the template reads score during render, Vue records that dependency; score.value++ writes a new value; Vue triggers the render effect that depends on score; the effect is queued and runs; the h2 text node is patched in the DOM.',
  },

  internals: {
    beginner: `
A ref is an object with one important property: \`value\`. When the component draws itself, Vue notes "this template read \`score.value\`". Later, when you write to \`score.value\`, Vue looks up who read it and redraws them. Read = subscribe, write = notify.
`,
    technical: [
      `
\`ref()\` returns a \`RefImpl\` object. Its \`value\` is a **getter/setter pair**:

- the **getter** calls \`track()\`, recording the currently running *effect* (for a component, its render effect) as a subscriber of this ref;
- the **setter** compares old and new values (with \`Object.is\`) and, if they differ, calls \`trigger()\`, which schedules every subscribed effect to re-run.
`,
      {
        code: `// A simplified model — not Vue's real source
function ref(initial) {
  let inner = initial
  const subscribers = new Set()
  return {
    get value() {
      if (activeEffect) subscribers.add(activeEffect) // track
      return inner
    },
    set value(next) {
      if (Object.is(next, inner)) return
      inner = next
      subscribers.forEach((effect) => queue(effect))  // trigger
    },
  }
}`,
        lang: 'js',
        title: 'mental model of a ref',
      },
      `
Re-renders are **batched**: if you change \`score.value\` three times in one click handler, the component still re-renders once, in the next microtask. If you pass an object or array to \`ref()\`, Vue wraps it with \`reactive()\` internally, so nested changes are tracked too.

**Template unwrapping:** refs that are *top-level* properties of the template's context are unwrapped automatically, which is why \`{{ score }}\` works. A ref nested inside a plain object is *not* unwrapped inside expressions: with \`const obj = { count: ref(1) }\`, \`{{ obj.count + 1 }}\` renders \`[object Object]1\`. One exception: if the nested ref is the *final value* of an interpolation, \`{{ obj.count }}\` does render \`1\`, because text interpolation unwraps refs when converting to a string.
`,
    ],
    production: `
- Prefer \`ref()\` as your default for component state — it works for primitives and objects and survives destructuring when you return it from composables.
- For big data you replace wholesale (API payloads, large lists), consider \`shallowRef()\` so Vue doesn't make every nested property reactive.
- Never export a mutable module-level ref casually: it becomes global shared state. Put shared state in a store or a deliberately designed composable.
- Watch for accidental \`.value\` in templates (\`{{ score.value }}\` happens to work for top-level refs but signals confusion in code review) and *missing* \`.value\` in scripts — the most common source of "it doesn't update" bugs.
`,
  },

  mistakes: [
    {
      title: 'Forgetting `.value` in JavaScript',
      wrong: { code: `const score = ref(0)\n\nscore++ // TypeError in strict code, or a silent no-op`, lang: 'js' },
      right: { code: `const score = ref(0)\n\nscore.value++`, lang: 'js' },
      explanation: '`score` is the box, not the number. `score++` tries to add one to an *object*. Always reach inside with `.value` in JavaScript. (With `const`, `score++` is a TypeError: "Assignment to constant variable".)',
    },
    {
      title: 'Replacing the ref instead of its value',
      wrong: { code: `let todos = ref([])\n\nasync function load() {\n  todos = ref(await fetchTodos()) // template still shows the old, empty ref\n}`, lang: 'js' },
      right: { code: `const todos = ref([])\n\nasync function load() {\n  todos.value = await fetchTodos()\n}`, lang: 'js' },
      explanation: 'The template was wired to the *original* ref object. Creating a new ref and assigning it to the variable leaves the template pointing at the old one. Declare refs with `const` and assign to `.value`.',
    },
    {
      title: 'Writing `.value` inside the template',
      wrong: { code: `<p>{{ score.value + 1 }}</p>`, lang: 'vue' },
      right: { code: `<p>{{ score + 1 }}</p>`, lang: 'vue' },
      explanation: 'Top-level refs are already unwrapped in templates. It happens to work here, but it is noisy and breaks as soon as the ref is passed down as a prop (props are unwrapped values, not refs).',
    },
  ],

  debugging: [
    {
      symptom: 'The variable changes (console.log shows it) but the screen does not.',
      cause: 'The value is a plain `let` variable, not a ref — Vue has nothing to track.',
      fix: 'Declare it with `ref()` and change it through `.value`.',
    },
    {
      symptom: 'An expression like `{{ obj.count + 1 }}` shows `[object Object]1`.',
      cause: 'A ref nested inside a plain object is used inside an expression, where it is not auto-unwrapped (only top-level refs are, plus a nested ref that is the final value of `{{ }}`).',
      fix: 'Destructure it to the top level (`const { count } = obj`), write `obj.count.value + 1`, or make the object `reactive()` so nested refs unwrap.',
    },
    {
      symptom: '`TypeError: Assignment to constant variable` when updating.',
      cause: 'Assigning to the ref variable (`score = 5`) instead of its value.',
      fix: 'Write `score.value = 5`.',
    },
    {
      symptom: 'Updates work in one component but a second component shows stale data.',
      cause: 'Each component called a function that creates its own new ref, so they hold separate state.',
      fix: 'If they must share, create the ref once (in a store, a parent, or a shared composable module) and pass it around.',
    },
  ],

  bestPractices: [
    'Declare refs with `const` — you change `.value`, never the variable.',
    'Name refs after what they hold (`isOpen`, `selectedUser`), not after the fact they are refs (`openRef`).',
    'Keep the initial value the same type as later values (`ref([])` for a list, `ref(null)` for "not loaded yet") so templates can rely on its shape.',
    'Use `ref()` by default; reach for `reactive()` when you genuinely want an object you will never replace.',
    'Derive values with `computed()` instead of storing copies in more refs that you must keep in sync.',
  ],

  useCases: [
    'Counters, toggles and flags: `isMenuOpen`, `likes`, `step` in a wizard.',
    'Form field values bound with `v-model`.',
    'Data loaded from an API: `const users = ref([])`, `const error = ref(null)`, `const loading = ref(false)`.',
    'A template ref to a DOM element: `const input = ref(null)` paired with `ref="input"` in the template.',
    'The state returned from composables like `useMouse()` → `{ x, y }` as refs that stay reactive after destructuring.',
  ],

  whenToUse: {
    use: [
      'You need a value the UI should react to — primitives especially (`number`, `string`, `boolean`).',
      'You will replace the whole value at times (`list.value = newList`).',
      'You return state from a composable and want callers to destructure it safely.',
    ],
    avoid: [
      'The value never changes and never appears in the UI — a plain `const` is clearer and cheaper.',
      'You only need a value computed from other state — use `computed()`.',
      'You have a huge, deeply nested object you only ever replace — `shallowRef()` avoids converting everything inside.',
    ],
  },

  comparison: {
    title: 'ref vs related tools',
    headers: ['', '`ref()`', '`reactive()`', 'plain `let`', '`computed()`'],
    rows: [
      ['Holds', 'any value', 'objects / arrays / Maps / Sets only', 'anything', 'a value derived from others'],
      ['Read in JS', '`x.value`', '`obj.prop`', '`x`', '`x.value`'],
      ['Screen updates on change?', 'yes', 'yes', '**no**', 'yes (when dependencies change)'],
      ['Can replace the whole value?', 'yes (`x.value = …`)', 'no — reassigning loses reactivity', 'yes, but invisible to Vue', 'only if writable'],
      ['Survives destructuring?', 'yes (the ref itself)', 'no — use `toRefs()`', 'n/a', 'yes'],
    ],
    note: 'Rule of thumb: start with `ref()`. Read [reactive() and ref vs reactive](lesson:reactive) next.',
  },

  quiz: [
    {
      id: 'ref-q1',
      type: 'mcq',
      prompt: 'Inside `<script setup>`, how do you add 1 to `const likes = ref(0)`?',
      options: [
        { text: '`likes++`', why: '`likes` is the ref object. You must change the value inside it.' },
        { text: '`likes.value++`' },
        { text: '`likes = likes + 1`', why: 'That replaces the ref (and fails because it is a `const`).' },
        { text: '`ref(likes + 1)`', why: 'This creates a brand-new ref the template knows nothing about.' },
      ],
      answer: 1,
      explanation: 'In JavaScript you read and write a ref through `.value`. Vue tracks reads and writes of `.value`.',
    },
    {
      id: 'ref-q2',
      type: 'output',
      prompt: 'What does the heading show after the button is clicked **three** times?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const n = ref(2)
function bump() { n.value = n.value * 2 }
</script>

<template>
  <h2>{{ n }}</h2>
  <button @click="bump">x2</button>
</template>`,
      },
      options: ['6', '8', '16', '2 — the heading does not update'],
      answer: 2,
      explanation: '2 → 4 → 8 → 16. Each click doubles `n.value`, and the heading re-renders because it reads the ref.',
    },
    {
      id: 'ref-q3',
      type: 'bug',
      prompt: 'This counter never updates the screen. Click the line that causes the bug.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

let count = 0

function add() {
  count++
}
</script>

<template>
  <button @click="add">{{ count }}</button>
</template>`,
      },
      answerLine: 4,
      explanation: '`count` is a plain variable, so Vue cannot track it. It should be `const count = ref(0)` with `count.value++` in `add()`.',
    },
    {
      id: 'ref-q4',
      type: 'fill',
      prompt: 'Fill the blanks so `message` is reactive and can be changed.',
      code: { lang: 'js', code: `import { ___ } from 'vue'\n\nconst message = ref('hi')\n\nfunction shout() {\n  message.___ = message.value.toUpperCase()\n}` },
      answer: [['ref'], ['value']],
      explanation: 'Import `ref`, create the ref, and write through `.value`.',
    },
    {
      id: 'ref-q5',
      type: 'mcq',
      prompt: 'Why can you write `{{ score }}` in the template but must write `score.value` in the script?',
      options: [
        { text: 'Templates are compiled and Vue automatically unwraps top-level refs there.' },
        { text: 'Templates run in a different JavaScript engine.', why: 'They run in the same engine; the compiler rewrites template expressions.' },
        { text: '`.value` is only needed for numbers.', why: 'Every ref uses `.value` in JavaScript, whatever it holds.' },
        { text: 'The template makes a copy of the value when the component mounts.', why: 'If it were a copy it would never update.' },
      ],
      answer: 0,
      explanation: 'The template compiler accesses refs through a proxy that unwraps them (`score.value` behind the scenes). Plain JavaScript has no such magic, so you write `.value` yourself.',
    },
    {
      id: 'ref-q6',
      type: 'short',
      prompt: 'In two or three sentences: what problem does `ref()` solve compared to a plain `let` variable?',
      answer: 'A plain variable is invisible to Vue, so changing it never updates the page. `ref()` wraps the value in an object whose reads and writes Vue tracks, so when `.value` changes, everything that used it re-renders automatically.',
    },
  ],

  exercises: [
    {
      id: 'floor-counter',
      title: 'A counter that cannot go below zero',
      difficulty: 'beginner',
      prompt: `
Build a counter with **+** and **−** buttons.

- Show the number in an element with \`class="count"\`.
- The **+** button has \`class="inc"\`, the **−** button \`class="dec"\`.
- The count starts at **0** and must **never go below 0**.
- Bonus: disable the − button when the count is 0.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

// TODO: create the count

</script>

<template>
  <p class="count">0</p>
  <button class="dec">−</button>
  <button class="inc">+</button>
</template>`,
      },
      hints: [
        'Create the state with `const count = ref(0)` and show it with `{{ count }}`.',
        'Write `increment()` and `decrement()` functions and attach them with `@click`.',
        'In `decrement()`, only subtract when `count.value > 0`. For the bonus, bind `:disabled="count === 0"`.',
      ],
      solution: {
        explanation: 'The rule "never below zero" lives in `decrement()`, next to the data it protects. The `:disabled` binding is a nicety for users — the guard in the function is what actually enforces the rule.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}

function decrement() {
  if (count.value > 0) count.value--
}
</script>

<template>
  <p class="count">{{ count }}</p>
  <button class="dec" :disabled="count === 0" @click="decrement">−</button>
  <button class="inc" @click="increment">+</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts at 0', code: `expect(text('.count')).toBe('0')` },
        { name: '+ adds one each click', code: `await click('.inc'); await click('.inc'); expect(text('.count')).toBe('2')` },
        { name: '− subtracts one', code: `await click('.inc'); await click('.inc'); await click('.dec'); expect(text('.count')).toBe('1')` },
        {
          name: 'never goes below 0',
          code: `await click('.inc')
await click('.inc')
const dec = find('.dec')
for (let i = 0; i < 5; i++) { dec.disabled = false; await click('.dec') }
expect(text('.count')).toBe('0')`,
        },
      ],
    },
    {
      id: 'like-toggle',
      title: 'Like button with a toggle',
      difficulty: 'beginner',
      prompt: `
Make a like button:

- A \`<button class="like">\` shows **♡ Like** when not liked and **♥ Liked** when liked.
- A \`<span class="likes">\` shows the number of likes, starting at **41**.
- Clicking toggles liked/unliked and adds or removes one like.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

</script>

<template>
  <button class="like">♡ Like</button>
  <span class="likes">41</span>
</template>`,
      },
      hints: [
        'You need two refs: `liked` (a boolean) and `likes` (a number).',
        'In a `toggle()` function, flip `liked.value` and then add or subtract 1 from `likes.value` depending on the new state.',
        'For the label, use a ternary in the template: `{{ liked ? \'♥ Liked\' : \'♡ Like\' }}`.',
      ],
      solution: {
        explanation: 'Two pieces of state, one function that keeps them consistent. Later you will see `computed()` can derive labels like this instead of writing ternaries in the template.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const liked = ref(false)
const likes = ref(41)

function toggle() {
  liked.value = !liked.value
  likes.value += liked.value ? 1 : -1
}
</script>

<template>
  <button class="like" @click="toggle">{{ liked ? '♥ Liked' : '♡ Like' }}</button>
  <span class="likes">{{ likes }}</span>
</template>`,
        },
      },
      tests: [
        { name: 'starts unliked with 41 likes', code: `expect(text('.like')).toContain('Like'); expect(text('.like')).not.toContain('Liked'); expect(text('.likes')).toBe('41')` },
        { name: 'one click likes it (42)', code: `await click('.like'); expect(text('.like')).toContain('Liked'); expect(text('.likes')).toBe('42')` },
        { name: 'second click unlikes it (41)', code: `await click('.like'); await click('.like'); expect(text('.like')).not.toContain('Liked'); expect(text('.likes')).toBe('41')` },
      ],
    },
  ],

  interview: [
    {
      id: 'ref-value-template',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Why do we use `.value` with `ref()` in JavaScript but usually not in Vue templates?',
      answer: 'A ref is an object that wraps a value so Vue can track reads and writes through its `.value` getter/setter. In JavaScript you must access `.value` explicitly; in templates, Vue automatically unwraps top-level refs, so `{{ count }}` reads `count.value` for you.',
      explanation: 'JavaScript can\'t intercept reading a plain variable, so Vue puts the value inside an object where it *can* intercept access — that\'s why `.value` exists. The template compiler knows which bindings are refs and inserts the `.value` access for you.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const count = ref(0)
const inc = () => count.value++   // JS: explicit .value
</script>

<template>
  <button @click="inc">{{ count }}</button>  <!-- template: unwrapped -->
</template>`,
      },
      whyAsked: 'It checks whether you understand that reactivity is implemented through property access, not magic — and whether you\'ll write correct script code.',
      mistakes: [
        'Saying `.value` is "just syntax" without explaining tracking.',
        'Claiming refs are unwrapped everywhere — refs nested in plain objects are not unwrapped inside template expressions (e.g. `{{ obj.count + 1 }}`).',
        'Confusing it with `reactive()`, which never uses `.value`.',
      ],
      followUps: [
        'When is a ref *not* automatically unwrapped in a template?',
        'What happens if you put a ref inside a `reactive()` object?',
        'Why does `reactive()` not need `.value`?',
      ],
      modelAnswer: 'JavaScript can\'t detect when you read or write a plain variable, so `ref()` wraps the value in an object with a getter and setter on `.value`. The getter tracks who\'s reading, the setter triggers updates. That\'s why script code says `count.value`. In templates, the compiler and the render proxy unwrap top-level refs automatically, so `{{ count }}` just works. One caveat: a ref nested inside a plain object isn\'t unwrapped inside expressions like `{{ obj.count + 1 }}` — though `{{ obj.count }}` on its own still renders the value.',
      challenge: 'With `const obj = { count: ref(1) }`, predict what `{{ obj.count }}` and `{{ obj.count + 1 }}` render. Then try both in the playground.',
    },
    {
      id: 'ref-vs-let',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'A component has `let total = 0` and a button that runs `total++`. What does the template `{{ total }}` show after three clicks, and why?',
      code: {
        lang: 'vue',
        code: `<script setup>
let total = 0
function add() { total++ }
</script>

<template>
  <button @click="add">{{ total }}</button>
</template>`,
      },
      options: ['3', '0', 'NaN', 'It throws an error on click'],
      correctOption: 1,
      answer: 'It still shows **0**. `total` does change in memory, but it is a plain variable, so Vue never re-renders the component.',
      explanation: 'Only reactive state (refs, reactive objects, computed values, props) triggers re-renders. A plain `let` is captured once and invisible to Vue\'s tracking.',
      whyAsked: 'A quick filter question: candidates who have built real Vue apps recognise this bug instantly.',
      mistakes: ['Answering 3 because "the variable changed".', 'Thinking Vue re-runs `<script setup>` on every render — it runs once per component instance.'],
      followUps: ['How would you fix it?', 'Does `<script setup>` run again when the component re-renders?'],
      modelAnswer: 'It shows 0. The variable increments in memory, but it isn\'t reactive, so nothing tells Vue to re-render. `<script setup>` runs once per instance — only reactive state changes cause the template to update. Fix: `const total = ref(0)` and `total.value++`.',
    },
    {
      id: 'ref-how-tracking',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'How does a ref know which parts of the UI to update when its value changes?',
      answer: 'When a component renders, it runs inside a reactive *effect*. Reading `ref.value` during that run records the effect as a subscriber (track). Writing a new value calls `trigger`, which schedules every subscribed effect — including that component\'s render — to re-run, batched in the next microtask.',
      explanation: 'Think of reading as "subscribing" and writing as "publishing". Vue only re-renders components that actually read the ref during their last render.',
      whyAsked: 'Distinguishes people who memorised the API from people who understand dependency tracking — essential for debugging performance and "why didn\'t it update?" issues.',
      mistakes: [
        'Saying Vue "watches" every variable or polls for changes.',
        'Believing the entire app re-renders on every change.',
        'Forgetting that updates are batched and asynchronous.',
      ],
      followUps: ['What does `nextTick()` give you?', 'Does setting a ref to the same value trigger a re-render?', 'How is `computed()` built on the same mechanism?'],
      modelAnswer: 'Each component\'s render runs as a reactive effect. While it runs, every `ref.value` read registers that effect as a dependency — that\'s tracking. When I assign a new value, the ref\'s setter triggers its dependents, Vue queues those effects and flushes them in a microtask, so several changes in one tick produce one re-render. Setting the same value (by `Object.is`) triggers nothing.',
    },
    {
      id: 'ref-replace-bug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'After the API call finishes, this list stays empty on screen even though `console.log(items)` shows data. What is wrong?',
      code: {
        lang: 'js',
        code: `let items = ref([])

async function load() {
  const data = await fetch('/api/items').then((r) => r.json())
  items = ref(data)
  console.log(items.value) // has data
}`,
      },
      answer: '`items = ref(data)` replaces the variable with a *new* ref. The template is still bound to the original ref object, which is still empty. Assign to the existing ref instead: `items.value = data`, and declare it with `const`.',
      explanation: 'The template grabbed a reference to the first box. Making a new box doesn\'t move the template to it.',
      whyAsked: 'Common real-world bug in data loading; tests understanding that the ref object identity matters.',
      mistakes: ['Blaming async timing or suggesting `nextTick`.', 'Suggesting `reactive()` without explaining the identity problem.'],
      followUps: ['Why does `const` help prevent this?', 'Would `reactive([])` with `items = data` have the same problem?'],
      modelAnswer: 'The code reassigns the variable to a new ref, so the template is still reading the old, empty ref. Refs work by identity — you change `.value`, not the binding. Fix: `const items = ref([])` and `items.value = data`. Using `const` turns this mistake into an immediate error.',
    },
    {
      id: 'ref-deep',
      difficulty: 'advanced',
      type: 'comparison',
      minutes: 4,
      question: 'If you store an object in `ref()`, is a change to a nested property reactive? How does that differ from `shallowRef()`?',
      answer: 'Yes. `ref()` passes objects through `reactive()`, so `user.value.address.city = "Pune"` triggers updates. `shallowRef()` only tracks the `.value` assignment itself; nested mutations are not reactive unless you replace `.value` or call `triggerRef()`.',
      explanation: '`ref` = deep by default (convenient). `shallowRef` = only the outer box is watched (cheaper for big data you replace wholesale).',
      code: {
        lang: 'js',
        code: `const deep = ref({ count: 0 })
deep.value.count++            // ✅ triggers

const shallow = shallowRef({ count: 0 })
shallow.value.count++         // ❌ no update
shallow.value = { count: 1 }  // ✅ triggers
triggerRef(shallow)           // ✅ force an update after mutation`,
      },
      whyAsked: 'Probes knowledge of reactivity costs — relevant when handling large datasets or third-party class instances.',
      mistakes: ['Saying refs are always shallow.', 'Not knowing `triggerRef()` exists.', 'Ignoring the performance motivation.'],
      followUps: ['When would you choose `shallowRef` in production?', 'What does `markRaw()` do?'],
      modelAnswer: 'A normal ref is deep: objects inside it are converted with `reactive()`, so nested mutations trigger updates. `shallowRef` only reacts to replacing `.value`, which avoids proxying big structures — useful for large API payloads, immutable data, or class instances from libraries. After mutating inside a shallowRef you can call `triggerRef` to force an update.',
    },
    {
      id: 'ref-coding-toggle',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Implement a show/hide toggle: a button with `class="toggle"` toggles a paragraph with `class="secret"`. The button text should read "Show" when hidden and "Hide" when visible. Start hidden.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

</script>

<template>
  <button class="toggle">Show</button>
  <p class="secret">The cake is a lie.</p>
</template>`,
        },
      },
      tests: [
        { name: 'starts hidden with a Show button', code: `expect(exists('.secret') && isVisible('.secret')).toBe(false); expect(text('.toggle')).toBe('Show')` },
        { name: 'click shows it and the button says Hide', code: `await click('.toggle'); expect(isVisible('.secret')).toBe(true); expect(text('.toggle')).toBe('Hide')` },
        { name: 'second click hides it again', code: `await click('.toggle'); await click('.toggle'); expect(exists('.secret') && isVisible('.secret')).toBe(false)` },
      ],
      hints: ['One boolean ref is enough.', 'Use `v-if` (or `v-show`) on the paragraph and a ternary for the label.'],
      answer: 'Keep one boolean ref, flip it on click, and drive both the paragraph and the label from it.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>

<template>
  <button class="toggle" @click="open = !open">{{ open ? 'Hide' : 'Show' }}</button>
  <p v-if="open" class="secret">The cake is a lie.</p>
</template>`,
        },
      },
      explanation: 'A single source of truth (`open`) controls two different pieces of UI, so they can never disagree.',
      whyAsked: 'A warm-up coding task to see if you reach for state + template bindings instead of manual DOM manipulation.',
      mistakes: ['Using `document.querySelector` to toggle a class.', 'Keeping separate state for the label and the visibility.'],
      followUps: ['Would you use `v-if` or `v-show` here, and why?', 'How would you make it accessible (aria-expanded)?'],
      modelAnswer: 'I\'d hold one boolean ref, `open`, flip it in the click handler and derive both the paragraph\'s visibility and the button label from it. For accessibility I\'d add `aria-expanded` bound to `open` and `aria-controls` pointing at the paragraph.',
    },
  ],

  takeaways: [
    '`ref(initial)` creates a reactive box; the value lives in `.value`.',
    'In JavaScript use `.value`; in templates top-level refs are unwrapped automatically.',
    'Change `.value`, never the variable — declare refs with `const`.',
    'Reading `.value` during render subscribes; writing it triggers a batched re-render of only what depends on it.',
    'Objects inside a `ref` are deeply reactive; use `shallowRef` for big data you replace wholesale.',
  ],
}
