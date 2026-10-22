# Content guide — writing Vue/Zero lessons

Every lesson is one ES module at `src/content/lessons/<level-id>/<lesson-id>.js` that
`export default`s a plain object. The level and lesson ids come from
`src/content/curriculum.js`. The reference implementation is
`src/content/lessons/reactivity/ref.js` — read it first and match its quality.

Lesson files must be **pure data**: no `import` statements, no Vite-only syntax.
Shared code strings may be declared as `const` at the top of the file.

Validate while you work (Node 20.19+ required, Node 24 is installed via nvm):

```bash
export PATH=~/.nvm/versions/node/v24.18.0/bin:$PATH
LESSONS=ref,computed npm run validate:content
```

The validator checks the schema, compiles every runnable file set with
`@vue/compiler-sfc`, runs every exercise's tests against its **solution** (must all
pass) and its **starter** (must fail at least one), and checks that guided
experiments fail on the untouched playground. A lesson is done only when it is green.

---

## 1. Teaching standard

- **Audience:** a curious 15-year-old with no background, who will grow into a
  professional. Define every technical term the first time it appears
  ("a *component* is…"). Never rely on an undefined term.
- **Intuition first, precision second.** Start from the idea and an everyday
  analogy, then the code, then the line-by-line explanation, then what happens
  internally, then edge cases and production practice.
- **Teach, don't list.** Explain *why* each rule exists. Use concrete, realistic
  examples (carts, todo lists, profiles, search boxes) — not `foo`/`bar`.
- **Depth scales with the topic.** Simple topics stay short; advanced topics get a
  genuinely deep `internals` with all three layers (beginner / technical /
  production). Don't pad.
- **Tone:** direct, warm, a little playful, never childish. Short paragraphs.
  No "In this lesson we will…" filler.

## 2. Accuracy rules (non-negotiable)

