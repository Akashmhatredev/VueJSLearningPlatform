// Lesson: How to answer technical questions.

const proofApp = `<script setup>
import { ref, computed } from 'vue'

const items = ref([
  { name: 'Notebook', price: 6 },
  { name: 'Desk Lamp', price: 39 },
])
const theme = ref('light')

// DEFINE: computed() = a cached value derived from reactive state
const total = computed(() => {
  console.log('computed total ran')
  return items.value.reduce((sum, item) => sum + item.price, 0)
})

// COMPARE: a method re-runs every time the template renders
function totalMethod() {
  console.log('method total ran')
  return items.value.reduce((sum, item) => sum + item.price, 0)
}

function toggleTheme() {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}
</script>

<template>
  <section class="demo" :class="theme">
    <p class="computed">computed: {{ total }} · {{ total }}</p>
    <p class="method">method: {{ totalMethod() }} · {{ totalMethod() }}</p>
    <button class="toggle" @click="toggleTheme">Re-render (theme: {{ theme }})</button>
  </section>
</template>

<style scoped>
.demo { padding: 12px; border-radius: 8px; font-family: system-ui, sans-serif; }
.dark { background: #1d1d1f; color: #f5f5f5; }
</style>`

export default {
  id: 'answering-framework',
  title: 'How to answer technical questions',
  summary: 'A repeatable way to turn what you know into clear interview answers: define, why, how, example, trade-off — plus clarifying, thinking aloud and handling "I don\'t know".',
  difficulty: 'intermediate',
  minutes: 35,
  prerequisites: ['computed', 'conditional-rendering'],
  related: ['live-coding', 'frontend-system-design', 'rapid-review', 'watch', 'composables-intro'],
  tags: ['interview', 'communication', 'answer structure', 'define why how example trade-off', 'STAR', 'behavioral', 'computed vs methods', 'v-if vs v-show'],
  apis: [
    { name: 'Define → Why → How → Example → Trade-off', summary: 'A five-step structure for conceptual answers.' },
    { name: 'STAR', summary: 'Situation, Task, Action, Result — a structure for "tell me about a time…" questions.' },
  ],
  docs: [
    { label: 'Vue Guide — Computed caching vs methods', url: 'https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods' },
    { label: 'Vue Guide — v-if vs v-show', url: 'https://vuejs.org/guide/essentials/conditional.html#v-if-vs-v-show' },
    { label: 'Vue Guide — Watchers', url: 'https://vuejs.org/guide/essentials/watchers.html' },
  ],

  intro: `
Knowing Vue and *explaining* Vue are different skills. Interviewers can only grade what you say, and a correct answer delivered as a jumble of facts often scores worse than a slightly simpler answer delivered with structure.

This lesson gives you one structure that works for almost every conceptual question:

1. **Define** — one sentence: what is it?
2. **Why** — what problem does it solve?
3. **How** — how does it work, at the depth the role needs?
4. **Example** — a tiny, concrete case (code you could sketch).
5. **Trade-off** — when *not* to use it, or what it costs.

You'll also practise the moves around the answer — clarifying, thinking aloud, recovering from "I don't know" — and back answers up with **runnable proof**, which is what the playground is for.
`,

  why: `
Interviewers aren't only checking *whether* you know something. They are asking themselves:

- Does this person understand **why** it exists, or did they memorise a definition?
- Can they **communicate** with teammates — juniors, seniors, product managers?
- Do they know the **limits** of their tools, or do they reach for the same hammer every time?

The five steps map directly onto those questions. *Define* shows you know what it is. *Why* and *How* show understanding. *Example* shows you've used it. *Trade-off* shows judgement — and judgement is what separates mid-level from senior answers.

Structure also helps **you**: under pressure, a known sequence stops you from rambling, freezing, or forgetting the best part.
`,

  eli15: `
Imagine a friend asks you, "What's a bicycle gear?"

A messy answer: "Uh, it's the thing with the teeth, and there's a chain, and when you go up hills, and also my bike has 21 of them…"

A clear answer:

1. **Define:** "A gear changes how hard it is to turn the pedals."
2. **Why:** "So you can climb hills without exhausting yourself, and go fast on flat roads."
3. **How:** "The chain moves between different-sized wheels with teeth."
4. **Example:** "Going uphill, you shift to an easy gear — your legs spin fast, the bike moves slowly but steadily."
5. **Trade-off:** "Easy gears make climbing easy but you can't go fast in them."

Same knowledge. The second one sounds like someone who *really* understands bikes. Interview answers work exactly like that.
`,

  analogy: {
    title: 'A good museum guide',
    body: `
A good museum guide doesn't recite every fact about a painting. They say what it is, why it mattered, how the artist did it, point at one detail you can see with your own eyes, and mention what the critics disagreed about. Then they pause and let you ask for more.

That pause matters: a strong interview answer gives a clear short version first, then *offers* depth instead of dumping it.
`,
    mapping: [
      ['"This is a Monet, painted in 1872"', 'Define — one clear sentence'],
      ['"It started Impressionism"', 'Why — the problem it solved'],
      ['"Short brush strokes, painted outdoors"', 'How — the mechanism'],
      ['"Look at the light on the water here"', 'Example — something concrete you can show'],
      ['"Critics at the time called it unfinished"', 'Trade-off — limits and costs'],
      ['"Any questions?"', 'Offer depth; let the interviewer steer'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'The five steps, applied to "What is computed()?"',
    caption: 'Step through a strong answer one move at a time. Each step is one or two sentences — the whole answer fits in about the time it takes to read it aloud.',
    alt: 'Five boxes in a row: Define, Why, How, Example, Trade-off, followed by an "Offer depth" box. Each step reveals the sentence a candidate would say about computed properties.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'define', label: 'Define', note: 'one sentence', tone: 'acid' },
        { id: 'why', label: 'Why', note: 'the problem', tone: 'cobalt' },
        { id: 'how', label: 'How', note: 'the mechanism', tone: 'paper' },
        { id: 'example', label: 'Example', note: 'concrete', tone: 'kraft' },
        { id: 'tradeoff', label: 'Trade-off', note: 'limits', tone: 'red' },
        { id: 'offer', label: 'Offer depth', note: '"want me to go deeper?"', tone: 'ink' },
      ],
      edges: [
        { from: 'define', to: 'why' },
        { from: 'why', to: 'how' },
        { from: 'how', to: 'example' },
        { from: 'example', to: 'tradeoff' },
        { from: 'tradeoff', to: 'offer', dashed: true },
      ],
      steps: [
        { focus: ['define'], text: '**Define:** "`computed()` creates a read-only reactive value that is derived from other reactive state and cached."' },
        { focus: ['why'], edges: ['define->why'], text: '**Why:** "It keeps derived data — totals, filtered lists, labels — in sync automatically, without duplicating state or recalculating on every render."' },
        { focus: ['how'], edges: ['why->how'], text: '**How:** "While the getter runs, Vue tracks which reactive values it reads. The result is cached until one of those dependencies changes; then it is marked dirty and recomputed lazily on the next read."' },
        { focus: ['example'], edges: ['how->example'], text: '**Example:** "A cart total: `computed(() => items.value.reduce(…))`. Toggling a theme re-renders the component, but the total isn\'t recalculated — only adding an item does."' },
        { focus: ['tradeoff'], edges: ['example->tradeoff'], text: '**Trade-off:** "Getters must be pure — no API calls or DOM changes; that\'s what `watch` is for. And values that aren\'t reactive, like `Date.now()`, never trigger a recompute."' },
        { focus: ['offer'], edges: ['tradeoff->offer'], text: '**Stop and offer:** "I can go into how the dependency tracking works internally if that\'s useful." Let the interviewer choose the next level.' },
      ],
    },
  },

  syntax: [
    `
#### The five-step template
`,
    {
      code: `DEFINE     "X is …"                                   (one sentence, no jargon you can't explain)
WHY        "It exists because … / without it you'd have to …"
HOW        "Under the hood / the way it works is …"     (depth matched to the role)
EXAMPLE    "For instance, in a cart …"                  (tiny, concrete, ideally code)
TRADE-OFF  "The catch is … / I wouldn't use it when …"
OFFER      "Happy to go deeper into … if that's useful."`,
      lang: 'text',
      title: 'answer skeleton',
    },
    `
#### Phrases that buy you clarity

| Situation | Say something like |
|---|---|
| The question is vague | "Do you mean in the Composition API or the Options API?" / "For a small app or a large team?" |
| You need a moment | "Let me think about that for a second." (then actually think) |
| You're choosing what to cover | "There are two parts to this — X and Y. I'll start with X." |
| You know part of it | "I know the behaviour well; I'm less sure about the internals, but my understanding is…" |
| You don't know | "I haven't used that. Here's how I'd find out / reason about it: …" |
| You realise you were wrong | "Actually, let me correct that — …" |

#### Calibrate depth to the role

- **Junior:** correct definition, why it exists, a working example. Internals are a bonus.
- **Mid-level:** add how it works and common pitfalls you've hit.
- **Senior:** add trade-offs, alternatives, production consequences (performance, testing, team conventions) — and *when you wouldn't use it at all*.

#### Behavioural questions: STAR

"Tell me about a time you…" questions use a different structure: **Situation** (context, briefly), **Task** (your responsibility), **Action** (what *you* did — the longest part, with technical detail), **Result** (the outcome, and what you learned). Use real specifics, not invented metrics.

#### Prove it with code

When a question has a behaviour you can demonstrate — caching, rendering, ordering — the strongest *Example* is a tiny runnable snippet. The playground below is exactly such a proof for "computed vs methods".
`,
    {
      callout: 'tip',
      title: 'Length',
      text: 'Give the short version first — a few sentences covering all five steps — and then stop. Interviewers would rather ask "tell me more" than interrupt a monologue. Long answers that never reach the trade-off are the most common way strong candidates lose points.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: proofApp,
    intro: 'This component is the "Example" step of an answer to *"What\'s the difference between computed and methods?"* — written so the console proves the claim.',
    steps: [
      { lines: [4, 8], text: 'Two pieces of reactive state: the cart `items`, and an unrelated `theme`. Changing `theme` re-renders the component without touching the items.' },
      { lines: [10, 14], text: '**Define + How in code:** `computed()` reads `items`, so Vue tracks that dependency. The `console.log` lets us *count* how often the getter really runs.' },
      { lines: [16, 20], text: 'The same calculation as a plain function. Templates call it on every render, and the log will show it.' },
      { lines: [29, 30], text: 'The template uses each **twice**. On first render the console shows the computed ran once (cached for the second read) and the method ran twice.' },
      { lines: [31], text: 'Clicking re-renders via `theme`. Watch the console: two more "method" lines, zero "computed" lines. That is your evidence for the *Example* and *Trade-off* steps.' },
    ],
  },

  playground: {
    title: 'Prove your answer: computed vs methods',
    objective: 'Turn a spoken answer into evidence: extend the demo so it proves when `computed()` recalculates — and when it doesn\'t.',
    files: { 'App.vue': proofApp },
    expected: 'Both lines show **45 · 45**. The console shows **computed total ran** once and **method total ran** twice. Each click on **Re-render** logs two more method lines and no computed lines.',
    experiments: [
      {
        id: 'add-item',
        task: 'Add a `<button class="add">` that pushes `{ name: \'Mug\', price: 12 }` into `items`. The totals should become **57**, and the computed getter should run **exactly once** per click.',
        hint: 'Add a function `addMug()` that does `items.value.push({ name: \'Mug\', price: 12 })`, and a button with `@click="addMug"`.',
        tests: [
          { name: 'adding an item recomputes once and updates the total', code: `const count = () => logs.filter((l) => l.includes('computed total ran')).length\nconst before = count()\nawait click('.add')\nexpect(text('.computed')).toContain('57')\nexpect(count() - before).toBe(1)` },
        ],
        explain: 'This is the other half of the evidence: computed is not "never recalculated", it is recalculated **when its dependencies change** — once, even though the template reads it twice.',
      },
      {
        id: 'discount',
        task: 'Make `total` depend on a second piece of state: add `<input class="discount" v-model.number="discount">` (starting at 0) and subtract it from the computed total.',
        hint: '`const discount = ref(0)`, then `return items.value.reduce(…) - discount.value` inside the computed.',
        tests: [
          { name: 'a discount of 5 makes the computed total 40', code: `await type('.discount', '5')\nexpect(text('.computed')).toContain('40')` },
        ],
        explain: 'Computed values can depend on any number of reactive sources — Vue tracks every one read during the getter. That\'s a good detail for the *How* step: "it tracks dependencies automatically, I don\'t declare them".',
      },
      {
        id: 'counter-example',
        task: 'Find the trade-off yourself: add `const now = computed(() => new Date().toLocaleTimeString())` and show `{{ now }}`. Click **Re-render** a few times.',
        hint: 'What reactive state does the getter read?',
        explain: 'The time never changes: the getter reads no reactive state, so the cached value is never invalidated. A method (or a ref updated by a timer) is right for that. Being able to name a case where your tool is *wrong* is the strongest possible trade-off.',
      },
      {
        id: 'say-it',
        task: 'Write your answer to "computed vs methods?" as a five-line comment at the top of the script — one line each for define, why, how, example, trade-off. Then say it out loud, timing yourself.',
        hint: 'Use the console evidence as your example sentence.',
        explain: 'Saying it out loud is the practice that matters. If it takes much longer than reading the five lines aloud, cut words, not steps.',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Same knowledge, different answer',
    caption: 'Two answers to "What\'s the difference between v-if and v-show?" — both technically correct.',
    alt: 'Two text panels side by side. The left answer is a run-on list of facts without structure. The right answer follows define, why, how, example and trade-off. Bullet points explain why the second scores higher.',
    props: {
      left: {
        label: 'Unstructured',
        lang: 'text',
        code: `"So v-if, it's like, conditional, and v-show is
also conditional, but v-show uses display none,
and v-if doesn't render it, and there's also
v-else, and v-if is more expensive, or actually
v-show is more expensive at first, and you can
use v-if with template tags, and…"`,
      },
      right: {
        label: 'Five steps',
        lang: 'text',
        code: `DEFINE  Both show content conditionally.
WHY     They trade off render cost differently.
HOW     v-if adds/removes the element (and destroys
        child components); v-show always renders it
        and toggles CSS display.
EXAMPLE A modal opened rarely → v-if.
        A tab panel toggled constantly → v-show.
TRADE   v-if: cheaper initially, costlier to toggle.
        v-show: costlier initially, cheap to toggle,
        and no v-else/<template> support.`,
      },
      points: [
        'The right answer leads with a definition the interviewer can anchor on.',
        'It explains the mechanism (destroy vs CSS) instead of listing symptoms.',
        'Concrete examples show practical judgement.',
        'It ends on a trade-off — the part that signals seniority.',
        'The left answer contains most of the same facts but in an order that hides understanding.',
      ],
    },
  },

  internals: {
    beginner: `
Interviewers listen for signals: Do you understand the purpose? Have you actually used it? Do you know when it's the wrong choice? A structured answer makes each signal easy to spot. Practising out loud matters because explaining uses different "muscles" from coding.
`,
    technical: [
      `
**What each step demonstrates:**

| Step | Signal to the interviewer | Common failure |
|---|---|---|
| Define | precise vocabulary | a vague definition ("it's for stuff that changes") |
| Why | understanding of the problem space | skipping straight to syntax |
| How | mental model of the mechanism | magic words: "Vue just knows" |
| Example | hands-on experience | foo/bar examples, or none |
| Trade-off | judgement and seniority | "it's always better" |

**Handling follow-ups.** Most interviews are a conversation: your first answer invites a follow-up, usually aimed at the step you were weakest on. Answering with all five steps means follow-ups go *deeper* rather than back to basics.

**Clarify before you answer** when a question has hidden variables — Options vs Composition API, Vue 2 vs Vue 3, small app vs large team. A quick clarifying question shows you know the answer depends on context.
`,
      `
**Pushback is often a test, not a correction.** If an interviewer says "Are you sure? Wouldn't \`watch\` be better here?", check your reasoning out loud. If you still agree with yourself, say why, politely: "For derived values I'd still use computed because it's cached and declarative; I'd switch to watch if we needed a side effect like saving to the server." If they've spotted a real mistake, acknowledge it and correct it — both outcomes score well. Caving instantly or arguing defensively both score badly.
`,
    ],
    production: `
- The same structure works on the job: design docs, code-review comments ("this works, but here's the trade-off…") and explaining decisions to product managers.
- Keep a **story bank**: four to six real projects or incidents (a tricky bug, a performance fix, a disagreement, a migration) written up in STAR form. Most behavioural questions map onto one of them.
- **Never invent numbers or experience.** "Load time improved noticeably" is fine; a made-up percentage that you can't explain under follow-up questions is not.
- **Practise out loud** with a timer, ideally recorded. Notice filler words and answers that never reach the trade-off.
- Use the [Rapid review](lesson:rapid-review) for the most common Vue questions, [Live coding](lesson:live-coding) for hands-on rounds and [Frontend architecture interviews](lesson:frontend-system-design) for design rounds.
`,
  },

  mistakes: [
    {
      title: 'Leading with details instead of a definition',
      wrong: { code: `"Well, so there's this RefImpl class, and it has a dep, and track gets called…"`, lang: 'text' },
      right: { code: `"A ref is a reactive container for a single value. Under the hood it's an object\nwhose .value getter tracks reads and setter triggers updates…"`, lang: 'text' },
      explanation: 'Start with one sentence the interviewer can anchor on, then add mechanism. Internals without a frame sound like memorisation.',
    },
    {
      title: 'Never reaching the trade-off',
      wrong: { code: `"…and that's why Pinia is great and I use it for everything."`, lang: 'text' },
      right: { code: `"…the trade-off is extra structure; for state used by one component tree,\nprops or provide/inject are simpler, so I only reach for Pinia when state is truly shared."`, lang: 'text' },
      explanation: 'Knowing when *not* to use a tool is the clearest signal of experience.',
    },
    {
      title: 'Bluffing',
      wrong: { code: `"Yes, Vue's scheduler uses a red-black tree for that." (made up)`, lang: 'text' },
      right: { code: `"I'm not sure how the scheduler orders jobs internally. I know updates are batched\nand flushed in a microtask, and that parents update before children — I'd check the\nsource in runtime-core to confirm the details."`, lang: 'text' },
      explanation: 'Interviewers often probe until you reach the edge of your knowledge. Saying where the edge is — and how you\'d find out — is a strength. A confident wrong answer is a red flag.',
    },
    {
      title: 'foo/bar examples',
      wrong: { code: `"Like, if you have foo and bar, and baz depends on foo…"`, lang: 'text' },
      right: { code: `"In a cart, the total depends on the items' prices and quantities…"`, lang: 'text' },
      explanation: 'Realistic examples show you\'ve built real things and make your answer easier to follow.',
    },
  ],

  debugging: [
    {
      symptom: 'You freeze, or your mind goes blank.',
      cause: 'Trying to produce the perfect complete answer at once.',
      fix: 'Start with step 1 — just the definition. Saying one true sentence usually unlocks the rest. It\'s fine to say "let me think for a moment".',
    },
    {
      symptom: 'The interviewer keeps interrupting you.',
      cause: 'Your answer is too long or going in a direction they don\'t care about.',
      fix: 'Give the short five-step version, then ask "should I go deeper on any part?"',
    },
    {
      symptom: 'Follow-up questions keep returning to basics.',
      cause: 'Your first answer skipped "why" or "how", so they\'re checking understanding.',
      fix: 'Always include the problem being solved and the mechanism, even briefly.',
    },
    {
      symptom: 'You realise mid-answer that you said something wrong.',
      cause: 'Normal under pressure.',
      fix: 'Correct it explicitly: "Actually, I said X — it\'s Y, because…". Self-correction is a positive signal.',
    },
  ],

  bestPractices: [
    'Lead with a one-sentence definition.',
    'Always say why the thing exists before how it works.',
    'Use realistic examples — carts, forms, search boxes — and offer to sketch code.',
    'End with a trade-off or a case where you wouldn\'t use it.',
    'Give the short version first, then offer depth.',
    'Ask clarifying questions when the answer depends on context.',
    'Say "I don\'t know, but here\'s how I\'d find out" instead of bluffing.',
    'Practise out loud, with a timer, and keep a bank of real STAR stories.',
  ],

  useCases: [
    'Conceptual questions: "What is computed?", "Why keys in v-for?", "What is the virtual DOM?"',
    'Comparison questions: "ref vs reactive", "v-if vs v-show", "Pinia vs provide/inject".',
    'Behavioural questions: "Tell me about a hard bug" (STAR).',
    'Design discussions and code reviews on the job.',
    'Explaining technical decisions to non-engineers (drop to define/why/example).',
  ],

  whenToUse: {
    use: [
      'Define → why → how → example → trade-off for conceptual and comparison questions.',
      'STAR for behavioural "tell me about a time…" questions.',
      'A clarify → plan → build → test loop for coding questions (see [Live coding](lesson:live-coding)).',
      'Requirements → architecture → data → trade-offs for design questions (see [Frontend architecture interviews](lesson:frontend-system-design)).',
    ],
    avoid: [
      'Reciting the five steps robotically for a yes/no fact ("Is Suspense stable?" → "No, still experimental in Vue 3").',
      'Spending most of your time on the definition and never reaching the trade-off.',
      'Using the framework to pad an answer you don\'t actually understand.',
    ],
  },

  comparison: {
    title: 'Which structure for which question?',
    headers: ['Question type', 'Example', 'Structure', 'Watch out for'],
    rows: [
      ['Conceptual', '"What is a composable?"', 'define → why → how → example → trade-off', 'jargon without a definition'],
      ['Comparison', '"ref vs reactive?"', 'define both → key difference → when each → trade-off', 'declaring a winner without context'],
      ['Behavioural', '"Tell me about a hard bug"', 'STAR: situation → task → action → result', 'saying "we" for everything — what did *you* do?'],
      ['Coding', '"Build a filterable list"', 'clarify → plan → smallest working version → test → extend', 'coding in silence'],
      ['Design', '"Design a dashboard"', 'requirements → architecture → data/state → API → trade-offs', 'jumping to components before requirements'],
    ],
    note: 'Practise the most common Vue questions with this structure in the [Rapid review](lesson:rapid-review).',
  },

  quiz: [
    {
      id: 'answering-framework-q1',
      type: 'mcq',
      prompt: 'What should usually come **first** in an answer to "What is `watch()` in Vue?"',
      options: [
        { text: 'A one-sentence definition', },
        { text: 'The internal implementation using effects and schedulers', why: 'Internals without a definition sound memorised; they belong in the "how" step, after the frame is set.' },
        { text: 'A comparison with React\'s `useEffect`', why: 'Comparisons can help later, but they assume the interviewer wants a cross-framework discussion.' },
        { text: 'A story about a project', why: 'A story can be your example, but start with what `watch` is.' },
      ],
      answer: 0,
      explanation: 'Lead with a definition the interviewer can anchor on: "`watch()` runs a callback with side effects when specific reactive sources change."',
    },
    {
      id: 'answering-framework-q2',
      type: 'output',
      prompt: 'In the playground component, the template reads `{{ total }}` twice and `{{ totalMethod() }}` twice. You click **Re-render** once (it only changes `theme`). How many **new** console lines appear?',
      code: {
        lang: 'vue',
        code: `<p>{{ total }} · {{ total }}</p>              <!-- computed -->
<p>{{ totalMethod() }} · {{ totalMethod() }}</p> <!-- method -->
<button @click="toggleTheme">Re-render</button>`,
      },
      options: [
        { text: '0 computed, 0 method', why: 'The component does re-render because `theme` is used in the template, and methods run on every render.' },
        { text: '0 computed, 2 method' },
        { text: '1 computed, 2 method', why: 'The computed only recalculates when `items` changes; `theme` isn\'t one of its dependencies.' },
        { text: '2 computed, 2 method', why: 'Even when recalculated, a computed runs once per change, not once per use.' },
      ],
      answer: 1,
      explanation: 'The re-render calls the method twice (once per use) while the cached computed returns its stored value — exactly the evidence for "computed is cached, methods are not".',
    },
    {
      id: 'answering-framework-q3',
      type: 'bug',
      prompt: 'This answer to "Why does `v-for` need a key?" is mostly good, but one line is **wrong**. Click it.',
      code: {
        lang: 'text',
        code: `Define: a key gives each rendered item a stable identity.
Why: so Vue can match old and new items when the list changes.
How: Vue's diff reuses and moves elements with the same key.
Example: a todo list where items can be reordered or removed.
Trade-off: using the array index as key is always the best choice.`,
      },
      answerLine: 5,
      explanation: 'Index keys break identity when items are inserted, removed or reordered — state (like input values or component state) can end up on the wrong item. The trade-off line should say: use a stable unique id; the index is acceptable only for static lists that never reorder.',
    },
    {
      id: 'answering-framework-q4',
      type: 'fill',
      prompt: 'Fill in the missing steps of the framework.',
      code: { lang: 'text', code: `1. Define\n2. ___\n3. How\n4. Example\n5. ___` },
      answer: [['Why', 'why'], ['Trade-off', 'trade-off', 'Tradeoff', 'tradeoff', 'Trade-offs', 'trade-offs']],
      explanation: 'Define → Why → How → Example → Trade-off.',
    },
    {
      id: 'answering-framework-q5',
      type: 'mcq',
      prompt: 'You\'re asked about an API you\'ve never used (say, `effectScope()`). What\'s the best response?',
      options: [
        { text: 'Guess confidently — interviewers reward confidence', why: 'A confident wrong answer damages trust in everything else you said.' },
        { text: 'Say you haven\'t used it, then reason from what you do know and say how you\'d find out' },
        { text: 'Say "I don\'t know" and wait for the next question', why: 'Honest, but you miss the chance to show how you reason and learn.' },
        { text: 'Change the subject to something you know well', why: 'Interviewers notice, and it looks evasive.' },
      ],
      answer: 1,
      explanation: '"I haven\'t used it. From the name, I\'d guess it groups effects so they can be stopped together — like what a component does for its watchers on unmount. I\'d confirm in the Vue API docs." That shows honesty and reasoning.',
    },
    {
      id: 'answering-framework-q6',
      type: 'mcq',
      prompt: 'Select **all** the elements of a strong behavioural (STAR) answer.',
      options: [
        { text: 'A short description of the situation' },
        { text: 'What *you* specifically did, with technical detail' },
        { text: 'The result, and what you learned' },
        { text: 'Precise improvement percentages, even if you have to estimate them', why: 'Never invent numbers. Use real measurements if you have them; otherwise describe the outcome honestly.' },
        { text: 'Mostly "we" so you sound like a team player', why: 'Teamwork matters, but the interviewer needs to know your contribution.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Situation, Task, Action, Result — with your own actions as the heart of it, and honest outcomes.',
    },
    {
      id: 'answering-framework-q7',
      type: 'short',
      prompt: 'Answer "What is the difference between `computed` and `watch`?" using the five steps, in five sentences.',
      answer: 'Define: `computed` declares a cached value derived from reactive state; `watch` runs a callback with side effects when specific sources change. Why: derived values should stay in sync automatically, while side effects (API calls, saving, DOM work) need an explicit trigger. How: computed tracks the dependencies its getter reads and recomputes lazily when they change; watch tracks its sources and calls your function with new and old values. Example: a cart total is a computed; saving the cart to localStorage whenever it changes is a watch. Trade-off: computed getters must be pure and return a value, while watchers are imperative and easier to misuse for things that should be computed.',
    },
  ],

  exercises: [
    {
      id: 'prove-vif-vshow',
      title: 'Prove the v-if vs v-show trade-off',
      difficulty: 'intermediate',
      prompt: `
Build the "Example" for the classic answer. \`Panel.vue\` logs \`mounted\` followed by its name (e.g. \`mounted if-panel\`) when it mounts. In \`App.vue\`:

- \`visible\` starts as \`true\`; the \`<button class="toggle">\` flips it.
- Render \`<Panel name="if-panel" class="with-if">\` with **\`v-if\`**.
- Render \`<Panel name="show-panel" class="with-show">\` with **\`v-show\`**.

The tests hide and show both, then check the DOM *and* the logs: the v-if panel should mount again each time it reappears; the v-show panel should mount only once and simply be hidden.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'
import Panel from './Panel.vue'

const visible = ref(true)
</script>

<template>
  <button class="toggle" @click="visible = !visible">Toggle</button>
  <Panel v-if="visible" name="if-panel" class="with-if" />
  <Panel v-if="visible" name="show-panel" class="with-show" />
</template>`,
        'Panel.vue': `<script setup>
import { onMounted } from 'vue'

const props = defineProps({ name: String })
onMounted(() => console.log('mounted ' + props.name))
</script>

<template>
  <div class="panel">I am {{ name }}</div>
</template>`,
      },
      hints: [
        'Only one directive needs to change.',
        'Replace `v-if` with `v-show` on the second `<Panel>`. `v-show` works on components: it toggles `display` on the component\'s root element.',
        'Look at the logs in the console after toggling twice: which panel mounted twice?',
      ],
      solution: {
        explanation: 'The logs prove the mechanism behind the trade-off: `v-if` destroys and recreates the component (so it pays mount cost — and loses local state — on every show), while `v-show` mounts once and toggles CSS. That\'s the "example" that makes your spoken answer undeniable.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'
import Panel from './Panel.vue'

const visible = ref(true)
</script>

<template>
  <button class="toggle" @click="visible = !visible">Toggle</button>
  <Panel v-if="visible" name="if-panel" class="with-if" />
  <Panel v-show="visible" name="show-panel" class="with-show" />
</template>`,
          'Panel.vue': `<script setup>
import { onMounted } from 'vue'

const props = defineProps({ name: String })
onMounted(() => console.log('mounted ' + props.name))
</script>

<template>
  <div class="panel">I am {{ name }}</div>
</template>`,
        },
      },
      tests: [
        { name: 'both panels are visible at first', code: `expect(isVisible('.with-if')).toBe(true)\nexpect(isVisible('.with-show')).toBe(true)` },
        { name: 'hidden: v-if removes, v-show hides', code: `await click('.toggle')\nexpect(exists('.with-if')).toBe(false)\nexpect(exists('.with-show')).toBe(true)\nexpect(isVisible('.with-show')).toBe(false)` },
        { name: 'only the v-if panel mounts again', code: `await click('.toggle')\nawait click('.toggle')\nconst count = (name) => logs.filter((l) => l.includes('mounted ' + name)).length\nexpect(count('if-panel')).toBe(2)\nexpect(count('show-panel')).toBe(1)` },
      ],
    },
    {
      id: 'prove-computed-watch',
      title: 'Prove "computed for values, watch for side effects"',
      difficulty: 'intermediate',
      prompt: `
Make a demo for the answer to *"When do you use computed and when watch?"*

- \`<input class="query" v-model="query">\` filters \`products\` by name (case-insensitive). Render matches as \`<li class="result">\`. Use a **\`computed\`** for the filtered list.
- **Side effect:** whenever \`query\` changes, save it to \`localStorage\` under the key \`'last-query'\`. Use a **\`watch\`**.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const products = ['Desk Lamp', 'Notebook', 'Coffee Mug', 'USB Cable']
const query = ref('')

// TODO: a computed list of matching products
// TODO: a watcher that saves the query to localStorage ('last-query')
</script>

<template>
  <input class="query" v-model="query" placeholder="Search" />
  <ul>
    <li v-for="name in products" :key="name" class="result">{{ name }}</li>
  </ul>
</template>`,
      },
      hints: [
        'Import `computed` and `watch` from `vue`.',
        '`const results = computed(() => products.filter((p) => p.toLowerCase().includes(query.value.toLowerCase())))`, then loop over `results` in the template.',
        '`watch(query, (q) => localStorage.setItem(\'last-query\', q))`.',
      ],
      solution: {
        explanation: 'The filtered list is a pure function of state — a computed, cached and declarative. Saving to storage *does* something rather than *returns* something — a watch. If you can point at this split in a demo, your answer\'s trade-off section writes itself.',
        files: {
          'App.vue': `<script setup>
import { ref, computed, watch } from 'vue'

const products = ['Desk Lamp', 'Notebook', 'Coffee Mug', 'USB Cable']
const query = ref('')

const results = computed(() =>
  products.filter((p) => p.toLowerCase().includes(query.value.toLowerCase()))
)

watch(query, (q) => {
  localStorage.setItem('last-query', q)
})
</script>

<template>
  <input class="query" v-model="query" placeholder="Search" />
  <ul>
    <li v-for="name in results" :key="name" class="result">{{ name }}</li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: 'shows all products at first', code: `expect(findAll('.result')).toHaveLength(4)` },
        { name: 'filters case-insensitively', code: `await type('.query', 'LAMP')\nexpect(findAll('.result')).toHaveLength(1)\nexpect(text('.result')).toBe('Desk Lamp')` },
        { name: 'saves the query to localStorage', code: `await type('.query', 'mug')\nexpect(localStorage.getItem('last-query')).toBe('mug')` },
      ],
    },
  ],

  interview: [
    {
      id: 'answering-framework-project-walkthrough',
      difficulty: 'beginner',
      type: 'scenario',
      minutes: 4,
      question: '"Walk me through a Vue project you\'ve built." How do you structure the answer?',
      answer: 'Use a STAR-like shape with technical depth: one or two sentences of context (what the app does and for whom), your role and responsibilities, then the most interesting technical decisions you made — architecture, state management, a hard bug or performance issue — with why you chose that approach and what the trade-off was, and finally the outcome and what you would do differently. Pick one or two highlights instead of narrating every feature.',
      explanation: 'The interviewer is looking for ownership, decision-making and reflection, not a feature list.',
      whyAsked: 'Almost every interview starts here; it sets the tone and gives the interviewer material for follow-ups.',
      mistakes: ['Listing every library used.', 'Saying "we" throughout so your contribution is unclear.', 'No trade-offs or lessons learned.', 'Inventing metrics.'],
      followUps: ['What would you change if you rebuilt it?', 'What was the hardest bug?', 'How did you structure state?'],
      modelAnswer: 'I\'d say: "I built a booking dashboard for a small clinic — staff manage appointments and patients see availability. I owned the frontend: Vue 3 with script setup, Pinia for the shared calendar state, and Vue Router with lazy-loaded admin pages. The most interesting problem was keeping the calendar in sync when two staff edited at once; I added optimistic updates with rollback when the server rejected a conflict. The trade-off was more complex state code, which I contained in one store module with tests. In hindsight I\'d have introduced the API layer earlier — we had fetch calls scattered in components for a while." Then I stop and let them pick a thread.',
    },
    {
      id: 'answering-framework-dont-know',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'An interviewer asks, "How does Vue\'s compiler hoist static nodes?" You\'re not sure. What do you say?',
      answer: 'Be honest about the boundary, then reason from what you know and say how you would verify. For example: "I haven\'t studied the compiler output in detail. My understanding is that Vue\'s compiler analyses templates at build time and can treat parts that never change as static, so they don\'t need to be re-created or diffed on every render. I\'d confirm the specifics by looking at compiled output in the Vue SFC Playground or the docs\' rendering mechanism page."',
      explanation: 'Interviewers deliberately probe until you reach the edge of your knowledge. How you behave at that edge is part of the evaluation.',
      whyAsked: 'Tests honesty, reasoning under uncertainty and learning habits — all predictors of how you\'ll work on a team.',
      mistakes: ['Bluffing specifics.', 'A flat "I don\'t know" with no reasoning.', 'Apologising at length.'],
      followUps: ['What tools would you use to investigate?', 'Why would compile-time optimisation matter for performance?'],
      modelAnswer: 'I\'d say that I haven\'t dug into that part of the compiler, so I\'ll reason about it rather than pretend. Vue compiles templates ahead of time, so it can see which parts contain no dynamic bindings; it makes sense that those can be created once and skipped during updates, which reduces work during diffing. To confirm, I\'d paste a template into the Vue SFC Playground and read the compiled render function, and check the rendering mechanism section of the docs. That way they hear my mental model and how I\'d close the gap.',
    },
    {
      id: 'answering-framework-calibrate-depth',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'Explain `v-if` vs `v-show` twice: once as you would to a junior developer on your team, and once to a senior interviewer.',
      answer: 'To a junior: "Both show or hide things. `v-if` actually adds or removes the element; `v-show` keeps it and just hides it with CSS. Use `v-show` for things you toggle a lot, `v-if` for things that rarely appear." To a senior interviewer: the same core, plus mechanism and consequences — `v-if` destroys and recreates child components (running lifecycle hooks and resetting local state), supports `v-else` and `<template>`, and is lazy (nothing renders while false); `v-show` always renders once and toggles `display`, so initial cost is higher but toggling is cheap, and component state is kept. Then trade-offs: for heavy components toggled frequently, `v-show` or `<KeepAlive>`; for rarely shown or permission-gated content, `v-if` — but noting that hiding content in the UI is not security.',
      explanation: 'Calibration means the same truth at different depth — not a different answer.',
      whyAsked: 'Shows communication skill and whether you can go deep when it matters.',
      mistakes: ['Using jargon with the junior.', 'Stopping at the junior version with a senior interviewer.', 'Contradicting yourself between the two versions.'],
      followUps: ['When would you use `<KeepAlive>` instead?', 'How does `v-show` behave on a component with multiple root nodes?'],
      modelAnswer: 'For a junior I keep it to the mental picture: v-if adds or removes the element, v-show hides it with CSS, so frequently toggled things suit v-show and rarely shown things suit v-if. For a senior I add the mechanism and consequences: v-if is lazy and destroys child components, so hooks re-run and local state resets, and it works with v-else and template; v-show renders once, keeps state and only toggles display, so it costs more up front and less per toggle. Then the trade-off: frequent toggles of heavy UI — v-show or KeepAlive; rare or gated content — v-if, remembering that hiding isn\'t authorization.',
    },
    {
      id: 'answering-framework-why-vue',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: '"Why would you choose Vue over React for a new project?" How do you answer without sounding tribal?',
      answer: 'Anchor on project context and trade-offs rather than claiming one is better. Strengths often cited for Vue: approachable single-file components with HTML-based templates, a fine-grained reactivity system so you rarely hand-optimise re-renders, official solutions for routing and state (Vue Router, Pinia) and tooling (Vite, Vue DevTools), and good incremental adoption. Considerations for React: a larger ecosystem and hiring pool in many markets, React Native for mobile, and team familiarity. The honest conclusion: the team\'s experience and the product\'s needs usually matter more than the framework.',
      explanation: 'Interviewers asking this want to see balanced reasoning, not loyalty.',
      whyAsked: 'Reveals judgement and whether you can make technology decisions for a team.',
      mistakes: ['"React is bad" / "Vue is just better".', 'Benchmarks or popularity numbers you can\'t source.', 'Ignoring the team and the product.'],
      followUps: ['When would you pick React instead?', 'How does Vue\'s reactivity differ from React\'s rendering model?'],
      modelAnswer: 'I\'d start with "it depends on the team and the product", then be concrete. Vue gives you single-file components with templates that feel close to HTML, reactivity that tracks dependencies so components update precisely without manual memoisation, and first-party router, store and devtools, so a team makes fewer ecosystem decisions. React\'s strengths are its very large ecosystem, React Native, and often a bigger hiring pool. If the team already knows React deeply or needs native mobile, I\'d lean React; for a team that values conventions and fast onboarding, Vue is a strong choice. Either can build an excellent product.',
    },
    {
      id: 'answering-framework-pushback',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 3,
      question: 'You explain that a filtered list should be a `computed`. The interviewer says: "I\'d use a `watch` that updates a ref — isn\'t that more flexible?" How do you respond?',
      answer: 'Treat it as a discussion, not an attack. Re-check your reasoning out loud, acknowledge the valid point, then explain your position with trade-offs: "A watch can do it, and it is more flexible — for example if the filtering were async or needed debouncing. For a synchronous derived value I\'d still prefer computed: it\'s declarative, cached, can\'t get out of sync, and avoids duplicated state and an extra update cycle. If the requirement changed to fetching results from the server, I\'d switch to a watch." If they then reveal a requirement you missed, adapt.',
      explanation: 'Pushback often tests whether you can hold a reasoned position and update it with new information.',
      whyAsked: 'Senior engineers disagree constructively every day in design reviews.',
      mistakes: ['Instantly agreeing to please the interviewer.', 'Getting defensive.', 'Not identifying when their suggestion would be right.'],
      followUps: ['What problems does duplicated state cause?', 'How would you implement debounced filtering?'],
      modelAnswer: 'I\'d say: that works, and a watcher is the right tool if the filtering becomes asynchronous — say results come from the server, or we need debouncing. For a synchronous filter I\'d keep computed, because it\'s a pure derivation: it\'s cached, it can\'t drift out of sync with its sources, and I avoid a second piece of state plus a watcher to maintain. So my rule is computed for values, watch for side effects — and if there\'s a requirement I\'m missing that makes it async, I\'d happily switch.',
    },
    {
      id: 'answering-framework-grade-answer',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 3,
      question: 'A candidate answers "What is a composable?" with: *"It\'s a function that starts with use. You put stuff in it."* What is missing, and what would a strong answer sound like?',
      answer: 'It has no real definition, no why, no mechanism, no example and no trade-off. Strong version: "A composable is a function that uses the Composition API to encapsulate and reuse stateful logic. It exists because logic like fetching, mouse tracking or form validation is often needed in several components, and mixins made sources and name clashes unclear. It works by creating refs, computed values and watchers inside the function and returning them, so each component calling it gets its own reactive state tied to its lifecycle. For example `useFetch(url)` returns `data`, `error` and `loading`. The trade-off is that composables can hide too much — I keep them focused and accept refs or getters as inputs."',
      explanation: 'Grading an answer is a great way to internalise the framework: spot which steps are missing.',
      whyAsked: 'Some interviews include "critique this" tasks; it also mirrors code-review communication.',
      mistakes: ['Only fixing the definition.', 'Adding internals without a why.', 'Forgetting the trade-off.'],
      followUps: ['How do composables compare to mixins?', 'What makes a composable well designed?'],
      modelAnswer: 'The answer names a convention but explains nothing, so I\'d rebuild it with the five steps. A composable is a function using Composition API primitives to encapsulate reusable stateful logic. It exists so logic shared across components — fetching, validation, browser APIs — lives in one place with explicit inputs and outputs, unlike mixins. Inside, it creates refs, computeds and watchers and returns them, and they\'re scoped to the calling component. Example: `useFetch(url)` returning data, error and loading. Trade-off: it\'s easy to build composables that do too much, so I keep them focused and well named.',
    },
    {
      id: 'answering-framework-prove-caching',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 5,
      question: 'This component recalculates an expensive total on every render, even when only `showTax` changes. Refactor it so the total is recalculated only when `items` change, and prove it: after toggling `.toggle-tax` twice, the console must show no new **total calculated** lines.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const items = ref([{ price: 20 }, { price: 15 }, { price: 5 }])
const showTax = ref(false)

function total() {
  console.log('total calculated')
  return items.value.reduce((sum, item) => sum + item.price, 0)
}
</script>

<template>
  <p class="total">Total: {{ total() }}</p>
  <p v-if="showTax" class="tax">Tax included</p>
  <button class="toggle-tax" @click="showTax = !showTax">Toggle tax note</button>
</template>`,
        },
      },
      tests: [
        { name: 'shows the total', code: `expect(text('.total')).toBe('Total: 40')` },
        { name: 'toggling unrelated state does not recalculate', code: `const count = () => logs.filter((l) => l.includes('total calculated')).length\nconst before = count()\nawait click('.toggle-tax')\nawait click('.toggle-tax')\nexpect(count()).toBe(before)` },
      ],
      hints: ['Which Vue API caches a derived value until its dependencies change?', '`const total = computed(() => { … })` and use `{{ total }}` (no parentheses) in the template.'],
      answer: 'Turn the function into `computed()` and reference it without calling it in the template.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const items = ref([{ price: 20 }, { price: 15 }, { price: 5 }])
const showTax = ref(false)

const total = computed(() => {
  console.log('total calculated')
  return items.value.reduce((sum, item) => sum + item.price, 0)
})
</script>

<template>
  <p class="total">Total: {{ total }}</p>
  <p v-if="showTax" class="tax">Tax included</p>
  <button class="toggle-tax" @click="showTax = !showTax">Toggle tax note</button>
</template>`,
        },
      },
      explanation: 'The computed depends only on `items`, so re-renders caused by `showTax` reuse the cached value; the log count proves it.',
      whyAsked: 'Interviewers like candidates who back claims with evidence — a two-minute demo beats a paragraph of assertions.',
      mistakes: ['Keeping `total()` with parentheses in the template after converting.', 'Memoising manually with a variable that never invalidates.', 'Putting side effects in the computed (the log here is only for the demo).'],
      followUps: ['When would a method be the better choice?', 'What happens if the computed getter mutates state?'],
      modelAnswer: 'I\'d convert `total` to a computed: it depends only on `items`, so Vue caches the result and returns it on re-renders triggered by `showTax`. In the template it becomes `{{ total }}` without parentheses. To prove it I count the log lines before and after toggling — the count doesn\'t change. In real code I wouldn\'t log inside a computed; getters should be pure.',
    },
  ],

  takeaways: [
    'Structure conceptual answers as define → why → how → example → trade-off, then offer depth.',
    'Lead with a one-sentence definition; explain the problem before the mechanism.',
    'Use realistic examples and, where possible, a tiny runnable proof.',
    'The trade-off — when not to use it — is the strongest seniority signal.',
    'Clarify vague questions, think aloud, correct yourself openly, and never bluff or invent numbers.',
    'Use STAR for behavioural questions, and practise every answer out loud.',
  ],
}
