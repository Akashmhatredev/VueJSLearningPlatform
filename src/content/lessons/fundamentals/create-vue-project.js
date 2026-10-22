// Lesson: Creating a Vue project with Vite

const projectTree = `my-vue-app/
├── node_modules/
├── public/
│   └── favicon.ico
├── src/
│   ├── assets/
│   │   ├── base.css
│   │   ├── logo.svg
│   │   └── main.css
│   ├── components/
│   │   ├── HelloWorld.vue
│   │   ├── TheWelcome.vue
│   │   └── WelcomeItem.vue
│   ├── App.vue
│   └── main.js
├── .gitignore
├── index.html
├── jsconfig.json
├── package.json
├── README.md
└── vite.config.js`

const mainJs = `import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`

const appVue = `<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <header>
    <h1 class="site-title">My Vue App</h1>
  </header>

  <main>
    <HelloWorld msg="You did it!" />
  </main>
</template>`

const helloWorld = `<script setup>
// "msg" is a prop: an input the parent passes in (see the props lesson).
defineProps({
  msg: String,
})
</script>

<template>
  <div class="greetings">
    <h2 class="green">{{ msg }}</h2>
    <p>You've created a project with <strong>Vite</strong> + <strong>Vue 3</strong>.</p>
  </div>
</template>

<style scoped>
.green {
  color: #0f7a3d;
}
</style>`

const theFooter = `<template>
  <footer class="site-footer">
    <small>Built with Vue + Vite</small>
  </footer>
</template>`

const mainCss = `body {
  font-family: system-ui, sans-serif;
  margin: 0;
  padding: 1.5rem;
  line-height: 1.5;
}

.site-title {
  margin: 0 0 1rem;
}`