- Teach **Vue 3** (the platform runs Vue 3.5). Primary references:
  [Vue guide](https://vuejs.org/guide/introduction.html),
  [Vue Router](https://router.vuejs.org/), [Pinia](https://pinia.vuejs.org/).
  Every lesson links at least one official page in `docs`.
- Prefer `<script setup>` + Composition API. Show the Options API where the lesson
  is about it or where comparing helps.
- Mention version requirements for version-sensitive APIs, e.g. `defineModel()`
  (3.4+), `watch(..., { once: true })` (3.4+), `useTemplateRef()` (3.5+),
  `useId()` (3.5+), `onWatcherCleanup()` (3.5+), reactive props destructure (3.5+),
  `defineOptions`/`defineSlots` (3.3+), `toValue()` (3.3+). `<Suspense>` is
  experimental — say so.
- Keep Vue core, Vue Router, Pinia and Nuxt clearly separated. Don't attribute a
  library feature to Vue core.
- Avoid deprecated APIs except in clearly labelled legacy/migration content.
- Label simplified demonstrations as **simplified** and say what production code
  would add. Never present a toy implementation as production-ready.
- **Never invent numbers** — no fabricated benchmarks, percentages or stats.
- If you are not sure a detail is true for the current release, leave it out or
  phrase it carefully. Wrong is worse than missing.
- Frontend checks never replace backend authorization — say so wherever relevant.

## 3. Lesson object

Fields marked * are required for normal lessons. "Rich" means: a markdown string,
or an array mixing markdown strings, code objects `{ code, lang, title?, highlight?, static? }`
and callouts `{ callout: 'tip'|'warn'|'note'|'version', title?, text }`.

| field | type | notes |
|---|---|---|
| `id`* | string | equals the file name |
| `title`*, `summary`* | string | summary is one sentence |
| `difficulty`* | `'beginner'|'intermediate'|'advanced'` | |
| `minutes`* | number | honest reading + doing time |
| `prerequisites`, `related` | lesson id[] | must exist in curriculum.js |
| `tags`* | string[] | search keywords |
| `apis` | `{ name, summary }[]` | API reference entries for search |
| `docs`* | `{ label, url }[]` | https official docs |
| `intro`*, `why`*, `eli15`* | Rich | what it is · why it exists · explained to a 15-year-old |
| `analogy`* | `{ title, body: Rich, mapping?: [concept, meaning][] }` | everyday-life analogy |
| `visual` | Visual | static or interactive illustration ("Picture it") |
| `syntax`* | Rich | syntax and rules |
| `walkthrough` | `{ title?, lang?, code, intro?, steps: [{ lines: [n] or [start,end], text }] }` | if `code` equals the playground entry file, the playground's **Guide** mode reuses these steps |
| `playground`* | Playground | the live, editable example |
| `animation` | Visual | animated explanation ("Watch it work") |
| `internals` | Rich, or `{ beginner, technical, production }` | use the 3-layer object for intermediate/advanced topics |
| `mistakes` | `{ title, wrong?: Code, right?: Code, explanation }[]` | |
| `debugging` | `{ symptom, cause, fix }[]` | |
| `bestPractices`, `useCases` | string[] | |
| `whenToUse` | `{ use: string[], avoid: string[] }` | |
| `comparison` | `{ title?, headers: string[], rows: string[][], note? }` | each row has `headers.length` cells; first cell is the row label |
| `quiz`* | QuizQuestion[] (≥4, ≥2 auto-graded) | |
| `exercises`* | Exercise[] (≥1, usually 2) | |
| `interview`* | InterviewQuestion[] (≥4, usually 5–7) | |
| `takeaways`* | string[] (≥3) | |
| `completion` | `{ requireRun?, quizPass?, exercises? }` | rarely needed |
| `next` | lesson id | only to override curriculum order |

At least one of `visual` / `animation` is required.

### Playground

```js
playground: {
  title: 'Shopping cart',
  objective: 'One sentence: what to try.',
  files: { 'App.vue': `...`, 'CartItem.vue': `...` },   // entry: main.js if present, else App.vue
  entry: 'App.vue',            // optional
  expected: 'What the learner should see (markdown).',
  experiments: [               // 3–4 guided experiments
    {
      id: 'discount',
      task: 'Change … so that …',          // markdown
      hint: 'Look at line …',              // optional
      tests: [{ name: '…', code: `…` }],   // optional; MUST fail on the original files
      explain: 'Why it worked (shown after completion).',
    },
  ],
  variants: [{ id: 'basic', label: 'Beginner version', files: {…} }, …], // optional: alternative versions/solutions
}
```

### Visual

```js
visual: { type: 'concept-diagram', props: {…}, title?: '…', caption?: Rich, alt: 'Text description of what the visual shows (required, for screen readers)', after?: Rich }
```

### Quiz questions

All need `id` (unique in the lesson, prefix with the lesson id), `type`, `prompt`
(markdown) and `explanation` (except `short`). Options are strings or
`{ text, why }` — **write `why` for every wrong option**: it is the feedback shown
when a learner picks it (the right answer is only revealed on request).

| type | shape |
|---|---|
| `mcq` | `options`, `answer: index` (or `[indexes]` for select-all) |
| `output` | `code`, then `options` + `answer: index`, or `answer: 'expected text'` (+ `accept: []`) |
| `bug` | `code`, `answerLine: n` (1-based line the learner clicks) — or `options` + `answer` |
| `fill` | `code` containing `___` blanks, `answer: [['ref'], ['value', '.value']]` (accepted strings per blank) |
| `short` | `answer: 'model answer'` — self-assessed, never counted in the score |

Use a mix: at least one `mcq`, one `output` (predict-the-output), one `bug`
where it makes sense, one `fill`, one `short`. 5–7 questions.

### Exercises

```js
{
  id: 'floor-counter', title: '…', difficulty: 'beginner',
  prompt: `…exact requirements, including the class names / selectors the tests use…`,
  files: { 'App.vue': `starter` },
  hints: ['…', '…', '…'],                 // progressive: nudge → approach → near-answer
  solution: { explanation: '…why it works…', files: { 'App.vue': `…` } },
  tests: [{ name: 'starts at 0', code: `expect(text('.count')).toBe('0')` }],
}
```

The prompt **must state the selectors the tests rely on** (e.g. `class="count"`).

### Interview questions

```js
{
  id: 'ref-value-template',            // globally unique: start with the lesson id
  difficulty: 'beginner',              // beginner | intermediate | advanced
  type: 'conceptual',                  // conceptual | output | debugging | coding | scenario | comparison | architecture
  minutes: 2,                          // estimated answer time
  question: '…',
  answer: 'Clear, direct answer.',
  explanation: 'Simple explanation.',
  code: { lang: 'vue', code: `…` },    // optional example
  whyAsked: 'Why interviewers ask it.',
  mistakes: ['Common weak answers…'],
  followUps: ['Likely follow-up questions…'],
  modelAnswer: 'What to say out loud in an interview (4–7 sentences): define → why → how → example → trade-off.',
  challenge: 'Optional learner challenge.',
  // auto-graded variant (good for output/debugging/comparison):
  options: ['…', '…', '…'], correctOption: 1,
  // coding variant (test-graded):
  starter: { files: {…} }, tests: [{ name, code }], solution: { files: {…} }, hints: ['…'],
}
```

Per lesson: 5–7 questions spanning beginner → advanced and several types
(always conceptual + at least two of scenario / debugging / output / coding /
comparison / architecture). Include one `coding` question with starter, tests and
solution in most lessons. Questions must be specific to the topic — no
reworded duplicates of questions in other lessons.

### Projects (level `projects`, `kind: 'project'`)

Projects add: `requirements` (string[]), `objectives` (string[]), `steps`
(`{ title, body: Rich }[]` — the step-by-step build), `challenges` (string[]),
`solution` (`{ files, entry?, explanation }` — rendered as the live "finished
app" preview and the reveal-on-request complete solution), and
`playground` = the **starter** with `playground.tests` (the solution must pass
them; the starter must fail at least one). `analogy`, `syntax`, `visual` and
`exercises` are optional for projects; `quiz` and `interview` need ≥2 each.

## 4. Markdown dialect

Paragraphs, `- ` / `1. ` lists, ```` ```lang ```` fences, `> ` quotes (start with
`**Tip:**`, `**Careful:**`, `**Note:**` or `**Version:**` to style them),
`#### headings`, `` `code` ``, `**bold**`, `*italic*`, `[text](https://…)`
and lesson cross-links `[computed()](lesson:computed)` or `(lesson:computed#syntax)`.
Cross-link related lessons generously.

## 5. Escaping inside template literals (the #1 source of broken files)

Lesson text lives in JavaScript template literals, so:

- write `` \` `` for a literal backtick and `\${` for a literal `${`;
- **regex backslashes must be doubled**: `\\d`, `\\s`, `\\w` (a single `\d` silently becomes `d`);
- a code sample containing a template string: `` \`Hello \${name}\` ``.

Single-quoted strings are fine for short text; escape `'` inside them.

## 6. The sandbox (what runnable code can do)

Runnable code = `playground.files`, `variants`, exercise starters/solutions,
interview `starter`/`solution`, project `solution`.

- Plain JavaScript only. `lang="ts"` is rejected — show TypeScript with static
  code blocks (`{ code, lang: 'ts', static: true }`).
- Imports: `'vue'`, `'pinia'`, `'vue-router'`, and relative project files
  (`./Child.vue`, `./useCounter.js`, `./api.js`). Nothing else (no axios, no
  lodash) — show those as static code.
- `.vue` (with `<script setup>`, `<script>`, scoped CSS, `<style module>`,
  `v-bind()` in CSS), `.js` and `.css` files are supported. No preprocessors.
- **No network.** Simulate APIs in a local `api.js` with `setTimeout` +
  Promises (and fake failures where useful). Keep simulated delays short
  (≤ 600 ms) so tests stay fast.
- **Vue Router:** use `createMemoryHistory()` in runnable code (the sandbox has
  no real URL); explain that real apps use `createWebHistory()`.
- **Pinia / Router:** add a `main.js` that does
  `createApp(App).use(createPinia()).use(router).mount('#app')`. When `main.js`
  exists it is the entry and is re-run for every test.
- **Plain JavaScript demos** (foundations level): a project may be just a
  `main.js` that renders into `document.getElementById('app')` with DOM APIs —
  no Vue needed. Attach event listeners to elements inside `#app` (not to
  `document`/`window`, which persist between test runs).
- `localStorage` / `sessionStorage` work but are in-memory; they are cleared on every run and before every test.
- Learners can add and delete files in playgrounds, but include every file a task (and its tests) needs in the starter — a stub is fine.
- The playground's version menu always offers the lesson's own files as "Lesson example"; `variants` are extra versions (you don't need a "starting point" variant).
- `alert`/`confirm` work. Forms submitted without `.prevent` are blocked with a warning.
- Loops are guarded: a loop running > 1.5 s throws.
- Dynamic `import('./Page.vue')` works (string paths only) and resolves asynchronously like a
  lazy chunk — use it for lazy routes and `defineAsyncComponent`. `import.meta.env` provides
  `MODE`, `DEV`, `PROD`, `SSR` and `BASE_URL` only (no `VITE_*` variables).
- Markdown pipe tables are supported in prose.

### Test API (exercise, experiment, coding-question and project tests)

Each test's `code` is the body of an `async` function. Before every test the app
is mounted fresh (modules re-evaluated). Available:

| helper | does |
|---|---|
| `expect(x)` | `.toBe` `.toEqual` (deep, key-order-insensitive) `.toContain` `.toMatch` `.toBeTruthy` `.toBeFalsy` `.toBeNull` `.toBeUndefined` `.toBeDefined` `.toBeGreaterThan(OrEqual)` `.toBeLessThan(OrEqual)` `.toHaveLength` `.toThrow`, and `.not.*` |
| `find(sel)` / `findAll(sel)` / `exists(sel)` | query inside `#app` |
| `query(sel)` / `queryAll(sel)` | query the whole document (e.g. Teleported content) |
| `text(sel?)` | trimmed text, whitespace collapsed (whole app if no selector) |
| `html(sel?)`, `attr(sel, name)`, `classes(sel)` | inspection |
| `isVisible(sel)` | false if missing, `display:none` (inline, e.g. `v-show`), `hidden` or `visibility:hidden` |
| `click(sel or element)` | dispatch click, then await DOM update |
| `type(sel, value)` | set value + `input` + `change` events (works with `v-model`) |
| `check(sel, bool?)`, `select(sel, value)` | checkboxes/radios, `<select>` |
| `trigger(sel, 'keyup', { key: 'Enter' })` | any event (KeyboardEvent for `key*`) |
| `submit(sel = 'form')` | dispatch a cancelable submit |
| `nextTick()`, `flush()`, `wait(ms)` | await updates / timers (`wait` also flushes) |
| `state` | the root component's setup state (refs unwrapped): `state.count` |
| `vm` | the root component's public instance |
| `logs` | array of console output strings during this test |
| `requireModule('useCounter.js')` | a project module's exports |
| `withSetup(() => useCounter())` | run a composable inside a component setup, returns its result |
| `mountFile('Child.vue', props)` | mount one component; returns `{ el, text(), find(sel), emitted(name), setProps(p), props }` |

Tests also run in **jsdom** in CI, so avoid layout measurements (`offsetWidth`,
`getBoundingClientRect`), computed colours or stylesheet-dependent visibility —
assert text, attributes, classes, existence and `isVisible` (inline styles).
Keep each test under ~2 s. Prefer stable selectors (`class` or `data-test`).

## 7. Visualizers (`visual` / `animation`)

| type | props | shows |
|---|---|---|
| `scoreboard` | `label`, `start` | clicking changes a ref; arrow "Vue notices the change" |
| `reactivity` | `preset`: `compare` · `ref` · `reactive` · `computed` · `watch` | stepper: state → track → change → trigger → effects → DOM, for the chosen API (`compare` = ref vs reactive vs computed vs watch on one cart) |
| `dependency-tracker` | `preset`: `cart` · `chain` | live mini reactivity engine; edit state and see which computeds/effects re-run (`chain` shows lazy computed chains) |
| `component-flow` | `mode`: `props` · `emits` · `v-model` · `slots` · `scoped-slots` · `provide-inject` · `pinia` | animated parent/child data flow, clickable components show code |
| `lifecycle` | `withChild` (bool) | mount/update/unmount real components and watch hooks fire in order |
| `router` | `preset`: `basics` · `dynamic` · `nested` · `guards` · `lazy` | URL → matching → guards → rendering with a real in-memory router |
| `pinia` | `preset`: `cart` · `local-vs-shared` | components sharing a real store; who re-renders after an action |
| `vdom` | `preset`: `list` · `keys` · `text` | conceptual old/new virtual trees, changed nodes, patch list |
| `performance` | `demo`: `updates` · `computed-cache` · `debounce` · `lazy-routes` · `virtual-list` · `shallow` | measured, live demos (real counts and timings from the learner's browser) |
| `directive-lab` | `directive`: `interpolation` · `v-bind` · `v-on` · `v-if` · `v-show` · `v-for` · `v-model` · `class` · `style` | toggle inputs and inspect the real DOM the directive produces |
| `event-loop` | `preset`: `promises` · `timers` · `async-await` · `nexttick` | call stack / microtasks / tasks stepper |
| `rendering-lab` | `mode`: `teleport` · `keep-alive` · `transition` · `dynamic` | live demos of those built-ins |
| `dom-tree` | `html` | editable HTML → the DOM tree the browser builds |
| `comparison` | `left: { label, code, lang }`, `right: {…}`, `points: string[]` | side-by-side approaches with the differences called out |
| `concept-diagram` | see below | your own stepped diagram for any concept |

`concept-diagram` props:

```js
{
  nodes: [
    { id: 'url', label: 'URL changes', note: '/users/42', tone: 'acid' }, // tone: paper | acid | cobalt | red | ink | kraft
    { id: 'match', label: 'Route matching' },
  ],
  edges: [{ from: 'url', to: 'match', label: 'router.push()', dashed: false }],  // edge id = 'url->match' unless you set id
  steps: [
    { focus: ['url'], text: 'The user clicks a link… (markdown)' },
    { focus: ['match'], edges: ['url->match'], text: '…' },
  ],
  layout: 'row',      // row | column | grid  (used when nodes have no x/y)
  cols: 3,            // for grid
  // or give every node x, y (centre) inside width × height (default 760 × 320)
}
```

Use `concept-diagram` freely for foundations, architecture, SSR, security flows,
etc. Use the specialised visualizers where they fit the lesson exactly.

## 8. Checklist before you call a lesson done

- [ ] Every required field present; `LESSONS=<id> npm run validate:content` is green.
- [ ] ELI15 + analogy are genuinely understandable without prior knowledge.
- [ ] The playground runs, shows something meaningful, and has 3–4 experiments (most with tests).
- [ ] 1–2 exercises with tests, 2–3 progressive hints, solution + explanation.
- [ ] Quiz mixes types, every wrong option has a `why`.
- [ ] 5–7 interview questions across difficulties and types, model answers speakable in an interview.
- [ ] Version notes where relevant; simplified code labelled; no invented numbers.
- [ ] Cross-links to related lessons with `lesson:` links.
