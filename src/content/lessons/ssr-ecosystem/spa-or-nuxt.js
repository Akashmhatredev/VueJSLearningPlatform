// Lesson: Choosing a plain SPA or Nuxt (Level 17)

const recommendJs = `// A SIMPLIFIED decision helper. Real decisions also weigh team skills,
// budgets, existing systems and deadlines — use this to structure the talk.
export function recommend(answers) {
  const reasons = []
  const needsHtml = answers.seo || answers.socialPreviews || answers.slowFirstLoad

  if (!needsHtml && !answers.serverApi) {
    reasons.push('No SEO or first-load requirement: a client-rendered SPA is the simplest option.')
    if (answers.behindLogin) reasons.push('Behind a login, people come back often and their browser caches the app.')
    return { choice: 'spa', reasons }
  }

  if (needsHtml) reasons.push('Pages need their content in the first HTML response.')
  if (answers.serverApi) reasons.push('You want API routes and server-only secrets next to the frontend.')
  return { choice: 'nuxt-ssr', reasons }
}`

const appVue = `<script setup>
import { reactive, computed } from 'vue'
import { recommend } from './recommend.js'

const questions = [
  { key: 'seo', label: 'Pages must rank in search engines' },
  { key: 'socialPreviews', label: 'Links must show rich previews when shared' },
  { key: 'slowFirstLoad', label: 'First visits on slow phones must show content fast' },
  { key: 'behindLogin', label: 'Most of the app is behind a login' },
  { key: 'serverApi', label: 'We want API routes / server-only secrets in this project' },
  { key: 'staticHostingOnly', label: 'We can only host static files (no server runtime)' },
  { key: 'embedWidget', label: 'It\\'s a widget embedded in other people\\'s pages' },
]

const answers = reactive(Object.fromEntries(questions.map((q) => [q.key, false])))

const labels = {
  spa: 'Plain Vue SPA (Vite + Vue Router)',
  'nuxt-ssr': 'Nuxt with server-side rendering',
  'nuxt-static': 'Nuxt with static generation (or another SSG)',
  widget: 'Plain Vue widget / custom element',
}

const result = computed(() => recommend(answers))
</script>

<template>
  <h2>SPA or Nuxt?</h2>
  <label v-for="q in questions" :key="q.key" class="question">
    <input v-model="answers[q.key]" type="checkbox" :class="'q-' + q.key" />
    {{ q.label }}
  </label>

  <p class="choice">→ {{ labels[result.choice] }}</p>
</template>`

// ---------- exercise 1: per-route rendering plan
const rulesStarter = `// Turn page descriptions into a Nuxt-style routeRules object.
export function planRouteRules(pages) {
  return {}
}`

const rulesSolution = `export function planRouteRules(pages) {
  const rules = {}
  for (const page of pages) {
    if (!page.public) rules[page.path] = { ssr: false }             // app behind login
    else if (page.personalized) rules[page.path] = { ssr: true }    // per-request HTML
    else if (page.changesOften) rules[page.path] = { swr: 60 }      // SSR + short shared cache
    else rules[page.path] = { prerender: true }                     // build-time HTML
  }
  return rules
}`

const rulesApp = `<script setup>
import { planRouteRules } from './planRouteRules.js'

const pages = [
  { path: '/', public: true },
  { path: '/blog/**', public: true },
  { path: '/products/**', public: true, changesOften: true },
  { path: '/account/**', public: true, personalized: true },
  { path: '/dashboard/**', public: false },
]

const rules = planRouteRules(pages)
</script>

<template>
  <pre class="rules">routeRules: {{ JSON.stringify(rules, null, 2) }}</pre>
</template>`

// ---------- exercise 2: SSR hazard finder
const hazardsStarter = `// Find lines that use browser-only globals OUTSIDE an onMounted(...) call.
// Return [{ line, api }] with 1-based line numbers.
export function findSsrHazards(source) {
  return []
}`

const hazardsSolution = `const BROWSER_ONLY = /\\b(window|document|localStorage|sessionStorage|navigator)\\b/

export function findSsrHazards(source) {
  const hazards = []
  let depth = 0 // > 0 while we are inside onMounted( … )

  source.split('\\n').forEach((text, index) => {
    const trimmed = text.trim()
    if (trimmed.startsWith('//')) return

    const start = depth === 0 ? text.indexOf('onMounted(') : -1
    if (depth === 0 && start === -1) {
      const match = text.match(BROWSER_ONLY)
      if (match) hazards.push({ line: index + 1, api: match[1] })
      return
    }

    // Count parentheses from where onMounted( starts (or the whole line if we're inside).
    for (const ch of text.slice(start === -1 ? 0 : start)) {
      if (ch === '(') depth++
      else if (ch === ')') depth--
    }
  })
  return hazards
}`

const hazardsApp = `<script setup>
import { findSsrHazards } from './findSsrHazards.js'

const sample = \`import { ref, onMounted } from 'vue'
const width = ref(window.innerWidth)
onMounted(() => {
  width.value = window.innerWidth
})
const lang = navigator.language\`

const hazards = findSsrHazards(sample)
</script>

<template>
  <ul class="hazards">
    <li v-for="h in hazards" :key="h.line">line {{ h.line }}: {{ h.api }}</li>
  </ul>
</template>`

// ---------- interview coding: expand routes for prerendering
const expandStarter = `// List concrete URLs to prerender from route patterns and known param values.
export function expandRoutes(patterns, params) {
  return patterns
}`

const expandSolution = `export function expandRoutes(patterns, params) {
  const urls = []
  for (const pattern of patterns) {
    const names = [...pattern.matchAll(/:(\\w+)/g)].map((m) => m[1])
    if (!names.length) {
      urls.push(pattern)
      continue
    }
    // Simplified: one param per route.
    const values = params[names[0]] ?? []
    for (const value of values) urls.push(pattern.replace(':' + names[0], encodeURIComponent(value)))
  }
  return urls
}`

const expandApp = `<script setup>
import { expandRoutes } from './expandRoutes.js'

const urls = expandRoutes(['/', '/about', '/products/:id'], { id: [1, 2, 3] })
</script>

<template>
  <ul>
    <li v-for="u in urls" :key="u" class="url">{{ u }}</li>
  </ul>
</template>`

