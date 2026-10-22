# Vue/Zero — Vue.js from zero to ship it

An interactive Vue.js course built **with** Vue 3: 20 levels and 134 lessons, from
"what is a website?" up to SSR and system-design interviews. Every lesson has
plain-English explanations, a live code sandbox, animated visualizers, a quiz,
test-graded coding exercises and topic-specific interview practice. The visual
style is a raw, editorial, hand-made manual (Anti-Polish / neo-brutalist).

- **134 lessons** (125 lessons + 9 guided projects) with 905 interview
  questions (135 of them test-graded coding challenges), 905 quiz questions,
  258 test-graded coding exercises and project builds, and 500 guided
  playground experiments (412 checked automatically)
- **A real sandbox**: Single-File Components compile in a Web Worker
  (`@vue/compiler-sfc`) and run in a sandboxed iframe, with a console, a live
  reactive-state inspector, guided walkthroughs and in-browser tests
- **15 reusable visualizers**, driven by real Vue, Vue Router and Pinia
  instances (or a small, clearly labelled teaching engine)
- **Interview mode**: practice or timed mock sessions, auto-, test- and
  self-graded answers (labelled as such), a review screen and a revision queue
- **Progress tracking** in the browser only (no account): completion rules
  tied to real activity, streaks, quiz history, bookmarks and recommendations

## Getting started

Requires **Node 20.19+** (an `.nvmrc` pins Node 24).

```bash
nvm use            # or any Node >= 20.19
npm install
npm run dev        # http://localhost:5173
```

| script | does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run build` / `npm run preview` | production build / serve it |
| `npm test` | all unit, sandbox and content tests (Vitest + jsdom) |
| `npm run validate:content` | content validation only; `LESSONS=ref,computed npm run validate:content` limits it |
| `npm run test:e2e` | Playwright end-to-end + axe accessibility tests (uses your installed Chrome) |

## Tech stack

Vue 3.5 (`<script setup>`, JavaScript), Vite, Vue Router, Pinia, CodeMirror 6
(editor + Lezer static highlighting), GSAP (two meaningful animations only),
lucide icons, self-hosted fonts (Archivo, JetBrains Mono, Patrick Hand),
Vitest + Vue Test Utils, Playwright + axe-core.

## Project structure

```text
plugins/
  content-index.js      Vite plugin: builds virtual modules from the lessons
                        (light index · lazy search index · question bank · question meta)
  sandbox-libs.js       serves/emits the Vue, Pinia and Vue Router browser builds the sandbox loads
src/
  content/
    curriculum.js       the course map (20 levels, teaching order)
    lessons/<level>/<lesson>.js   one pure-data module per lesson
    schema.js           content validator (used by tests)
    visualizers.js      visualizer catalog (types + props)
    playground-examples.js, interview-categories.js
  services/
    sandbox/            compile.js (SFC → modules, loop guards, import rewriting),
                        compiler.worker.js, core.js (module registry + test harness,
                        shared by the iframe and Vitest), runtime.js (iframe glue), srcdoc.js
    storage.js          persistence adapter (localStorage today, swappable)
    highlight.js        static highlighting with the editor's Lezer parsers
  stores/               progress, interview, preferences, ui (Pinia)
  utils/                learning analytics, grading, markdown, search, dates,
                        miniReactivity (visualizer engine), vdomDiff
  composables/          useSandbox, useStepPlayer, usePersistedState, useMediaQuery, …
  components/
    layout/ ui/ code/ learning/ quiz/ interview/ diagrams/
  pages/                every route is lazy-loaded
  styles/               tokens.css (design tokens) · base · components · code
tests/
  unit/                 utils, stores, components, router, sandbox, content validation
  e2e/                  learning flow, interview, search, mobile nav, 404, axe (light + dark)
```

## How the sandbox works (and why it's safe)

1. Files are compiled in a **Web Worker** with `@vue/compiler-sfc` (script
   setup, Options API, scoped CSS, CSS modules, `v-bind()` in CSS).
2. Each module's ES imports and exports are rewritten (via Babel's AST) into a
   tiny registry format; `import()` works for lazy routes; every loop gets a
   guard that throws after 1.5 s instead of freezing the tab.
3. The result runs in an `<iframe sandbox="allow-scripts allow-modals allow-forms">`
   **without** `allow-same-origin`, so learner code has an opaque origin: no
   access to the app's DOM, cookies or storage. Messages are checked by
   `event.source`.
4. The same `core.js` runs in Vitest, which is how the test suite proves that
   **every exercise solution passes its tests and every starter fails at
   least one**.

No Content-Security-Policy header is set: `srcdoc` iframes inherit the parent's
CSP, and the sandbox needs inline scripts and `new Function`. Isolation comes
from the opaque-origin sandbox instead.

## Writing content

Read **[CONTENT_GUIDE.md](CONTENT_GUIDE.md)**, the full authoring contract
(schema, teaching standard, accuracy rules, sandbox limits, test API,
visualizer catalog). `src/content/lessons/reactivity/ref.js` is the reference
lesson. A lesson is done when `LESSONS=<id> npm run validate:content` is green.
In dev, the course map and search update automatically when lesson files change
(set `VLP_NO_CONTENT_RELOAD=1` to stop open pages reloading during bulk edits).

## Progress and data

Stored in `localStorage` under `vlp:*` (see `services/storage.js`). Stores talk
to an adapter with `read/write/remove/keys/subscribe`, so a backend can replace
it later. Settings → *Your data* exports/imports JSON and resets data, with
confirmation. Completion requires real activity (run the example, pass the quiz
on first tries, pass an exercise's tests). Self-assessed answers are never
counted as correct.

## Accessibility

Semantic landmarks, skip link, visible focus rings, keyboard-operable
tabs/palette/visualizer controls, native `<dialog>` modals, `aria-live`
feedback, text descriptions for every visual, `prefers-reduced-motion` plus an
in-app motion setting (visualizers switch to manual stepping), light and dark
themes. The axe suite checks 8 key pages in both themes for serious or critical
WCAG 2.1 AA issues.

## Deployment

`vercel.json` configures the Vite build, SPA rewrites, long-term caching for
hashed assets and the sandbox libraries, and basic security headers. Any static
host works if unknown paths fall back to `index.html`.

## Known limitations

- The sandbox has no npm packages (only `vue`, `pinia`, `vue-router`) and no
  real network; API lessons use simulated servers. TypeScript and tooling code
  (Vitest, Playwright, Nuxt, Axios) is shown as static code.
- Sandbox imports are copies, not live bindings (`export let` won't update
  importers); top-level `await` isn't supported.
- `localStorage` inside the sandbox is in-memory and resets on each run.
- The search index (~370 KB gzipped) and question bank (~600 KB gzipped) load
  lazily, the first time you search or open interview pages.
- A few time-based project tests (e.g. the simulated real-time socket) assume
  normal machine load. They pass reliably on their own but can flake when the
  machine is heavily loaded.
