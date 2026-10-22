// Lesson: Production readiness — builds, logging & SEO (Level 16)

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import { capture } from './reporter.js'

const app = createApp(App)

// One place for every error Vue catches: setup, render, lifecycle hooks,
// watchers and event handlers (including async handlers that return a promise).
app.config.errorHandler = (err, instance, info) => {
  capture(err, { component: instance?.$options.__name ?? 'App', info })
}

app.mount('#app')`

const configJs = `// Simulated environment-specific config.
// In a Vite app this would come from import.meta.env.MODE (build time)
// or from a /config.json fetched at startup (runtime).
const MODE = 'production' // try 'development'

const configs = {
  development: { mode: 'development', release: 'dev', logToConsole: true },
  production: { mode: 'production', release: 'shop@1.4.2', logToConsole: false },
}

export const config = configs[MODE]`

const reporterJs = `import { reactive } from 'vue'
import { config } from './config.js'

// SIMPLIFIED error reporter. A real one would batch reports and send them to an
// error-tracking service, with hidden source maps uploaded for readable stacks.
export const sent = reactive([])

// Remove personal data before anything leaves the browser.
export function scrub(text) {
  return String(text)
}

export function capture(error, context = {}) {
  const report = {
    message: scrub(error && error.message ? error.message : error),
    component: context.component || 'unknown',
    info: context.info || '',
  }
  sent.push(report)
  if (config.logToConsole) console.error('[report]', report.message)
}`

const appVue = `<script setup>
import { ref } from 'vue'
import { sent } from './reporter.js'
import CheckoutButton from './CheckoutButton.vue'
import ProfileCard from './ProfileCard.vue'

const showProfile = ref(false)
</script>

<template>
  <h2>Acme Shop</h2>
  <CheckoutButton />
  <button class="show-profile" @click="showProfile = true">Open profile card</button>
  <ProfileCard v-if="showProfile" />

  <h3>Reports sent ({{ sent.length }})</h3>
  <ul class="reports">
    <li v-for="(r, i) in sent" :key="i" class="report">
      {{ r.component }} · {{ r.info }} · {{ r.message }}
      <span v-if="r.release" class="release">· {{ r.release }}</span>
    </li>
  </ul>
</template>`

const checkoutVue = `<script setup>
async function pay() {
  await new Promise((resolve) => setTimeout(resolve, 50))
  // Errors in async handlers still reach app.config.errorHandler,
  // because Vue watches the promise the handler returns.
  throw new Error('Payment failed for ada@example.com (card declined)')
}
</script>

<template>
  <button class="pay" @click="pay">Pay now</button>
</template>`

const profileVue = `<script setup>
import { ref } from 'vue'

const user = ref(null) // the data never arrived…
</script>

<template>
  <!-- …so this throws during render: Cannot read properties of null -->
  <div class="profile">{{ user.name.toUpperCase() }}</div>
</template>`

// ---------- exercise 1: logger
const loggerApp = `<script setup>
import { createLogger } from './logger.js'

const log = createLogger({ level: 'info' })
log.debug('Cart recalculated')                       // skipped at 'info'
log.info('Checkout started', { items: 3 })
log.error('Login failed', { user: 'ada', password: 'hunter2' })
</script>

<template>
  <p class="hint">Open the console to see the log lines.</p>
</template>`

const loggerStarter = `const LEVELS = ['debug', 'info', 'warn', 'error']

export function createLogger({ level = 'info' } = {}) {
  function write(name, message, context) {
    const line = name.toUpperCase() + ' ' + message
    console.log(line)
    return line
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
  }
}`

const loggerSolution = `const LEVELS = ['debug', 'info', 'warn', 'error']
const SENSITIVE = ['password', 'token', 'authorization', 'cardnumber']

function redact(value) {
  if (Array.isArray(value)) return value.map(redact)
  if (value && typeof value === 'object') {
    const out = {}
    for (const [key, inner] of Object.entries(value)) {
      out[key] = SENSITIVE.includes(key.toLowerCase()) ? '[redacted]' : redact(inner)
    }
    return out
  }
  return value
}

export function createLogger({ level = 'info' } = {}) {
  const threshold = LEVELS.indexOf(level)

  function write(name, message, context) {
    if (LEVELS.indexOf(name) < threshold) return null
    let line = name.toUpperCase() + ' ' + message
    if (context !== undefined) line += ' ' + JSON.stringify(redact(context))
    console[name](line)
    return line
  }

  return {
    debug: (message, context) => write('debug', message, context),
    info: (message, context) => write('info', message, context),
    warn: (message, context) => write('warn', message, context),
    error: (message, context) => write('error', message, context),
  }
}`

// ---------- exercise 2: per-route SEO tags
const seoMain = `import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router.js'

createApp(App).use(router).mount('#app')`

const seoApp = `<template>
  <nav>
    <RouterLink to="/">Home</RouterLink> ·
    <RouterLink to="/pricing">Pricing</RouterLink> ·
    <RouterLink to="/missing-page">Broken link</RouterLink>
  </nav>
  <RouterView />
</template>`

const seoRouterStarter = `import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const page = (text) => ({ render: () => h('h2', { class: 'page' }, text) })

export const router = createRouter({
  history: createMemoryHistory(), // real apps: createWebHistory()
  routes: [
    { path: '/', component: page('Welcome'), meta: { title: 'Home', description: 'Acme Shop sells sturdy, repairable gadgets.' } },
    { path: '/pricing', component: page('Pricing'), meta: { title: 'Pricing', description: 'Simple plans for every team size.' } },
    { path: '/:pathMatch(.*)*', component: page('Page not found'), meta: { title: 'Not found', noindex: true } },
  ],
})

// TODO: router.afterEach(...) — update the title and meta tags`

const seoRouterSolution = `import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const page = (text) => ({ render: () => h('h2', { class: 'page' }, text) })

export const router = createRouter({
  history: createMemoryHistory(), // real apps: createWebHistory()
  routes: [
    { path: '/', component: page('Welcome'), meta: { title: 'Home', description: 'Acme Shop sells sturdy, repairable gadgets.' } },
    { path: '/pricing', component: page('Pricing'), meta: { title: 'Pricing', description: 'Simple plans for every team size.' } },
    { path: '/:pathMatch(.*)*', component: page('Page not found'), meta: { title: 'Not found', noindex: true } },
  ],
})

function setMeta(name, content) {
  let tag = document.head.querySelector('meta[name="' + name + '"]')
  if (content == null) {
    if (tag) tag.remove()
    return
  }
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute('name', name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

router.afterEach((to) => {
  document.title = to.meta.title ? to.meta.title + ' · Acme Shop' : 'Acme Shop'
  setMeta('description', to.meta.description ?? null)
  setMeta('robots', to.meta.noindex ? 'noindex' : null)
})`

const resetHead = `document.title = ''
document.head.querySelectorAll('meta[name="description"], meta[name="robots"]').forEach((m) => m.remove())`