export default {
  id: 'spa-or-nuxt',
  title: 'Choosing a plain SPA or Nuxt',
  summary: 'Decide, with reasons you can defend, whether a project should be a client-rendered Vue SPA, a Nuxt app (SSR, static or hybrid), or something smaller.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['rendering-strategies', 'nuxt-intro'],
  related: ['hydration', 'production-readiness', 'project-structure', 'frontend-system-design', 'create-vue-project'],
  tags: ['architecture', 'spa', 'nuxt', 'ssr', 'ssg', 'seo', 'decision making', 'hybrid rendering', 'migration', 'vitepress'],
  apis: [
    { name: 'routeRules', summary: 'Nuxt config mapping URL patterns to rendering/caching behaviour (prerender, ssr: false, swr …).' },
    { name: 'ssr: false', summary: 'Nuxt option (global or per route) to render in the browser only, like an SPA.' },
    { name: 'nuxi generate', summary: 'Prerenders a Nuxt app to static files.' },
  ],
  docs: [
    { label: 'Vue Guide — Ways of using Vue', url: 'https://vuejs.org/guide/extras/ways-of-using-vue.html' },
    { label: 'Vue Guide — SSR: why SSR?', url: 'https://vuejs.org/guide/scaling-up/ssr.html#why-ssr' },
    { label: 'Vue Guide — SSR vs SSG', url: 'https://vuejs.org/guide/scaling-up/ssr.html#ssr-vs-ssg' },
    { label: 'Nuxt — Rendering modes', url: 'https://nuxt.com/docs/guide/concepts/rendering' },
    { label: 'VitePress (Vue-powered static site generator)', url: 'https://vitepress.dev/' },
  ],

  intro: `
You now know two ways to build a Vue app:

- a **plain SPA** — Vite + Vue (+ Vue Router, Pinia), rendered in the browser and hosted as static files;
- **Nuxt** — the same Vue, plus conventions and a server runtime, rendering on the server, at build time, or both.

Neither is "the professional choice". Each solves different problems at different costs. This lesson gives you a short list of questions that decide it in practice, a few middle-ground options, and the vocabulary to explain your choice to a team.
`,

  why: `
Wrong choices are expensive in both directions:

- A **marketing site or storefront built as a pure SPA** ships an empty HTML shell: weak link previews, slower first content on mobile, and SEO that depends on crawlers executing JavaScript. Fixing it later means a migration.
- An **internal dashboard built with SSR** pays for servers, universal-code rules, hydration bugs and slower deploys — for users who log in daily, have the app cached, and never arrive from Google.

Most real products are **mixed**: public pages that must be found, plus an app behind a login. Recognising that early lets you pick a hybrid setup instead of forcing one strategy on everything.
`,

  eli15: `
Choosing between a plain SPA and Nuxt is like choosing between a **food truck** and a **restaurant**.

A **food truck** (SPA) is simple and cheap: park it anywhere (static hosting), cook when customers order (render in the browser). Regulars who already know the menu love it. But passers-by can't see the food until they walk up and order — like search engines and link previews looking at an empty page.

A **restaurant** (Nuxt with SSR) has a window display with real dishes (HTML with content), a kitchen (server) and staff. Great for attracting new customers walking by — but you pay rent and staff, and running it is more work.

And some places do both: a nice shop window for the street (prerendered public pages), with a members-only lounge in the back (an SPA section behind login). That's **hybrid rendering**.
`,

  analogy: {
    title: 'Food truck, restaurant, or both',
    body: `
Ask who your customers are (regulars vs passers-by), what they need to see before they come in (content in the HTML), and what you can afford to run (static hosting vs a server). The answers pick the format.
`,
    mapping: [
      ['food truck', 'plain Vue SPA on static hosting'],
      ['regular customers', 'logged-in users with the app cached'],
      ['passers-by looking through the window', 'search crawlers, link-preview bots, first-time mobile visitors'],
      ['restaurant window display', 'server-rendered or prerendered HTML'],
      ['rent and staff', 'server runtime, operations, universal-code rules'],
      ['shop window + members-only lounge', 'hybrid: prerendered public pages, SPA behind login'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'A decision path',
    caption: 'Four questions settle most cases. Walk through them with your own project in mind.',
    alt: 'A decision diagram. First question: is it a widget embedded in other pages? Yes leads to a plain Vue widget. No leads to: does content need to be in the first HTML response (SEO, previews, slow devices)? No leads to a plain SPA. Yes leads to: is the content the same for everyone and does it change rarely? Yes leads to static generation; no leads to server-side rendering with Nuxt. A side note marks hybrid rendering when a product has both kinds of pages.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'widget', label: 'Embedded widget?', tone: 'paper', x: 100, y: 70 },
        { id: 'plainwidget', label: 'Plain Vue widget', note: 'or a custom element', tone: 'kraft', x: 100, y: 250 },
        { id: 'html', label: 'Content needed in the first HTML?', note: 'SEO · previews · slow devices', tone: 'paper', x: 330, y: 70 },
        { id: 'spa', label: 'Plain SPA', note: 'Vite + Vue Router', tone: 'acid', x: 330, y: 250 },
        { id: 'stable', label: 'Same for everyone, changes rarely?', tone: 'paper', x: 570, y: 70 },
        { id: 'ssg', label: 'Static generation', note: 'Nuxt generate / VitePress', tone: 'acid', x: 500, y: 250 },
        { id: 'ssr', label: 'Nuxt with SSR', note: 'hybrid per route', tone: 'cobalt', x: 680, y: 250 },
      ],
      edges: [
        { from: 'widget', to: 'plainwidget', label: 'yes' },
        { from: 'widget', to: 'html', label: 'no' },
        { from: 'html', to: 'spa', label: 'no' },
        { from: 'html', to: 'stable', label: 'yes' },
        { from: 'stable', to: 'ssg', label: 'yes' },
        { from: 'stable', to: 'ssr', label: 'no' },
      ],
      steps: [
        { focus: ['widget'], text: 'Is this a **widget inside someone else\'s page** (a chat bubble, a booking form on a partner site)? Then you don\'t own the page or routing — ship a small Vue bundle, or a custom element made with `defineCustomElement`.' },
        { focus: ['widget', 'plainwidget'], edges: ['widget->plainwidget'], text: 'Widgets want a small footprint and no assumptions about the host page. Neither a full SPA router nor a Nuxt server fits.' },
        { focus: ['html'], edges: ['widget->html'], text: 'Otherwise: must the **first HTML response contain the content**? That\'s the case for SEO-critical pages, rich social previews, and content-first pages visited on slow devices.' },
        { focus: ['spa'], edges: ['html->spa'], text: 'If not — dashboards, internal tools, editors, most apps behind a login — a **plain SPA** is the simplest, cheapest option: static hosting, no universal-code rules, no hydration.' },
        { focus: ['stable', 'ssg'], edges: ['html->stable', 'stable->ssg'], text: 'If yes, and the content is **the same for everyone and changes rarely** (docs, blog, marketing): **prerender** it. Nuxt can generate static files; for documentation, VitePress is a Vue-powered static site generator.' },
        { focus: ['ssr'], edges: ['stable->ssr'], text: 'If content is personalised or changes constantly (search, catalogue, news): **SSR with Nuxt**, with caching where possible. Mixed products use **hybrid rendering** — different strategies per route in one Nuxt app.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'The same product page, two stacks',
    caption: 'Same component logic. The difference is who fetches the data, when, and what the first HTML contains.',
    alt: 'Side by side code. Left: a Vue SPA product page that fetches the product in onMounted and shows a loading state; the server only sends an empty shell. Right: a Nuxt page that awaits useFetch, so the server renders the product into the HTML and the browser reuses the data during hydration.',
    props: {
      left: {
        label: 'Plain SPA page',
        lang: 'vue',
        code: `<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const product = ref(null)

onMounted(async () => {
  const res = await fetch('/api/products/' + route.params.id)
  product.value = await res.json()
})
</script>

<template>
  <p v-if="!product">Loading…</p>
  <h1 v-else>{{ product.name }}</h1>
</template>`,
      },
      right: {
        label: 'Nuxt page (static example)',
        lang: 'vue',
        code: `<script setup>
const route = useRoute()
const { data: product } = await useFetch(
  \`/api/products/\${route.params.id}\`,
)
</script>

<template>
  <h1>{{ product.name }}</h1>
</template>

<!-- First HTML response already contains the <h1>.
     The browser reuses the fetched data while hydrating. -->`,
      },
      points: [
        'SPA: the first HTML is a shell; the user sees "Loading…" until JS runs and the request finishes.',
        'Nuxt: the server fetches and renders, so content, title and preview tags can be in the first response.',
        'SPA: deploy anywhere static. Nuxt SSR: you run a server or serverless runtime (or prerender).',
        'Both use the same Vue knowledge — moving between them is mostly about data fetching and browser-only code.',
      ],
    },
  },

  syntax: [
    `
#### The questions that decide it

| Question | Points to a plain SPA | Points to Nuxt |
|---|---|---|
| Must pages rank in search / show rich link previews? | no | yes |
| Do first-time visitors on slow devices need content fast? | rarely (returning users) | often (content-first pages) |
| Is most of it behind a login? | yes | partly or no |
| Can you run a server or serverless runtime? | not needed | needed for SSR (not for static generation) |
| Do you want API routes / server-only secrets in the same project? | separate backend | \`server/api\` + private runtime config |
| Do you value strong conventions across a team? | you choose the structure | conventions included |
| Is it a widget embedded in other sites? | plain Vue / custom element | no |

#### Middle grounds

- **Nuxt in SPA mode** (\`ssr: false\`): Nuxt's conventions and tooling, static hosting, no server rendering.
- **Hybrid Nuxt** with \`routeRules\`: prerender public pages, SSR dynamic ones, \`ssr: false\` behind login.
- **Two projects**: a static or Nuxt marketing site plus a Vue SPA for the app, linked by URL (\`example.com\` vs \`app.example.com\`).
- **Docs with VitePress**, a Vue-powered static site generator.
- **Vue inside server-rendered pages** of an existing backend (Laravel, Django, Rails…): mount small Vue apps or custom elements where interactivity is needed.
`,
    {
      code: `// nuxt.config.ts — one product, three strategies (static example)
export default defineNuxtConfig({
  routeRules: {
    '/': { prerender: true },            // marketing: built once
    '/blog/**': { prerender: true },
    '/products/**': { swr: 60 },         // SSR, cached briefly (host support varies)
    '/dashboard/**': { ssr: false },     // app behind login: client-rendered
  },
})`,
      lang: 'ts',
      title: 'hybrid rendering (static example)',
      static: true,
    },
    {
      callout: 'tip',
      title: 'Write the decision down',
      text: 'Record the requirements that drove the choice (SEO? login? hosting?) in an architecture decision record. When requirements change — marketing pages added to a dashboard product — you\'ll know exactly which assumption broke.',
    },
  ],

  walkthrough: {
    title: 'recommend.js',
    lang: 'js',
    code: recommendJs,
    intro: 'The playground\'s decision helper encodes the first two questions. You\'ll extend it with the others.',
    steps: [
      { lines: [1, 2], text: 'Labelled simplified: real decisions include people, budgets and existing systems. A helper like this structures the conversation; it doesn\'t replace it.' },
      { lines: [5], text: 'The key question: does any requirement need content in the first HTML response — SEO, social previews, or fast first content on slow devices?' },
      { lines: [7, 11], text: 'No HTML requirement and no need for server routes → a plain SPA. Being behind a login strengthens the case: returning users have the app cached.' },
      { lines: [13, 15], text: 'Otherwise recommend Nuxt with SSR, explaining why. Missing so far: widgets, static-only hosting — your experiments.' },
    ],
  },

  playground: {
    title: 'SPA or Nuxt? A decision helper',
    objective: 'Tick requirements and watch the recommendation change, then teach the helper about widgets, static hosting and explaining its reasons.',
    files: { 'App.vue': appVue, 'recommend.js': recommendJs },
    expected: 'A list of requirements. With nothing ticked the helper recommends a plain SPA. Tick **Pages must rank in search engines** and it switches to Nuxt with SSR.',
    experiments: [
      {
        id: 'widget-rule',
        task: 'An embedded widget never needs a router or a server — even if the host page cares about SEO. In `recommend.js`, return `{ choice: \'widget\', reasons: [...] }` first when `answers.embedWidget` is true.',
        hint: 'At the top of `recommend()`: `if (answers.embedWidget) return { choice: \'widget\', reasons: [\'Embedded in other pages: ship a small Vue bundle or a custom element.\'] }`.',
        tests: [
          {
            name: 'widgets win over every other answer',
            code: `const { recommend } = requireModule('recommend.js')
expect(recommend({ embedWidget: true, seo: true, serverApi: true }).choice).toBe('widget')
expect(recommend({ embedWidget: false }).choice).toBe('spa')`,
          },
        ],
        explain: 'Order matters in decision rules: a constraint that makes the other questions irrelevant goes first. Vue\'s `defineCustomElement` can turn a component into a custom element any page can use.',
      },
      {
        id: 'static-rule',
        task: 'If pages need content in the HTML but you can **only host static files** (and don\'t need server routes), recommend `\'nuxt-static\'` — prerendering at build time.',
        hint: 'Before the final `return`: `if (answers.staticHostingOnly && !answers.serverApi) return { choice: \'nuxt-static\', reasons }` (push a reason first).',
        tests: [
          {
            name: 'static-only hosting with SEO needs → static generation',
            code: `const { recommend } = requireModule('recommend.js')
expect(recommend({ seo: true, staticHostingOnly: true }).choice).toBe('nuxt-static')
expect(recommend({ seo: true }).choice).toBe('nuxt-ssr')
expect(recommend({ seo: true, staticHostingOnly: true, serverApi: true }).choice).toBe('nuxt-ssr')`,
          },
        ],
        explain: 'SEO doesn\'t automatically mean "run a server": prerendered HTML on static hosting covers content that is the same for everyone. Server routes, however, need a server or serverless runtime.',
      },
      {
        id: 'show-reasons',
        task: 'A recommendation without reasons isn\'t convincing. In `App.vue`, list `result.reasons` below the choice, each in an `<li class="reason">`.',
        hint: '`<ul><li v-for="r in result.reasons" :key="r" class="reason">{{ r }}</li></ul>`',
        tests: [
          {
            name: 'reasons are listed',
            code: `expect(findAll('.reason').length).toBeGreaterThan(0)
await check('.q-seo', true)
expect(text('.choice')).toContain('Nuxt')
expect(findAll('.reason').some((li) => /HTML/.test(li.textContent))).toBe(true)`,
          },
        ],
        explain: 'In real projects the reasons matter more than the label. "We chose an SPA because everything is behind a login and we deploy to static hosting" is something a team can revisit when requirements change.',
      },
      {
        id: 'mixed-product',
        task: 'Tick **Pages must rank in search engines** *and* **Most of the app is behind a login**. The helper says Nuxt — but is one answer right for the whole product?',
        hint: 'Think of `example.com` (marketing) and `app.example.com` (dashboard), or `routeRules` in one Nuxt app.',
        explain: 'Mixed products rarely need one strategy everywhere. Options: hybrid rendering in Nuxt (prerender public routes, `ssr: false` for the dashboard), or two projects — a static/Nuxt marketing site and a Vue SPA for the app.',
      },
    ],
  },

  internals: {
    beginner: `
Both options run the same Vue components. The difference is **where the first HTML is produced** and **what you have to operate**. An SPA is a folder of files any web host can serve. A server-rendered Nuxt app is a program that has to run somewhere and answer every request. Static generation sits in between: Nuxt runs at build time and you deploy files again.
`,
    technical: [
      `
**What you pay for SSR:** a runtime (Node, serverless or edge) with monitoring and scaling; per-request rendering latency before the first byte; universal code (no browser APIs during setup, per-request state, SSR-compatible libraries); hydration cost and mismatch bugs; and caching rules that distinguish personalised from public responses.

**What you pay for an SPA:** an empty first response (blank screen until JS runs, weaker previews, SEO dependent on JS rendering), all rendering work on the user's device, and secrets/API logic that must live in a separate backend.

**What you pay for static generation:** build time that grows with the number of pages, and staleness between builds — mitigated with rebuild hooks, or hybrid rules where the host supports regeneration.
`,
      {
        code: `// Moving an SPA page to Nuxt usually touches three things (simplified)
// 1. routing:    router.js entry          → pages/products/[id].vue
// 2. data:       onMounted(fetch …)       → await useFetch(…)
// 3. browser-only code in setup           → onMounted / <ClientOnly> / import.meta.client`,
        lang: 'js',
        title: 'what a migration changes',
      },
      `
**Migration is realistic** because components, composables, Pinia stores and most Vue Router concepts carry over. The work concentrates on route files, data fetching (to avoid double fetching and mismatches) and auditing code that touches \`window\`, \`document\` or storage during setup — exactly what this lesson's second exercise automates.
`,
    ],
    production: `
- **Start from requirements, not fashion**: list SEO/preview needs, the share of logged-in traffic, hosting constraints and team experience; decide; write it down.
- **Prefer the simplest thing that meets the requirements.** A plain SPA is a perfectly professional choice for apps behind a login.
- **For mixed products, separate concerns**: hybrid route rules in Nuxt, or a marketing site and an app on different subdomains — each can evolve on its own schedule.
- **Measure before and after any change** of rendering strategy (Largest Contentful Paint, Interaction to Next Paint, server costs, error rates).
- **Revisit when requirements change.** A dashboard that grows public, shareable report pages may need SSR/SSG for those routes only.
`,
  },

  mistakes: [
    {
      title: 'Choosing Nuxt because "SSR is faster"',
      wrong: { code: `// Internal admin tool, 100% behind SSO, no SEO\n// → Nuxt SSR on a fleet of Node servers "for performance"`, lang: 'js' },
      right: { code: `// Internal admin tool → Vite SPA on static hosting\n// (or Nuxt with ssr: false if the team wants Nuxt conventions)`, lang: 'js' },
      explanation: 'SSR helps when content must be in the first HTML. Behind a login, users return with cached assets and crawlers don\'t matter — SSR adds cost without the benefit.',
    },
    {
      title: 'Building a public storefront as a pure SPA',
      wrong: { code: `<!-- every product URL returns -->\n<div id="app"></div>`, lang: 'html' },
      right: { code: `// SSR or prerender product and category pages (e.g. Nuxt routeRules),\n// keep the account area client-rendered if you like`, lang: 'js' },
      explanation: 'Product pages live on search traffic and shared links. Shipping an empty shell makes previews generic and SEO dependent on JavaScript rendering.',
    },
    {
      title: 'One strategy for a mixed product',
      wrong: { code: `// Whole SaaS (landing pages + dashboard) as SSR, or whole thing as SPA`, lang: 'js' },
      right: { code: `routeRules: {\n  '/': { prerender: true },\n  '/pricing': { prerender: true },\n  '/app/**': { ssr: false },\n}`, lang: 'ts' },
      explanation: 'Public pages and the logged-in app have opposite needs. Hybrid rendering (or two projects) gives each what it needs.',
    },
    {
      title: 'Choosing static generation for per-user or fast-changing pages',
      wrong: { code: `// Prerender /account and /cart at build time`, lang: 'js' },
      right: { code: `// /account, /cart → SSR or client-rendered\n// /blog, /docs     → prerendered`, lang: 'js' },
      explanation: 'Static files are the same for everyone and only as fresh as the last build. Per-user pages need SSR or client rendering.',
    },
  ],

  debugging: [
    {
      symptom: 'After launching the SPA, shared links show the generic site title and no image.',
      cause: 'Link-preview bots read the raw HTML, which is the SPA shell.',
      fix: 'Prerender or server-render the shareable pages (Nuxt routeRules, a separate static marketing site), or at least prerender the few routes that are shared most.',
    },
    {
      symptom: 'The Nuxt dashboard is slow to deploy and has hydration warnings everywhere, but nobody needs SEO for it.',
      cause: 'SSR applied to an app area that doesn\'t benefit from it.',
      fix: 'Set `ssr: false` for those routes with `routeRules`, or move the dashboard to a separate SPA.',
    },
    {
      symptom: 'Migrating an SPA to Nuxt: `window is not defined` errors in many components.',
      cause: 'SPA code freely uses browser APIs during setup because it never ran on a server.',
      fix: 'Audit for browser globals outside `onMounted` (see the exercise), move them into `onMounted`, guard with `import.meta.client`, or wrap widgets in `<ClientOnly>`.',
    },
    {
      symptom: 'A static-generated site with 50,000 product pages takes very long to build.',
      cause: 'Every page is rendered at build time.',
      fix: 'Prerender only the most important pages and SSR the long tail with caching, or use regeneration features your host supports.',
    },
  ],

  bestPractices: [
    'Decide from requirements: SEO/previews, first-load needs, logged-in share, hosting, team skills.',
    'Default to a plain SPA for apps behind a login; default to SSR/SSG for public, content-first pages.',
    'Use hybrid rendering or separate projects for mixed products.',
    'Consider Nuxt\'s SPA mode if you want its conventions without a server.',
    'Record the decision and its assumptions; revisit when requirements change.',
    'Measure real-user performance and server cost before and after changing strategy.',
  ],

  useCases: [
    'Internal tools, admin panels, editors → plain SPA.',
    'Docs and blogs → static generation (Nuxt generate, VitePress).',
    'Storefronts, marketplaces, news → Nuxt with SSR (and caching).',
    'SaaS with a marketing site → hybrid Nuxt, or static marketing site + SPA app.',
    'Widgets on partner sites → small Vue bundle or custom element.',
    'Existing server-rendered backend → Vue islands or an SPA consuming its API.',
  ],

  whenToUse: {
    use: [
      'A plain SPA when the app lives behind a login, needs no SEO, and static hosting is preferred.',
      'Nuxt when public pages need content in the first HTML, or you want API routes and server secrets in the same project.',
      'Hybrid rendering when one product has both kinds of pages.',
    ],
    avoid: [
      'SSR "because it\'s modern" for apps that don\'t need content in the HTML.',
      'A pure SPA for SEO-critical or share-heavy public pages.',
      'Static generation for personalised or constantly changing pages.',
    ],
  },

  comparison: {
    title: 'Plain SPA vs Nuxt (SSR) vs Nuxt (static)',
    headers: ['', 'Plain SPA', 'Nuxt — SSR / hybrid', 'Nuxt — static generation'],
    rows: [
      ['First HTML contains content', 'no', 'yes', 'yes'],
      ['Hosting', 'static files', 'server / serverless / edge', 'static files'],
      ['Personalised pages', 'yes (client-side)', 'yes (server-side)', 'only client-side parts'],
      ['Server-only secrets / API routes', 'separate backend', 'yes (`server/`, runtime config)', 'only at build time'],
      ['Universal-code rules & hydration', 'not needed', 'needed', 'needed'],
      ['Best for', 'apps behind login, tools', 'storefronts, dynamic public pages, mixed products', 'docs, blogs, marketing'],
    ],
    note: 'That wraps up the SSR level. The optional TypeScript track starts with [why TypeScript](lesson:why-typescript).',
  },

  quiz: [
    {
      id: 'spa-or-nuxt-q1',
      type: 'mcq',
      prompt: 'An internal inventory tool for 40 warehouse staff, behind company SSO, deployed to a static file host. Best fit?',
      options: [
        { text: 'Nuxt with SSR', why: 'No SEO, no previews, logged-in daily users with cached assets — SSR adds a server and complexity for no benefit.' },
        { text: 'A plain Vue SPA' },
        { text: 'Static generation of every page', why: 'Inventory data is live and per-user; prerendered pages would be stale.' },
        { text: 'A custom element', why: 'It\'s a full application with routes, not a widget embedded in someone else\'s page.' },
      ],
      answer: 1,
      explanation: 'Behind a login, no SEO, static hosting: the SPA is the simplest option that meets every requirement.',
    },
    {
      id: 'spa-or-nuxt-q2',
      type: 'mcq',
      prompt: 'Which requirements point towards Nuxt (SSR or static generation)? (Select all that apply.)',
      options: [
        { text: 'Product pages must show rich previews when shared on social media' },
        { text: 'Blog posts must rank well in search engines' },
        { text: 'All pages are behind a login', why: 'That points towards an SPA — crawlers and preview bots can\'t see logged-in pages anyway.' },
        { text: 'You want server routes that keep an API key secret' },
        { text: 'It must run inside a mobile app\'s webview from bundled files', why: 'Bundled, offline files fit a client-rendered SPA.' },
      ],
      answer: [0, 1, 3],
      explanation: 'Content in the first HTML (previews, SEO) and server-side capabilities (API routes, secrets) are Nuxt\'s strengths.',
    },
    {
      id: 'spa-or-nuxt-q3',
      type: 'output',
      prompt: 'With the playground\'s original `recommend()` (before your experiments), what does this return?',
      code: { lang: 'js', code: `recommend({ behindLogin: true, slowFirstLoad: false, seo: false, serverApi: false }).choice` },
      options: [
        { text: '`\'spa\'`' },
        { text: '`\'nuxt-ssr\'`', why: 'None of the HTML-related answers or serverApi is true, so the first branch returns early.' },
        { text: '`\'nuxt-static\'`', why: 'The original helper doesn\'t know that option yet — and it wouldn\'t apply here anyway.' },
        { text: '`undefined`', why: 'Every path returns an object with a choice.' },
      ],
      answer: 0,
      explanation: '`needsHtml` is false and `serverApi` is false → `{ choice: \'spa\', reasons: [...] }` with an extra reason about the login.',
    },
    {
      id: 'spa-or-nuxt-q4',
      type: 'fill',
      prompt: 'Complete the hybrid config: prerender the landing page, client-render the dashboard.',
      code: {
        lang: 'ts',
        code: `export default defineNuxtConfig({
  routeRules: {
    '/': { ___: true },
    '/dashboard/**': { ssr: ___ },
  },
})`,
      },
      answer: [['prerender'], ['false']],
      explanation: '`prerender: true` renders the route at build time; `ssr: false` makes that section client-rendered like an SPA.',
    },
    {
      id: 'spa-or-nuxt-q5',
      type: 'bug',
      prompt: 'This plan for a news site has one choice that will clearly cause problems. Click the line.',
      code: {
        lang: 'ts',
        code: `routeRules: {
  '/': { swr: 60 },
  '/about': { prerender: true },
  '/articles/**': { swr: 60 },
  '/my-account/**': { prerender: true },
  '/admin/**': { ssr: false },
}`,
      },
      answerLine: 5,
      explanation: 'Account pages are personalised; prerendering bakes one version at build time for everyone. Use SSR without shared caching, or client rendering, for `/my-account/**`.',
    },
    {
      id: 'spa-or-nuxt-q6',
      type: 'mcq',
      prompt: 'Your team loves Nuxt\'s conventions, but the product is a dashboard behind login and you must deploy to static hosting. What\'s a sensible option?',
      options: [
        { text: 'Nuxt with `ssr: false` (SPA mode)' },
        { text: 'Nuxt with SSR on static hosting', why: 'Static hosting can\'t run the server needed for SSR.' },
        { text: 'You can\'t use Nuxt at all', why: 'Nuxt can build a client-rendered app that is served as static files.' },
        { text: 'Prerender every dashboard page at build time', why: 'Dashboard data is live and per-user; prerendered pages would be stale or empty.' },
      ],
      answer: 0,
      explanation: 'SPA mode keeps Nuxt\'s conventions (pages, layouts, auto-imports) while producing a client-rendered app for static hosting.',
    },
    {
      id: 'spa-or-nuxt-q7',
      type: 'short',
      prompt: 'Your manager asks: "Why didn\'t we use Nuxt? Isn\'t it better?" for an SPA-based internal tool. Answer in two or three sentences.',
      answer: 'Nuxt\'s main advantages are content in the first HTML (SEO, previews, faster first content) and server features like API routes. Our tool is behind a login, has no SEO needs, and users return daily with the app cached, so SSR would add servers, hydration complexity and cost without benefit. A plain SPA on static hosting meets every requirement more simply — and we can revisit if public pages appear.',
    },
  ],

  exercises: [
    {
      id: 'plan-route-rules',
      title: 'Plan rendering per route',
      difficulty: 'intermediate',
      prompt: `
Write \`planRouteRules(pages)\` in \`planRouteRules.js\`. Each page is \`{ path, public?, personalized?, changesOften? }\`. Return a Nuxt-style \`routeRules\` object keyed by \`path\`, applying the **first** matching rule:

1. not \`public\` (behind login) → \`{ ssr: false }\`
2. \`personalized\` → \`{ ssr: true }\` (rendered per request, no shared cache)
3. \`changesOften\` → \`{ swr: 60 }\` (server-rendered, cached briefly)
4. otherwise → \`{ prerender: true }\`

\`App.vue\` prints the result in \`<pre class="rules">\`. (The option names mirror Nuxt's \`routeRules\`; the cache duration is illustrative.)
`,
      files: { 'App.vue': rulesApp, 'planRouteRules.js': rulesStarter },
      hints: [
        'Loop over the pages and build an object: `rules[page.path] = …`.',
        'Use an `if / else if` chain in exactly the listed order, so the first matching rule wins.',
        'A page without `public: true` counts as behind login.',
      ],
      solution: {
        explanation: 'Each rule encodes one idea from this level: no SEO needs → client rendering; per-user HTML → SSR without shared caching; fresh but shared → SSR with a short cache; same for everyone and stable → build-time HTML. Order matters: privacy (login, personalisation) beats freshness, which beats static.',
        files: { 'App.vue': rulesApp, 'planRouteRules.js': rulesSolution },
      },
      tests: [
        {
          name: 'stable public pages are prerendered',
          code: `const { planRouteRules } = requireModule('planRouteRules.js')
const rules = planRouteRules([{ path: '/', public: true }, { path: '/blog/**', public: true }])
expect(rules['/'].prerender).toBe(true)
expect(rules['/blog/**'].prerender).toBe(true)`,
        },
        {
          name: 'pages behind login are client-rendered',
          code: `const { planRouteRules } = requireModule('planRouteRules.js')
const rules = planRouteRules([{ path: '/app/**', public: false, personalized: true }, { path: '/settings' }])
expect(rules['/app/**'].ssr).toBe(false)
expect(rules['/settings'].ssr).toBe(false)`,
        },
        {
          name: 'personalised public pages are SSR without caching',
          code: `const { planRouteRules } = requireModule('planRouteRules.js')
const r = planRouteRules([{ path: '/account/**', public: true, personalized: true, changesOften: true }])['/account/**']
expect(r.ssr).toBe(true)
expect(r.swr).toBeUndefined()`,
        },
        {
          name: 'fast-changing shared pages get a short cache',
          code: `const { planRouteRules } = requireModule('planRouteRules.js')
const r = planRouteRules([{ path: '/products/**', public: true, changesOften: true }])['/products/**']
expect(r.swr).toBe(60)
expect(r.prerender).toBeUndefined()`,
        },
        { name: 'the page prints the plan', code: `expect(text('.rules')).toContain('"/dashboard/**"')\nexpect(text('.rules')).toContain('"ssr": false')` },
      ],
    },
    {
      id: 'ssr-hazard-finder',
      title: 'Find SSR hazards before migrating',
      difficulty: 'advanced',
      prompt: `
Before moving an SPA to Nuxt, you want to find code that would crash during server rendering. Write a **simplified** static checker \`findSsrHazards(source)\` in \`findSsrHazards.js\`:

- Return an array of \`{ line, api }\` (1-based line numbers) for lines that use \`window\`, \`document\`, \`localStorage\`, \`sessionStorage\` or \`navigator\` as a whole word — the first one on that line is enough.
- Ignore lines **inside** an \`onMounted(\` … \`)\` call (which never runs on the server). The call may span many lines: track parentheses from \`onMounted(\` until they balance.
- Ignore comment lines that start with \`//\` (after trimming).

\`App.vue\` lists the hazards of a sample in \`<ul class="hazards">\`.
`,
      files: { 'App.vue': hazardsApp, 'findSsrHazards.js': hazardsStarter },
      hints: [
        'Split into lines and keep a `depth` counter: while it\'s above 0 you are inside `onMounted(…)`.',
        'When `depth === 0` and a line contains `onMounted(`, start counting `(` and `)` from that index; otherwise test the line with `/\\b(window|document|localStorage|sessionStorage|navigator)\\b/`.',
        'While `depth > 0`, keep counting parentheses on each line until `depth` returns to 0. Skip `//` comment lines before anything else.',
      ],
      solution: {
        explanation: 'This is a deliberately simple checker (it doesn\'t understand strings, block comments or other client-only hooks), but it captures the migration rule: browser globals are fine inside `onMounted`, and a hazard anywhere else. Real projects rely on the framework\'s errors, linting and tests — and fix hazards with `onMounted`, `import.meta.client` or `<ClientOnly>`.',
        files: { 'App.vue': hazardsApp, 'findSsrHazards.js': hazardsSolution },
      },
      tests: [
        {
          name: 'finds browser globals at the top level of setup',
          code: `const { findSsrHazards } = requireModule('findSsrHazards.js')
const src = "const w = ref(window.innerWidth)\\nconst saved = localStorage.getItem('x')"
const h = findSsrHazards(src)
expect(h.map((x) => x.line)).toEqual([1, 2])
expect(h.map((x) => x.api)).toEqual(['window', 'localStorage'])`,
        },
        {
          name: 'ignores code inside a multi-line onMounted',
          code: `const { findSsrHazards } = requireModule('findSsrHazards.js')
const src = "onMounted(() => {\\n  width.value = window.innerWidth\\n  document.title = 'Hi'\\n})\\nconst lang = navigator.language"
expect(findSsrHazards(src)).toEqual([{ line: 5, api: 'navigator' }])`,
        },
        {
          name: 'handles nested parentheses inside onMounted',
          code: `const { findSsrHazards } = requireModule('findSsrHazards.js')
const src = "onMounted(() => {\\n  setTimeout(() => console.log(window.scrollY), 10)\\n})\\nsessionStorage.clear()"
expect(findSsrHazards(src)).toEqual([{ line: 4, api: 'sessionStorage' }])`,
        },
        {
          name: 'ignores comments and partial words',
          code: `const { findSsrHazards } = requireModule('findSsrHazards.js')
const src = "// window is fine in comments\\nconst windowSize = 3\\nconst documents = []"
expect(findSsrHazards(src)).toEqual([])`,
        },
        { name: 'the sample shows two hazards', code: `expect(findAll('.hazards li').map((li) => li.textContent.trim())).toEqual(['line 2: window', 'line 6: navigator'])` },
      ],
    },
  ],

  interview: [
    {
      id: 'spa-or-nuxt-when-nuxt',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'When would you choose Nuxt instead of a plain Vue SPA?',
      answer: 'When pages need content in the first HTML response — SEO-critical or share-heavy public pages, or content-first pages that must show quickly on slow devices — via SSR or static generation. Also when you want server capabilities in the same project (API routes, server-only secrets via runtime config), hybrid rendering per route, or Nuxt\'s conventions for a larger team. For apps behind a login with no SEO needs and static hosting, a plain SPA is usually simpler.',
      explanation: 'The deciding question is whether the first HTML response must contain the content; then hosting, server needs and team conventions.',
      whyAsked: 'A classic architecture question; interviewers want reasons, not brand preference.',
      mistakes: ['"Nuxt is always better/faster."', 'Ignoring hosting and operational cost.', 'Not mentioning that SPAs are fine behind a login.'],
      followUps: ['What would you choose for a SaaS with a marketing site?', 'What does Nuxt\'s SPA mode give you?'],
      modelAnswer: 'I choose Nuxt when pages need their content in the first HTML — search-driven or frequently shared public pages, or content-first pages that must load fast on slow phones — because it gives me SSR or static generation, plus hybrid rules per route. It also helps when I want API routes and server-only secrets in the same project, or strong conventions for a bigger team. For an app behind a login with no SEO needs, a plain Vite SPA on static hosting is simpler and cheaper, so that\'s my default there.',
    },
    {
      id: 'spa-or-nuxt-dashboard-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 3,
      question: 'A startup is building an analytics dashboard (behind login) and a public landing page with pricing and a blog. They ask you to "pick SPA or Nuxt". What do you recommend?',
      answer: 'It\'s two kinds of pages with opposite needs. Either one Nuxt app with hybrid `routeRules` — prerender landing, pricing and blog; `ssr: false` for the dashboard — or two projects: a static/Nuxt (or VitePress) marketing site on the root domain and a Vite SPA dashboard on `app.` subdomain. One Nuxt app shares components and deploys once; two projects decouple release cycles and keep the dashboard purely static-hosted. Decide by team size, shared components and hosting.',
      explanation: 'The right answer is often "both, per route".',
      whyAsked: 'Tests whether candidates recognise mixed requirements.',
      mistakes: ['Forcing one strategy on everything.', 'Ignoring deployment and team structure.'],
      followUps: ['How would authentication work across the two?', 'Which pages would you cache?'],
      modelAnswer: 'I\'d point out that the product has two halves with opposite needs: the landing page, pricing and blog need content in the HTML for SEO and previews, while the dashboard is behind login and doesn\'t. So I\'d either use one Nuxt app with route rules — prerender the marketing pages, client-render the dashboard — or split into a static marketing site and a Vite SPA on an app subdomain. One project shares components and deployment; two projects decouple releases. I\'d pick based on team size and how much UI they share.',
    },
    {
      id: 'spa-or-nuxt-migration',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'An established Vue SPA needs SEO for its new public product pages. How would you approach introducing SSR/SSG without rewriting everything?',
      answer: 'Options: (1) Migrate to Nuxt incrementally: move the app into Nuxt with `ssr: false` for existing routes (keeping SPA behaviour), then enable SSR/prerender for the public product routes via `routeRules`; adapt those pages\' data fetching to `useFetch` and fix browser-only code. (2) Split: build the public pages as a separate Nuxt/static site sharing a component library, linking into the SPA. (3) Lightweight: prerender a limited set of routes at build time if they\'re static. Plan for: route conversion, data fetching (payload, no double-fetch), auditing `window`/`document` usage in setup, SSR-compatible libraries, per-request state (Pinia), hydration testing, and a server/serverless runtime if SSR is used.',
      explanation: 'Because components carry over, migration is mostly about routing, data and universal code — and can be done route by route.',
      whyAsked: 'Senior candidates are expected to plan migrations with risk management.',
      mistakes: ['Proposing a big-bang rewrite.', 'Ignoring browser-only code and library compatibility.', 'Forgetting hosting changes.'],
      followUps: ['How would you test for hydration mismatches?', 'How do you share components between two projects?'],
      modelAnswer: 'I\'d avoid a big-bang rewrite. One path is moving the app into Nuxt with SSR disabled for the existing routes, so behaviour stays the same, then turning on SSR or prerendering just for the public product routes and converting their data fetching to useFetch. The alternative is a separate Nuxt or static site for the public pages that shares our component library. Either way the work is route files, data fetching without double requests, auditing browser APIs in setup, checking library SSR support, per-request state, and adding hydration checks to our end-to-end tests — plus a runtime if we SSR.',
    },
    {
      id: 'spa-or-nuxt-existing-backend',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your company\'s main site is server-rendered by a Django (or Laravel, Rails…) backend. Product wants a rich, interactive configurator on one page. Do you build an SPA, adopt Nuxt, or something else?',
      answer: 'Probably neither a full SPA nor Nuxt: mount a Vue app (or a Vue custom element) on that one page of the server-rendered site — "progressive enhancement" — fed by the existing backend\'s API or data embedded in the page. The backend keeps routing, SEO and auth. An SPA or Nuxt makes sense only if the frontend becomes a large, separate product; Nuxt would add a second server layer next to Django.',
      explanation: 'Vue can be used at any scale — from a widget on one page to a full-stack framework.',
      whyAsked: 'Checks knowledge of Vue\'s flexibility and pragmatism.',
      mistakes: ['Rewriting the whole site.', 'Adding a Nuxt server in front of an existing server-rendered backend without a reason.'],
      followUps: ['How would you pass initial data from the Django template to Vue?', 'How would you handle CSRF tokens?'],
      modelAnswer: 'I\'d keep the existing server-rendered site and mount a Vue app just where the configurator lives — Vue is designed to be adopted incrementally like that. The backend keeps routing, SEO and sessions; the Vue app gets initial data embedded in the page or from the existing API, and uses the backend\'s CSRF protection for writes. A full SPA or Nuxt only makes sense if the frontend grows into a separate product; otherwise Nuxt would just add a second server layer.',
    },
    {
      id: 'spa-or-nuxt-myths',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 2,
      question: 'Which statement is accurate?',
      options: [
        'An SPA can\'t be indexed by search engines at all.',
        'Nuxt always needs a running Node server.',
        'An SPA behind a login gains little from SSR, while public, content-first pages often benefit from SSR or static generation.',
        'SSR makes a page interactive sooner than CSR.',
      ],
      correctOption: 2,
      answer: 'The third. Google can render JavaScript, so SPAs can be indexed (less reliably and not by every bot); Nuxt can output static files or run on serverless/edge; SSR shows content sooner but interactivity still waits for JavaScript and hydration.',
      explanation: 'Each myth contains a grain of truth turned into an absolute.',
      whyAsked: 'Separates nuanced understanding from slogans.',
      mistakes: ['Repeating absolutes in either direction.'],
      followUps: ['What would you measure to settle an SSR debate?'],
      modelAnswer: 'The accurate one is that SSR helps public, content-first pages much more than apps behind a login. SPAs can be indexed, just less reliably and not by every bot. Nuxt doesn\'t require a Node server — it can generate static files or deploy to serverless and edge. And SSR improves when content appears, not when the page becomes interactive.',
    },
    {
      id: 'spa-or-nuxt-coding-expand',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 7,
      question: 'For static generation you need concrete URLs. Implement `expandRoutes(patterns, params)` in `expandRoutes.js`: static patterns are returned as-is; a pattern with one `:param` is expanded with every value in `params[param]` (URL-encoded); patterns without known values are skipped.',
      starter: { files: { 'expandRoutes.js': expandStarter, 'App.vue': expandApp } },
      tests: [
        { name: 'static routes pass through', code: `const { expandRoutes } = requireModule('expandRoutes.js')\nexpect(expandRoutes(['/', '/about'], {})).toEqual(['/', '/about'])` },
        { name: 'params are expanded in order', code: `const { expandRoutes } = requireModule('expandRoutes.js')\nexpect(expandRoutes(['/', '/products/:id'], { id: [1, 2] })).toEqual(['/', '/products/1', '/products/2'])` },
        { name: 'values are URL-encoded', code: `const { expandRoutes } = requireModule('expandRoutes.js')\nexpect(expandRoutes(['/tags/:tag'], { tag: ['vue js', 'c#'] })).toEqual(['/tags/vue%20js', '/tags/c%23'])` },
        { name: 'patterns without values are skipped', code: `const { expandRoutes } = requireModule('expandRoutes.js')\nexpect(expandRoutes(['/users/:userId', '/contact'], {})).toEqual(['/contact'])` },
      ],
      hints: [
        'Find param names with a regex such as `/:(\\w+)/g` (`matchAll`).',
        'No params → push the pattern; otherwise look up `params[name] ?? []`.',
        'For each value: `pattern.replace(\':\' + name, encodeURIComponent(value))`.',
      ],
      answer: 'Loop over patterns; detect `:name`; push static patterns directly; for dynamic ones map each known value to a URL with the encoded value substituted, skipping patterns with no values.',
      solution: { files: { 'expandRoutes.js': expandSolution, 'App.vue': expandApp } },
      explanation: 'Static generation can only build pages it knows about, so dynamic routes need a list of values — typically from your CMS or database at build time. The number of URLs is also your build-time budget: thousands of products may argue for SSR with caching instead.',
      whyAsked: 'A practical task that connects SSG mechanics to a real constraint (build size).',
      mistakes: ['Forgetting URL encoding.', 'Emitting `/products/:id` literally.', 'Crashing on missing params.'],
      followUps: ['How would you support several params per route?', 'Where would the product ids come from in a real build?'],
      modelAnswer: 'For each pattern I look for a :param. Static patterns go straight into the list. For a dynamic one I take the known values for that param, substitute each one URL-encoded, and skip the pattern if there are no values. In a real build the values come from the CMS or database, and the length of this list tells me whether static generation is still practical or whether SSR with caching fits better.',
    },
  ],

  takeaways: [
    'The deciding question: must the first HTML response contain the content (SEO, previews, slow first loads)?',
    'Apps behind a login with no SEO needs → a plain SPA is simpler and perfectly professional.',
    'Public, content-first pages → SSR or static generation; Nuxt provides both.',
    'Mixed products → hybrid `routeRules` in Nuxt, or separate marketing site + SPA.',
    'Middle grounds exist: Nuxt SPA mode, VitePress for docs, Vue islands in server-rendered sites, custom elements for widgets.',
    'Decide from requirements, write the reasons down, measure, and revisit when requirements change.',
  ],
}
