// Lesson: Live coding & debugging interviews.

const buggyApp = `<script setup>
import { ref, computed } from 'vue'

const products = ref([
  { id: 1, name: 'Desk Lamp', price: 39 },
  { id: 2, name: 'Notebook', price: 6 },
  { id: 3, name: 'Headphones', price: 89 },
  { id: 4, name: 'Coffee Mug', price: 12 },
])
const query = ref('')
const cart = ref([])

const visible = computed(() => {
  const q = query.value.trim().toLowerCase()
  return products.value.filter((p) => p.name.includes(q))
})

const summary = computed(
  () => \`Showing \${visible.value.length} of \${products.length} products\`
)

function addToCart(product) {
  cart.push(product)
}

function clearSearch() {
  query.value === ''
}
</script>

<template>
  <input class="search" v-model="query" placeholder="Search products" />
  <button class="clear" @click="clearSearch">Clear</button>
  <p class="summary">{{ summary }}</p>
  <ul>
    <li v-for="p in visible" :key="p.id" class="product">
      {{ p.name }} — \${{ p.price }}
      <button class="add" @click="addToCart(p)">Add</button>
    </li>
  </ul>
  <p class="cart-count">Cart: {{ cart.length }} items</p>
</template>`

export default {
  id: 'live-coding',
  title: 'Live coding & debugging interviews',
  summary: 'A calm, repeatable method for coding and debugging in front of an interviewer: clarify, plan, build the smallest working slice, test, extend — and debug by evidence, not guesswork.',
  difficulty: 'intermediate',
  minutes: 45,
  prerequisites: ['answering-framework', 'list-rendering', 'v-model-forms', 'computed'],
  related: ['frontend-system-design', 'rapid-review', 'debugging-reactivity', 'watch', 'list-rendering'],
  tags: ['interview', 'live coding', 'debugging', 'pair programming', 'problem solving', 'devtools', 'debounce', 'keys', 'v-model'],
  apis: [
    { name: 'Clarify → Plan → Build → Test → Extend', summary: 'The live-coding loop: never write code before you know what "done" means.' },
    { name: 'Reproduce → Read → Isolate → Hypothesise → Verify → Fix', summary: 'The debugging loop: change one thing at a time, based on evidence.' },
    { name: 'Vue DevTools', summary: 'Browser extension to inspect components, props, state, Pinia stores, routes and events.' },
  ],
  docs: [
    { label: 'Vue Guide — Reactivity Fundamentals', url: 'https://vuejs.org/guide/essentials/reactivity-fundamentals.html' },
    { label: 'Vue Guide — List Rendering: maintaining state with key', url: 'https://vuejs.org/guide/essentials/list.html#maintaining-state-with-key' },
    { label: 'Vue Guide — Form Input Bindings: modifiers', url: 'https://vuejs.org/guide/essentials/forms.html#modifiers' },
    { label: 'Vue DevTools', url: 'https://devtools.vuejs.org/' },
  ],

  intro: `
In a live-coding round you build or fix something small — a filterable list, a counter with rules, a debounced search, a buggy component — while an interviewer watches and talks with you.

They're not grading whether you type fast. They're watching **how you work**:

- Do you understand the problem before you start?
- Do you get something working early, then improve it?
- Do you explain your thinking so they can follow (and help)?
- When something breaks, do you debug methodically or flail?

This lesson gives you a loop for building, a loop for debugging, and practice on the exact kinds of tasks Vue interviews use. The playground is a mock debugging round: a small app with **four planted bugs**.
`,

  why: `
Most people who fail live-coding rounds don't fail because they lack knowledge. They fail because of process:

- They start typing immediately, build the wrong thing, and run out of time.
- They write everything at once, run it at the end, and face five errors together.
- They go silent, so the interviewer can't give hints or credit their reasoning.
- They debug by changing random things until something works.

A repeatable process fixes all four, and it reduces stress: when you know your next step is always "make the smallest thing work, then check it", there's much less room for panic.

It's also simply how good engineers work every day. The habits you practise here — small steps, fast feedback, evidence-based debugging — will make you faster at your job, not just at interviews.
`,

  eli15: `
Imagine building a Lego model while a friend watches and can give you tips.

The panicky way: dump all the bricks out, start snapping random pieces together, and only look at the picture on the box at the very end. Something's wrong — but what? You have to pull everything apart.

The calm way:

1. **Look at the picture first** and ask "Is the spaceship supposed to have wings?" (clarify).
2. **Plan**: base first, then cockpit, then wings.
3. **Build the base and check it** against the picture.
4. **Add one part at a time**, checking each.
5. **Say what you're doing** — "Now I'm adding the cockpit" — so your friend can say "Wait, that's the wrong grey!"

And if something doesn't fit? Don't smash it. Look closely at *which* piece is wrong. That's debugging.
`,

  analogy: {
    title: 'A cooking show',
    body: `
A cooking-show chef reads the recipe aloud, sets out the ingredients, and narrates while cooking ("now I'm browning the onions — we want them golden, not burnt"). They taste as they go. When something goes wrong, they say so, figure out why ("too much salt — I'll balance it with lemon"), and carry on. The audience learns as much from the narration and the recovery as from the finished dish.
`,
    mapping: [
      ['reading the recipe aloud', 'restating the requirements and asking questions'],
      ['setting out ingredients', 'planning: state, components, steps'],
      ['cooking one step at a time', 'building the smallest working slice first'],
      ['tasting as you go', 'running and checking after every small change'],
      ['narrating', 'thinking aloud so the interviewer can follow and help'],
      ['fixing a mistake on camera', 'methodical debugging — calm recovery earns points'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The live-coding loop',
    caption: 'Step through a typical round. The inner loop — build a slice, run it, check it — repeats many times; that\'s where most of the time should go.',
    alt: 'A diagram of six boxes: Clarify, Plan, Build smallest slice, Run and check, Extend, and Recap. Build, run and extend form a repeating loop; a dashed arrow from run back to build shows small iterations.',
    props: {
      layout: 'grid',
      cols: 3,
      nodes: [
        { id: 'clarify', label: 'Clarify', note: 'inputs, outputs, edge cases', tone: 'acid' },
        { id: 'plan', label: 'Plan', note: 'state + steps, out loud', tone: 'cobalt' },
        { id: 'build', label: 'Build a slice', note: 'smallest working piece', tone: 'kraft' },
        { id: 'recap', label: 'Recap', note: 'trade-offs, next steps', tone: 'ink' },
        { id: 'extend', label: 'Extend', note: 'next requirement', tone: 'paper' },
        { id: 'check', label: 'Run & check', note: 'see it work', tone: 'red' },
      ],
      edges: [
        { from: 'clarify', to: 'plan' },
        { from: 'plan', to: 'build' },
        { from: 'build', to: 'check' },
        { from: 'check', to: 'extend' },
        { from: 'extend', to: 'build', label: 'repeat', dashed: true },
        { from: 'extend', to: 'recap' },
      ],
      steps: [
        { focus: ['clarify'], text: '**Clarify (a few minutes, not more).** Restate the task. Ask about inputs, outputs, edge cases: "Case-insensitive search? What shows when nothing matches? Is the data static or from an API?" Write the answers as a checklist in a comment.' },
        { focus: ['plan'], edges: ['clarify->plan'], text: '**Plan out loud.** "I\'ll keep `query` in a ref, derive `results` with a computed, render with v-for keyed by id, then add the empty state." The interviewer can redirect you *before* you waste time.' },
        { focus: ['build'], edges: ['plan->build'], text: '**Build the smallest slice that runs** — render the static list first. Hard-code things if it gets you to a running state faster; you\'ll replace them.' },
        { focus: ['check'], edges: ['build->check'], text: '**Run and check every few minutes.** Look at the preview and the console. Catching one error at a time is far easier than five at once.' },
        { focus: ['extend', 'build'], edges: ['check->extend', 'extend->build'], text: '**Extend one requirement at a time**: filtering, then case-insensitivity, then the empty state. Narrate each: "Next, the empty state."' },
        { focus: ['recap'], edges: ['extend->recap'], text: '**Recap at the end** (or when time is nearly up): what works, what you\'d improve with more time — tests, accessibility, debouncing, error states. This shows judgement even if you didn\'t finish.' },
      ],
    },
  },

  syntax: [
    `
#### Start every task with a comment checklist
`,
    {
      code: `<script setup>
// Requirements (confirmed with interviewer):
// [ ] input filters products by name, case-insensitive
// [ ] show "N results"
// [ ] show "No matches" when empty
// [ ] (stretch) debounce the search
import { ref, computed } from 'vue'
</script>`,
      lang: 'vue',
      title: 'clarify, then write it down',
    },
    `
#### Questions worth asking before coding

- **Inputs:** Where does the data come from? Static array, prop, API? What shape?
- **Outputs:** What exactly should render? Any formatting (currency, dates)?
- **Edge cases:** Empty list? No matches? Very long text? Duplicate names?
- **Constraints:** Composition or Options API? Libraries allowed? Do they care about styling?
- **Scope:** "Should I focus on functionality first and polish later?"

#### Think-aloud phrases

| Moment | Say |
|---|---|
| Starting | "I'll get the static list rendering first, then add filtering." |
| Choosing | "I'll use a computed here because it's derived from \`query\` and the list." |
| Unsure | "I don't remember if \`includes\` is case-sensitive — I'll check by running it." |
| Bug appears | "The count says undefined. Let me read the error and log the value." |
| Short on time | "I'll leave the debounce as a TODO and make sure the core works." |

#### The debugging loop
`,
    {
      code: `1. REPRODUCE   Can I make it fail on demand? What exact steps?
2. READ        Read the whole error message and the line number. Read the code that runs.
3. ISOLATE     Where does reality diverge from expectation? Log / inspect values at each step.
4. HYPOTHESISE "I think cart is a ref, so cart.push doesn't exist."
5. VERIFY      Check the hypothesis (log typeof cart, look in DevTools) BEFORE changing code.
6. FIX         Change one thing. Re-run the reproduction.
7. PREVENT     Mention the test or lint rule that would have caught it.`,
      lang: 'text',
      title: 'debug by evidence',
    },
    `
#### Vue bugs that show up again and again

| Symptom | Usual suspect |
|---|---|
| Value changes, screen doesn't | missing \`.value\` in script, plain \`let\` instead of \`ref\`, destructured reactive object |
| \`undefined\` in text | \`.length\`/property read on a ref without \`.value\`, data not loaded yet |
| \`x.push is not a function\` | calling array methods on the ref instead of \`.value\` |
| \`"2" + 1 = "21"\` from an input | \`v-model\` without \`.number\` |
| Inputs keep the wrong values after reorder | \`:key="index"\` |
| Crash on first render with async data | reading \`user.name\` before \`user\` exists — use \`v-if\` or \`?.\` |
| Handler runs at render time | \`@click="save()"\` vs \`:onClick="save()"\` confusion, or calling instead of passing in JS |
| Nothing happens, no error | a comparison \`===\` where an assignment \`=\` was meant |
`,
    {
      callout: 'tip',
      title: 'Your tools',
      text: 'Use the console (`console.log({ cart })` prints the name with the value), the browser debugger (`debugger;` statements), and **Vue DevTools** to inspect component state, props and Pinia stores. In this sandbox, the **Reactive state** tab under the preview shows the root component\'s refs.',
    },
  ],

  walkthrough: {
    title: 'App.vue (with four planted bugs)',
    lang: 'vue',
    code: buggyApp,
    intro: 'A mock debugging round. Read it the way you would in an interview — top to bottom, saying what each part *should* do — and spot where reality diverges.',
    steps: [
      { lines: [4, 11], text: 'State: `products` and `cart` are refs holding arrays; `query` is a ref bound to the input. Remember: in `<script>`, refs need `.value`.' },
      { lines: [13, 16], text: '**Bug 1.** The query is lowercased, but `p.name` isn\'t — "Desk Lamp".includes("lamp") is false. Search only works if you type the exact capitalisation.' },
      { lines: [18, 20], text: '**Bug 2.** `products.length` reads `.length` of the *ref object*, which is `undefined`. In the template refs are unwrapped; in script they are not. The summary says "of undefined".' },
      { lines: [22, 24], text: '**Bug 3.** `cart.push` — the same mistake on a method call. `cart` is the ref; the array is `cart.value`. Clicking Add throws `TypeError: cart.push is not a function` (check the console).' },
      { lines: [26, 28], text: '**Bug 4.** `===` compares instead of assigning. The line evaluates to `false` and does nothing; no error, no effect — the quietest kind of bug.' },
      { lines: [31, 42], text: 'The template is fine: `v-model` binds the input, `v-for` is keyed by `p.id`, refs are unwrapped automatically. Most of the time, read the script first.' },
    ],
  },

  playground: {
    title: 'Mock debugging round',
    objective: 'Find and fix four planted bugs using the debugging loop: reproduce, read the error, isolate, hypothesise, verify, fix — one bug at a time.',
    files: { 'App.vue': buggyApp },
    expected: 'A search box, a **Clear** button, the text **Showing 4 of undefined products**, four products with **Add** buttons, and **Cart: 0 items**. Typing **lamp** shows nothing; **Add** logs a TypeError; **Clear** does nothing.',
    experiments: [
      {
        id: 'fix-search',
        task: '**Bug 1:** typing `lamp` (lowercase) should find **Desk Lamp**. Reproduce it first, then fix it.',
        hint: 'Both sides of `includes` must be lowercase: `p.name.toLowerCase().includes(q)`.',
        tests: [
          { name: '"lamp" finds Desk Lamp', code: `await type('.search', 'lamp')\nexpect(findAll('.product')).toHaveLength(1)\nexpect(text('.product')).toContain('Desk Lamp')` },
        ],
        explain: 'Say the hypothesis before fixing: "The query is lowercased but the names aren\'t, so the comparison is case-sensitive." Then verify by typing `Lamp` — it works, which confirms the hypothesis.',
      },
      {
        id: 'fix-summary',
        task: '**Bug 2:** the summary should read **Showing 4 of 4 products**.',
        hint: 'Inside `<script>`, a ref\'s array lives in `.value`.',
        tests: [
          { name: 'the summary counts all products', code: `expect(text('.summary')).toBe('Showing 4 of 4 products')` },
        ],
        explain: '`undefined` in output is a strong clue that you read a property from the wrong object. `products.value.length` reads the array; `products.length` reads the ref.',
      },
      {
        id: 'fix-cart',
        task: '**Bug 3:** clicking **Add** should add the product to the cart (**Cart: 1 items** after one click). Read the console error first.',
        hint: 'The error says `cart.push is not a function`. What *is* `cart`?',
        tests: [
          { name: 'Add puts the product in the cart', code: `await click('.add')\nexpect(text('.cart-count')).toBe('Cart: 1 items')` },
        ],
        explain: 'The error message named the exact problem. Reading it fully — instead of skimming — is the single most underrated debugging skill. Fix: `cart.value.push(product)`.',
      },
      {
        id: 'fix-clear',
        task: '**Bug 4:** **Clear** should empty the search box and show all products again.',
        hint: 'There\'s no error. Read the function character by character.',
        tests: [
          { name: 'Clear resets the search', code: `await type('.search', 'ote')\nexpect(findAll('.product')).toHaveLength(1)\nawait click('.clear')\nexpect(find('.search').value).toBe('')\nexpect(findAll('.product')).toHaveLength(4)` },
        ],
        explain: '`query.value === \'\'` is a comparison whose result is thrown away. Silent bugs need isolation: put a `console.log(query.value)` after the line and see it never changes. ESLint\'s `no-unused-expressions` rule would flag it — worth mentioning as the "prevent" step.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'Debugging Bug 3, by evidence',
    caption: 'Follow the debugging loop on the "Add does nothing" bug. Notice that no code changes until a hypothesis has been verified.',
    alt: 'A row of six boxes: Reproduce, Read the error, Isolate, Hypothesise, Verify, Fix. Steps show clicking Add, reading "cart.push is not a function", logging cart, guessing it is a ref, confirming with isRef, and fixing with cart.value.push.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'repro', label: 'Reproduce', note: 'click Add', tone: 'paper' },
        { id: 'read', label: 'Read', note: 'TypeError: cart.push…', tone: 'red' },
        { id: 'isolate', label: 'Isolate', note: 'console.log({ cart })', tone: 'cobalt' },
        { id: 'hyp', label: 'Hypothesise', note: '"cart is a ref"', tone: 'acid' },
        { id: 'verify', label: 'Verify', note: 'isRef(cart) → true', tone: 'kraft' },
        { id: 'fix', label: 'Fix', note: 'cart.value.push(…)', tone: 'ink' },
      ],
      edges: [
        { from: 'repro', to: 'read' },
        { from: 'read', to: 'isolate' },
        { from: 'isolate', to: 'hyp' },
        { from: 'hyp', to: 'verify' },
        { from: 'verify', to: 'fix' },
      ],
      steps: [
        { focus: ['repro'], text: '"Let me reproduce it: I click **Add** on the first product… the cart count stays at 0." Now you have a reliable failing case.' },
        { focus: ['read'], edges: ['repro->read'], text: '"There\'s an error in the console: `TypeError: cart.push is not a function`, inside `addToCart`." Read the **whole** message, including the function name.' },
        { focus: ['isolate'], edges: ['read->isolate'], text: '"Let me look at what `cart` actually is." Logging `{ cart }` shows a `RefImpl` object, not an array.' },
        { focus: ['hyp'], edges: ['isolate->hyp'], text: '"Hypothesis: `cart` is a ref, so the array is on `.value`. That\'s the same pattern as the summary bug."' },
        { focus: ['verify'], edges: ['hyp->verify'], text: '"I\'ll confirm: `cart` was declared with `ref([])` on line 11." Verification can be reading the code, a log, or DevTools — but it comes **before** the change.' },
        { focus: ['fix'], edges: ['verify->fix'], text: '"Fix: `cart.value.push(product)`. Re-run: the count is 1." Then **prevent**: "TypeScript or a test clicking Add would have caught this."' },
      ],
    },
  },

  internals: {
    beginner: `
Interviewers in live rounds are usually on your side — they want to see you succeed and will often hint if they can follow your thinking. Talking out loud gives them that chance. Small steps keep problems small: when the last change was five lines, the bug is in those five lines.
`,
    technical: [
      `
**What interviewers typically assess** (exact rubrics vary by company):

| Area | Looks like |
|---|---|
| Problem understanding | restates the task, asks about edge cases, confirms assumptions |
| Approach | plans before coding, picks appropriate Vue tools (computed vs watch, v-if vs v-show) |
| Code quality | readable names, small functions, no duplicated state |
| Verification | runs often, tests edge cases, reads errors carefully |
| Communication | narrates decisions, takes hints gracefully, recaps trade-offs |
| Debugging | systematic, evidence-based, one change at a time |

**Common Vue live-coding tasks:** counter with min/max, todo list (add/toggle/remove/filter), filterable/sortable table, debounced search with a fake API, tabs or accordion, modal with Escape-to-close, form with validation, star rating with \`v-model\` (\`defineModel\`, Vue 3.4+), fetching a list with loading/error states, pagination.
`,
      `
**Time management.** Keep clarifying short, get to a running state early, and leave a few minutes at the end to recap. If you're stuck for more than a couple of minutes, say so and narrate what you've tried — the interviewer will often nudge you. A working simple version beats an unfinished clever one.

**Taking hints well.** "Ah, good point — so the issue is X. Let me try that." Acknowledge, apply, move on. Arguing with a hint, or ignoring it, costs more than needing it.
`,
    ],
    production: `
- The same loop is how you should work on real tickets: clarify acceptance criteria, ship the smallest slice, verify, iterate.
- Real debugging adds tools you may not have in an interview: \`git bisect\` to find the commit that broke something, Vue DevTools' timeline, browser performance profiles, error-monitoring stack traces.
- Write the **regression test** after fixing a real bug, so it can't silently return.
- Many interview bugs (missing \`.value\`, \`==\` vs \`===\`, unused expressions, \`v-for\` without keys) are caught automatically by **ESLint with \`eslint-plugin-vue\`** and by TypeScript. Mentioning that you rely on them is a good "prevent" step.
- Pair-programming etiquette transfers directly: narrate, invite input, and keep the shared screen readable.
`,
  },

  mistakes: [
    {
      title: 'Coding before clarifying',
      wrong: { code: `Interviewer: "Build a search for this product list."\nCandidate: *starts typing a full component with sorting and pagination*`, lang: 'text' },
      right: { code: `Candidate: "Should search be case-insensitive? Match anywhere in the name?\nWhat should show when nothing matches? Is the list static?"`, lang: 'text' },
      explanation: 'A short round of questions prevents building the wrong thing — and shows you think about edge cases.',
    },
    {
      title: 'Writing everything, then running once',
      wrong: { code: `// 60 lines written, first run at minute 25:\n// 4 errors, unclear which change caused which`, lang: 'text' },
      right: { code: `// run after rendering the static list\n// run after adding the computed filter\n// run after the empty state …`, lang: 'text' },
      explanation: 'Each small run tells you the last few lines work. Errors stay small and obvious.',
    },
    {
      title: 'Shotgun debugging',
      wrong: { code: `// "Maybe it's nextTick?" *adds nextTick*\n// "Maybe reactive instead of ref?" *rewrites state*\n// "Maybe a key issue?" …`, lang: 'text' },
      right: { code: `// Read the error → log the value → form one hypothesis → verify → change one thing`, lang: 'text' },
      explanation: 'Random changes can hide the real bug or add new ones, and interviewers notice the lack of method.',
    },
    {
      title: 'Going silent',
      wrong: { code: `*four minutes of silent typing and deleting*`, lang: 'text' },
      right: { code: `"I'm stuck on why the count is undefined. I've checked the template — it's fine.\nI suspect the computed; let me log products there."`, lang: 'text' },
      explanation: 'Silence hides your reasoning and blocks hints. Narrating — especially when stuck — turns a struggle into a demonstration of method.',
    },
  ],

  debugging: [
    {
      symptom: 'The screen doesn\'t update after a change.',
      cause: 'Usually not reactive: a plain `let`, a missing `.value`, a destructured `reactive()` object, or a replaced ref.',
      fix: 'Check the declaration, check `.value` in script, and inspect the value in Vue DevTools / the Reactive state panel.',
    },
    {
      symptom: '`Cannot read properties of undefined (reading \'name\')` on first render.',
      cause: 'The template reads nested data before it has loaded.',
      fix: 'Guard with `v-if="user"`, use `user?.name`, or initialise state with the right shape.',
    },
    {
      symptom: 'Numbers from inputs concatenate ("2" + 1 = "21").',
      cause: 'Input values are strings; `v-model` keeps them as strings.',
      fix: 'Use `v-model.number` (or convert with `Number()`).',
    },
    {
      symptom: 'After reordering or removing items, inputs or child state end up on the wrong row.',
      cause: 'The list is keyed by index, so Vue patches elements in place instead of moving them.',
      fix: 'Key by a stable unique id: `:key="item.id"`.',
    },
    {
      symptom: 'You\'re stuck and the clock is running.',
      cause: 'Usually a wrong assumption you haven\'t checked.',
      fix: 'Say what you know and what you\'ve ruled out, then test your most basic assumption (is the function even called? log at its first line).',
    },
  ],

  bestPractices: [
    'Restate the task and confirm edge cases before writing code; jot requirements as a checklist.',
    'Get something rendering within the first few minutes, then iterate.',
    'Run after every small change; read the whole error message.',
    'Narrate decisions and uncertainties; invite the interviewer in.',
    'Debug by evidence: reproduce, read, isolate, hypothesise, verify, fix — one change at a time.',
    'Prefer simple, readable code over clever code; name things after what they hold.',
    'Leave time to recap what works, what doesn\'t, and what you\'d do next.',
  ],

  useCases: [
    'Build-from-scratch rounds: todo list, filterable table, tabs, counter with rules.',
    'Fix-the-bug rounds: a component with planted reactivity, key or event bugs.',
    'Extend-the-code rounds: add a feature to an existing small app.',
    'Take-home follow-ups: walking through and modifying your own submission live.',
    'Pair-programming interviews where you collaborate with an engineer.',
  ],

  whenToUse: {
    use: [
      'The clarify → plan → build → check → extend loop for any coding task.',
      'The evidence-based debugging loop whenever something behaves unexpectedly.',
      'Hard-coded data and simple solutions first, refinement second.',
    ],
    avoid: [
      'Premature optimisation or abstraction (generic components, composables) before the basic version works.',
      'Pulling in libraries the interviewer didn\'t mention without asking.',
      'Long silent stretches — even "I\'m thinking about X" helps.',
    ],
  },

  comparison: {
    title: 'Panicked vs methodical, side by side',
    headers: ['Moment', 'Panicked', 'Methodical'],
    rows: [
      ['First minutes', 'starts typing immediately', 'restates task, asks about edge cases'],
      ['Building', 'writes everything, runs at the end', 'smallest slice, runs often'],
      ['An error appears', 'skims it, changes something', 'reads it fully, logs the value'],
      ['Stuck', 'goes silent', 'narrates what\'s known and ruled out'],
      ['Hint offered', 'argues or ignores it', 'acknowledges and applies it'],
      ['Time nearly up', 'keeps typing', 'recaps what works and next steps'],
    ],
    note: 'Pair this with the [answering framework](lesson:answering-framework) for the questions asked during the round.',
  },

  quiz: [
    {
      id: 'live-coding-q1',
      type: 'mcq',
      prompt: 'You\'re asked to "build a product search". What should you do first?',
      options: [
        { text: 'Start with a reusable generic `<SearchList>` component', why: 'Abstraction before a working version is a classic time sink.' },
        { text: 'Restate the task and ask a few clarifying questions (case sensitivity, empty state, data source)' },
        { text: 'Install a fuzzy-search library', why: 'Ask before adding dependencies — and you don\'t know yet whether fuzzy matching is wanted.' },
        { text: 'Write the CSS', why: 'Styling is rarely the point; ask whether it matters.' },
      ],
      answer: 1,
      explanation: 'A short clarifying round makes sure you build the right thing and shows you think about edge cases.',
    },
    {
      id: 'live-coding-q2',
      type: 'output',
      prompt: 'The user types `2` in the quantity input, then clicks **+1**. What does the input show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const qty = ref(1)
</script>

<template>
  <input v-model="qty" />
  <button @click="qty = qty + 1">+1</button>
</template>`,
      },
      options: [
        { text: '3', why: 'That needs `v-model.number`; without it, the typed value is the string "2".' },
        { text: '21' },
        { text: '2', why: 'The click does change `qty`.' },
        { text: 'NaN', why: 'String + number concatenates; it doesn\'t produce NaN.' },
      ],
      answer: 1,
      explanation: 'Input values are strings, so `qty` becomes `"2"` and `"2" + 1` is `"21"`. Fix with `v-model.number`.',
    },
    {
      id: 'live-coding-q3',
      type: 'bug',
      prompt: 'The count on screen never changes when the button is clicked. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count + 1
}
</script>

<template>
  <button @click="increment">{{ count }}</button>
</template>`,
      },
      answerLine: 7,
      explanation: '`count + 1` computes a value and throws it away (and uses the ref, not its value). It should be `count.value++`. Like `===` instead of `=`, it fails silently — no error to read, so isolate with a log.',
    },
    {
      id: 'live-coding-q4',
      type: 'fill',
      prompt: 'Fill in the debugging loop.',
      code: { lang: 'text', code: `1. Reproduce\n2. Read the error\n3. ___ (narrow down where it goes wrong)\n4. Hypothesise\n5. ___ (check the hypothesis before changing code)\n6. Fix` },
      answer: [['Isolate', 'isolate'], ['Verify', 'verify']],
      explanation: 'Isolate where expectation and reality diverge, and verify your hypothesis with evidence before changing anything.',
    },
    {
      id: 'live-coding-q5',
      type: 'mcq',
      prompt: 'You\'ve been stuck on a bug for a few minutes. What\'s the best move?',
      options: [
        { text: 'Keep trying silently so you don\'t look weak', why: 'Silence hides your reasoning and blocks the hints that interviewers are often ready to give.' },
        { text: 'Rewrite the component from scratch', why: 'You lose working code and still don\'t understand the bug.' },
        { text: 'Say what you know, what you\'ve ruled out, and test your most basic assumption' },
        { text: 'Ask the interviewer for the answer straight away', why: 'Asking is fine, but show your reasoning first so they can give a targeted hint.' },
      ],
      answer: 2,
      explanation: 'Narrating makes your method visible and invites a nudge. Checking basic assumptions (is the function even called?) breaks most stalls.',
    },
    {
      id: 'live-coding-q6',
      type: 'mcq',
      prompt: 'Select **all** the bugs that would typically fail **silently** (no error in the console).',
      options: [
        { text: '`query.value === \'\'` where an assignment was intended' },
        { text: '`cart.push(item)` where `cart` is a ref', why: 'This throws `TypeError: cart.push is not a function` — there is an error to read.' },
        { text: '`:key="index"` on a list that gets reordered' },
        { text: 'A search that compares a lowercase query with mixed-case names' },
        { text: 'Calling `user.name` before `user` has loaded', why: 'This throws `Cannot read properties of null/undefined` during render.' },
      ],
      answer: [0, 2, 3],
      explanation: 'Silent bugs produce wrong behaviour without errors, so you must isolate them with logs, DevTools or tests. Noisy bugs tell you where to look — read the message.',
    },
    {
      id: 'live-coding-q7',
      type: 'short',
      prompt: 'You have five minutes left and the stretch goal (debouncing) isn\'t done. What do you do and say?',
      answer: 'Stop starting new work and make sure the core requirements run correctly. Then recap: what works, what\'s missing, and how I\'d finish it — for debouncing, a watcher on the query that clears and resets a ~300 ms setTimeout before updating the searched value, cleared on unmount. I\'d also mention what I\'d add with more time, such as tests for the filter and empty state, and accessibility labels. A clear plan for unfinished work still demonstrates the skill.',
    },
  ],

  exercises: [
    {
      id: 'filterable-list',
      title: 'Warm-up: a filterable list in one sitting',
      difficulty: 'beginner',
      prompt: `
A classic first task. Using the \`people\` array:

- \`<input class="search">\` (with \`v-model\`) filters people by name, **case-insensitively**, matching anywhere in the name.
- Each match renders as \`<li class="item">\` with the person's name.
- \`<p class="count">\` shows **N results** (e.g. **3 results**, **1 results** is fine).
- When nothing matches, show \`<p class="empty">No matches</p>\` instead of the list.

Time yourself — and narrate as if an interviewer were listening.
`,
      files: {
        'App.vue': `<script setup>
const people = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Alan Turing']
</script>

<template>
  <p>TODO: build the filterable list</p>
</template>`,
      },
      hints: [
        'State: `const query = ref(\'\')`. Derived: `const results = computed(() => …)`.',
        'Filter with `people.filter((name) => name.toLowerCase().includes(query.value.trim().toLowerCase()))`.',
        'Template: the input with `v-model="query"`, the count, then `<ul v-if="results.length">` with `v-for`, and `<p v-else class="empty">No matches</p>`.',
      ],
      solution: {
        explanation: 'One ref for input, one computed for the derived list, and the template branches on its length. No duplicated state: the count and the empty state are both derived from `results`, so they can never disagree.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const people = ['Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Alan Turing']
const query = ref('')

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return people.filter((name) => name.toLowerCase().includes(q))
})
</script>

<template>
  <input class="search" v-model="query" placeholder="Search people" />
  <p class="count">{{ results.length }} results</p>
  <ul v-if="results.length">
    <li v-for="name in results" :key="name" class="item">{{ name }}</li>
  </ul>
  <p v-else class="empty">No matches</p>
</template>`,
        },
      },
      tests: [
        { name: 'shows everyone at first', code: `expect(findAll('.item')).toHaveLength(5)\nexpect(text('.count')).toBe('5 results')` },
        { name: 'filters case-insensitively, anywhere in the name', code: `await type('.search', 'HOP')\nexpect(findAll('.item')).toHaveLength(1)\nexpect(text('.item')).toBe('Grace Hopper')` },
        { name: '"in" matches two people', code: `await type('.search', 'in')\nexpect(text('.count')).toBe('2 results')` },
        { name: 'shows the empty state', code: `await type('.search', 'zzz')\nexpect(exists('.item')).toBe(false)\nexpect(text('.empty')).toBe('No matches')` },
      ],
    },
    {
      id: 'fix-the-cart',
      title: 'Debugging round: fix the cart',
      difficulty: 'intermediate',
      prompt: `
This cart has **three** bugs. Fix them without rewriting the component:

1. Typing a quantity and then clicking **+** concatenates (\`2\` then **+** gives **21**). It should add (**3**).
2. The total (\`.total\`) shows **Total: NaN**. It should be the sum of \`price × qty\`.
3. Clicking **Remove** on a row removes the **wrong** item. It should remove that row.

Selectors: each row is \`li.row\` with \`.name\`, an \`<input class="qty">\`, a \`.inc\` button and a \`.remove\` button.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: 'Notebook', price: 6, qty: 1 },
  { id: 2, name: 'Desk Lamp', price: 39, qty: 1 },
  { id: 3, name: 'Coffee Mug', price: 12, qty: 1 },
])

const total = computed(() =>
  items.value
    .map((item) => { item.price * item.qty })
    .reduce((sum, value) => sum + value, 0)
)

function remove(item) {
  items.value.splice(item.id, 1)
}
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" class="row">
      <span class="name">{{ item.name }}</span>
      <input class="qty" v-model="item.qty" />
      <button class="inc" @click="item.qty = item.qty + 1">+</button>
      <button class="remove" @click="remove(item)">Remove</button>
    </li>
  </ul>
  <p class="total">Total: {{ total }}</p>
</template>`,
      },
      hints: [
        'Bug 1: what type is an input\'s value? Look for a `v-model` modifier.',
        'Bug 2: the `map` callback has braces — what does it return?',
        'Bug 3: `splice` takes an **index**. Is `item.id` an index? Find the index with `items.value.indexOf(item)` (or filter by id).',
      ],
      solution: {
        explanation: '`v-model.number` converts the input to a number; removing the braces (or adding `return`) makes `map` return values; and `splice` needs the item\'s index, not its id. Each bug was found by reproducing it, then checking a single assumption — exactly what the interviewer wants to see.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { id: 1, name: 'Notebook', price: 6, qty: 1 },
  { id: 2, name: 'Desk Lamp', price: 39, qty: 1 },
  { id: 3, name: 'Coffee Mug', price: 12, qty: 1 },
])

const total = computed(() =>
  items.value
    .map((item) => item.price * item.qty)
    .reduce((sum, value) => sum + value, 0)
)

function remove(item) {
  const index = items.value.indexOf(item)
  if (index !== -1) items.value.splice(index, 1)
}
</script>

<template>
  <ul>
    <li v-for="item in items" :key="item.id" class="row">
      <span class="name">{{ item.name }}</span>
      <input class="qty" v-model.number="item.qty" />
      <button class="inc" @click="item.qty = item.qty + 1">+</button>
      <button class="remove" @click="remove(item)">Remove</button>
    </li>
  </ul>
  <p class="total">Total: {{ total }}</p>
</template>`,
        },
      },
      tests: [
        { name: 'typing then + adds numerically', code: `await type('.qty', '2')\nawait click('.inc')\nexpect(find('.qty').value).toBe('3')` },
        { name: 'the total is correct', code: `expect(text('.total')).toBe('Total: 57')\nawait click('.inc')\nexpect(text('.total')).toBe('Total: 63')` },
        { name: 'Remove removes that row', code: `await click('.remove')\nconst names = findAll('.row .name').map((n) => n.textContent)\nexpect(names).toEqual(['Desk Lamp', 'Coffee Mug'])` },
      ],
    },
  ],

  interview: [
    {
      id: 'live-coding-first-minutes',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 3,
      question: 'You\'re given 45 minutes to build a todo list in Vue. What do you do in the first few minutes?',
      answer: 'Restate the task and clarify scope: which features are required (add, toggle, delete, filter?), what counts as done, whether persistence or styling matters, and whether I should use the Composition API. Write the requirements as a checklist comment. Outline the plan aloud — state shape (`todos` array of `{ id, title, done }`), a computed for filtered todos, the template structure — then get a static list rendering as quickly as possible.',
      explanation: 'A short investment in clarity and a plan saves far more time than it costs.',
      whyAsked: 'Shows whether you manage scope and communicate before diving in.',
      mistakes: ['Starting to code without asking anything.', 'Spending most of the time planning and never getting to a running state.', 'Over-engineering (stores, generic components) for a small task.'],
      followUps: ['What would you cut if time ran short?', 'How would you structure state if todos came from an API?'],
      modelAnswer: 'I\'d restate it: "So, add, complete and delete todos — should there be filtering or persistence?" I\'d confirm any constraints like Composition API or no libraries, and jot the answers as a checklist. Then I\'d say the plan out loud: a `todos` ref of objects with id, title and done, a form with `@submit.prevent`, a computed for remaining count and filters, keyed v-for. And I\'d aim to have a static list rendering within a few minutes, then add features one by one, running after each.',
    },
    {
      id: 'live-coding-undefined-name',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'This component throws `TypeError: Cannot read properties of null (reading \'name\')` as soon as it renders. What is the most appropriate fix?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'
import { fetchUser } from './api.js'

const user = ref(null)
onMounted(async () => {
  user.value = await fetchUser(1)
})
</script>

<template>
  <h2>{{ user.name }}</h2>
</template>`,
      },
      options: [
        'Wrap the assignment in nextTick()',
        'Render the heading only when user exists (v-if="user"), ideally with a loading state',
        'Use reactive() instead of ref()',
        'Move fetchUser into the template',
      ],
      correctOption: 1,
      answer: 'The template renders immediately, while `user` is still `null`; the data arrives later. Guard the part that needs the data: `<h2 v-if="user">{{ user.name }}</h2>` with a `v-else` loading message (or `user?.name` for a quick fix). `nextTick` or `reactive()` don\'t change the fact that the first render happens before the data exists.',
      explanation: 'Async data means at least one render without it — design for that state explicitly.',
      whyAsked: 'One of the most common real-world Vue errors; tests understanding of render timing with async data.',
      mistakes: ['Suggesting `nextTick`.', 'Initialising `user` with fake data to hide the error.', 'Forgetting the loading and error states.'],
      followUps: ['How would you show an error if the fetch fails?', 'When is `?.` preferable to `v-if`?'],
      modelAnswer: 'The component renders before the fetch resolves, so the template reads `name` from null. I\'d model the loading state explicitly: `v-if="user"` around the heading with a `v-else` loading message, plus an error ref for failures. Optional chaining would stop the crash, but an explicit loading state gives a better UI. Changing to reactive or adding nextTick wouldn\'t help, because the issue is timing, not reactivity.',
    },
    {
      id: 'live-coding-debounced-search',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement debouncing: `searched` should update to the current `query` only **300 ms after the user stops typing**. The input is `.search` (bound to `query`), and `.searched` displays `searched`. Clean up the timer when the component unmounts.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, watch } from 'vue'

const query = ref('')
const searched = ref('')

// TODO: debounce — currently updates on every keystroke
watch(query, (value) => {
  searched.value = value
})
</script>

<template>
  <input class="search" v-model="query" placeholder="Search" />
  <p>Searching for: <span class="searched">{{ searched }}</span></p>
</template>`,
        },
      },
      tests: [
        { name: 'does not update while typing quickly', code: `await type('.search', 'v')\nawait type('.search', 'vu')\nawait type('.search', 'vue')\nexpect(text('.searched')).toBe('')\nawait wait(350)` },
        { name: 'updates 300 ms after the last keystroke', code: `await type('.search', 'vu')\nawait type('.search', 'vue')\nawait wait(150)\nexpect(text('.searched')).toBe('')\nawait wait(250)\nexpect(text('.searched')).toBe('vue')` },
      ],
      hints: ['Keep a `let timer` outside the watcher. In the watcher: `clearTimeout(timer)` then `timer = setTimeout(() => { searched.value = value }, 300)`.', 'Import `onUnmounted` and call `clearTimeout(timer)` in it.'],
      answer: 'Store the timer id; on each change clear the previous timer and start a new 300 ms one that assigns `searched`; clear it in `onUnmounted`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, watch, onUnmounted } from 'vue'

const query = ref('')
const searched = ref('')
let timer

watch(query, (value) => {
  clearTimeout(timer)
  timer = setTimeout(() => {
    searched.value = value
  }, 300)
})

onUnmounted(() => clearTimeout(timer))
</script>

<template>
  <input class="search" v-model="query" placeholder="Search" />
  <p>Searching for: <span class="searched">{{ searched }}</span></p>
</template>`,
        },
      },
      explanation: 'Every keystroke cancels the pending timer, so only the last one survives 300 ms. Cleaning up on unmount prevents a callback from running after the component is gone.',
      whyAsked: 'A very common live task that combines watchers, timers, closures and cleanup.',
      mistakes: ['Creating a new timer without clearing the previous one (that\'s a delay, not a debounce).', 'Forgetting cleanup on unmount.', 'Debouncing inside the template or with a library you weren\'t allowed to use.'],
      followUps: ['How would you make this a reusable `useDebouncedRef` composable?', 'How do you also cancel the in-flight request when a new search starts?', 'How would you test it with fake timers?'],
      modelAnswer: 'I keep the timer id in a variable outside the watcher. Each time the query changes I clear the pending timer and start a new 300 millisecond one that copies the query into `searched` — so only the last keystroke\'s timer survives. I clear the timer in onUnmounted so nothing fires after the component is gone. Next steps I\'d mention: extracting it into a composable, and cancelling stale requests with an AbortController.',
    },
    {
      id: 'live-coding-not-updating',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'In a live debugging round, a component\'s value changes (you can log it) but the screen doesn\'t update. Walk through your checklist.',
      answer: 'Check, in order: (1) Is the value reactive at all — declared with `ref`/`reactive`, not a plain `let`? (2) In script, is it updated through `.value`? (3) Was a `reactive()` object destructured, or a ref replaced (`items = ref(...)`) so the template holds the old one? (4) Is the template reading the same object you\'re changing (a copy, a prop vs local state)? (5) Is the data in a `shallowRef` where nested mutations aren\'t tracked? (6) Is the DOM being read before Vue\'s batched update — needs `await nextTick()`? Inspect in Vue DevTools to see which value the component actually holds.',
      explanation: 'Almost every "doesn\'t update" bug is one of a few causes — check them systematically rather than guessing.',
      whyAsked: 'The most common Vue debugging scenario; a structured answer signals real experience.',
      mistakes: ['Jumping to `forceUpdate`-style hacks.', 'Blaming Vue.', 'Adding `nextTick` everywhere without understanding.'],
      followUps: ['How do you inspect component state in Vue DevTools?', 'Why does destructuring a reactive object lose reactivity?'],
      modelAnswer: 'I\'d first confirm what the component actually holds in Vue DevTools, then walk a short list. Is it reactive — ref or reactive, not a plain variable? Am I writing `.value` in script? Did I destructure a reactive object or replace a ref so the template still points at the old one? Am I mutating a copy rather than the source, or nested data inside a shallowRef? And if the state is right but my code reads stale DOM, I need `await nextTick()`. That order goes from most to least common, so I usually find it in the first two or three checks.',
    },
    {
      id: 'live-coding-stuck',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Halfway through a round, your code doesn\'t work and you have no idea why. The interviewer is quiet. What exactly do you do?',
      answer: 'Narrate and narrow down. Say what you expected and what happened, and what you\'ve already ruled out. Then test the most basic assumptions with quick logs: is the handler called at all? What are the values at each step? Compare with the last version that worked (what changed since?). If a hypothesis emerges, state it and verify it. If still stuck after a short while, ask a focused question: "I think the problem is in the computed — am I right that it should re-run when `query` changes?"',
      explanation: 'Interviewers grade the process of getting unstuck, not only whether you got stuck.',
      whyAsked: 'Everyone gets stuck; the question is whether you can recover calmly and collaboratively.',
      mistakes: ['Silence.', 'Random changes.', 'Starting over from scratch.', 'Vague "help, it\'s broken" questions.'],
      followUps: ['How do you decide when to ask for a hint?', 'What does "binary search" debugging mean?'],
      modelAnswer: 'I\'d say out loud: "I expected the list to filter, but it shows everything. The input is bound, so I suspect the computed." Then I\'d check the basics with logs — is the computed running, what\'s the query, what does the filter return — and think about what changed since it last worked. Once I have a hypothesis I verify it before editing. If I\'m still stuck after a couple of minutes I ask a specific question, which lets the interviewer help without giving away the whole answer.',
    },
    {
      id: 'live-coding-index-keys',
      difficulty: 'advanced',
      type: 'coding',
      minutes: 6,
      question: 'Each row has an uncontrolled note `<input class="note">`. After typing a note on Ada\'s row and clicking **Reverse**, the note stays at the top instead of moving with Ada. Fix the component so notes stay with their person.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const people = ref([
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
])

function reverse() {
  people.value.reverse()
}
</script>

<template>
  <button class="reverse" @click="reverse">Reverse</button>
  <ul>
    <li v-for="(person, index) in people" :key="index">
      <span class="name">{{ person.name }}</span>
      <input class="note" placeholder="note" />
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'the note moves with Ada after reversing', code: `await type('.note', 'note for Ada')\nawait click('.reverse')\nconst rows = findAll('li')\nexpect(rows[0].querySelector('.name').textContent).toBe('Linus')\nconst adaRow = rows.find((li) => li.querySelector('.name').textContent === 'Ada')\nexpect(adaRow.querySelector('.note').value).toBe('note for Ada')` },
        { name: 'other rows keep empty notes', code: `await type('.note', 'note for Ada')\nawait click('.reverse')\nexpect(findAll('li')[0].querySelector('.note').value).toBe('')` },
      ],
      hints: ['What does the `key` tell Vue about which element belongs to which item?', 'Use a stable, unique id: `:key="person.id"`.'],
      answer: 'Key the rows by `person.id` instead of the index, so Vue moves the existing `<li>` elements (with their input state) instead of patching their text in place.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const people = ref([
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Grace' },
  { id: 3, name: 'Linus' },
])

function reverse() {
  people.value.reverse()
}
</script>

<template>
  <button class="reverse" @click="reverse">Reverse</button>
  <ul>
    <li v-for="person in people" :key="person.id">
      <span class="name">{{ person.name }}</span>
      <input class="note" placeholder="note" />
    </li>
  </ul>
</template>`,
        },
      },
      explanation: 'With index keys, position 0 is "the same item" before and after reversing, so Vue reuses that `<li>` and only updates its text — the DOM input (and its typed value) stays put. With id keys, Vue sees Ada\'s element move and moves the actual DOM node.',
      whyAsked: 'A classic bug that tests real understanding of Vue\'s list diffing, not just the rule "always add a key".',
      mistakes: ['Saying "add a key" when a key is already present — the problem is *which* key.', 'Controlling the inputs with v-model to hide the symptom without explaining it.', 'Using `Math.random()` as a key (new identity every render).'],
      followUps: ['When is an index key acceptable?', 'What happens to child component state with index keys?', 'How does Vue\'s keyed diff decide what to move?'],
      modelAnswer: 'The list is keyed by index, so after reversing, Vue thinks the item at position zero is still the same item. It reuses the existing li and just patches the name text, while the DOM input — which holds the typed note — stays at the top. Keying by `person.id` gives each row a stable identity, so Vue moves the actual element, input included. Index keys are only safe for static lists that never reorder, and the same issue would affect child component state, not just inputs.',
    },
  ],

  takeaways: [
    'Live coding is graded on process: clarify, plan, build the smallest slice, run often, extend, recap.',
    'Spend a few minutes clarifying inputs, outputs and edge cases; write them as a checklist.',
    'Narrate decisions and uncertainty — it earns credit and invites hints.',
    'Debug by evidence: reproduce, read the whole error, isolate, hypothesise, verify, then change one thing.',
    'Know the usual Vue suspects: missing `.value`, strings from inputs, index keys, async data on first render, silent `===`.',
    'When time runs short, secure the core, then explain how you\'d finish.',
  ],
}
