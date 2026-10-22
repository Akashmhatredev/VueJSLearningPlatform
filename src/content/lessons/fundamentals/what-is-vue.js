// Lesson: What is Vue.js and why use it?

const ticketsApp = `<script setup>
import { ref } from 'vue'

const tickets = ref(1)
const price = 25

function addTicket() {
  tickets.value++
}
</script>

<template>
  <h2>Concert tickets</h2>
  <p class="summary">{{ tickets }} × €{{ price }} = €{{ tickets * price }}</p>
  <button class="add" @click="addTicket">Add a ticket</button>
</template>`

const plainTickets = `// The same ticket counter, written with plain DOM code (no Vue).
let tickets = 1
const price = 25

const root = document.getElementById('app')
const heading = document.createElement('h2')
const summary = document.createElement('p')
const button = document.createElement('button')

heading.textContent = 'Concert tickets'
summary.className = 'summary'
button.className = 'add'
button.textContent = 'Add a ticket'
root.append(heading, summary, button)

// You must write this "sync the screen" step yourself...
function render() {
  summary.textContent = tickets + ' × €' + price + ' = €' + tickets * price
}

button.addEventListener('click', () => {
  tickets++
  render() // ...and remember to call it after EVERY change.
})

render()`

export default {
  id: 'what-is-vue',
  title: 'What is Vue.js and why use it?',
  summary: 'Vue is a JavaScript framework that keeps the page in sync with your data, so you describe what the screen should show instead of updating it by hand.',
  difficulty: 'beginner',
  minutes: 20,
  prerequisites: ['dom-and-events', 'js-essentials'],
  related: ['create-vue-project', 'template-syntax', 'what-is-reactivity', 'ref'],
  tags: ['vue', 'framework', 'declarative', 'reactivity', 'vue 2 vs vue 3', 'react', 'angular', 'progressive'],
  apis: [
    { name: 'createApp()', summary: 'Creates a Vue application instance from a root component.' },
    { name: 'ref()', summary: 'Creates a reactive value; the screen updates when its `.value` changes.' },
  ],
  docs: [
    { label: 'Vue Guide — Introduction', url: 'https://vuejs.org/guide/introduction.html' },
    { label: 'Vue Guide — Quick Start', url: 'https://vuejs.org/guide/quick-start.html' },
    { label: 'Vue 3 Migration Guide (Vue 2 → 3)', url: 'https://v3-migration.vuejs.org/' },
  ],

  intro: `
**Vue** (pronounced like *view*) is a JavaScript **framework** for building user interfaces — the part of a website or app that people see and click. A *framework* is a ready-made toolkit plus a set of conventions: it handles the boring, error-prone plumbing so you can focus on what your app actually does.

Vue's core promise is simple: **you keep track of the data, Vue keeps the screen in sync with it.** Change a number in your code and every place on the page that shows that number updates by itself.

It was created by Evan You and first released in 2014. Today's version is **Vue 3**, and that is what this course teaches.
`,

  why: [
    `
Imagine building a ticket shop with plain JavaScript. The page shows "1 ticket × €25 = €25". A visitor clicks **Add a ticket**. Now *you* have to:

1. update the \`tickets\` variable,
2. find the right element on the page,
3. rebuild its text,
4. and remember to do steps 2–3 for **every** element that shows the ticket count — the summary, the cart badge, the checkout button…

Forget one spot and the page **lies** to the user. As apps grow, this "keep the screen in sync by hand" work becomes most of the code and most of the bugs.
`,
    {
      code: `let tickets = 1
const summary = document.querySelector('.summary')

button.addEventListener('click', () => {
  tickets++
  // the variable is 2… but the page still says 1
  // until you remember to do this:
  summary.textContent = tickets + ' × €25 = €' + tickets * 25
})`,
      lang: 'js',
      title: 'plain JavaScript: you sync the screen yourself',
    },
    `
Vue exists to remove that whole category of work. You write **what** the page should look like for any data (\`{{ tickets }} × €25\`), and Vue figures out **how** and **when** to update the real page. That style is called **declarative** — you declare the result. The plain-JS style above is **imperative** — you give step-by-step commands.

Vue also gives you **components**: self-contained building blocks (a \`ProductCard\`, a \`SearchBox\`) that bundle their own HTML, logic and styles, so a big app becomes a tree of small, understandable pieces.
`,
  ],

  eli15: `
Think of a web page as a whiteboard in a classroom, and your data as the teacher's notebook.

**Without Vue**, every time the notebook changes, someone has to walk to the whiteboard, find the old number, erase it and write the new one. Miss one and the board is wrong.

**With Vue**, you hire an assistant who watches the notebook. You only ever write in the notebook. The assistant notices every change and fixes exactly the right spots on the whiteboard — instantly, every time.

That assistant is Vue. The notebook is your *state* (the data your app remembers). The whiteboard is the *DOM* (the live page the browser shows).
`,

  analogy: {
    title: 'The spreadsheet that recalculates itself',
    body: `
In a spreadsheet, cell C1 holds the formula \`=A1 * B1\`. You never "update C1" yourself — you change A1, and C1 recalculates instantly.

A Vue template works the same way. \`{{ tickets * price }}\` is a formula. When \`tickets\` changes, Vue recalculates every "cell" on the page that uses it. Plain DOM code is like a spreadsheet with no formulas: you would retype C1 by hand every time A1 changed.
`,
    mapping: [
      ['a cell with a value (A1)', 'your state, e.g. `const tickets = ref(1)`'],
      ['a cell with a formula (C1 = A1 × B1)', 'a template expression like `{{ tickets * price }}`'],
      ['the spreadsheet recalculating', "Vue's reactivity system re-rendering what changed"],
      ['the grid you look at', 'the DOM — the page the user sees'],
    ],
  },

  visual: {
    type: 'comparison',
    title: 'The same ticket counter, two ways',
    props: {
      left: { label: 'Plain JavaScript (imperative)', lang: 'js', code: plainTickets },
      right: { label: 'Vue (declarative)', lang: 'vue', code: ticketsApp },
      points: [
        'Plain JS: you write *how* to change the page — create elements, find them, set their text.',
        'Vue: you write *what* the page shows for any value of `tickets`; Vue works out the DOM changes.',
        'Plain JS: every change must remember to call `render()`. Vue re-renders automatically when `tickets.value` changes.',
        'Show the ticket count in a second place: in Vue you add one `{{ tickets }}`; in plain JS you must update `render()` too.',
      ],
    },
    caption: 'Both versions behave identically. The difference is who is responsible for keeping the screen correct.',
    alt: 'Two code panels side by side. Left: plain JavaScript that creates elements, writes a render function and calls it after every click. Right: a Vue component with a ref called tickets and a template that shows tickets times price; a click handler only changes tickets.value. Call-outs list the differences.',
  },

  syntax: [
    `
A Vue app has three ingredients. You will meet each one properly in the next lessons; here is the whole picture at once.

**1. A place on the page** for Vue to control — usually an empty \`<div id="app">\` in \`index.html\`.

**2. A component** — a \`.vue\` file with a template (the HTML it shows), a script (its data and functions) and optionally styles:
`,
    {
      code: `<script setup>
import { ref } from 'vue'

const name = ref('Ada')   // state: data Vue watches
</script>

<template>
  <h1>Hello, {{ name }}!</h1>   <!-- the template reads the state -->
</template>`,
      lang: 'vue',
      title: 'App.vue',
    },
    `
**3. A few lines that start the app** and attach it to the page:
`,
    {
      code: `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
      lang: 'js',
      title: 'main.js',
    },
    `
Read the component like a sentence: *"the state is \`name\`; the screen shows \`Hello, {{ name }}!\`"*. That's declarative rendering. \`ref()\` makes \`name\` **reactive** — Vue tracks it, so changing \`name.value\` updates the heading. (You'll study [ref()](lesson:ref) in depth in the reactivity module.)

#### Vue without a build step

Vue can also run straight from a \`<script>\` tag — handy for sprinkling interactivity onto an existing page. This is what "progressive" means: use as little or as much of Vue as you need.
`,
    {
      code: `<div id="app">
  <button @click="count++">Clicked {{ count }} times</button>
</div>

<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script>
  const { createApp, ref } = Vue
  createApp({
    setup() {
      const count = ref(0)
      return { count }
    },
  }).mount('#app')
</script>`,
      lang: 'html',
      title: 'index.html (no build tools)',
      static: true,
    },
    `
Real projects almost always use a build tool (Vite) and \`.vue\` files instead — see [Creating a Vue project with Vite](lesson:create-vue-project).

#### Vue 2 vs Vue 3 — what changed

You will still find Vue 2 code in older tutorials and codebases, so learn to recognise it:
`,
    {
      code: `// Vue 2 (end of life since 31 Dec 2023)
import Vue from 'vue'
import App from './App.vue'

new Vue({
  render: (h) => h(App),
}).$mount('#app')

// Vue 3 (current)
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
      lang: 'js',
      title: 'starting an app: Vue 2 vs Vue 3',
      static: true,
    },
    `
The big differences:

- **Starting an app:** \`new Vue()\` became \`createApp()\`, which creates an isolated app instance instead of changing one global \`Vue\` object. ([details](lesson:create-app-mount))
- **Reactivity engine:** Vue 2 used \`Object.defineProperty\` getters/setters, so it could not detect new properties or array index assignments (you needed \`Vue.set\`). Vue 3 uses JavaScript **Proxies**, which detect those changes.
- **Composition API:** Vue 3 adds \`ref()\`, \`computed()\`, \`<script setup>\` and composables, a way to organise logic by feature. The Options API (\`data\`, \`methods\`…) still works.
- **New built-ins:** multiple root elements per component (fragments), \`<Teleport>\`, and \`<Suspense>\` (still experimental).
- **Removed:** filters, \`$on/$off\` event buses, numeric key-code modifiers, and IE11 support.
`,
    {
      callout: 'version',
      title: 'Which Vue to learn',
      text: 'Vue 3 has been the default since February 2022, and Vue 2 reached end of life on 31 December 2023 (no more official updates or security fixes). Learn Vue 3. Vue 2.7 backported some Vue 3 APIs to help teams migrate, but new projects should start on Vue 3.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: ticketsApp,
    intro: "Here's the whole ticket counter. Don't worry about memorising syntax yet — notice how little of it is about the DOM.",
    steps: [
      { lines: [1, 2], text: '`<script setup>` holds the component\'s JavaScript. We import `ref` from Vue — the tool that makes a value reactive.' },
      { lines: [4, 5], text: '`tickets` is **reactive state**: Vue watches it. `price` is a plain constant because it never changes, so Vue has nothing to watch.' },
      { lines: [7, 9], text: "A normal function. It changes the data and **nothing else** — there's no `querySelector`, no `textContent`. In JavaScript you reach inside a ref with `.value`." },
      { lines: [12, 16], text: 'The `<template>` describes what the page shows. The `{{ }}` parts are JavaScript expressions — Vue re-evaluates them whenever `tickets` changes.' },
      { lines: [15], text: '`@click="addTicket"` connects the button to the function. Click → `tickets.value++` → Vue notices → the summary text is redrawn. That loop is the heart of Vue.' },
    ],
  },

  playground: {
    title: 'Ticket counter',
    objective: 'Run the Vue version, change it in small steps, then compare it with the plain JavaScript variant.',
    files: { 'App.vue': ticketsApp },
    expected: 'A heading, the line **1 × €25 = €25** and a button. Each click adds a ticket and the total updates instantly. Switch to the **plain JavaScript** variant to see the same behaviour written by hand.',
    experiments: [
      {
        id: 'price',
        task: 'Tickets got more expensive. Change the price to **40** and run it.',
        hint: 'The price lives on line 5.',
        tests: [{ name: 'the summary uses €40', code: `expect(text('.summary')).toContain('€40')` }],
        explain: 'You changed data, not the DOM. Every expression that uses `price` picked up the new value on the next render.',
      },
      {
        id: 'remove',
        task: 'Add a second button labelled **Remove a ticket** that lowers the count by one.',
        hint: 'Copy the `addTicket` function, call it `removeTicket` and use `tickets.value--`. Then add `<button @click="removeTicket">Remove a ticket</button>`.',
        tests: [
          {
            name: 'a Remove button lowers the count',
            code: `await click('.add')
const btn = findAll('button').find((b) => /remove/i.test(b.textContent))
expect(btn).toBeTruthy()
await click(btn)
expect(text('.summary').startsWith('1 ')).toBe(true)`,
          },
        ],
        explain: 'Two buttons, one piece of state. Neither function touches the page; both just change `tickets`, and the template follows.',
      },
      {
        id: 'second-place',
        task: 'Show the ticket count in a **second** place: add `<p class="badge">🎟 {{ tickets }}</p>` under the button. Click a few times.',
        hint: 'Paste the line inside `<template>`, right after the `<button>`.',
        tests: [
          {
            name: 'the badge follows the ticket count',
            code: `expect(exists('.badge')).toBe(true)
await click('.add')
await click('.add')
expect(text('.badge')).toContain('3')`,
          },
        ],
        explain: 'You did not touch `addTicket()`. In plain JavaScript you would have had to update `render()` too — in Vue, anything that reads `tickets` stays in sync for free.',
      },
      {
        id: 'compare',
        task: 'Open the variant **Same app in plain JavaScript**. Find the `render()` function and delete the `render()` call inside the click listener. Run it and click.',
        hint: 'Use the variant picker above the editor.',
        explain: 'The variable still changes, but the page stops updating — the classic bug Vue was built to eliminate. In plain JS, *you* are the reactivity system.',
      },
    ],
    variants: [{ id: 'plain-js', label: 'Same app in plain JavaScript', files: { 'main.js': plainTickets } }],
  },

  animation: {
    type: 'concept-diagram',
    title: 'The Vue loop: state → template → DOM',
    props: {
      nodes: [
        { id: 'state', label: 'State', note: 'tickets = 1', tone: 'acid' },
        { id: 'template', label: 'Template', note: '{{ tickets }} × €25' },
        { id: 'vue', label: 'Vue', note: 'tracks + renders', tone: 'cobalt' },
        { id: 'dom', label: 'Real DOM', note: '<p>1 × €25</p>', tone: 'paper' },
        { id: 'user', label: 'User', note: 'clicks Add', tone: 'kraft' },
      ],
      edges: [
        { from: 'state', to: 'vue', label: 'read' },
        { from: 'template', to: 'vue', label: 'describes' },
        { from: 'vue', to: 'dom', label: 'creates / patches' },
        { from: 'user', to: 'state', label: 'handler changes', dashed: true },
      ],
      layout: 'row',
      steps: [
        { focus: ['state'], text: 'You declare **state**: the data your app remembers. `ref(1)` makes it reactive, so Vue can tell when it changes.' },
        { focus: ['template'], text: 'The **template** describes the screen for *any* value of the state. It never says "find this element" — only "show this".' },
        { focus: ['vue', 'dom'], edges: ['state->vue', 'template->vue', 'vue->dom'], text: 'Vue renders the template into **real DOM** and remembers which state each part read.' },
        { focus: ['user', 'state'], edges: ['user->state'], text: 'The user clicks. Your handler runs `tickets.value++`. That is the only line you wrote for the update.' },
        { focus: ['vue', 'dom'], edges: ['state->vue', 'vue->dom'], text: 'Vue notices `tickets` changed and patches **only** the text that depends on it. You never touched the DOM.' },
      ],
    },
    caption: 'Every Vue app runs this loop. Your job is the state and the template; Vue owns the DOM.',
    alt: 'A five-node diagram: State and Template both feed into Vue, which creates and patches the Real DOM. A dashed arrow from User back to State shows a click handler changing the state, which starts the loop again.',
  },

  internals: {
    beginner: `
Vue does three jobs for you. It **reads your template** and turns it into JavaScript instructions. It **runs those instructions** to build the page. And it **watches your state**: whenever a value the page used changes, it re-runs only the instructions that depended on it and patches the page. You change data; Vue does the rest.
`,
    technical: [
      `
Vue is built from three cooperating parts:

- **The compiler** turns each template into a *render function* — plain JavaScript that returns a description of the UI (a *virtual DOM* tree: lightweight objects like \`{ type: 'p', children: '1 × €25' }\`). With a build tool this happens before the code ever reaches the browser.
- **The reactivity system** wraps state in trackable objects (\`ref\`, \`reactive\`). While a component renders, every reactive read is recorded as a dependency.
- **The renderer** runs each component's render function, compares the new virtual tree with the previous one and applies the minimal set of real DOM changes (*patching*).
`,
      {
        code: `// What the compiler roughly produces for the ticket template (simplified)
function render() {
  return [
    h('h2', 'Concert tickets'),
    h('p', { class: 'summary' }, tickets.value + ' × €' + price + ' = €' + tickets.value * price),
    h('button', { class: 'add', onClick: addTicket }, 'Add a ticket'),
  ]
}`,
        lang: 'js',
        title: 'a template is just a render function (simplified)',
      },
      `
Vue calls its approach a **compiler-informed virtual DOM**: because the compiler can see which parts of a template are static and which are dynamic, it marks the dynamic nodes so the renderer can skip everything that can't change. Updates are tracked **per component**: when \`tickets\` changes, only components that read \`tickets\` during their last render re-run. Read more in [How Vue updates the DOM](lesson:how-vue-updates) and [How reactivity works](lesson:how-reactivity-works).
`,
    ],
    production: `
- **Ship precompiled templates.** With Vite and \`.vue\` files, templates are compiled at build time, so the browser downloads Vue's *runtime-only* build without the template compiler. The CDN \`vue.global.js\` build includes the compiler because it compiles templates in the browser.
- **The ecosystem is layered, not bundled.** Vue core gives you components and reactivity. Routing ([Vue Router](lesson:router-basics)) and shared state ([Pinia](lesson:pinia-basics)) are official but separate packages you add when needed. [Nuxt](lesson:nuxt-intro) is a separate framework built on top of Vue for server rendering and more.
- **Vue is not a security boundary.** Hiding an "Admin" button with Vue does not stop anyone from calling your API. Authorization always lives on the server.
- **Migrating from Vue 2:** Vue 2 is end-of-life. The [official migration guide](https://v3-migration.vuejs.org/) lists every breaking change; teams typically upgrade dependencies first, then fix removed APIs (filters, event buses, \`$listeners\`).
`,
  },

  mistakes: [
    {
      title: 'Changing Vue-managed elements with DOM code',
      wrong: {
        code: `function addTicket() {
  tickets.value++
  document.querySelector('.summary').textContent = 'Updated!'
}`,
        lang: 'js',
      },
      right: {
        code: `function addTicket() {
  tickets.value++   // the template updates .summary for you
}`,
        lang: 'js',
      },
      explanation: 'Vue owns the DOM it renders. If you edit it by hand, Vue overwrites your change on the next re-render — or gets confused about what is on screen. Change state and let the template describe the result.',
    },
    {
      title: 'Following a Vue 2 tutorial in a Vue 3 project',
      wrong: { code: `import Vue from 'vue'\n\nnew Vue({ el: '#app', data: { count: 0 } })`, lang: 'js' },
      right: { code: `import { createApp } from 'vue'\nimport App from './App.vue'\n\ncreateApp(App).mount('#app')`, lang: 'js' },
      explanation: 'Vue 3 has no default `Vue` export and no `new Vue()`. If a tutorial starts with `new Vue`, it is Vue 2 — check the date and look for a Vue 3 version.',
    },
    {
      title: 'Thinking you must rewrite the whole site to use Vue',
      explanation: 'Vue is *progressive*: you can mount a small Vue app into one `<div>` of an existing server-rendered page (a search box, a cart widget) and grow from there. A full single-page app with a build step is one option, not a requirement.',
    },
    {
      title: 'Treating the frontend as the place that enforces rules',
      wrong: { code: `<button v-if="user.isAdmin" @click="deleteAllUsers">Delete all</button>`, lang: 'vue' },
      explanation: 'Hiding the button is good UX, but anyone can call your API directly from the browser console. The server must check permissions on every request. Vue decides what to *show*; the backend decides what is *allowed*.',
    },
  ],

  debugging: [
    {
      symptom: '`TypeError: Vue is not a constructor` or `export \'default\' (imported as \'Vue\') was not found`.',
      cause: 'Vue 2 code (`import Vue from \'vue\'`, `new Vue()`) running against Vue 3.',
      fix: 'Use `import { createApp } from \'vue\'` and `createApp(App).mount(\'#app\')`.',
    },
    {
      symptom: 'The page shows raw `{{ message }}` text.',
      cause: 'Vue never compiled that markup: the script failed to load, or the element is outside the element you mounted to.',
      fix: 'Check the browser console for errors and make sure the markup is inside the mounted element (e.g. `#app`).',
    },
    {
      symptom: 'A variable changes (console.log proves it) but the screen does not.',
      cause: 'It is a plain `let` variable, not reactive state, so Vue cannot know it changed.',
      fix: 'Create it with `ref()` and change `.value`. See [ref()](lesson:ref).',
    },
    {
      symptom: 'A blank page and the warning `Failed to mount app: mount target selector "#app" returned null`.',
      cause: 'The selector passed to `.mount()` does not match any element in `index.html`.',
      fix: 'Make the ids match, e.g. `<div id="app"></div>` and `.mount(\'#app\')`.',
    },
  ],

  bestPractices: [
    'Think "state first": decide what data the screen depends on, then write the template that displays it.',
    'Let Vue own the DOM it renders — change state instead of calling `querySelector` on Vue-managed elements.',
    'Use Vue 3 with `<script setup>` for new code; treat `new Vue()` examples as legacy.',
    'Start small: a single component or widget is a perfectly valid way to adopt Vue.',
    'Keep business rules and permissions on the server; the UI only reflects them.',
  ],

  useCases: [
    'Interactive single-page apps: dashboards, admin panels, email clients, project boards.',
    'Widgets inside existing server-rendered pages (a live search box, a shopping cart, a booking form).',
    'Server-rendered or statically generated sites with Nuxt (a separate framework built on Vue).',
    'Mobile and desktop apps via wrappers such as Capacitor or Electron, using the same Vue components.',
  ],

  whenToUse: {
    use: [
      'The UI changes a lot in response to user input or live data.',
      'You want to split a growing interface into reusable components.',
      'You want templates that look like HTML so designers and backend developers can read them.',
    ],
    avoid: [
      'A mostly static page (a blog post, a landing page) with almost no interactivity — plain HTML and CSS are simpler and faster.',
      'A tiny one-off behaviour (toggle one menu) on a page that has no other JavaScript — a few lines of plain JS may be enough.',
      'Your team already standardised on another framework and has no reason to switch — consistency often beats preference.',
    ],
  },

  comparison: {
    title: 'Vue compared with plain JavaScript, React and Angular (conceptual)',
    headers: ['', 'Plain JS', 'Vue', 'React', 'Angular'],
    rows: [
      ['What it is', 'the language itself + browser APIs', 'progressive UI framework', 'UI library', 'full, opinionated framework'],
      ['Describing UI', 'DOM calls (`createElement`, `textContent`)', 'HTML-based templates (JSX optional)', 'JSX (HTML-like syntax inside JS)', 'HTML templates with Angular syntax'],
      ['How updates happen', 'you update the DOM by hand', 'reactive state is tracked; components that read it re-render', 'calling a state setter re-runs the component function', 'change detection (increasingly signal-based in recent versions)'],
      ['Routing & state', 'build it yourself', 'official add-ons: Vue Router, Pinia', 'community libraries or frameworks such as Next.js', 'router, forms, HTTP client built in'],
      ['Language', 'JavaScript', 'JavaScript or TypeScript', 'JavaScript or TypeScript', 'TypeScript'],
    ],
    note: 'All three frameworks can build excellent apps; the concepts (components, state, one-way data flow) transfer between them. Choose based on your team, your codebase and the ecosystem you need.',
  },

  quiz: [
    {
      id: 'what-is-vue-q1',
      type: 'mcq',
      prompt: 'What does it mean that Vue is a **progressive** framework?',
      options: [
        { text: 'It gets faster the longer the page stays open.', why: '"Progressive" is about how you adopt Vue, not about speed over time.' },
        { text: 'You can adopt it gradually — from one widget on an existing page to a full single-page app.' },
        { text: 'It only works in modern "progressive web apps".', why: 'Vue works in any modern browser page; PWAs are a separate idea.' },
        { text: 'It automatically upgrades your Vue 2 code to Vue 3.', why: 'Migration is a manual process guided by the migration guide.' },
      ],
      answer: 1,
      explanation: 'Vue is designed to be incrementally adoptable: drop it onto part of a page via a script tag, or build a whole app with Vite, Vue Router and Pinia.',
    },
    {
      id: 'what-is-vue-q2',
      type: 'output',
      prompt: 'The user clicks the button **twice**. What does the paragraph show?',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const cups = ref(1)
function refill() { cups.value = cups.value + 2 }
</script>

<template>
  <p>Coffee: {{ cups }} cups</p>
  <button @click="refill">Refill</button>
</template>`,
      },
      options: [
        { text: 'Coffee: 1 cups', why: 'That would only happen if `cups` were a plain variable. It is a ref, so the paragraph re-renders.' },
        { text: 'Coffee: 3 cups', why: 'That is after one click. Each click adds 2.' },
        { text: 'Coffee: 5 cups' },
        { text: 'Coffee: 122 cups', why: 'The values are numbers, so `+` adds them instead of joining strings.' },
      ],
      answer: 2,
      explanation: '1 → 3 → 5. The handler only changes `cups.value`; Vue re-renders the paragraph each time.',
    },
    {
      id: 'what-is-vue-q3',
      type: 'bug',
      prompt: 'This `main.js` is from an old tutorial and crashes in a Vue 3 project. Click the line where the Vue 2-only API is used to create the app.',
      code: {
        lang: 'js',
        code: `import { createApp } from 'vue'
import App from './App.vue'

const app = new Vue({
  render: (h) => h(App),
})

app.$mount('#app')`,
      },
      answerLine: 4,
      explanation: '`new Vue()` is the Vue 2 way to create an app, and there is no global `Vue` here. In Vue 3 you write `createApp(App).mount(\'#app\')` — the import on line 1 is already correct.',
    },
    {
      id: 'what-is-vue-q4',
      type: 'fill',
      prompt: 'Complete the Vue 3 code that starts an app and attaches it to `<div id="app">`.',
      code: { lang: 'js', code: `import { ___ } from 'vue'\nimport App from './App.vue'\n\ncreateApp(App).___('#app')` },
      answer: [['createApp'], ['mount']],
      explanation: '`createApp(App)` creates the application instance; `.mount(\'#app\')` renders it into the element.',
    },
    {
      id: 'what-is-vue-q5',
      type: 'mcq',
      prompt: 'Which statement about Vue 3 vs Vue 2 reactivity is correct?',
      options: [
        { text: 'Vue 3 uses JavaScript Proxies, so it can detect added properties and array index assignments.' },
        { text: 'Vue 3 polls your variables every few milliseconds to see if they changed.', why: 'Neither version polls. Both intercept property access — Vue 2 with getters/setters, Vue 3 with Proxies.' },
        { text: 'Vue 3 makes every `let` variable reactive automatically.', why: 'Only values wrapped in `ref()`/`reactive()` (and props, computed values) are reactive.' },
        { text: 'Vue 3 removed reactivity in favour of manual DOM updates.', why: 'Reactivity is still the core of Vue 3.' },
      ],
      answer: 0,
      explanation: 'Vue 2 relied on `Object.defineProperty`, which cannot see new keys or `arr[i] = x`. Vue 3 wraps objects in Proxies, which intercept those operations too.',
    },
    {
      id: 'what-is-vue-q6',
      type: 'mcq',
      prompt: 'Select **all** libraries that are official Vue projects maintained alongside Vue core.',
      options: [
        { text: 'Vue Router' },
        { text: 'Pinia' },
        { text: 'Axios', why: 'Axios is a popular third-party HTTP client, not part of Vue.' },
        { text: 'Nuxt', why: 'Nuxt is a separate framework built on top of Vue by its own team.' },
      ],
      answer: [0, 1],
      explanation: 'Vue Router (routing) and Pinia (state management) are the official companion libraries. Keep them separate from Vue core in your head: you install them when you need them.',
    },
    {
      id: 'what-is-vue-q7',
      type: 'short',
      prompt: 'Explain the difference between **imperative** and **declarative** UI code in two or three sentences, using a counter as the example.',
      answer: 'Imperative code gives step-by-step DOM commands: when the count changes, find the element and set its text — and remember to do it every time. Declarative code describes the result for any state (`<p>{{ count }}</p>`), and the framework works out when and how to update the DOM when `count` changes.',
    },
  ],

  exercises: [
    {
      id: 'lamp-switch',
      title: 'A lamp you can switch on and off',
      difficulty: 'beginner',
      prompt: `
Make the lamp work:

- A paragraph with \`class="status"\` shows **The lamp is off** at first.
- A button with \`class="switch"\` flips the lamp: the text becomes **The lamp is on**, and clicking again turns it off.
- Keep the on/off state in a ref called \`isOn\`.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

// TODO: create a ref called isOn that starts as false

</script>

<template>
  <p class="status">The lamp is off</p>
  <button class="switch">Flip the switch</button>
</template>`,
      },
      hints: [
        'Create the state with `const isOn = ref(false)`.',
        'Write a `flip()` function that does `isOn.value = !isOn.value`, and connect it with `@click="flip"`.',
        "In the template, choose the word with a ternary: `The lamp is {{ isOn ? 'on' : 'off' }}`.",
      ],
      solution: {
        explanation: 'One boolean ref is the single source of truth. The function flips the data; the template turns the data into words. You never touched the paragraph directly.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const isOn = ref(false)

function flip() {
  isOn.value = !isOn.value
}
</script>

<template>
  <p class="status">The lamp is {{ isOn ? 'on' : 'off' }}</p>
  <button class="switch" @click="flip">Flip the switch</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts off', code: `expect(text('.status')).toBe('The lamp is off')` },
        { name: 'one click turns it on', code: `await click('.switch'); expect(text('.status')).toBe('The lamp is on')` },
        { name: 'a second click turns it off again', code: `await click('.switch'); await click('.switch'); expect(text('.status')).toBe('The lamp is off')` },
        { name: 'the state lives in a ref called isOn', code: `await click('.switch'); expect(state.isOn).toBe(true)` },
      ],
    },
    {
      id: 'port-like-widget',
      title: 'Port a plain-JavaScript widget to Vue',
      difficulty: 'beginner',
      prompt: `
\`legacy.js\` contains a like counter written with plain DOM code (it is there for reference and is **not** run). Rebuild it in \`App.vue\` the Vue way:

- A \`<button class="like">\` adds one like per click.
- A \`<span class="likes">\` shows the count with the right word: **0 likes**, **1 like**, **2 likes**…
- Keep the count in a ref called \`likes\`, starting at 0.
- No \`document.querySelector\` in your Vue code.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

</script>

<template>
  <button class="like">👍 Like</button>
  <span class="likes">0 likes</span>
</template>`,
        'legacy.js': `// Reference only — this file is not imported anywhere.
let likes = 0
const button = document.querySelector('.like')
const label = document.querySelector('.likes')

function render() {
  label.textContent = likes + (likes === 1 ? ' like' : ' likes')
}

button.addEventListener('click', () => {
  likes++
  render()
})

render()`,
      },
      hints: [
        'The `let likes = 0` becomes `const likes = ref(0)`.',
        'The click listener becomes a function you attach with `@click`. The `render()` function disappears: its job moves into the template.',
        "Inside the span: `{{ likes }} {{ likes === 1 ? 'like' : 'likes' }}`.",
      ],
      solution: {
        explanation: 'Each piece of the imperative version has a declarative home: the variable becomes a ref, the event listener becomes `@click`, and `render()` becomes the template itself — which Vue re-runs for you whenever `likes` changes.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const likes = ref(0)

function like() {
  likes.value++
}
</script>

<template>
  <button class="like" @click="like">👍 Like</button>
  <span class="likes">{{ likes }} {{ likes === 1 ? 'like' : 'likes' }}</span>
</template>`,
          'legacy.js': `// Reference only — this file is not imported anywhere.
let likes = 0
const button = document.querySelector('.like')
const label = document.querySelector('.likes')

function render() {
  label.textContent = likes + (likes === 1 ? ' like' : ' likes')
}

button.addEventListener('click', () => {
  likes++
  render()
})

render()`,
        },
      },
      tests: [
        { name: 'starts at 0 likes', code: `expect(text('.likes')).toBe('0 likes')` },
        { name: 'one click shows "1 like"', code: `await click('.like'); expect(text('.likes')).toBe('1 like')` },
        { name: 'three clicks show "3 likes"', code: `await click('.like'); await click('.like'); await click('.like'); expect(text('.likes')).toBe('3 likes')` },
        { name: 'the count is a ref called likes', code: `await click('.like'); expect(state.likes).toBe(1)` },
      ],
    },
  ],

  interview: [
    {
      id: 'what-is-vue-definition',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is Vue.js, and why would a team choose it?',
      answer: 'Vue is a progressive JavaScript framework for building user interfaces. It combines declarative, HTML-based templates with a reactivity system that keeps the DOM in sync with state, and a component model for splitting UIs into reusable pieces. Teams pick it for its approachable templates, incremental adoption, official router and state libraries, and good performance defaults.',
      explanation: 'Interviewers want three ideas: declarative rendering, reactivity, and components — plus a sensible reason to choose it.',
      whyAsked: 'A standard opener. It shows whether you understand what problem a framework solves rather than just naming features.',
      mistakes: [
        'Listing features ("it has v-if and v-for") without explaining the problem Vue solves.',
        'Claiming Vue is "faster than React" without evidence — avoid benchmark claims you cannot back up.',
        'Calling Vue Router or Pinia part of Vue core.',
      ],
      followUps: ['What does "declarative" mean?', 'What does "progressive" mean in practice?', 'What happens when state changes?'],
      modelAnswer: "Vue is a JavaScript framework for building user interfaces. The core idea is declarative rendering: I describe what the UI should look like for a given state in an HTML-like template, and Vue's reactivity system tracks which state each component uses and updates only those parts of the DOM when it changes. It also gives me components, so a large interface becomes a tree of small, testable pieces. Teams like it because the templates are approachable, you can adopt it incrementally — one widget or a full SPA — and it has official libraries for routing and state. The trade-off, like any framework, is a learning curve and a dependency you have to keep up to date.",
    },
    {
      id: 'what-is-vue-progressive',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'Your company has a large server-rendered site (PHP/Rails/Django). The product team wants a live product filter on one page. How would you introduce Vue without a rewrite?',
      answer: 'Mount a small Vue app into just that part of the page: render a container element server-side, load Vue (via a script tag or a small Vite build that outputs one bundle), and call `createApp(FilterApp).mount(\'#product-filter\')`. Pass initial data through a JSON script tag or data attributes, and keep the rest of the page untouched. That is Vue\'s "progressive" adoption.',
      explanation: 'Vue only controls the element you mount it into, so it can live alongside existing server-rendered HTML.',
      code: {
        lang: 'html',
        code: `<!-- rendered by the server -->
<div id="product-filter" data-category="shoes"></div>

<script type="module">
  import { createApp } from 'vue'
  import FilterApp from './FilterApp.vue'

  const el = document.getElementById('product-filter')
  createApp(FilterApp, { category: el.dataset.category }).mount(el)
</script>`,
      },
      whyAsked: 'Real teams rarely start from scratch. This checks that you understand mounting, scope and pragmatic migration.',
      mistakes: [
        'Proposing a full SPA rewrite for one feature.',
        'Letting jQuery and Vue manipulate the same elements.',
        'Forgetting how initial data gets from the server into the Vue app.',
      ],
      followUps: ['Can you mount several Vue apps on one page?', 'How would you share state between two mounted widgets?', 'When would you switch to a full SPA?'],
      modelAnswer: "Vue is progressive, so I'd mount a small app into just that section. The server renders an empty container, maybe with data attributes or a JSON script tag for the initial data. A small Vite build produces one script that calls createApp with the filter component and mounts it on that container. Everything outside the container stays server-rendered, and I'd make sure no other script touches the elements Vue controls. If more pages need interactivity later, we can add more mount points or move gradually toward an SPA.",
    },
    {
      id: 'what-is-vue-vs-frameworks',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'How does Vue compare conceptually with React and Angular?',
      answer: 'All three are component-based with one-way data flow. Vue uses HTML-based templates compiled to render functions and a dependency-tracking reactivity system, so components re-render when the state they read changes. React uses JSX and re-runs component functions when state setters are called, relying on memoization to skip work. Angular is a full, TypeScript-first framework with dependency injection, a router, forms and an HTTP client built in. Vue sits in between: a focused core with official, optional router and state libraries.',
      explanation: 'Compare along a few axes — templating, update model, scope — instead of making value judgements.',
      whyAsked: 'Checks breadth and maturity: can you compare tools fairly and choose based on context rather than fandom?',
      mistakes: [
        'Making unsupported performance or popularity claims.',
        'Saying React is "not reactive" or Angular is "outdated" — both are actively developed.',
        'Ignoring team skills and existing codebases as decision factors.',
      ],
      followUps: ['What does Vue gain from compiling templates?', 'When would you recommend Angular over Vue?', 'How do Pinia and Redux differ in spirit?'],
      modelAnswer: "All three build UIs from components with data flowing down. The differences are in the details. Vue uses HTML-like templates that are compiled ahead of time, and its reactivity tracks exactly which state each component reads, so only those components re-render. React uses JSX; calling a state setter re-runs the component function, and you reach for memoization to avoid unnecessary work. Angular is a complete, TypeScript-first platform with DI, routing, forms and HTTP built in, which suits large teams that want strong conventions. Vue is a focused core with official optional pieces, so you add only what you need. In practice I'd choose based on the team's experience and the existing ecosystem.",
    },
    {
      id: 'what-is-vue-2-vs-3',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 4,
      question: 'What are the most important differences between Vue 2 and Vue 3?',
      answer: 'Vue 3 replaced `new Vue()` with `createApp()` (isolated app instances), switched reactivity from `Object.defineProperty` to Proxies (detecting added properties and array index changes), added the Composition API and `<script setup>`, supports multiple root nodes, `<Teleport>` and experimental `<Suspense>`, has better TypeScript support and tree-shaking, and removed filters, `$on/$off` and IE11 support. Vue 2 reached end of life on 31 December 2023.',
      explanation: 'Group your answer: app creation, reactivity, authoring APIs, new built-ins, removals.',
      code: {
        lang: 'js',
        code: `// Vue 2: adding a new reactive key needed a helper
Vue.set(this.user, 'age', 30)

// Vue 3: Proxies see it directly
user.age = 30`,
      },
      whyAsked: 'Many companies still maintain Vue 2 code or have just migrated. Knowing the differences shows real-world experience.',
      mistakes: [
        'Saying the Options API was removed in Vue 3 — it is fully supported.',
        'Only mentioning the Composition API.',
        'Not knowing that Vue 2 is end-of-life.',
      ],
      followUps: ['Why did Vue 2 need `Vue.set`?', 'Why does `createApp` matter for testing and multiple apps?', 'How would you plan a Vue 2 → 3 migration?'],
      modelAnswer: "The headline changes are: apps are created with createApp instead of new Vue, so global config no longer leaks between apps; reactivity moved from Object.defineProperty to Proxies, so adding properties or setting array indexes is detected without Vue.set; and the Composition API with script setup was added alongside the Options API, which still works. Vue 3 also supports fragments, Teleport and an experimental Suspense, and it's more tree-shakable with better TypeScript support. Some things were removed, like filters, the instance event emitter and IE11 support. Vue 2 is end-of-life since the end of 2023, so new work should be on Vue 3.",
    },
    {
      id: 'what-is-vue-dom-fight',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'A teammate updates a Vue-rendered label with `document.querySelector(\'.total\').textContent = newTotal`. It works at first, then "randomly" reverts to an old value. What is happening?',
      answer: 'The label is owned by Vue. When any state that component reads changes, Vue re-renders and patches the DOM from the template, overwriting the manual edit with whatever the template computes. The fix is to put the total in reactive state (or compute it) and display it in the template.',
      explanation: 'Vue assumes it is the only one changing the DOM it rendered. Manual edits are invisible to it and get overwritten.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { ref } from 'vue'
const total = ref(0)
function recalc(items) {
  total.value = items.reduce((sum, i) => sum + i.price, 0) // ✅ change state
}
</script>

<template>
  <p class="total">{{ total }}</p>
</template>`,
      },
      whyAsked: 'Mixing jQuery-style DOM code with a framework is a very common source of bugs during migrations.',
      mistakes: ['Suggesting `setTimeout` or `nextTick` hacks to "make it stick".', 'Not realising the template is the source of truth for that element.'],
      followUps: ['When is touching the DOM directly legitimate in Vue?', 'What are template refs for?'],
      modelAnswer: "That element is rendered by Vue, so the template is its source of truth. The manual textContent change isn't known to Vue, and the next time something that component depends on changes, Vue re-renders and patches the element back to what the template says. The fix is to stop editing the DOM and put the total in reactive state, or derive it with computed, then show it with interpolation. Direct DOM access is fine for things Vue doesn't manage, like focusing an input through a template ref.",
    },
    {
      id: 'what-is-vue-when-not',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'When would you NOT build a project as a client-side Vue single-page app?',
      answer: 'When the content is mostly static (blogs, docs, marketing pages) or search-engine visibility and first-load speed are critical, a client-rendered SPA adds JavaScript cost and delays content. Options: plain HTML/CSS, a static site generator, server rendering, or Nuxt (built on Vue) for SSR/SSG. For a tiny interaction on an otherwise static page, a few lines of plain JavaScript or a small mounted Vue widget may be better than a full SPA.',
      explanation: 'A good engineer knows a tool\'s costs: bundle size, initial render time, and SEO considerations for content rendered only in the browser.',
      whyAsked: 'Seniors are expected to choose architectures, not just frameworks. Saying "always Vue" is a red flag.',
      mistakes: ['Answering "never — Vue is always fine".', 'Confusing Nuxt with Vue core.', 'Ignoring team skills and hosting constraints.'],
      followUps: ['What is the difference between CSR, SSR and SSG?', 'What does hydration mean?', 'How does Nuxt relate to Vue?'],
      modelAnswer: "A client-side SPA means the browser downloads JavaScript before the user sees real content. For mostly static, content-heavy sites like blogs, docs or marketing pages, that's a poor trade: plain HTML, a static site generator, or server rendering gives faster first paint and simpler SEO. If I still want Vue components there, Nuxt — a separate framework on top of Vue — can pre-render or server-render pages. And for one small interaction, a tiny script or a single mounted widget is enough. I'd reserve a full SPA for highly interactive apps like dashboards where the JavaScript cost pays off.",
    },
    {
      id: 'what-is-vue-coding-units',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Build a temperature display: `<p class="temp">` shows **20°C**. A `<button class="unit-toggle">` switches to Fahrenheit (**68°F**) and back. Use reactive state, not DOM code.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const celsius = 20
</script>

<template>
  <p class="temp">20°C</p>
  <button class="unit-toggle">Switch unit</button>
</template>`,
        },
      },
      tests: [
        { name: 'starts in Celsius', code: `expect(text('.temp')).toBe('20°C')` },
        { name: 'one click shows Fahrenheit', code: `await click('.unit-toggle'); expect(text('.temp')).toBe('68°F')` },
        { name: 'a second click goes back to Celsius', code: `await click('.unit-toggle'); await click('.unit-toggle'); expect(text('.temp')).toBe('20°C')` },
      ],
      hints: ['Store which unit is showing in a boolean ref, e.g. `showFahrenheit`.', 'Fahrenheit = celsius × 9 / 5 + 32. Choose the text with a ternary in the template.'],
      answer: 'Keep the temperature as data and the chosen unit as a boolean ref; derive the displayed string in the template.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const celsius = 20
const showFahrenheit = ref(false)

function toggleUnit() {
  showFahrenheit.value = !showFahrenheit.value
}
</script>

<template>
  <p class="temp">{{ showFahrenheit ? (celsius * 9) / 5 + 32 + '°F' : celsius + '°C' }}</p>
  <button class="unit-toggle" @click="toggleUnit">Switch unit</button>
</template>`,
        },
      },
      explanation: 'The temperature itself never changes — only the *view* of it does. A boolean ref captures the user\'s choice, and the template converts on the fly. Later you would move that expression into a `computed()`.',
      whyAsked: 'A warm-up that shows whether you think in state + derived display rather than reaching for the DOM.',
      mistakes: ['Storing both the Celsius and Fahrenheit strings in separate refs that can drift apart.', 'Using `document.querySelector` to change the text.'],
      followUps: ['How would you move the conversion into a computed property?', 'How would you let the user type the Celsius value?'],
      modelAnswer: "I'd keep the source temperature as data and add one boolean ref for the selected unit. The button flips that boolean, and the template derives the display string, converting with times nine-fifths plus thirty-two when Fahrenheit is selected. Nothing touches the DOM directly. In a real component I'd move the conversion into a computed so it's named, cached and easy to test.",
    },
  ],

  takeaways: [
    'Vue is a progressive JavaScript framework for building UIs: adopt it for one widget or a whole app.',
    'Declarative rendering: you describe what the screen shows for any state; Vue updates the DOM when the state changes.',
    'Reactive state (`ref()`) is what Vue watches — plain variables are invisible to it.',
    'Vue owns the DOM it renders; change state instead of editing those elements by hand.',
    'Learn Vue 3: `createApp()`, Proxy-based reactivity, the Composition API. Vue 2 (`new Vue()`) is end-of-life.',
    'Vue core, Vue Router, Pinia and Nuxt are separate pieces — and the backend, not Vue, enforces security.',
  ],
}