export default {
  id: 'production-readiness',
  title: 'Production readiness: builds, logging & SEO',
  summary: 'Turn a working Vue app into a shippable one: production builds and deployment config, error reporting and logging that respect privacy, environment-specific settings, and the SEO basics a single-page app needs.',
  difficulty: 'advanced',
  minutes: 42,
  prerequisites: ['error-handling', 'api-production', 'secrets-csp-dependencies'],
  related: ['bundle-optimization', 'measuring-performance', 'rendering-strategies', 'plugins-app-config', 'project-production-app', 'router-basics'],
  tags: ['production', 'deployment', 'vite build', 'errorHandler', 'error reporting', 'logging', 'monitoring', 'seo', 'meta tags', 'environment config', 'history mode', 'caching'],
  apis: [
    { name: 'app.config.errorHandler', summary: 'Global handler for uncaught errors from component setup, render, hooks, watchers and event handlers.' },
    { name: 'onErrorCaptured()', summary: 'Lifecycle hook that sees errors from descendant components — useful for local fallbacks.' },
    { name: 'vite build / vite preview', summary: 'Create the optimised production bundle in dist/, and serve it locally to test (not a production server).' },
    { name: 'router.afterEach()', summary: 'Runs after every navigation — a common place to update the document title and meta tags.' },
  ],
  docs: [
    { label: 'Vue Guide — Production deployment', url: 'https://vuejs.org/guide/best-practices/production-deployment.html' },
    { label: 'API — app.config.errorHandler', url: 'https://vuejs.org/api/application.html#app-config-errorhandler' },
    { label: 'Vue Router — History modes & server configuration', url: 'https://router.vuejs.org/guide/essentials/history-mode.html' },
    { label: 'Vite — Building for production', url: 'https://vite.dev/guide/build' },
    { label: 'Vite — Deploying a static site', url: 'https://vite.dev/guide/static-deploy' },
    { label: 'Google Search Central — JavaScript SEO basics', url: 'https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics' },
  ],

  intro: `
"It works on my machine" is the start of the job, not the end. **Production readiness** is the set of habits that make an app behave well when real people use it on real networks:

- a **production build** that is small, cacheable and free of dev-only code, deployed with the right **server configuration**;
- **error reporting and logging**, so you hear about problems before users tweet about them — without leaking their personal data;
- **environment-specific configuration** (dev, staging, production) that doesn't require editing code;
- the **SEO** basics (titles, descriptions, crawlable pages) a client-rendered app needs if people should find it.
`,

  why: `
In development, Vue shouts at you: warnings in the console, a red error overlay, devtools at hand. In production, by default, **errors happen silently on someone else's device**. The checkout button throws, the user shrugs and leaves, and you never find out.

Production also changes the rules of the game:

- Refresh \`/products/42\` on a misconfigured server and you get a **404**, because the server has no such file — only your router knows that page.
- Deploy a new version and some users keep running the **old JavaScript** because \`index.html\` was cached.
- Share a product link on social media and the preview shows "**Vite App**" with no image, because the preview bot never ran your JavaScript.
- Log a full API response "just to debug" and you've stored **customers' emails and tokens** in a third-party logging tool.

None of these are Vue bugs. They're the gap between "the code works" and "the product works". This lesson closes it.
`,

  eli15: `
Imagine you built a lemonade stand at home. Production readiness is everything you do before opening it on a busy street:

- **The build:** you pack only what customers need — no mixing bowls, no spilled sugar. (Minified, optimised files; no development helpers.)
- **The signboard and directions:** if someone asks for "the lemonade stand on Oak Street", the street has to point them to you. (Server config so every app URL loads your app; titles and descriptions so search engines know what each page is.)
- **The complaint box:** when something goes wrong, customers drop a note — but you don't ask for their home address. (Error reporting that removes personal data.)
- **Different setups for practice and real days:** at home you taste-test loudly; on the street you stay quiet and professional. (Development vs production configuration.)

Same lemonade, very different preparation.
`,

  analogy: {
    title: 'Opening the lemonade stand',
    body: `
At home, mistakes are cheap and visible. On the street, mistakes are expensive and invisible — unless you set up ways to see them. Production readiness is building those windows (reporting, logs) and signposts (routing fallback, SEO tags) *before* the crowd arrives.
`,
    mapping: [
      ['packing only what customers need', '`vite build`: minified, tree-shaken, hashed files in `dist/`'],
      ['directions to the stand', 'SPA history fallback: the server returns `index.html` for app routes'],
      ['the signboard', '`<title>`, meta description and crawlable HTML for search and previews'],
      ['the complaint box', '`app.config.errorHandler` + an error-reporting service'],
      ['not asking for home addresses', 'scrubbing personal data from logs and reports'],
      ['practice day vs opening day', 'development / staging / production configuration'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'From npm run build to a user\'s screen — and back',
    caption: 'The production path, plus the feedback loop that tells you when something breaks.',
    alt: 'A flow diagram: source code goes through vite build into dist (index.html plus hashed assets), is deployed to a host or CDN with cache rules, SPA fallback and security headers, and is loaded by the user\'s browser. Errors in the browser flow to an error reporter and then to a monitoring dashboard the team watches.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'src', label: 'src/', note: '.vue, .js, .env.production', tone: 'paper', x: 80, y: 90 },
        { id: 'build', label: 'vite build', note: 'minify · tree-shake · hash', tone: 'cobalt', x: 250, y: 90 },
        { id: 'host', label: 'Host / CDN', note: 'cache rules · SPA fallback · headers', tone: 'kraft', x: 450, y: 90 },
        { id: 'browser', label: 'User\'s browser', note: 'your app, for real', tone: 'acid', x: 660, y: 90 },
        { id: 'reporter', label: 'Error reporter', note: 'errorHandler → scrub → send', tone: 'red', x: 560, y: 245 },
        { id: 'team', label: 'Your team', note: 'alerts & dashboards', tone: 'ink', x: 300, y: 245 },
      ],
      edges: [
        { from: 'src', to: 'build' },
        { from: 'build', to: 'host', label: 'dist/' },
        { from: 'host', to: 'browser', label: 'HTTPS' },
        { from: 'browser', to: 'reporter', label: 'errors', dashed: true },
        { from: 'reporter', to: 'team', label: 'release + context' },
      ],
      steps: [
        { focus: ['src', 'build'], edges: ['src->build'], text: '`vite build` uses the production mode: it loads `.env.production`, uses Vue\'s production build (no dev warnings), minifies, removes unused code and adds **content hashes** to file names (`index-3f2a9c.js`).' },
        { focus: ['host'], edges: ['build->host'], text: 'You deploy `dist/`. The host needs three rules: serve `index.html` for any app route (history-mode fallback), cache hashed assets for a long time but **not** `index.html`, and send security headers such as CSP.' },
        { focus: ['browser'], edges: ['host->browser'], text: 'Users load the app over HTTPS. Their devices, networks and data are messier than yours — this is where unknown errors happen.' },
        { focus: ['reporter'], edges: ['browser->reporter'], text: '`app.config.errorHandler` (plus window-level handlers for errors outside Vue) catches failures, **scrubs personal data**, adds context (release, route, component) and sends a report.' },
        { focus: ['team'], edges: ['reporter->team'], text: 'Your team gets alerted, sees which release introduced the error, and fixes it — often before most users notice.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'What a non-JavaScript crawler sees',
    caption: 'Social preview bots and some crawlers read the HTML response without running your JavaScript. Google can render JavaScript, but SEO-critical pages are safer when the HTML already contains the content.',
    alt: 'Side by side HTML. Left: a client-rendered app\'s index.html with a generic title and an empty div with id app. Right: a server-rendered or prerendered product page with a specific title, meta description, Open Graph tags and the product content in the HTML.',
    props: {
      left: {
        label: 'Client-side rendered (SPA) response',
        lang: 'html',
        code: `<!doctype html>
<html lang="en">
  <head>
    <title>Vite App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/assets/index-3f2a9c.js"></script>
  </body>
</html>`,
      },
      right: {
        label: 'Prerendered / server-rendered response',
        lang: 'html',
        code: `<!doctype html>
<html lang="en">
  <head>
    <title>Trail Backpack 30L · Acme Shop</title>
    <meta name="description" content="Waterproof 30-litre pack…">
    <meta property="og:title" content="Trail Backpack 30L">
    <meta property="og:image" content="https://acme.example/img/pack.jpg">
    <link rel="canonical" href="https://acme.example/products/trail-30">
  </head>
  <body>
    <div id="app"><h1>Trail Backpack 30L</h1><p>€89</p>…</div>
  </body>
</html>`,
      },
      points: [
        'The SPA response has no page-specific content until JavaScript runs.',
        'Per-route titles set with JavaScript help users and JavaScript-rendering crawlers, but not bots that only read the HTML.',
        'Social previews (Open Graph tags) generally need the tags in the HTML response.',
        'For SEO-critical public pages, consider SSR or static generation — the next level of this course.',
      ],
    },
  },

  syntax: [
    `
#### Build, preview, modes
`,
    {
      code: `npm run build                # vite build → dist/ (production mode)
npm run preview              # serve dist/ locally to test it — not a production server
npx vite build --mode staging  # loads .env.staging instead of .env.production`,
      lang: 'bash',
      title: 'terminal',
    },
    {
      code: `if (import.meta.env.DEV) {
  // only in the dev server — removed from production builds
}
console.log(import.meta.env.MODE) // 'development' | 'production' | 'staging' | …`,
      lang: 'js',
      title: 'environment checks (static example)',
      static: true,
    },
    `
#### Catching errors globally
`,
    {
      code: `const app = createApp(App)

app.config.errorHandler = (err, instance, info) => {
  // err: the error · instance: the component (may be null) · info: where it happened
  reportError(err, { component: instance?.$options.__name, info })
}

// Errors outside Vue's reach (plain scripts, timers, third-party code):
window.addEventListener('error', (e) => reportError(e.error))
window.addEventListener('unhandledrejection', (e) => reportError(e.reason))`,
      lang: 'js',
      title: 'main.js',
    },
    {
      callout: 'note',
      title: 'info in production',
      text: 'In production builds Vue passes a short code as `info` instead of the long description (Vue\'s docs publish a production error code reference to look codes up). Log it as-is.',
    },
    `
#### Local fallbacks with onErrorCaptured
`,
    {
      code: `import { ref, onErrorCaptured } from 'vue'

const widgetFailed = ref(false)
onErrorCaptured((err) => {
  widgetFailed.value = true   // show a fallback instead of the broken child
  // return false here would stop the error from reaching app.config.errorHandler
})`,
      lang: 'js',
      title: 'an error boundary-style parent',
    },
    `
#### Deployment rules for an SPA

- **History fallback:** with \`createWebHistory()\`, configure the server to return \`index.html\` for unknown paths (the Vue Router docs list configs for common servers). Otherwise refreshing a deep link is a 404.
- **Caching:** hashed files in \`/assets\` can be cached for a long time (\`Cache-Control: public, max-age=31536000, immutable\`); \`index.html\` should be revalidated (\`no-cache\`) so users pick up new releases.
- **Base path:** deploying under a sub-path (\`https://example.com/shop/\`) needs Vite's \`base\` option and the same base in \`createWebHistory(import.meta.env.BASE_URL)\`.

#### Per-route titles and meta tags
`,
    {
      code: `router.afterEach((to) => {
  document.title = to.meta.title ? \`\${to.meta.title} · Acme Shop\` : 'Acme Shop'
})`,
      lang: 'js',
      title: 'router.js',
    },
  ],

  walkthrough: {
    title: 'main.js',
    lang: 'js',
    code: mainJs,
    intro: 'The playground wires global error reporting in four lines. Here is what each part does.',
    steps: [
      { lines: [3], text: '`capture` lives in its own module, so the rest of the app (and tests) can use the same reporter.' },
      { lines: [5], text: 'Configure the app **before** `mount()`, so errors thrown during the very first render are caught too.' },
      { lines: [7, 8], text: 'The comment lists what Vue routes to the handler. Errors in timers or plain scripts outside Vue need `window` listeners as well.' },
      { lines: [9, 11], text: '`instance` is the component where the error happened (it can be null); `$options.__name` is the component\'s name from its file. `info` says where: render function, event handler, a hook…' },
      { lines: [13], text: 'Mount last. From here on, an error no longer disappears silently.' },
    ],
  },

  playground: {
    title: 'An error reporter that respects privacy',
    objective: 'Trigger real errors, see them reported, then make the reports privacy-safe, traceable to a release, and configurable per environment.',
    files: {
      'main.js': mainJs,
      'App.vue': appVue,
      'reporter.js': reporterJs,
      'config.js': configJs,
      'CheckoutButton.vue': checkoutVue,
      'ProfileCard.vue': profileVue,
    },
    expected: 'Click **Pay now**: after a moment a report appears — note that it contains a customer\'s email address. Click **Open profile card**: the card fails to render and a second report appears with `render function` as the location. The rest of the page keeps working.',
    experiments: [
      {
        id: 'scrub-emails',
        task: 'The payment report contains `ada@example.com`. Make `scrub()` in `reporter.js` replace every email address with `[email]`.',
        hint: 'Return `String(text).replace(/[^\\s@]+@[^\\s@]+\\.[^\\s@]+/g, \'[email]\')`.',
        tests: [
          {
            name: 'scrub() hides email addresses',
            code: `const { scrub } = requireModule('reporter.js')
expect(scrub('Contact ada@example.com or bea@shop.example now')).toBe('Contact [email] or [email] now')`,
          },
          {
            name: 'the payment report no longer contains the email',
            code: `await click('.pay')
await wait(120)
expect(text('.reports')).toContain('[email]')
expect(text('.reports')).not.toContain('ada@example.com')`,
          },
        ],
        explain: 'Error messages and logs end up in third-party tools, dashboards and screenshots. Scrubbing at the source — before anything leaves the browser — is far safer than hoping nobody looks.',
      },
      {
        id: 'release-tag',
        task: 'When an error spikes after a deploy, you need to know *which* release introduced it. Add `release: config.release` to every report.',
        hint: 'Add the property inside the `report` object in `capture()`; the template already shows `r.release` when it exists.',
        tests: [
          {
            name: 'reports carry the release identifier',
            code: `await click('.show-profile')
await flush()
expect(text('.reports')).toContain('shop@1.4.2')`,
          },
        ],
        explain: 'Release tags (often the git commit or version) let error trackers group errors by deploy and show "new in this release". Pair them with hidden source maps so stack traces point at your original code.',
      },
      {
        id: 'dev-mode',
        task: 'Switch `config.js` to development mode so reports are also logged to the console while you work.',
        hint: 'Change `const MODE = \'production\'` to `\'development\'`.',
        tests: [
          {
            name: 'in development, reports are logged to the console',
            code: `await click('.show-profile')
await flush()
expect(logs.some((line) => line.includes('[report]'))).toBe(true)`,
          },
        ],
        explain: 'Same code, different behaviour per environment. In a real Vite app the mode comes from `import.meta.env.MODE` (decided at build time) or a runtime config file — never from editing source before each deploy.',
      },
      {
        id: 'fallback',
        task: 'Show a friendly fallback instead of a blank space: in `App.vue`, use `onErrorCaptured` to set a `profileFailed` ref and render `<p class="fallback">Profile unavailable</p>` instead of the card. Don\'t return `false`, so the error is still reported.',
        hint: 'Import `onErrorCaptured`, add `const profileFailed = ref(false)` and `onErrorCaptured(() => { profileFailed.value = true })`. Then use `<ProfileCard v-if="showProfile && !profileFailed" />` and `<p v-if="profileFailed" class="fallback">…</p>`.',
        tests: [
          {
            name: 'the fallback replaces the broken card and the error is still reported',
            code: `await click('.show-profile')
await flush()
expect(exists('.fallback')).toBe(true)
expect(findAll('.report').length).toBeGreaterThan(0)`,
          },
        ],
        explain: '`onErrorCaptured` lets a parent contain a child\'s failure — like an error boundary. Returning `false` would stop propagation, and your global reporter would never hear about the error; usually you want both a fallback *and* a report.',
      },
    ],
  },

  internals: {
    beginner: `
When you run \`vite build\`, Vite reads your source, throws away everything that isn't used, squeezes the rest into small files, and gives each file a name based on its content (like \`index-3f2a9c.js\`). Change the code and the name changes — that's how browsers know to download the new version.

When something throws inside a component, Vue catches it and hands it to your \`errorHandler\` instead of letting it vanish. That handler is your chance to write it down and send it somewhere you'll see it.
`,
    technical: [
      `
**What changes in a production build.** Vite bundles with the production version of Vue: dev-only checks and warnings are compiled away, Vue devtools support is off unless enabled with a build flag, and \`import.meta.env.DEV\` branches are removed as dead code. Assets get content hashes so they can be cached "forever"; \`index.html\` references the current hashes, which is why it must not be cached aggressively.

**How Vue routes errors.** Vue wraps the user code it calls — \`setup()\`, render functions, lifecycle hooks, watcher callbacks, event handlers — in error-handling helpers. A thrown error (or a rejected promise *returned* by a handler or hook) is passed up the component tree: each ancestor's \`onErrorCaptured\` hook runs, and if none returns \`false\`, \`app.config.errorHandler\` receives it. Without a handler, Vue logs it to the console. Code Vue didn't call — a \`setTimeout\` callback, a promise you didn't return or await, a third-party script — needs \`window\` \`error\`/\`unhandledrejection\` listeners.
`,
      {
        code: `// Caught by app.config.errorHandler (Vue called it, or got the promise):
<button @click="async () => { throw new Error('x') }">

// NOT caught by Vue (nobody returns the promise):
<button @click="() => { setTimeout(() => { throw new Error('x') }) }">
// → needs window.addEventListener('error', …)`,
        lang: 'vue',
        title: 'what reaches the handler',
      },
      `
**Build-time vs runtime configuration.** \`import.meta.env\` values are baked into the bundle at build time, so a staging build and a production build are different artifacts. Many teams prefer to **build once and deploy the same artifact everywhere**, loading environment-specific settings at runtime (for example \`fetch('/config.json')\` before mounting). Either way, config holds no secrets ([previous lesson](lesson:secrets-csp-dependencies)).

**SEO and SPAs.** A client-rendered page's HTML response is mostly empty. Google's crawler can execute JavaScript, but rendering may be deferred and not every crawler or link-preview bot runs scripts. Client-side updates to \`document.title\` and meta tags help JavaScript-capable crawlers and users (tab titles, history); content that must be indexed reliably — and Open Graph previews — benefit from server-side rendering or prerendering ([CSR, SSR & SSG](lesson:rendering-strategies)). Use real URLs with \`createWebHistory()\` (hash fragments aren't treated as separate pages), and avoid "soft 404s": an unknown route that returns 200 should at least carry \`<meta name="robots" content="noindex">\`.
`,
    ],
    production: `
- **Release checklist:** \`npm ci && npm run build\` in CI; tests and type checks green; \`npm audit --omit=dev\`; bundle size checked; \`vite preview\` smoke test; CSP and security headers verified; source maps uploaded (hidden) to the error tracker; release tagged.
- **Error reporting:** global \`errorHandler\` + \`window\` listeners → a reporting service with release, route and component context; scrub PII (emails, tokens, card numbers); sample high-volume errors; alert on new errors and spikes after deploys.
- **Logging:** structured, levelled logs (debug/info/warn/error) with a configurable threshold; never log passwords, tokens or full API payloads; strip debug noise from production.
- **Deployment config:** SPA fallback to \`index.html\`, long-lived caching for hashed assets, \`no-cache\` for \`index.html\`, HTTPS + HSTS, compression, correct \`base\` when deploying under a sub-path.
- **Monitoring beyond errors:** real-user performance (Core Web Vitals), uptime checks, and a way to roll back quickly ([measuring performance](lesson:measuring-performance)).
- **SEO:** unique titles and descriptions per route, canonical URLs, a sitemap and \`robots.txt\`, semantic HTML, fast pages — and SSR/SSG where search and social previews matter.
`,
  },

  mistakes: [
    {
      title: 'No global error handler',
      wrong: { code: `createApp(App).mount('#app')\n// errors in production: logged to a console nobody reads`, lang: 'js' },
      right: { code: `const app = createApp(App)\napp.config.errorHandler = (err, instance, info) => report(err, { info })\napp.mount('#app')`, lang: 'js' },
      explanation: 'Without a handler you find out about production errors from angry users — or never. One handler plus a reporting service turns invisible failures into actionable reports.',
    },
    {
      title: 'Logging personal data and secrets',
      wrong: { code: `logger.info('login response', response) // contains email, token…`, lang: 'js' },
      right: { code: `logger.info('login ok', { userId: response.user.id })`, lang: 'js' },
      explanation: 'Logs are copied into tools, retained for months and seen by many people. Log identifiers and events, not payloads; redact sensitive keys automatically.',
    },
    {
      title: 'Forgetting the history-mode fallback',
      wrong: { code: `// router: createWebHistory()\n// server: static files only → refreshing /products/42 returns 404`, lang: 'js' },
      right: { code: `# Example (nginx): send unknown paths to index.html\nlocation / {\n  try_files $uri $uri/ /index.html;\n}`, lang: 'text' },
      explanation: 'With HTML5 history, URLs like `/products/42` exist only in your router. The server must answer them with `index.html` so the app can boot and route.',
    },
    {
      title: 'Caching index.html forever',
      wrong: { code: `Cache-Control: max-age=31536000   # on index.html`, lang: 'text' },
      right: { code: `index.html        → Cache-Control: no-cache\n/assets/*-hash.js → Cache-Control: public, max-age=31536000, immutable`, lang: 'text' },
      explanation: '`index.html` is the pointer to the current hashed bundle. If it\'s cached, users keep loading the old release (and may request old chunks that no longer exist).',
    },
    {
      title: 'Editing code to switch environments',
      wrong: { code: `const API_URL = 'https://staging-api.example' // remember to change before release!`, lang: 'js' },
      right: { code: `const API_URL = import.meta.env.VITE_API_URL  // from .env.staging / .env.production\n// or: const { apiUrl } = await fetch('/config.json').then((r) => r.json())`, lang: 'js' },
      explanation: 'Manual edits get forgotten. Modes and env files (build time) or a runtime config file make the environment a deployment decision, not a code change.',
    },
  ],

  debugging: [
    {
      symptom: 'Refreshing any page except the home page gives a 404 in production.',
      cause: 'The router uses `createWebHistory()` but the host has no fallback to `index.html`.',
      fix: 'Add the SPA fallback/rewrite rule for your host (see Vue Router\'s server configuration examples) and render a proper not-found route inside the app.',
    },
    {
      symptom: 'After a deploy, some users see the old version or get "Failed to fetch dynamically imported module".',
      cause: '`index.html` (or a service worker) was cached and points at old hashed chunks, some of which were deleted.',
      fix: 'Serve `index.html` with `no-cache`, keep previous assets around for a while after deploying, and handle chunk-load errors (e.g. in `router.onError`) by reloading once.',
    },
    {
      symptom: 'Error reports show minified stack traces like `at e (index-3f2a.js:1:4821)`.',
      cause: 'No source maps available to the error tracker.',
      fix: 'Build with hidden source maps (`build.sourcemap: \'hidden\'`) and upload them to your error-tracking service per release, without serving them publicly.',
    },
    {
      symptom: 'Errors from a `setTimeout` callback never reach `app.config.errorHandler`.',
      cause: 'Vue didn\'t call that callback, so it can\'t catch what it throws.',
      fix: 'Add `window` `error` and `unhandledrejection` listeners that call the same reporter — or await/return the promise so Vue sees it.',
    },
    {
      symptom: 'The app works under `npm run dev` but is blank in production with a 404 for `/assets/…`.',
      cause: 'Deployed under a sub-path (e.g. `/shop/`) without setting Vite\'s `base`.',
      fix: 'Set `base: \'/shop/\'` in the Vite config and use `createWebHistory(import.meta.env.BASE_URL)`.',
    },
  ],

  bestPractices: [
    'Set `app.config.errorHandler` before mounting, add `window` error listeners, and send reports to a service with release and route context.',
    'Scrub personal data and secrets before anything is logged or reported; log ids and events, not payloads.',
    'Use a levelled logger whose threshold comes from the environment.',
    'Build in CI with `npm ci`; test the real build with `vite preview` before release.',
    'Configure the host: SPA fallback, long cache for hashed assets, `no-cache` for `index.html`, HTTPS and security headers.',
    'Keep environment differences in modes/env files or a runtime config file, never in hand-edited code.',
    'Give every route a unique title and description; use SSR or prerendering for pages that must rank or preview well.',
  ],

  useCases: [
    'Launching a customer-facing app with an error tracker and alerts on new errors.',
    'Promoting one build artifact from staging to production with runtime config.',
    'Deploying an SPA to a static host or CDN with history-mode rewrites.',
    'Making marketing and product pages discoverable with titles, descriptions and prerendering.',
    'Meeting privacy requirements by redacting personal data from logs and reports.',
  ],

  whenToUse: {
    use: [
      'Global error reporting for every app that real users depend on.',
      'Client-side title/meta updates for every routed SPA (good UX, helps JavaScript-rendering crawlers).',
      'Runtime config when the same build must run in several environments.',
    ],
    avoid: [
      'Shipping debug logging, verbose payload logs or source maps to the public.',
      'Relying on client-side meta tags alone for pages whose search ranking or social previews matter — use SSR/SSG.',
      'Hand-editing URLs or flags in code for each environment.',
    ],
  },

  comparison: {
    title: 'Development vs production',
    headers: ['', 'Development (`vite`)', 'Production (`vite build`)'],
    rows: [
      ['Vue build', 'dev build: warnings, devtools, detailed errors', 'prod build: smaller, faster, no dev warnings'],
      ['Errors', 'overlay + console, you see them', 'silent on users\' devices unless you report them'],
      ['Files', 'served unbundled, on demand', 'bundled, minified, content-hashed in `dist/`'],
      ['Env', '`.env.development`, `MODE=development`', '`.env.production`, `MODE=production`'],
      ['Routing', 'dev server falls back to `index.html` for you', 'your host must be configured to fall back'],
      ['SEO', 'irrelevant', 'titles, descriptions, crawlable HTML, sitemaps'],
    ],
    note: 'That completes the security level. Next, the rendering strategies that fix SPA SEO: [CSR, SSR & SSG](lesson:rendering-strategies).',
  },

  quiz: [
    {
      id: 'production-readiness-q1',
      type: 'mcq',
      prompt: 'Your production app uses `createWebHistory()`. Users can click around fine, but refreshing `/orders/7` shows the host\'s 404 page. What\'s the fix?',
      options: [
        { text: 'Switch every link to `<a href>` so the browser loads pages itself', why: 'That makes it worse: every click becomes a full page request for a file that doesn\'t exist.' },
        { text: 'Configure the host to serve `index.html` for unknown paths' },
        { text: 'Add `/orders/7.html` to `dist/`', why: 'You can\'t pre-create a file for every id; the router handles dynamic paths once the app has booted.' },
        { text: 'Increase the router\'s timeout', why: 'There is no timeout involved; the request never reaches your app.' },
      ],
      answer: 1,
      explanation: 'With HTML5 history, deep links only exist in the router. The server must answer them with `index.html` (a rewrite/fallback rule), and the app renders the right page.',
    },
    {
      id: 'production-readiness-q2',
      type: 'mcq',
      prompt: 'Which errors reach `app.config.errorHandler`? (Select all that apply.)',
      options: [
        { text: 'An error thrown while a component renders' },
        { text: 'A rejected promise returned by an `async` click handler' },
        { text: 'An error thrown inside a `setTimeout` callback started in `onMounted`', why: 'Vue didn\'t call the timer callback, so it can\'t catch the error. Use a `window` `error` listener.' },
        { text: 'An error thrown in a `watch` callback' },
      ],
      answer: [0, 1, 3],
      explanation: 'Vue catches errors in code it invokes — setup, render, hooks, watchers, event handlers (including returned promises). Code scheduled outside Vue needs window-level listeners.',
    },
    {
      id: 'production-readiness-q3',
      type: 'output',
      prompt: 'With this logger configured at level `warn`, what is printed?',
      code: {
        lang: 'js',
        code: `const LEVELS = ['debug', 'info', 'warn', 'error']
const threshold = LEVELS.indexOf('warn')

function log(level, msg) {
  if (LEVELS.indexOf(level) >= threshold) console.log(level.toUpperCase() + ' ' + msg)
}

log('info', 'cart loaded')
log('error', 'payment failed')
log('debug', 'render took 3ms')
log('warn', 'slow response')`,
      },
      options: [
        { text: '`ERROR payment failed` then `WARN slow response`' },
        { text: 'All four lines', why: '`info` and `debug` are below the `warn` threshold, so they are skipped.' },
        { text: 'Only `ERROR payment failed`', why: '`warn` is equal to the threshold, and the check uses `>=`.' },
        { text: 'Nothing — level `warn` hides everything but errors', why: 'The threshold includes `warn` itself.' },
      ],
      answer: 0,
      explanation: 'Messages at or above the threshold are printed, in call order: error, then warn.',
    },
    {
      id: 'production-readiness-q4',
      type: 'bug',
      prompt: 'This setup misses every error that happens during the **first render**. Click the line that causes it.',
      code: {
        lang: 'js',
        code: `import { createApp } from 'vue'
import App from './App.vue'
import { report } from './reporter.js'

const app = createApp(App)
app.mount('#app')

app.config.errorHandler = (err, instance, info) => {
  report(err, { info })
}`,
      },
      answerLine: 6,
      explanation: '`mount()` renders synchronously, so errors in the initial setup and render happen before the handler is assigned on line 8. Configure the app first, then mount.',
    },
    {
      id: 'production-readiness-q5',
      type: 'fill',
      prompt: 'Complete the cache headers: hashed assets are cached for a year and never revalidated; `index.html` is always revalidated.',
      code: {
        lang: 'text',
        code: `/assets/index-3f2a9c.js  →  Cache-Control: public, max-age=31536000, ___
/index.html              →  Cache-Control: ___`,
      },
      answer: [['immutable'], ['no-cache']],
      explanation: '`immutable` tells browsers the file will never change at that URL (its name changes instead). `no-cache` means "store it, but check with the server before using it", so users always get the latest `index.html` and thus the latest asset hashes.',
    },
    {
      id: 'production-readiness-q6',
      type: 'mcq',
      prompt: 'Marketing wants product pages to show rich previews (title, image) when shared on social media. The app is a client-rendered SPA that sets meta tags in `router.afterEach`. What\'s the most reliable fix?',
      options: [
        { text: 'Set the Open Graph tags earlier, in `onBeforeMount`', why: 'Still JavaScript: preview bots that read only the HTML response never see it.' },
        { text: 'Serve those pages with the tags already in the HTML — via SSR or prerendering' },
        { text: 'Add the tags to `index.html` once for the whole site', why: 'Then every product shares the same generic preview.' },
        { text: 'Use hash URLs (`/#/products/42`) so bots load the page', why: 'Hash fragments aren\'t sent to the server at all, which makes per-page previews impossible.' },
      ],
      answer: 1,
      explanation: 'Many preview bots don\'t execute JavaScript. Page-specific tags must be in the HTML response, which is what SSR, SSG or prerendering provide.',
    },
    {
      id: 'production-readiness-q7',
      type: 'short',
      prompt: 'Why should error reports be scrubbed of personal data *in the browser*, before they are sent?',
      answer: 'Because once data leaves the browser it is copied into third-party tools, stored for a long time, and visible to many people — and you can\'t un-send it. Scrubbing at the source (emails, tokens, card numbers, full payloads) keeps you compliant with privacy rules and limits damage if the reporting tool is ever compromised. Reports still stay useful with ids, routes, components and release tags.',
    },
  ],

  exercises: [
    {
      id: 'levelled-logger',
      title: 'A levelled logger that redacts secrets',
      difficulty: 'intermediate',
      prompt: `
Finish \`createLogger({ level = 'info' })\` in \`logger.js\`. It returns \`{ debug, info, warn, error }\`; each method takes \`(message, context?)\`.

- Levels are ordered \`debug < info < warn < error\`. Messages **below** the configured level are skipped: the method returns \`null\` and prints nothing.
- Otherwise build the line \`'LEVEL message'\` (level in upper case), plus \`' ' + JSON.stringify(context)\` when a context is given — e.g. \`'WARN Payment slow {"orderId":42}'\`.
- Print it with the matching console method (\`console.warn\` for warn, …) and **return** the line.
- Before stringifying, redact the values of keys named \`password\`, \`token\`, \`authorization\` or \`cardNumber\` (any letter case) to \`'[redacted]'\` — at any depth.
`,
      files: { 'App.vue': loggerApp, 'logger.js': loggerStarter },
      hints: [
        'Compute `const threshold = LEVELS.indexOf(level)` once; in `write`, return `null` when `LEVELS.indexOf(name) < threshold`.',
        'Write a recursive `redact(value)`: for objects, copy each key, replacing sensitive ones (compare `key.toLowerCase()`), and call `redact` on the others.',
        'Use `console[name](line)` to pick the console method dynamically, and only append the JSON when `context !== undefined`.',
      ],
      solution: {
        explanation: 'A threshold turns noisy debug output off in production without deleting log calls. Redaction lives inside the logger, so no caller can forget it — the safest place for a privacy rule is the one place every log line passes through.',
        files: { 'App.vue': loggerApp, 'logger.js': loggerSolution },
      },
      tests: [
        {
          name: 'messages below the level are skipped',
          code: `const { createLogger } = requireModule('logger.js')
const log = createLogger({ level: 'warn' })
expect(log.info('quiet please')).toBeNull()
expect(log.debug('also quiet')).toBeNull()
expect(logs.some((l) => l.includes('quiet please'))).toBe(false)`,
        },
        {
          name: 'lines are formatted and printed',
          code: `const { createLogger } = requireModule('logger.js')
const log = createLogger({ level: 'debug' })
expect(log.warn('Payment slow', { orderId: 42 })).toBe('WARN Payment slow {"orderId":42}')
expect(log.info('Ready')).toBe('INFO Ready')
expect(logs).toContain('WARN Payment slow {"orderId":42}')`,
        },
        {
          name: 'the level defaults to info',
          code: `const { createLogger } = requireModule('logger.js')
const log = createLogger()
expect(log.debug('hidden')).toBeNull()
expect(log.info('shown')).toBe('INFO shown')`,
        },
        {
          name: 'sensitive keys are redacted (any case)',
          code: `const { createLogger } = requireModule('logger.js')
const line = createLogger().error('Login failed', { user: 'ada', password: 'hunter2', Token: 'abc' })
expect(line).toBe('ERROR Login failed {"user":"ada","password":"[redacted]","Token":"[redacted]"}')`,
        },
        {
          name: 'nested sensitive keys are redacted',
          code: `const { createLogger } = requireModule('logger.js')
const line = createLogger().warn('Request failed', { request: { headers: { Authorization: 'Bearer x' } }, payment: { cardNumber: '4242' } })
expect(line).not.toContain('Bearer x')
expect(line).not.toContain('4242')
expect(line).toContain('[redacted]')`,
        },
      ],
    },
    {
      id: 'route-seo-tags',
      title: 'Per-route title, description and noindex',
      difficulty: 'intermediate',
      prompt: `
Add a \`router.afterEach\` hook in \`router.js\` that keeps the document head in sync with the route's \`meta\`:

- \`document.title\` becomes \`'<meta.title> · Acme Shop'\` (or just \`'Acme Shop'\` without a title).
- A \`<meta name="description">\` tag in \`document.head\` gets \`meta.description\` as its \`content\` — create the tag if it doesn't exist, remove it when the route has no description.
- The not-found route has \`meta.noindex\`: add \`<meta name="robots" content="noindex">\` there, and remove that tag on every other route (so a soft 404 isn't indexed).

Each page renders an \`<h2 class="page">\`. The tests navigate with \`router.push()\` and read \`document.title\` and the meta tags.
`,
      files: { 'main.js': seoMain, 'App.vue': seoApp, 'router.js': seoRouterStarter },
      hints: [
        '`router.afterEach((to) => { … })` runs after every successful navigation; read `to.meta.title`, `to.meta.description`, `to.meta.noindex`.',
        'Write a helper `setMeta(name, content)` that finds `document.head.querySelector(\'meta[name="\' + name + \'"]\')`, creates it when missing, and removes it when `content` is `null`.',
        'Call `setMeta(\'description\', to.meta.description ?? null)` and `setMeta(\'robots\', to.meta.noindex ? \'noindex\' : null)`.',
      ],
      solution: {
        explanation: 'Route meta becomes the single source of truth for head tags, and `afterEach` applies it after every navigation. Removing tags matters as much as adding them: in an SPA the head persists between "pages", so a stale `noindex` would hide a real page from search. For pages that must rank or preview reliably, SSR/SSG puts these tags straight into the HTML.',
        files: { 'main.js': seoMain, 'App.vue': seoApp, 'router.js': seoRouterSolution },
      },
      tests: [
        {
          name: 'the pricing page sets its title',
          code: `${resetHead}
const { router } = requireModule('router.js')
await router.push('/pricing')
await flush()
expect(text('.page')).toBe('Pricing')
expect(document.title).toBe('Pricing · Acme Shop')`,
        },
        {
          name: 'the description meta tag follows the route',
          code: `${resetHead}
const { router } = requireModule('router.js')
await router.push('/pricing')
await flush()
const tag = document.head.querySelector('meta[name="description"]')
expect(tag && tag.getAttribute('content')).toBe('Simple plans for every team size.')
await router.push('/')
await flush()
expect(document.head.querySelectorAll('meta[name="description"]').length).toBe(1)
expect(document.head.querySelector('meta[name="description"]').getAttribute('content')).toBe('Acme Shop sells sturdy, repairable gadgets.')`,
        },
        {
          name: 'unknown routes get noindex, which is removed again afterwards',
          code: `${resetHead}
const { router } = requireModule('router.js')
await router.push('/does-not-exist')
await flush()
expect(document.title).toBe('Not found · Acme Shop')
const robots = document.head.querySelector('meta[name="robots"]')
expect(robots && robots.getAttribute('content')).toBe('noindex')
expect(document.head.querySelector('meta[name="description"]')).toBeNull()
await router.push('/pricing')
await flush()
expect(document.head.querySelector('meta[name="robots"]')).toBeNull()`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'production-readiness-checklist',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What do you check before shipping a Vue SPA to production for the first time?',
      answer: 'Build: `npm ci` + `vite build` in CI, tests green, bundle size reviewed, `vite preview` smoke test. Config: environment values via modes/env or runtime config, no secrets in the bundle. Hosting: history-mode fallback, cache headers (immutable hashed assets, `no-cache` index.html), HTTPS, CSP and security headers, correct `base`. Observability: global `errorHandler` + window listeners → error tracker with release tags and hidden source maps; scrubbed, levelled logs; performance monitoring. Product: titles/descriptions per route, 404 page, accessibility check, and a rollback plan.',
      explanation: 'Production readiness is a checklist across build, config, hosting, observability and discoverability.',
      whyAsked: 'Distinguishes developers who have owned a launch from those who only wrote features.',
      mistakes: ['Only mentioning "run npm run build".', 'Forgetting error reporting.', 'Forgetting the history fallback and caching.'],
      followUps: ['How do you roll back a bad release?', 'How would you know a release made things worse?'],
      modelAnswer: 'I group it into five areas. Build: CI runs npm ci, tests and vite build, and I smoke-test the output with vite preview. Config: environment settings come from modes or a runtime config file, and nothing secret is in the bundle. Hosting: SPA fallback to index.html, long caching for hashed assets but no-cache for index.html, HTTPS and a CSP. Observability: a global errorHandler plus window listeners reporting to an error tracker with release tags and hidden source maps, and logs without personal data. Finally titles and descriptions per route, a real 404 page, and a rollback plan.',
    },
    {
      id: 'production-readiness-refresh-404',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 3,
      question: 'The app works perfectly when you click through it, but refreshing `/settings/profile` in production shows a 404 from the host. Locally it works. Why?',
      answer: 'The router uses HTML5 history (`createWebHistory()`), so `/settings/profile` exists only inside the app. On refresh the browser asks the server for that path, and the static host has no such file. The Vite dev server falls back to `index.html` automatically; production hosts must be configured to do the same (a rewrite rule), after which the router renders the page. Add a catch-all route in the app for real 404s.',
      explanation: 'Client-side routes aren\'t files. The server\'s job is to hand back the app shell for any app URL.',
      whyAsked: 'A classic first-deploy bug; checks understanding of how SPAs and servers share responsibility for URLs.',
      mistakes: ['Blaming Vue Router.', 'Switching to hash mode without understanding the trade-off.', 'Forgetting to keep real 404s for missing assets.'],
      followUps: ['Why does it work in development?', 'What are the trade-offs of hash history?', 'How would you return a real 404 status for unknown pages?'],
      modelAnswer: 'With createWebHistory, that URL is a client-side route, not a file. Clicking works because the router handles it in the browser, but a refresh sends the path to the server, and the static host has nothing there. Vite\'s dev server quietly falls back to index.html, which is why it works locally. The fix is a rewrite rule on the host that serves index.html for app paths, plus a catch-all route in the app for genuinely unknown pages.',
    },
    {
      id: 'production-readiness-error-handling',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'How do you capture runtime errors from a Vue app in production? What does `app.config.errorHandler` catch, and what does it miss?',
      answer: 'Set `app.config.errorHandler` before mounting; it receives uncaught errors from code Vue invokes — `setup`, render functions, lifecycle hooks, watcher callbacks, event handlers, plus rejected promises returned from handlers/hooks — after `onErrorCaptured` hooks up the tree had their say. It misses errors Vue didn\'t call: timers, unawaited promises, code outside components, third-party scripts. Add `window` `error` and `unhandledrejection` listeners for those. Send everything to an error tracker with release, route and component context, scrubbed of PII, with hidden source maps for readable stacks.',
      explanation: 'Vue can only catch what flows through it; the window catches the rest.',
      whyAsked: 'Global error handling is a core production skill and often a follow-up to architecture questions.',
      mistakes: ['Saying try/catch everywhere.', 'Not knowing about onErrorCaptured or returning false stopping propagation.', 'Forgetting unhandledrejection.'],
      followUps: ['How would you show a fallback UI for one broken widget?', 'What is info in production builds?'],
      modelAnswer: 'I set app.config.errorHandler before mount and forward errors to a tracker with release, route and component name. It catches anything Vue invokes — setup, render, hooks, watchers and event handlers, including promises those return — after any onErrorCaptured hooks in ancestors run. It can\'t see errors from timers, promises nobody awaited, or third-party scripts, so I also listen to window error and unhandledrejection. Reports are scrubbed of personal data and stack traces are mapped with hidden source maps.',
    },
    {
      id: 'production-readiness-spa-seo',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'The marketing site and product catalogue are part of your Vue SPA. Search traffic is poor and shared links show a generic preview. What do you investigate and propose?',
      answer: 'Check what crawlers receive: the raw HTML response is an empty shell with a generic title, so non-JS bots and social preview scrapers see nothing page-specific, and JS rendering by search engines may be delayed. Short term: unique titles/descriptions per route, canonical URLs, a sitemap, `robots.txt`, real URLs (history mode), no soft 404s, good performance. Structural fix for public pages: server-side render or prerender them (SSR/SSG — e.g. with Nuxt, or a prerender step for mostly-static pages) so the HTML contains content and Open Graph tags. The logged-in app can stay a client-rendered SPA.',
      explanation: 'SEO problems in SPAs are usually "the HTML is empty" problems; fix the HTML for the pages that matter.',
      whyAsked: 'Tests whether you know the limits of client-side rendering and can propose proportionate solutions.',
      mistakes: ['"Google runs JavaScript, so SEO is fine" with no nuance.', 'Rewriting the whole app in SSR when only public pages need it.', 'Ignoring social previews.'],
      followUps: ['SSR vs SSG for a product catalogue with 10,000 items?', 'How do you return a 404 status from an SSR app?'],
      modelAnswer: 'First I\'d look at the raw HTML a bot receives — for our SPA it\'s an empty div with a generic title, so link-preview bots see nothing page-specific and search engines have to render JavaScript first. Quick wins are unique titles and descriptions per route, canonical links, a sitemap, proper URLs and fixing soft 404s. The real fix for the public pages is to deliver HTML with content: SSR or static generation, for example with Nuxt or a prerender step. The authenticated app can stay a regular SPA, so we only pay the SSR cost where it matters.',
    },
    {
      id: 'production-readiness-build-once',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team builds separate bundles for staging and production using `.env.staging` and `.env.production`. A lead proposes "build once, deploy everywhere". How would you implement it and what are the trade-offs?',
      answer: 'Move environment-specific, non-secret settings (API URL, feature flags, analytics id) out of `import.meta.env` into a runtime config — e.g. a `/config.json` (or a small inline script) written per environment by the deployment, fetched before `app.mount()`, validated, and provided to the app (provide/inject or a store). The exact artifact tested in staging is promoted to production. Trade-offs: an extra request (or an inline script that must fit your CSP) at startup, config is still public, build-time optimisations based on env (dead-code elimination of feature flags) are lost, and you need validation/fallbacks if the config is missing.',
      explanation: 'Build-time env bakes values into the bundle; runtime config lets one artifact run anywhere.',
      whyAsked: 'A practical architecture question about deployment pipelines and configuration management.',
      mistakes: ['Putting secrets in the runtime config.', 'Fetching config after mount, causing flashes of wrong config.', 'Not validating config.'],
      followUps: ['How would you handle a CSP with an inline config script?', 'How do feature flags fit in?'],
      modelAnswer: 'I\'d keep the bundle environment-agnostic and load a small runtime config — a config.json the deployment writes per environment — before mounting. It gets validated, with clear errors for missing values, and is provided to the app through a store or provide/inject. Then the artifact we tested in staging is exactly what reaches production. The costs are an extra startup request, losing build-time dead-code elimination for env-based flags, and the reminder that this config is still public, so no secrets. Many teams think that trade is worth it for reproducible releases.',
    },
    {
      id: 'production-readiness-caching',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'Which caching strategy fits `index.html` and which fits `/assets/index-3f2a9c.js` in a Vite build, and why?',
      options: [
        'Both: Cache-Control: max-age=31536000',
        'index.html: no-cache · assets: max-age=31536000, immutable',
        'index.html: max-age=31536000 · assets: no-store',
        'Both: no-store, to be safe',
      ],
      correctOption: 1,
      answer: 'Hashed assets get a long `max-age` with `immutable`, because their content can never change at that URL — a new build produces new names. `index.html` gets `no-cache` (revalidate every time) because it\'s the entry point that references the current hashes; caching it would keep users on an old release.',
      explanation: 'Content hashing moves "freshness" from the asset URLs into index.html.',
      whyAsked: 'Caching mistakes cause the "users see the old version" class of production bugs.',
      mistakes: ['Thinking `no-cache` means "don\'t store" (that\'s `no-store`).', 'Using no-store for everything, wasting bandwidth.'],
      followUps: ['What breaks if old chunks are deleted while users still have old index.html?', 'Where do service workers fit in?'],
      modelAnswer: 'Assets with content hashes in their names can be cached for a year and marked immutable, because any change produces a new file name. index.html is the pointer to those names, so it should be no-cache — browsers may store it but must revalidate before using it. That way a deploy takes effect on the next load, while repeat visits still reuse unchanged assets.',
    },
    {
      id: 'production-readiness-coding-config',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Implement `resolveConfig(raw, mode)` in `config.js`. It merges a raw config object (e.g. from `/config.json`) over per-mode defaults and validates it.',
      starter: {
        files: {
          'config.js': `const DEFAULTS = {
  development: { apiUrl: 'http://localhost:3000', logLevel: 'debug', reportErrors: false },
  production: { logLevel: 'warn', reportErrors: true },
}

export function resolveConfig(raw = {}, mode = 'production') {
  return raw
}`,
          'App.vue': `<script setup>
import { resolveConfig } from './config.js'

const config = resolveConfig({ apiUrl: 'https://api.shop.example' }, 'production')
</script>

<template>
  <pre class="config">{{ config }}</pre>
</template>`,
        },
      },
      tests: [
        { name: 'merges raw values over mode defaults', code: `const { resolveConfig } = requireModule('config.js')\nconst c = resolveConfig({ apiUrl: 'https://api.shop.example', logLevel: 'error' }, 'production')\nexpect(c.apiUrl).toBe('https://api.shop.example')\nexpect(c.logLevel).toBe('error')\nexpect(c.reportErrors).toBe(true)` },
        { name: 'development works with no raw config', code: `const { resolveConfig } = requireModule('config.js')\nconst c = resolveConfig({}, 'development')\nexpect(c.apiUrl).toBe('http://localhost:3000')\nexpect(c.logLevel).toBe('debug')\nexpect(c.reportErrors).toBe(false)` },
        { name: 'production requires an apiUrl', code: `const { resolveConfig } = requireModule('config.js')\nexpect(() => resolveConfig({}, 'production')).toThrow()` },
        { name: 'production requires https', code: `const { resolveConfig } = requireModule('config.js')\nexpect(() => resolveConfig({ apiUrl: 'http://api.shop.example' }, 'production')).toThrow()` },
        { name: 'unknown modes are rejected', code: `const { resolveConfig } = requireModule('config.js')\nexpect(() => resolveConfig({ apiUrl: 'https://x.example' }, 'prod')).toThrow()` },
      ],
      hints: [
        'Look up `DEFAULTS[mode]` first and throw if it doesn\'t exist.',
        'Merge with spread: `{ ...DEFAULTS[mode], ...raw }` — later keys win.',
        'Validate after merging: in production, `apiUrl` must exist and start with `https://`; throw an `Error` with a helpful message otherwise.',
      ],
      answer: 'Look up the mode\'s defaults (throw for unknown modes), merge `raw` over them with object spread, then validate the result: in production `apiUrl` must be present and use https. Throwing early turns a misconfigured deploy into an obvious startup error instead of subtle bugs.',
      solution: {
        files: {
          'config.js': `const DEFAULTS = {
  development: { apiUrl: 'http://localhost:3000', logLevel: 'debug', reportErrors: false },
  production: { logLevel: 'warn', reportErrors: true },
}

export function resolveConfig(raw = {}, mode = 'production') {
  const defaults = DEFAULTS[mode]
  if (!defaults) throw new Error('Unknown mode: ' + mode)

  const config = { ...defaults, ...raw }

  if (mode === 'production') {
    if (!config.apiUrl) throw new Error('config.apiUrl is required in production')
    if (!config.apiUrl.startsWith('https://')) throw new Error('config.apiUrl must use https in production')
  }
  return config
}`,
          'App.vue': `<script setup>
import { resolveConfig } from './config.js'

const config = resolveConfig({ apiUrl: 'https://api.shop.example' }, 'production')
</script>

<template>
  <pre class="config">{{ config }}</pre>
</template>`,
        },
      },
      explanation: 'Defaults keep the raw config small; validation makes bad deploys fail loudly at startup. The same function serves build-time env (`resolveConfig(import.meta.env…)`) or runtime config (`resolveConfig(await fetchConfig())`).',
      whyAsked: 'Environment configuration bugs cause real outages; the task checks merging, validation and fail-fast thinking.',
      mistakes: ['Silently falling back to a localhost URL in production.', 'Mutating the shared defaults object.', 'No validation at all.'],
      followUps: ['Where would you call this — before or after mount?', 'How would you surface a config error to users?'],
      modelAnswer: 'I\'d look up defaults for the mode and throw on an unknown mode, then spread the raw config over a copy of those defaults so explicit values win without mutating shared objects. After merging I validate: in production the API URL must exist and use https. Failing fast at startup means a broken deploy is caught by a smoke test, not by users. I\'d call it before mounting and provide the result to the app.',
    },
  ],

  takeaways: [
    '`vite build` produces minified, tree-shaken, content-hashed files using Vue\'s production build; test them with `vite preview`.',
    'History-mode SPAs need a server fallback to `index.html`; cache hashed assets long, revalidate `index.html`.',
    'Set `app.config.errorHandler` before mounting, add window listeners for the rest, and report with release + context.',
    'Scrub personal data from logs and reports at the source; use levelled logs configured per environment.',
    'Keep environment differences in modes/env files or runtime config — never in hand-edited code, never with secrets.',
    'Per-route titles/meta help users and JS-capable crawlers; SEO-critical pages and social previews need content in the HTML (SSR/SSG).',
  ],
}