export default {
  id: 'create-vue-project',
  title: 'Creating a Vue project with Vite',
  summary: 'Scaffold a real Vue 3 project with create-vue, run it with Vite, and understand what every generated file is for.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['what-is-vue', 'es-modules'],
  related: ['create-app-mount', 'single-file-components', 'project-structure', 'api-production'],
  tags: ['vite', 'create-vue', 'npm', 'scaffolding', 'project structure', 'hmr', 'build', 'dev server'],
  apis: [
    { name: 'npm create vue@latest', summary: 'Runs create-vue, the official scaffolding tool, to generate a Vite-based Vue project.' },
    { name: 'npm run dev', summary: 'Starts the Vite development server with hot module replacement.' },
    { name: 'npm run build', summary: 'Creates an optimised production build in the dist/ folder.' },
    { name: 'npm run preview', summary: 'Serves the built dist/ folder locally to check the production build.' },
  ],
  docs: [
    { label: 'Vue Guide — Quick Start', url: 'https://vuejs.org/guide/quick-start.html' },
    { label: 'Vue Guide — Tooling', url: 'https://vuejs.org/guide/scaling-up/tooling.html' },
    { label: 'Vite — Getting Started', url: 'https://vite.dev/guide/' },
  ],

  intro: `
Real Vue apps live in a **project**: a folder with your components, a configuration file and a list of the packages you depend on. You don't create it by hand — one command generates it for you:

\`\`\`bash
npm create vue@latest
\`\`\`

That runs **create-vue**, Vue's official *scaffolding* tool (a tool that generates a ready-to-use starter project). The project it creates is powered by **Vite** (French for "quick", pronounced *veet*), a build tool that runs a fast development server while you work and packs your app into optimised files when you ship it.
`,

  why: `
Browsers understand exactly three things: HTML, CSS and JavaScript. They have no idea what a \`.vue\` file is. They also know nothing about \`import App from './App.vue'\` pointing at a file that needs compiling first.

A **build tool** closes that gap:

- **While you develop**, it translates \`.vue\` files into JavaScript the browser can run, the moment the browser asks for them, and pushes your edits to the open page in about the time it takes to save — no manual refresh.
- **When you ship**, it bundles everything into a few small, optimised files with cache-friendly names.

You *could* wire Vite, the Vue plugin, linting and testing together yourself. create-vue does it in seconds, with the setup the Vue team recommends, so every Vue project starts from the same well-understood shape.
`,

  eli15: `
Starting a Vue project is like opening a new restaurant kitchen.

**\`npm create vue@latest\`** is the contractor who builds the kitchen: counters, shelves, labelled drawers — the folder structure.

**\`npm install\`** is the delivery truck bringing all the equipment (the packages your app needs) into the \`node_modules\` storeroom.

**\`npm run dev\`** turns the stoves on. While it runs, you cook (edit code) and the dish on the pass (your browser) updates the instant you change the recipe.

**\`npm run build\`** packs finished meals into takeaway boxes (the \`dist\` folder) — compact, labelled, ready to deliver to customers (a web server).
`,

  analogy: {
    title: 'A kitchen, a delivery and a takeaway box',
    body: `
Your source code is the recipe book. Vite is the chef. During service (\`npm run dev\`) the chef cooks each dish on demand, the moment it's ordered, and if you tweak a recipe the next plate already uses it. At closing time (\`npm run build\`) the chef prepares everything in bulk, packs it tightly and labels the boxes so customers' fridges (browser caches) know exactly when a box is new.
`,
    mapping: [
      ['building the kitchen', '`npm create vue@latest` generates the project folders and config'],
      ['delivery truck', '`npm install` downloads packages into `node_modules/`'],
      ['cooking to order', '`npm run dev`: Vite compiles files when the browser requests them'],
      ['takeaway boxes', '`npm run build`: optimised, hashed files in `dist/`'],
      ['the recipe book', 'your code in `src/`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'How the generated files connect',
    props: {
      nodes: [
        { id: 'html', label: 'index.html', note: '<div id="app"> + module script', tone: 'paper' },
        { id: 'main', label: 'src/main.js', note: 'createApp(App).mount("#app")', tone: 'acid' },
        { id: 'css', label: 'assets/main.css', note: 'global styles', tone: 'kraft' },
        { id: 'app', label: 'App.vue', note: 'the root component', tone: 'cobalt' },
        { id: 'comp', label: 'components/*.vue', note: 'HelloWorld, …' },
        { id: 'vite', label: 'Vite', note: 'serves + compiles', tone: 'ink' },
      ],
      edges: [
        { from: 'html', to: 'main', label: 'loads' },
        { from: 'main', to: 'css', label: 'imports' },
        { from: 'main', to: 'app', label: 'imports' },
        { from: 'app', to: 'comp', label: 'imports' },
        { from: 'vite', to: 'html', label: 'serves', dashed: true },
      ],
      layout: 'grid',
      cols: 3,
      steps: [
        { focus: ['vite', 'html'], edges: ['vite->html'], text: '`npm run dev` starts Vite. When you open `http://localhost:5173`, Vite sends **index.html** — a nearly empty page with `<div id="app">` and one `<script type="module">`.' },
        { focus: ['main'], edges: ['html->main'], text: 'The browser follows the script tag to **src/main.js**, the *entry point*: the first JavaScript file that runs.' },
        { focus: ['css', 'app'], edges: ['main->css', 'main->app'], text: '`main.js` imports the global CSS and **App.vue**. Vite compiles the `.vue` file into JavaScript on the fly, because the browser cannot read it directly.' },
        { focus: ['comp'], edges: ['app->comp'], text: 'App.vue imports smaller components from **components/**. Each import is another request Vite answers with compiled code.' },
        { focus: ['main', 'html'], text: '`createApp(App).mount(\'#app\')` renders the root component into the empty div. The page comes alive.' },
      ],
    },
    caption: 'One HTML page, one entry script, a tree of components. That is the shape of almost every Vue app.',
    alt: 'A grid diagram: Vite serves index.html; index.html loads src/main.js; main.js imports assets/main.css and App.vue; App.vue imports components. A final step shows main.js mounting App into the div with id app in index.html.',
  },

  syntax: [
    `
#### 1. Create the project

You need **Node.js** installed (it includes \`npm\`, the package manager). Open a terminal in the folder where you keep your projects:
`,
    { code: `npm create vue@latest`, lang: 'bash', title: 'terminal', static: true },
    `
create-vue asks a few questions. Press Enter to accept the defaults — for learning, plain JavaScript with no extras is perfect. You can add Vue Router, Pinia, Vitest and ESLint later, or tick them now.
`,
    {
      code: `✔ Project name: … my-vue-app
? Select features to include in your project:
  ◻ TypeScript
  ◻ JSX Support
  ◻ Router (SPA development)
  ◻ Pinia (state management)
  ◻ Vitest (unit testing)
  ◻ End-to-End Testing
  ◻ ESLint (error prevention)
  ◻ Prettier (code formatting)

Scaffolding project in ./my-vue-app...
Done. Now run:

  cd my-vue-app
  npm install
  npm run dev`,
      lang: 'text',
      title: 'create-vue prompts (representative — wording changes between versions)',
      static: true,
    },
    `
#### 2. Install and run
`,
    {
      code: `cd my-vue-app      # move into the new folder
npm install        # download the packages listed in package.json
npm run dev        # start the Vite dev server`,
      lang: 'bash',
      title: 'terminal',
      static: true,
    },
    `
Vite prints a local address — by default \`http://localhost:5173/\`. Open it in your browser. Leave the terminal running: edit \`src/App.vue\`, save, and the page updates without a reload. Stop the server with **Ctrl + C**.

Prefer another package manager? \`pnpm create vue@latest\`, \`yarn create vue\` and \`bun create vue@latest\` do the same thing.

#### 3. The project structure

A typical freshly generated JavaScript project looks like this (exact files vary by create-vue version and the options you picked):
`,
    {
      code: `my-vue-app/
├── node_modules/         ← installed packages (created by npm install, never edit or commit)
├── public/
│   └── favicon.ico       ← copied to the build as-is, served from "/"
├── src/                  ← YOUR code lives here
│   ├── assets/           ← CSS, images, fonts — processed by Vite
│   │   ├── base.css
│   │   ├── logo.svg
│   │   └── main.css
│   ├── components/       ← reusable .vue components
│   │   ├── HelloWorld.vue
│   │   ├── TheWelcome.vue
│   │   └── WelcomeItem.vue
│   ├── App.vue           ← the root component
│   └── main.js           ← entry point: creates and mounts the app
├── .gitignore            ← keeps node_modules/ and dist/ out of git
├── index.html            ← the single HTML page Vite serves
├── jsconfig.json         ← editor hints (e.g. the "@" → src alias)
├── package.json          ← dependencies + npm scripts
├── README.md
└── vite.config.js        ← Vite configuration and plugins`,
      lang: 'text',
      title: 'project structure (typical)',
      static: true,
    },
    `
The files you will touch most:
`,
    {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" href="/favicon.ico">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>`,
      lang: 'html',
      title: 'index.html',
      static: true,
      highlight: [10, 11],
    },
    { code: mainJs, lang: 'js', title: 'src/main.js', static: true },
    {
      code: `import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()], // teaches Vite how to compile .vue files
  resolve: {
    alias: {
      // lets you write  import X from '@/components/X.vue'
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})`,
      lang: 'js',
      title: 'vite.config.js (simplified — create-vue may also add the Vue DevTools plugin)',
      static: true,
    },
    {
      code: `{
  "name": "my-vue-app",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.x"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "…",
    "vite": "…"
  }
}`,
      lang: 'json',
      title: 'package.json (simplified — real version numbers vary)',
      static: true,
    },
    `
#### 4. Build for production
`,
    {
      code: `npm run build     # → creates dist/ with optimised HTML, JS and CSS
npm run preview   # → serves dist/ locally so you can check the real build`,
      lang: 'bash',
      title: 'terminal',
      static: true,
    },
    `
\`dist/\` is what you deploy to any static host. \`npm run preview\` is only for checking the build on your machine — it is not a production server.
`,
    {
      callout: 'version',
      title: 'Node.js version',
      text: 'Vite needs a recent Node.js. Check the Vue Quick Start page for the currently supported range (at the time of writing, current Vite versions require Node 20.19+ or 22.12+). If `npm run dev` complains about your Node version, upgrade Node — for example with a version manager such as nvm.',
    },
    {
      callout: 'note',
      title: 'What about Vue CLI?',
      text: 'Older tutorials use `vue create` from Vue CLI (webpack-based). Vue CLI is in maintenance mode; the Vue team recommends Vite-based create-vue for new projects.',
    },
  ],

  walkthrough: {
    title: 'project tree',
    lang: 'text',
    code: projectTree,
    intro: 'Step through the generated folder. The highlighted line is explained on the right.',
    steps: [
      { lines: [2], text: '`node_modules/` holds every downloaded package (Vue, Vite and their dependencies). `npm install` creates it from `package.json`. Never edit it, never commit it — anyone can recreate it with `npm install`.' },
      { lines: [3, 4], text: '`public/` is for files that must keep their exact name and path, like `favicon.ico` or `robots.txt`. They are copied to the build untouched and served from the site root (`/favicon.ico`).' },
      { lines: [5, 9], text: '`src/` is where you work. `src/assets/` holds CSS and images that your code *imports*; Vite processes them (e.g. adds a content hash to the filename so browsers cache them safely).' },
      { lines: [10, 13], text: '`src/components/` holds reusable components. The generated ones are demo content — delete them when you start your own app.' },
      { lines: [14], text: '`App.vue` is the **root component**: the top of your component tree. Everything else renders inside it.' },
      { lines: [15], text: "`main.js` is the **entry point** — the first JavaScript that runs. It imports global CSS, creates the app with `createApp(App)` and mounts it into `#app`." },
      { lines: [17], text: '`index.html` is the one real HTML page. It contains an empty `<div id="app">` and a `<script type="module" src="/src/main.js">`. Unlike older tools, Vite treats this file as the front door of your app.' },
      { lines: [19], text: '`package.json` lists your dependencies and the scripts `dev`, `build` and `preview` that you run with `npm run …`.' },
      { lines: [21], text: '`vite.config.js` configures Vite: the Vue plugin that compiles `.vue` files, the `@` alias for `src/`, and anything else you add later.' },
    ],
  },

  playground: {
    title: 'A freshly scaffolded project',
    objective: 'Explore a cut-down version of what create-vue generates: an entry file, a root component, child components and global CSS.',
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'components/HelloWorld.vue': helloWorld,
      'components/TheFooter.vue': theFooter,
      'assets/main.css': mainCss,
    },
    expected: 'A page titled **My Vue App** with a green **You did it!** heading. Click through the files: `main.js` starts everything, `App.vue` arranges the page, `components/` holds the pieces. (This sandbox plays the role of the Vite dev server.)',
    experiments: [
      {
        id: 'msg',
        task: 'In `App.vue`, change the message passed to `HelloWorld` from "You did it!" to **Hello, Vite!**',
        hint: 'Look for `msg="You did it!"` inside `<main>`.',
        tests: [{ name: 'the greeting says Hello, Vite!', code: `expect(text('.greetings h2')).toBe('Hello, Vite!')` }],
        explain: '`msg` is a *prop*: a value the parent hands to a child component. The child decides how to display it. Props get their own lesson in the components module.',
      },
      {
        id: 'footer',
        task: '`components/TheFooter.vue` is imported in `App.vue` but never shown. Render it below `<main>`.',
        hint: 'Add `<TheFooter />` after the closing `</main>` tag. The import is already on line 3.',
        tests: [{ name: 'the footer is rendered', code: `expect(exists('.site-footer')).toBe(true); expect(text('.site-footer')).toContain('Vue + Vite')` }],
        explain: 'Importing a component in `<script setup>` makes it *available*; writing its tag in the template is what actually renders it.',
      },
      {
        id: 'reuse',
        task: 'Components are reusable. Add a **second** `HelloWorld` under the first one with the message **Components are reusable**.',
        hint: '`<HelloWorld msg="Components are reusable" />`',
        tests: [
          {
            name: 'two greetings with different messages',
            code: `const heads = findAll('.greetings h2').map((h) => h.textContent.trim())
expect(heads.length).toBe(2)
expect(heads).toContain('Components are reusable')`,
          },
        ],
        explain: 'One `.vue` file, two independent copies on the page. Each copy is a separate *instance* with its own props.',
      },
      {
        id: 'break-import',
        task: 'Break something on purpose: in `App.vue`, change the import path to `./components/HelloWord.vue` (missing an "l") and run. Read the error, then fix it.',
        hint: 'The error names the file that could not be resolved — that is your first clue in real projects too.',
        explain: 'Vite reports the same kind of "could not resolve import" error in the terminal and in an overlay in the browser. Import paths are also **case-sensitive** on most servers and CI machines, even if your laptop forgives `helloworld.vue`.',
      },
    ],
  },

  animation: {
    type: 'concept-diagram',
    title: 'npm run dev vs npm run build',
    props: {
      nodes: [
        { id: 'src', label: 'src/', note: 'your .vue, .js, .css', tone: 'acid' },
        { id: 'dev', label: 'Vite dev server', note: 'compile on request + HMR', tone: 'cobalt' },
        { id: 'browser', label: 'Your browser', note: 'localhost:5173', tone: 'paper' },
        { id: 'build', label: 'vite build', note: 'bundle · minify · hash', tone: 'ink' },
        { id: 'dist', label: 'dist/', note: 'index.html + assets/', tone: 'kraft' },
        { id: 'host', label: 'Static host', note: 'users download dist/', tone: 'paper' },
      ],
      edges: [
        { from: 'src', to: 'dev', label: 'npm run dev' },
        { from: 'dev', to: 'browser', label: 'native ES modules' },
        { from: 'src', to: 'build', label: 'npm run build' },
        { from: 'build', to: 'dist', label: 'writes' },
        { from: 'dist', to: 'host', label: 'deploy' },
      ],
      layout: 'grid',
      cols: 3,
      steps: [
        { focus: ['src', 'dev'], edges: ['src->dev'], text: '**Development.** `npm run dev` starts a server. It does not bundle your whole app up front — it waits for the browser to ask for files.' },
        { focus: ['dev', 'browser'], edges: ['dev->browser'], text: 'The browser requests `main.js`, then each import. Vite compiles each file (e.g. a `.vue` file into JavaScript + CSS) and sends it as a native ES module.' },
        { focus: ['src', 'dev', 'browser'], text: '**Hot Module Replacement (HMR).** Save a component and Vite pushes just that module to the open page. When possible Vue swaps only that component and keeps the rest of the page as it was.' },
        { focus: ['src', 'build'], edges: ['src->build'], text: '**Production.** `npm run build` processes everything at once: bundles modules, removes unused code, minifies, and adds content hashes to filenames.' },
        { focus: ['dist', 'host'], edges: ['build->dist', 'dist->host'], text: 'The result in `dist/` is plain HTML, CSS and JavaScript. Upload it to any static host. No Vite, no Node required on the server.' },
      ],
    },
    caption: 'Same source code, two pipelines: fast feedback while you work, small optimised files when you ship.',
    alt: 'A diagram with two paths from src. Top path: npm run dev goes to the Vite dev server, which serves native ES modules to the browser at localhost:5173 with hot module replacement. Bottom path: npm run build goes through bundling, minifying and hashing into a dist folder, which is deployed to a static host.',
  },

  internals: {
    beginner: `
The browser only reads HTML, CSS and JavaScript. During development Vite sits between your files and the browser like a translator: whenever the browser asks for \`App.vue\`, Vite quickly turns it into JavaScript and sends that instead. When you build, Vite translates *everything* ahead of time and squeezes it into a few small files.
`,
    technical: [
      `
**Dev server.** Modern browsers support ES modules natively (\`<script type="module">\`, \`import\`). Vite exploits that: instead of bundling the whole app before starting, it serves source files individually and transforms each one when requested. A request for \`/src/App.vue\` goes through **@vitejs/plugin-vue**, which uses **@vue/compiler-sfc** to split the file into its template, script and style blocks and compile them into a JavaScript module plus CSS. Packages from \`node_modules\` are pre-bundled once and cached, so a library with hundreds of internal files doesn't cause hundreds of requests.

**HMR.** The dev server keeps a WebSocket connection open to the page. When you save a file, Vite works out which modules are affected and tells the page to re-import just those. The Vue plugin adds HMR handling for components, so an edited component can be swapped in place — often keeping its state — instead of reloading the whole page.

**Build.** \`vite build\` bundles the module graph for production: it tree-shakes unused exports, minifies, splits code into chunks, extracts CSS and writes files with content hashes (e.g. \`assets/index-<hash>.js\`). A hash changes only when the file's content changes, so browsers can cache files aggressively.
`,
      {
        code: `dist/
├── assets/
│   ├── index-<hash>.css
│   └── index-<hash>.js
├── favicon.ico        ← copied from public/
└── index.html         ← script/link tags point at the hashed files`,
        lang: 'text',
        title: 'what npm run build produces (shape only)',
      },
    ],
    production: `
- **Deploy \`dist/\`, never the dev server.** \`npm run dev\` is unoptimised and meant for one developer. Production = \`npm run build\` + any static host or CDN.
- **Sub-path deploys** (e.g. \`https://example.com/my-app/\`) need Vite's \`base\` option, otherwise asset URLs point at the domain root and 404.
- **Client-side routing** with HTML5 history (\`createWebHistory()\` in Vue Router) needs the host to serve \`index.html\` for unknown paths; otherwise refreshing \`/products/42\` returns a 404. See [Lazy-loaded routes & scroll behavior](lesson:lazy-routes-scroll) and [Production readiness](lesson:production-readiness).
- **Environment variables:** Vite exposes variables prefixed with \`VITE_\` to client code via \`import.meta.env\`. Everything in the client bundle is public — never put secrets there. See [Env variables, CORS & production errors](lesson:api-production).
- **Reproducible installs:** commit \`package-lock.json\` (or your manager's lockfile) and use \`npm ci\` in CI. Pin the Node version (\`.nvmrc\` or \`engines\` in \`package.json\`).
- As the app grows, organise \`src/\` by feature — see [Feature-based project structure](lesson:project-structure).
`,
  },

  mistakes: [
    {
      title: 'Opening index.html directly from the file system',
      explanation: 'Double-clicking `index.html` opens it as `file://…`. The browser then tries to load `/src/main.js` and its `.vue` imports without Vite to compile them, so you get a blank page and console errors. Always run `npm run dev` and use the `http://localhost` address.',
    },
    {
      title: 'Running the dev server before installing packages',
      wrong: { code: `npm create vue@latest\ncd my-vue-app\nnpm run dev   # 'vite' is not recognized / vite: command not found`, lang: 'bash' },
      right: { code: `cd my-vue-app\nnpm install\nnpm run dev`, lang: 'bash' },
      explanation: 'The `vite` command lives inside `node_modules/`, which only exists after `npm install`.',
    },
    {
      title: 'Committing node_modules or dist to git',
      explanation: '`node_modules/` can contain tens of thousands of files and is recreated by `npm install`; `dist/` is recreated by `npm run build`. The generated `.gitignore` already excludes both — keep it that way and commit the lockfile instead.',
    },
    {
      title: 'Import paths that only work on your machine',
      wrong: { code: `// file on disk: components/UserCard.vue\nimport UserCard from './components/userCard.vue'`, lang: 'js' },
      right: { code: `import UserCard from './components/UserCard.vue'`, lang: 'js' },
      explanation: 'macOS and Windows file systems are usually case-insensitive, so the wrong case works locally. Linux servers and CI are case-sensitive, so the build fails there. Match the file name exactly.',
    },
  ],

  debugging: [
    {
      symptom: "`'vite' is not recognized as an internal or external command` / `vite: command not found`.",
      cause: 'Dependencies are not installed (no `node_modules/`), or you ran the command outside the project folder.',
      fix: '`cd` into the project and run `npm install`, then `npm run dev`.',
    },
    {
      symptom: 'Vite prints an error about an unsupported Node.js version.',
      cause: 'Your Node.js is older than the range Vite supports.',
      fix: 'Install a current Node.js LTS (a version manager like nvm makes switching easy) and reinstall dependencies.',
    },
    {
      symptom: '`Failed to resolve import "./components/Helloworld.vue"`.',
      cause: 'A typo or wrong letter case in the import path, or the file is in a different folder.',
      fix: 'Copy the exact file name from your editor\'s file tree. Remember paths are relative to the importing file.',
    },
    {
      symptom: 'The deployed site is blank and the browser console shows 404s for `/assets/index-….js`.',
      cause: 'The app is hosted under a sub-path, but asset URLs point at the domain root.',
      fix: "Set `base: '/my-app/'` in `vite.config.js` and rebuild.",
    },
    {
      symptom: '`Port 5173 is in use, trying another one…`',
      cause: 'Another dev server (maybe an old one you forgot) is using the port.',
      fix: 'Use the new address Vite prints, or stop the other process. You can also set a fixed port in `vite.config.js` (`server.port`).',
    },
  ],

  bestPractices: [
    'Start every new Vue app with `npm create vue@latest`; add Router, Pinia, Vitest and ESLint when you need them.',
    'Keep your code in `src/`; use `public/` only for files that must keep an exact name or path.',
    'Commit the lockfile, ignore `node_modules/` and `dist/`.',
    'Delete the demo components early so the project only contains your code.',
    'Check the production build locally with `npm run build && npm run preview` before deploying.',
    'Use the `@/` alias for imports from deep folders instead of long `../../../` chains.',
  ],

  useCases: [
    'Starting any new Vue single-page app: dashboards, internal tools, portfolios, games.',
    'Spinning up a throwaway project to try a library or reproduce a bug.',
    'Creating a project with Router + Pinia + Vitest pre-wired for a team.',
    'Building a widget bundle you embed into an existing site.',
  ],

  whenToUse: {
    use: [
      'You are building anything beyond a single small widget.',
      'You want `.vue` single-file components, hot reload and an optimised production build.',
      'You want the setup the Vue docs and ecosystem assume.',
    ],
    avoid: [
      'You only need a sprinkle of interactivity on an existing page and cannot add a build step — use the CDN build instead.',
      'You need server-side rendering, file-based routing or static generation out of the box — consider Nuxt (a separate framework on top of Vue).',
    ],
  },

  comparison: {
    title: 'Ways to start a Vue project',
    headers: ['', 'create-vue', 'create-vite (vue template)', 'Vue CLI', 'CDN script'],
    rows: [
      ['Command', '`npm create vue@latest`', '`npm create vite@latest`', '`vue create my-app`', '`<script src=…vue.global.js>`'],
      ['Build tool', 'Vite', 'Vite', 'webpack', 'none'],
      ['Status', 'official, recommended', "Vite's own minimal template", 'maintenance mode', 'fine for prototypes and enhancing pages'],
      ['Extras', 'optional TS, Router, Pinia, Vitest, E2E, ESLint', 'minimal Vue + Vite only', 'plugin-based', 'none'],
      ['Best for', 'new Vue apps', 'a bare-bones start', 'existing webpack-based projects', 'no-build pages and quick experiments'],
    ],
    note: 'For learning and for new production apps, use create-vue.',
  },

  quiz: [
    {
      id: 'create-vue-project-q1',
      type: 'mcq',
      prompt: 'Which command scaffolds a new Vue 3 project with the officially recommended tooling?',
      options: [
        { text: '`npm create vue@latest`' },
        { text: '`npm install -g @vue/cli && vue create app`', why: 'That is Vue CLI, which is in maintenance mode. New projects should use the Vite-based create-vue.' },
        { text: '`npx vite build`', why: '`vite build` builds an existing project for production; it does not create one.' },
        { text: '`vue new app`', why: 'There is no such command.' },
      ],
      answer: 0,
      explanation: '`npm create vue@latest` runs create-vue, which generates a Vite-powered project and asks about optional features.',
    },
    {
      id: 'create-vue-project-q2',
      type: 'output',
      prompt: 'You run `npm run build` in a default create-vue project. Where does the production-ready output appear?',
      options: [
        { text: '`dist/`' },
        { text: '`src/`', why: '`src/` is your source code; the build never overwrites it.' },
        { text: '`public/`', why: '`public/` is an *input*: its files are copied into the build output.' },
        { text: '`node_modules/.vite`', why: 'That folder is a dev-time cache, not something you deploy.' },
      ],
      answer: 0,
      explanation: 'Vite writes optimised HTML, JS and CSS to `dist/` — that folder is what you deploy.',
    },
    {
      id: 'create-vue-project-q3',
      type: 'bug',
      prompt: 'This `index.html` gives `SyntaxError: Cannot use import statement outside a module`. Click the line that causes it.',
      code: {
        lang: 'html',
        code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Shop</title>
  </head>
  <body>
    <div id="app"></div>
    <script src="/src/main.js"></script>
  </body>
</html>`,
      },
      answerLine: 9,
      explanation: '`main.js` uses `import`, which only works in module scripts. The tag needs `type="module"`: `<script type="module" src="/src/main.js"></script>`.',
    },
    {
      id: 'create-vue-project-q4',
      type: 'fill',
      prompt: 'Complete the `scripts` section that create-vue generates in `package.json`.',
      code: { lang: 'json', code: `"scripts": {\n  "dev": "___",\n  "build": "vite ___",\n  "preview": "vite preview"\n}` },
      answer: [['vite'], ['build']],
      explanation: '`npm run dev` runs `vite` (the dev server), `npm run build` runs `vite build`, and `npm run preview` serves the built files.',
    },
    {
      id: 'create-vue-project-q5',
      type: 'mcq',
      prompt: 'You have a `logo.png` used by a component and a `robots.txt` that must be served at `/robots.txt`. Where should each go?',
      options: [
        { text: '`logo.png` in `src/assets/` (imported, processed by Vite); `robots.txt` in `public/` (copied as-is).' },
        { text: 'Both in `public/`.', why: 'It works, but files in `public/` skip processing — no content hashes, no import errors if the file is missing. Imported assets belong in `src/assets/`.' },
        { text: 'Both in `src/assets/`.', why: '`robots.txt` must keep its exact name at the site root; files in `src/assets/` get hashed names.' },
        { text: '`logo.png` in `node_modules/`, `robots.txt` in `dist/`.', why: 'Both folders are generated — anything you put there by hand gets wiped.' },
      ],
      answer: 0,
      explanation: '`public/` = "copy exactly, serve from the root". `src/assets/` = "my code imports this; let Vite optimise and hash it".',
    },
    {
      id: 'create-vue-project-q6',
      type: 'mcq',
      prompt: 'What does Hot Module Replacement (HMR) give you during `npm run dev`?',
      options: [
        { text: 'When you save a file, the changed module is swapped into the running page without a full reload.' },
        { text: 'It makes the production build smaller.', why: 'HMR is a development-only feature; it is not part of the production build.' },
        { text: 'It automatically fixes syntax errors.', why: 'Errors are reported (often in an overlay), not fixed.' },
        { text: 'It deploys your app every time you save.', why: 'Nothing is deployed; HMR only updates the page open on your machine.' },
      ],
      answer: 0,
      explanation: 'Vite pushes updated modules over a WebSocket and the page re-imports just those, often keeping component state.',
    },
    {
      id: 'create-vue-project-q7',
      type: 'short',
      prompt: 'Why can\'t a browser load `App.vue` directly, and what does Vite do about it?',
      answer: 'Browsers only understand HTML, CSS and JavaScript; a `.vue` file is a Vue-specific format with template, script and style blocks. Vite (via the Vue plugin and the SFC compiler) compiles each `.vue` file into a JavaScript module plus CSS — on demand in development, and all at once into optimised bundles for production.',
    },
  ],

  exercises: [
    {
      id: 'extract-header',
      title: 'Move the header into its own component',
      difficulty: 'beginner',
      prompt: `
\`App.vue\` contains the site header inline. Move it into \`components/AppHeader.vue\` (the file exists but only has a TODO):

- \`AppHeader.vue\` renders \`<header class="app-header">\` containing an \`<h1>\` with the text **Pixel Shop** and the tagline \`<p class="tagline">Retro games, new homes</p>\`.
- \`App.vue\` imports \`AppHeader\` and renders \`<AppHeader />\` where the header used to be.
- The page must show the header **exactly once**.
`,
      files: {
        'main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
        'App.vue': `<script setup>
// TODO: import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <header class="app-header">
    <h1>Pixel Shop</h1>
    <p class="tagline">Retro games, new homes</p>
  </header>

  <main>
    <p class="intro">New arrivals every Friday.</p>
  </main>
</template>`,
        'components/AppHeader.vue': `<template>
  <!-- TODO: move the header markup from App.vue here -->
</template>`,
      },
      hints: [
        'Cut the whole `<header>…</header>` block out of `App.vue` and paste it inside `<template>` in `AppHeader.vue`.',
        "In `App.vue`'s `<script setup>`, add `import AppHeader from './components/AppHeader.vue'`.",
        'Put `<AppHeader />` at the top of `App.vue`\'s template, above `<main>`.',
      ],
      solution: {
        explanation: 'The markup moved, nothing else changed: the page looks identical, but `App.vue` now reads like a table of contents. That is the everyday rhythm of Vue projects — when a block of template has its own job, it becomes its own component in `components/`.',
        files: {
          'main.js': `import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')`,
          'App.vue': `<script setup>
import AppHeader from './components/AppHeader.vue'
</script>

<template>
  <AppHeader />

  <main>
    <p class="intro">New arrivals every Friday.</p>
  </main>
</template>`,
          'components/AppHeader.vue': `<template>
  <header class="app-header">
    <h1>Pixel Shop</h1>
    <p class="tagline">Retro games, new homes</p>
  </header>
</template>`,
        },
      },
      tests: [
        {
          name: 'AppHeader.vue renders the header on its own',
          code: `const header = mountFile('components/AppHeader.vue')
expect(header.find('.app-header')).toBeTruthy()
expect(header.text()).toContain('Pixel Shop')
expect(header.text()).toContain('Retro games, new homes')`,
        },
        {
          name: 'the page shows the header exactly once',
          code: `expect(findAll('.app-header').length).toBe(1)
expect(text('.app-header h1')).toBe('Pixel Shop')`,
        },
        { name: 'the rest of the page is still there', code: `expect(text('.intro')).toBe('New arrivals every Friday.')` },
      ],
    },
    {
      id: 'fix-fresh-project',
      title: 'Fix three bugs in a fresh project',
      difficulty: 'beginner',
      prompt: `
A classmate "tidied up" a new project and now the page is blank. The code compiles, so the clues are in the **console warnings**. Fix all three bugs so that:

- the app mounts into the \`<div id="app">\` that \`index.html\` provides,
- \`HelloWorld\` renders a \`.greetings\` block with **Welcome back!**,
- \`TheFooter\` renders a \`.site-footer\` at the bottom.

The page should show an \`<h1>\` with **Pixel Shop**, the greeting and the footer. Don't rename any files.
`,
      files: {
        'main.js': `import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// index.html contains: <div id="app"></div>
createApp(App).mount('#root')`,
        'App.vue': `<script setup>
import HelloWorld from './components/HelloWorld.vue'
</script>

<template>
  <h1>Pixel Shop</h1>
  <Helloworld msg="Welcome back!" />
  <TheFooter />
</template>`,
        'components/HelloWorld.vue': `<script setup>
defineProps({ msg: String })
</script>

<template>
  <div class="greetings">
    <h2>{{ msg }}</h2>
  </div>
</template>`,
        'components/TheFooter.vue': `<template>
  <footer class="site-footer">
    <small>© Pixel Shop</small>
  </footer>
</template>`,
        'assets/main.css': `body {
  font-family: system-ui, sans-serif;
}`,
      },
      hints: [
        'Run it and open the console. The first warning says the mount target selector returned `null` — compare the selector in `main.js` with the id in the comment.',
        'Next, look for "Failed to resolve component" warnings. One tag has the wrong letter case; the other component was never imported.',
        "The fixes: `.mount('#app')`, `<HelloWorld … />`, and `import TheFooter from './components/TheFooter.vue'`.",
      ],
      solution: {
        explanation: 'Three classic fresh-project bugs: a mount selector that matches nothing (Vue warns and renders nothing), a component tag whose case does not match the imported name (`Helloworld` ≠ `HelloWorld`), and a component used without being imported. In both component cases Vue cannot find the component, warns "Failed to resolve component", and renders an unknown element instead. Reading the console warnings top to bottom leads to every fix.',
        files: {
          'main.js': `import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// index.html contains: <div id="app"></div>
createApp(App).mount('#app')`,
          'App.vue': `<script setup>
import HelloWorld from './components/HelloWorld.vue'
import TheFooter from './components/TheFooter.vue'
</script>

<template>
  <h1>Pixel Shop</h1>
  <HelloWorld msg="Welcome back!" />
  <TheFooter />
</template>`,
          'components/HelloWorld.vue': `<script setup>
defineProps({ msg: String })
</script>

<template>
  <div class="greetings">
    <h2>{{ msg }}</h2>
  </div>
</template>`,
          'components/TheFooter.vue': `<template>
  <footer class="site-footer">
    <small>© Pixel Shop</small>
  </footer>
</template>`,
          'assets/main.css': `body {
  font-family: system-ui, sans-serif;
}`,
        },
      },
      tests: [
        { name: 'the app mounts and shows the title', code: `expect(text('h1')).toBe('Pixel Shop')` },
        { name: 'HelloWorld renders its message', code: `expect(text('.greetings h2')).toBe('Welcome back!')` },
        { name: 'the footer is rendered', code: `expect(exists('.site-footer')).toBe(true)` },
      ],
    },
  ],

  interview: [
    {
      id: 'create-vue-project-vite-role',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'What does Vite do in a Vue project, in development and in production?',
      answer: 'In development, Vite runs a dev server that serves source files as native ES modules, compiling each file (like `.vue` SFCs via the Vue plugin) on demand, with Hot Module Replacement. In production, `vite build` bundles, tree-shakes, minifies and content-hashes the app into static files in `dist/`.',
      explanation: 'Two jobs, two modes: fast feedback while coding, optimised output for users.',
      whyAsked: 'Every modern Vue job uses Vite. Interviewers check you understand your own toolchain rather than treating it as magic.',
      mistakes: ['Saying Vite is part of Vue core — it is a separate build tool used by many frameworks.', 'Thinking you deploy the dev server.', 'Not knowing why `.vue` files need compiling.'],
      followUps: ['Why is the dev server fast even for large apps?', 'What is HMR?', 'What ends up in dist/?'],
      modelAnswer: "Vite is the build tool behind create-vue projects. In development it starts a server that doesn't bundle up front: the browser loads index.html, follows native ES module imports, and Vite compiles each file on request — for .vue files through the Vue plugin and the SFC compiler. Saving a file triggers hot module replacement, so only the changed module is swapped into the page. For production, vite build processes the whole module graph: bundling, tree-shaking, minifying and adding content hashes, and writes static files to dist, which I deploy to any static host.",
    },
    {
      id: 'create-vue-project-structure-tour',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'Walk me through the important files of a freshly created Vue project and how they connect.',
      answer: '`index.html` is the page Vite serves; it has `<div id="app">` and a module script pointing at `src/main.js`. `main.js` is the entry point: it imports global CSS, creates the app with `createApp(App)` and mounts it on `#app`. `App.vue` is the root component, which imports components from `src/components/`. `package.json` lists dependencies and the dev/build/preview scripts, and `vite.config.js` registers the Vue plugin and aliases like `@` → `src`.',
      explanation: 'Follow the chain: HTML → entry script → root component → child components.',
      whyAsked: 'Shows you can orient yourself in an unfamiliar codebase — the first thing you do in any new job.',
      mistakes: ['Not knowing where the app is mounted.', 'Confusing `public/` with `src/assets/`.', 'Thinking `index.html` is irrelevant in Vite projects.'],
      followUps: ['Where would you add Vue Router or Pinia?', 'What is the `@` alias?'],
      modelAnswer: "The chain starts at index.html, which Vite serves as the front door. It contains an empty div with id app and a module script for src/main.js. main.js is the entry point: it imports global styles, calls createApp with the root component App.vue, and mounts it on #app — that's also where I'd register plugins like the router or Pinia. App.vue is the top of the component tree and imports components from src/components. Around that, package.json holds dependencies and scripts, vite.config.js configures the Vue plugin and the @ alias, and public holds files copied verbatim.",
    },
    {
      id: 'create-vue-project-public-assets',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between putting an image in `public/` and in `src/assets/`?',
      answer: 'Files in `public/` are copied to the build untouched and referenced by absolute path (`/logo.png`); Vite does not process or hash them. Files in `src/assets/` are imported from code or referenced in templates/CSS with relative paths; Vite processes them, adds content hashes for caching, may inline small files, and fails the build if a referenced file is missing.',
      explanation: '`public/` = fixed URL, no processing. `src/assets/` = part of the module graph, optimised.',
      code: {
        lang: 'vue',
        code: `<script setup>
import logoUrl from '@/assets/logo.png' // processed, hashed URL
</script>

<template>
  <img :src="logoUrl" alt="Pixel Shop" />
  <img src="/favicon.ico" alt="" />  <!-- from public/, exact path -->
</template>`,
      },
      whyAsked: 'Caching and broken-asset bugs in production often come from misplaced files.',
      mistakes: ['Putting every asset in `public/` and losing cache busting.', 'Putting `robots.txt` in `src/assets/` and wondering why `/robots.txt` 404s.'],
      followUps: ['Why do hashed filenames help caching?', 'What happens to a missing imported asset at build time?'],
      modelAnswer: "public is for files that need an exact, stable URL — favicon, robots.txt, files referenced by external services. Vite copies them as-is and I reference them with absolute paths. src/assets is for assets my code uses: when I import them or reference them relatively, they become part of Vite's module graph, so they get content-hashed filenames for long-term caching, small ones can be inlined, and a missing file fails the build instead of silently 404ing in production. My default is src/assets unless a fixed URL is required.",
    },
    {
      id: 'create-vue-project-ci-case',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'The app runs perfectly on your Mac, but the CI build on Linux fails with `Could not resolve "./components/userCard.vue"`. The file exists. What is wrong?',
      answer: 'A letter-case mismatch: the file is probably `UserCard.vue`. macOS (and Windows) file systems are usually case-insensitive, so the import works locally; Linux is case-sensitive, so the build fails. Fix the import to match the exact file name (and, if git did not record a rename, rename the file with `git mv`).',
      explanation: 'The import string must match the file name character for character on case-sensitive systems.',
      whyAsked: 'A very common "works on my machine" bug. It tests debugging instincts and knowledge of the environment.',
      mistakes: ['Blaming caching or reinstalling node_modules.', 'Renaming the file on macOS without noticing git ignores case-only renames by default.'],
      followUps: ['How can a linter catch this earlier?', 'Why might git not notice a case-only rename?'],
      modelAnswer: "The error says the path can't be resolved even though the file exists, which points to case sensitivity. On macOS the file system usually ignores case, so './components/userCard.vue' still finds UserCard.vue. The Linux CI runner is case-sensitive, so it fails. I'd fix the import to match the file exactly, and check that git actually has the right case — case-only renames can be missed, so git mv is the safe way. An ESLint import rule can catch this before CI.",
    },
    {
      id: 'create-vue-project-deploy',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'A teammate deploys by running `npm run dev` on the production server. The site is slow and sometimes shows an error overlay. What would you change?',
      answer: 'Never serve the dev server in production. Run `npm run build` (ideally in CI), deploy the static `dist/` folder to a static host or CDN, check it locally with `npm run preview` first, set `base` if deploying under a sub-path, and configure an `index.html` fallback if the app uses history-mode routing.',
      explanation: 'The dev server serves unbundled, unminified modules and dev-only tooling. The build output is what users should get.',
      whyAsked: 'Tests whether you understand the gap between development tooling and production delivery.',
      mistakes: ['Suggesting a bigger server.', 'Using `vite preview` as the production server — it is for local checks only.', 'Forgetting SPA fallback routing.'],
      followUps: ['Why does a refresh on /products/42 return 404 on some hosts?', 'How do content hashes affect caching headers?'],
      modelAnswer: "The dev server is built for one developer: it compiles on demand, serves unminified modules, and shows error overlays. For production I'd run npm run build in CI, which produces optimised, hashed static files in dist, and deploy that folder to a static host or CDN. Before that, npm run preview lets us check the real build locally — but preview isn't a production server either. If the app is served under a sub-path, I'd set Vite's base option, and if we use history-mode routing I'd configure the host to fall back to index.html.",
    },
    {
      id: 'create-vue-project-env-config',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 4,
      question: 'How would you configure a different API URL for development and production in a Vite + Vue project, and what must never go into that configuration?',
      answer: 'Use Vite env files: `.env.development` and `.env.production` with variables prefixed `VITE_` (e.g. `VITE_API_URL`), read in code via `import.meta.env.VITE_API_URL`. Vite statically replaces them at build time. Anything exposed this way ends up in the JavaScript bundle and is public, so secrets (API keys with write access, database passwords, signing keys) must stay on a server.',
      explanation: 'Only `VITE_`-prefixed variables reach client code, precisely so you do not leak server secrets by accident.',
      code: {
        lang: 'js',
        code: `// .env.development  →  VITE_API_URL=http://localhost:3000
// .env.production   →  VITE_API_URL=https://api.example.com

const API = import.meta.env.VITE_API_URL
fetch(API + '/products')`,
      },
      whyAsked: 'Configuration and secret handling is a frequent source of real security incidents.',
      mistakes: ['Putting secret keys in `VITE_` variables.', 'Using `process.env` in client code without understanding the bundler.', 'Committing `.env.local` files with real credentials.'],
      followUps: ['How would you keep a third-party API key secret?', 'Which env files are loaded for `vite build`?'],
      modelAnswer: "Vite loads .env files per mode, so I'd put VITE_API_URL in .env.development and .env.production and read it with import.meta.env.VITE_API_URL. Only variables with the VITE_ prefix are exposed to client code, and they're replaced at build time, so the value ends up inside the bundle. That means anything there is public — fine for a public API base URL, never for secrets. If the frontend needs to use a secret key, I'd route that call through a backend endpoint that holds the key.",
    },
    {
      id: 'create-vue-project-coding-nav',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Fill in `components/AppNav.vue` so it renders `<nav class="app-nav">` with three links — **Home**, **Shop**, **Contact** — and show it at the top of `App.vue`.',
      starter: {
        files: {
          'App.vue': `<script setup>
</script>

<template>
  <main>
    <h1>Pixel Shop</h1>
  </main>
</template>`,
          'components/AppNav.vue': `<template>
  <!-- TODO: a <nav class="app-nav"> with three links -->
</template>`,
        },
      },
      tests: [
        {
          name: 'AppNav renders three links',
          code: `const nav = mountFile('components/AppNav.vue')
const links = Array.from(nav.el.querySelectorAll('.app-nav a')).map((a) => a.textContent.trim())
expect(links).toEqual(['Home', 'Shop', 'Contact'])`,
        },
        { name: 'App shows the nav above the title', code: `expect(exists('.app-nav')).toBe(true); expect(findAll('.app-nav a').length).toBe(3); expect(text('h1')).toBe('Pixel Shop')` },
      ],
      hints: ['Write the `<nav>` markup in `AppNav.vue` with three `<a href="#">` tags.', "Import it in App.vue: `import AppNav from './components/AppNav.vue'`, then add `<AppNav />`."],
      answer: 'Write the markup in the component file, import it in the parent\'s `<script setup>`, and use its tag.',
      solution: {
        files: {
          'App.vue': `<script setup>
import AppNav from './components/AppNav.vue'
</script>

<template>
  <AppNav />
  <main>
    <h1>Pixel Shop</h1>
  </main>
</template>`,
          'components/AppNav.vue': `<template>
  <nav class="app-nav">
    <a href="#">Home</a>
    <a href="#">Shop</a>
    <a href="#">Contact</a>
  </nav>
</template>`,
        },
      },
      explanation: 'With `<script setup>`, importing a component is all the registration it needs. In a real app these links would be `<RouterLink>`s from Vue Router.',
      whyAsked: 'Checks the basic file → import → use workflow that every Vue task builds on.',
      mistakes: ['Forgetting the import, which renders an unknown `<appnav>` element and logs "Failed to resolve component".', 'Wrong relative path.'],
      followUps: ['How would these links work with Vue Router?', 'When would you register a component globally instead?'],
      modelAnswer: "I'd put the nav markup in AppNav.vue's template, then in App.vue import it in script setup — with script setup the import itself registers it for the template — and render AppNav at the top. In a routed app I'd replace the anchors with RouterLink so navigation stays client-side.",
    },
  ],

  takeaways: [
    '`npm create vue@latest` scaffolds an official Vite-based project; then `npm install` and `npm run dev`.',
    'Browsers cannot read `.vue` files — Vite compiles them on demand in development and ahead of time for production.',
    'The chain: `index.html` → `src/main.js` (createApp + mount) → `App.vue` → `components/`.',
    '`public/` is copied as-is; `src/assets/` is processed and hashed by Vite.',
    '`npm run build` writes `dist/` — deploy that, never the dev server.',
    'Import paths are relative and case-sensitive; only `VITE_` env variables reach the browser, and they are public.',
  ],
}
