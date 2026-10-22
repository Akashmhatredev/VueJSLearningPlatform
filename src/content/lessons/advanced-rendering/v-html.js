// Lesson: v-html and its security implications.

const commentApp = `<script setup>
import { ref } from 'vue'
import { announcement } from './cms.js'

// Imagine this string arrived from ANOTHER user, through your API
const comment = ref(
  'Great post! <b>Loved it.</b> <img src="x" onerror="console.log(\\'XSS: code from a comment just ran!\\')">'
)
</script>

<template>
  <!-- trusted: written by our own team, shipped with the app -->
  <section class="announcement" v-html="announcement"></section>

  <label class="field">
    Your comment
    <textarea v-model="comment" class="editor" rows="3"></textarea>
  </label>

  <h3>Preview</h3>
  <!-- ⚠️ DANGER: another user's text rendered as HTML -->
  <div class="preview" v-html="comment"></div>
</template>

<style scoped>
.announcement {
  background: #fff8d6;
  border: 2px solid #1a1a1a;
  padding: 4px 12px;
  margin-bottom: 12px;
}
.announcement a {
  color: #1d3bf0; /* why does this never apply? */
  font-weight: 700;
}
.field textarea {
  display: block;
  width: 100%;
}
.preview {
  border: 2px dashed #888;
  padding: 8px;
  min-height: 2.5em;
}
</style>`

const cmsFile = `// Trusted HTML: written by our own team and shipped with the app.
// If many people could edit it (say, in a CMS), you would sanitize it too.
export const announcement =
  '<p><strong>New:</strong> free shipping on orders over 50 €. ' +
  '<a href="https://example.com/shipping">Details</a></p>'`

const toySanitizer = `// ⚠️ A TOY allowlist sanitizer, for learning only.
// Do NOT use it in production: use a maintained library such as DOMPurify,
// which handles many tricks this toy ignores (SVG/MathML, mutation XSS,
// DOM clobbering, URL schemes, configuration, browser quirks…).

const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'BR', 'P'])

export function sanitize(dirty) {
  // The content of a <template> element is inert: nothing in it loads or runs.
  const tpl = document.createElement('template')
  tpl.innerHTML = dirty
  clean(tpl.content)
  return tpl.innerHTML
}

function clean(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.TEXT_NODE) continue
    if (child.nodeType === Node.ELEMENT_NODE && ALLOWED_TAGS.has(child.tagName)) {
      // allowed tag: strip EVERY attribute (onclick, style, href…)
      for (const attr of [...child.attributes]) child.removeAttribute(attr.name)
      clean(child)
    } else {
      // anything else (img, script, a, comments…) is removed entirely
      child.remove()
    }
  }
}`

export default {
  id: 'v-html',
  title: 'v-html and its security implications',
  summary: 'Render a string as real HTML with v-html — and understand exactly why doing it with untrusted content hands attackers the keys to your page.',
  difficulty: 'intermediate',
  minutes: 32,
  prerequisites: ['template-syntax'],
  related: ['xss-safe-rendering', 'secrets-csp-dependencies', 'render-functions', 'styling-in-vue', 'dom-access-refs'],
  tags: ['v-html', 'innerHTML', 'XSS', 'cross-site scripting', 'sanitization', 'DOMPurify', 'escaping', 'v-text', 'security', ':deep'],
  apis: [
    { name: 'v-html', summary: 'Sets the element\'s `innerHTML` to the bound string. The string is parsed as HTML, not compiled as a Vue template, and is never escaped.' },
    { name: '{{ }} (text interpolation)', summary: 'Renders a value as plain text. Any `<`, `>` or `&` is shown literally — it is never parsed as HTML.' },
    { name: 'v-text', summary: 'Sets the element\'s `textContent`. Same safety as interpolation, but replaces all children.' },
    { name: ':deep()', summary: 'Scoped-CSS pseudo-class that lets a scoped rule reach descendants Vue did not render itself, such as `v-html` content.' },
  ],
  docs: [
    { label: 'Vue Guide — Template Syntax: Raw HTML', url: 'https://vuejs.org/guide/essentials/template-syntax.html#raw-html' },
    { label: 'API — v-html', url: 'https://vuejs.org/api/built-in-directives.html#v-html' },
    { label: 'Vue Guide — Security', url: 'https://vuejs.org/guide/best-practices/security.html' },
    { label: 'OWASP — Cross Site Scripting Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
    { label: 'DOMPurify (HTML sanitizer library)', url: 'https://github.com/cure53/DOMPurify' },
  ],

  intro: `
Normally, Vue treats every value you put in a template as **text**. If a variable contains \`<b>Hi</b>\`, the page literally shows the characters \`<b>Hi</b>\`.

\`v-html\` switches that off for one element: it takes a string and hands it to the browser **as HTML**, so \`<b>Hi</b>\` becomes bold "Hi".

That is genuinely useful — for HTML your own team wrote, or HTML produced by a trusted tool. It is also one of the most dangerous features in any frontend framework, because if the string came from someone else, they now control part of your page. This lesson covers both sides: how \`v-html\` works, and how to never let it become a security hole.
`,

  why: `
Sometimes your data simply *is* HTML:

- a help article or announcement written in your company's content system;
- documentation converted from Markdown at build time;
- an email-template preview, or a syntax-highlighted code snippet from a trusted library.

Rebuilding that markup element by element in a template would be impossible — you don't know its structure in advance. \`v-html\` exists to drop a ready-made chunk of HTML into an element.

**The catch** is a whole category of attack called **cross-site scripting (XSS)**: an attacker gets their own JavaScript to run inside *your* page, in *your user's* browser. It can read whatever the page can read, act as the logged-in user, and rewrite what they see. XSS has been on the OWASP list of the most common web vulnerabilities for years.

Vue protects you from XSS by default: interpolation escapes everything. \`v-html\` is the place where that protection is **deliberately turned off**. Vue's docs put it bluntly: *only use \`v-html\` on trusted content and never on user-provided content.*
`,

  eli15: `
Imagine you run a noticeboard at school. Normally, when someone hands you a note, you **copy their words onto the board in your own handwriting**. If their note says "the fire alarm is now off", you write exactly those words — it's just a message, it doesn't *do* anything.

\`v-html\` is like **pinning their note up as-is**, and the board is magic: anything written as an *instruction* on a pinned note actually happens. If someone writes "when anyone reads this, open the school safe", the board obeys.

So:

- \`{{ message }}\` = copying the words. Always safe — instructions are just letters.
- \`v-html="message"\` = pinning up the original note. Fine for notes the headteacher wrote. Never for notes from strangers.

And if you really must pin up notes from other people? You first run them through a strict checker that cuts out everything except harmless things like **bold** or *italics*. That checker is called a **sanitizer**.
`,

  analogy: {
    title: 'Reading a letter aloud vs. letting the writer speak',
    body: `
A radio host receives a letter from a listener. They can **read it aloud** in their own voice — whatever the letter says, the host is still in control of the broadcast. That's text interpolation.

Or the host can **hand the microphone to the letter-writer**. If it's a trusted colleague, great. If it's an anonymous stranger, they can say anything to the whole audience, in the station's name. That's \`v-html\` with untrusted input.

A sanitizer is the station's delay button and censor: the stranger can talk, but anything outside a short list of allowed words is cut before it reaches the air.
`,
    mapping: [
      ['reading the letter aloud', '`{{ comment }}` — the browser receives plain text'],
      ['handing over the microphone', '`v-html="comment"` — the browser parses the string as HTML'],
      ['a trusted colleague', 'HTML your team wrote, shipped with the app'],
      ['an anonymous stranger', 'anything a user typed, or that came from a third party'],
      ['the delay button and censor', 'a sanitizer like DOMPurify that keeps only allowlisted tags and attributes'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'Two ways to show the same string',
    props: {
      width: 760,
      height: 320,
      nodes: [
        { id: 'input', label: 'comment string', note: '<img src=x onerror=…>', tone: 'kraft', x: 90, y: 160 },
        { id: 'interp', label: '{{ comment }}', note: 'sets textContent', tone: 'acid', x: 290, y: 55 },
        { id: 'text', label: 'shown as letters', note: 'nothing is parsed', tone: 'acid', x: 520, y: 55 },
        { id: 'vhtml', label: 'v-html="comment"', note: 'sets innerHTML', tone: 'red', x: 290, y: 160 },
        { id: 'parse', label: 'browser parses HTML', note: 'real <img onerror>', tone: 'red', x: 500, y: 160 },
        { id: 'run', label: 'attacker code runs', note: 'as your user', tone: 'red', x: 680, y: 160 },
        { id: 'sanitize', label: 'sanitize()', note: 'allowlist: b, i, p…', tone: 'cobalt', x: 290, y: 265 },
        { id: 'safe', label: 'only safe tags rendered', note: 'no attributes, no img', tone: 'cobalt', x: 540, y: 265 },
      ],
      edges: [
        { from: 'input', to: 'interp' },
        { from: 'interp', to: 'text' },
        { from: 'input', to: 'vhtml' },
        { from: 'vhtml', to: 'parse' },
        { from: 'parse', to: 'run', label: 'onerror fires' },
        { from: 'input', to: 'sanitize' },
        { from: 'sanitize', to: 'safe', label: 'then v-html' },
      ],
      steps: [
        { focus: ['input'], text: 'Another user typed a comment. To your app it is just a string — but it contains markup with an `onerror` attribute.' },
        { focus: ['interp', 'text'], edges: ['input->interp', 'interp->text'], text: '`{{ comment }}` (and `v-text`) put the string into the page as **text**. The browser shows `<img …>` as characters. Nothing runs. This is Vue\'s default, and it is safe.' },
        { focus: ['vhtml', 'parse'], edges: ['input->vhtml', 'vhtml->parse'], text: '`v-html` assigns the string to `innerHTML`. The browser parses it as HTML and creates a real `<img>` element — with the attacker\'s `onerror` attribute attached.' },
        { focus: ['run'], edges: ['parse->run'], text: 'The image fails to load, `onerror` fires, and the attacker\'s JavaScript runs inside your page, with your user\'s session. That is **cross-site scripting (XSS)**.' },
        { focus: ['sanitize', 'safe'], edges: ['input->sanitize', 'sanitize->safe'], text: 'If you genuinely need user HTML (bold, lists, links), pass it through a **sanitizer** first. It keeps an allowlist of harmless tags and attributes and drops everything else — then `v-html` can render the result.' },
      ],
    },
    caption: 'Interpolation treats the string as text; `v-html` treats it as markup the browser will build and run.',
    alt: 'A diagram with a comment string on the left and three paths. Top path: text interpolation sets textContent and the string is shown as letters. Middle path: v-html sets innerHTML, the browser parses an img element with an onerror attribute, and attacker code runs. Bottom path: the string goes through sanitize first, and only safe tags are rendered.',
  },

  animation: {
    type: 'comparison',
    title: 'Unsafe vs. safe ways to show user content',
    props: {
      left: {
        label: '❌ Unsafe',
        lang: 'vue',
        code: `<script setup>
const props = defineProps({ comment: String })
</script>

<template>
  <!-- the comment's author controls this markup -->
  <div class="comment" v-html="comment"></div>
</template>`,
      },
      right: {
        label: '✅ Safe',
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'
import DOMPurify from 'dompurify' // needs a build setup
const props = defineProps({ comment: String })

// rich text needed? sanitize first, then render
const safeHtml = computed(() => DOMPurify.sanitize(props.comment))
</script>

<template>
  <!-- plain text: the default, and usually all you need -->
  <p class="comment">{{ comment }}</p>

  <!-- rich text: only sanitized HTML reaches v-html -->
  <div class="comment" v-html="safeHtml"></div>
</template>`,
      },
      points: [
        'Interpolation escapes everything — `<` is shown as `<`, never parsed.',
        '`v-html` parses the string as HTML, including event-handler attributes like `onerror`.',
        'If formatting is required, sanitize with a maintained allowlist library right before rendering.',
        'DOMPurify is shown as static code: it is an npm package, not part of Vue, and is not available in this sandbox.',
      ],
    },
    caption: 'Default to interpolation. Reach for `v-html` only with trusted or sanitized HTML.',
    alt: 'Side-by-side code. The left, unsafe version binds a comment prop directly with v-html. The right, safe version shows the comment with text interpolation, and for rich text renders a computed value produced by DOMPurify.sanitize.',
  },

  syntax: [
    `
#### Text vs. HTML
`,
    {
      code: `<script setup>
const message = '<b>Hi</b> there'
</script>

<template>
  <p>{{ message }}</p>          <!-- shows: <b>Hi</b> there -->
  <p v-text="message"></p>      <!-- same: plain text -->
  <p v-html="message"></p>      <!-- shows: Hi (bold) there -->
</template>`,
      lang: 'vue',
      title: 'three ways to put a string in an element',
    },
    `
**The rules of \`v-html\`:**

1. It **replaces** the element's children. Writing children inside a \`v-html\` element is a compile error ("v-html will override element children").
2. The string is **plain HTML, not a Vue template**. \`{{ }}\`, \`v-if\`, \`@click\` and components inside it are *not* processed — they arrive as literal text or inert attributes. Vue is not a string-based template engine; compose UI with components instead.
3. **Scoped styles don't reach it.** The inserted elements don't get the component's \`data-v-…\` attribute, so a scoped selector like \`.box a\` never matches them. Use \`.box :deep(a)\`, a CSS module, or a global stylesheet.
4. It is **never escaped or sanitized** by Vue. Whatever is in the string goes to the browser.
`,
    {
      callout: 'warn',
      title: 'The one rule that matters most',
      text: 'Never bind `v-html` to anything a user, a third-party API or a URL parameter could influence — unless it has first passed through a maintained HTML sanitizer such as DOMPurify. "We validate it on the server" is good, but sanitizing at the point of rendering is the safety net that catches what validation missed.',
    },
    `
#### Sanitizing when you truly need HTML

[DOMPurify](https://github.com/cure53/DOMPurify) is a widely used sanitizer. It is an npm package (not part of Vue) and needs a normal build setup, so it is shown here as static code:
`,
    {
      code: `// npm install dompurify
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps({ bio: String })

const safeBio = computed(() =>
  DOMPurify.sanitize(props.bio, {
    ALLOWED_TAGS: ['b', 'strong', 'i', 'em', 'p', 'br', 'ul', 'ol', 'li', 'a'],
    ALLOWED_ATTR: ['href'],
  })
)
// template: <div class="bio" v-html="safeBio"></div>`,
      lang: 'js',
      title: 'DOMPurify with an explicit allowlist',
      static: true,
    },
    `
#### Often you don't need \`v-html\` at all

Highlighting search matches, linkifying URLs, showing @mentions — these *feel* like HTML jobs, but you can split the text into pieces and render each piece with normal template syntax. Every piece stays escaped:
`,
    {
      code: `<template>
  <span v-for="(part, i) in parts" :key="i">
    <mark v-if="part.match">{{ part.text }}</mark>
    <template v-else>{{ part.text }}</template>
  </span>
</template>`,
      lang: 'vue',
      title: 'structured rendering instead of HTML strings',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: commentApp,
    intro: 'A comment box with a live preview — and a deliberately unsafe preview. Step through it to see which `v-html` is fine and which one is a hole.',
    steps: [
      { lines: [3], text: 'The announcement HTML is imported from our own code (`cms.js`). It ships with the app, written by our team — that is what "trusted" means.' },
      { lines: [5, 8], text: 'The comment, by contrast, would come from another user through an API. Its default value is an attack: an `<img>` that fails to load and runs code in `onerror`. (Here it only logs to the console.)' },
      { lines: [12, 13], text: '`v-html` on trusted HTML: acceptable. The `<strong>` and `<a>` inside become real elements.' },
      { lines: [15, 18], text: '`v-model` keeps the textarea and `comment` in sync, so the preview updates as you type.' },
      { lines: [21, 22], text: 'The bug. `v-html="comment"` hands another user\'s string to `innerHTML`. Whatever markup they type becomes part of your page — including event handlers that run JavaScript.' },
      { lines: [32, 35], text: 'This scoped rule targets links in the announcement… but `v-html` content never receives the component\'s `data-v-…` attribute, so the rule never matches. You will fix it with `:deep()`.' },
    ],
  },

  playground: {
    title: 'Comment preview',
    objective: 'See an XSS payload run through `v-html`, then fix the preview twice: once as plain text, once as sanitized rich text — and style `v-html` content correctly.',
    files: { 'App.vue': commentApp, 'cms.js': cmsFile, 'toySanitizer.js': toySanitizer },
    expected: 'A yellow announcement with a bold **New:** and a link, a textarea, and a preview showing **Loved it.** in bold plus a broken-image icon. Open the **Console**: you\'ll see `XSS: code from a comment just ran!` — code that came from the comment text. (In the automated test environment images never load, so `onerror` does not fire there; the tests check the DOM instead.)',
    experiments: [
      {
        id: 'see-the-attack',
        task: 'Run the app and open the **Console** to see the payload\'s message. Then replace the comment with `<script>console.log(\'hi\')</script>` and look again. Nothing is logged — so is `<script>` harmless here?',
        hint: 'Browsers never execute `<script>` elements inserted through `innerHTML`. Event-handler attributes are a different story.',
        explain: 'Attackers don\'t need `<script>`. `onerror`, `onload`, `onmouseover`, `javascript:` URLs, `<iframe srcdoc>` and many more vectors exist. "I tried a script tag and nothing happened" is never evidence of safety.',
      },
      {
        id: 'escape-preview',
        task: 'Fix the preview so the comment is displayed as **plain text** — the tags should be visible as characters, and no `<b>` or `<img>` element should be created.',
        hint: 'Remove `v-html` and put `{{ comment }}` inside the preview `<div>` (or use `v-text="comment"`).',
        tests: [
          {
            name: 'the preview shows the tags as text',
            code: `expect(find('.preview img')).toBeNull()
expect(find('.preview b')).toBeNull()
expect(text('.preview')).toContain('<b>Loved it.</b>')`,
          },
          {
            name: 'anything typed stays text',
            code: `await type('.editor', '<img src=x onerror=alert(1)><u>hi</u>')
expect(find('.preview img')).toBeNull()
expect(find('.preview u')).toBeNull()
expect(text('.preview')).toContain('<u>hi</u>')`,
          },
        ],
        explain: 'Interpolation sets `textContent`, so the browser never parses the string. This one change closes the hole completely — and it is the right default for user content.',
      },
      {
        id: 'sanitize',
        task: 'Product now wants **bold** and *italic* in comments. Render the preview as HTML again — but only after passing the comment through `sanitize()` from `toySanitizer.js`. Then read that file\'s warning.',
        hint: 'Import it: `import { sanitize } from \'./toySanitizer.js\'`, add `const safeComment = computed(() => sanitize(comment.value))` (import `computed` too), and use `v-html="safeComment"` on the preview.',
        tests: [
          {
            name: 'allowed tags survive, the image does not',
            code: `expect(text('.preview b')).toBe('Loved it.')
expect(find('.preview img')).toBeNull()`,
          },
          {
            name: 'attributes and links are stripped',
            code: `await type('.editor', 'Hi <i onclick="steal()">there</i> <a href="javascript:alert(1)">win</a>')
expect(text('.preview i')).toBe('there')
expect(attr('.preview i', 'onclick')).toBeNull()
expect(find('.preview a')).toBeNull()`,
          },
        ],
        explain: 'An **allowlist** says what may stay; everything else goes. That is the only sane direction — a blocklist ("remove `<script>` and `onerror`") always misses something. In a real app you would call `DOMPurify.sanitize()` here instead of the toy.',
      },
      {
        id: 'deep-style',
        task: 'The scoped rule `.announcement a { … }` never colours the link. Make it work **without** removing `scoped`.',
        hint: 'Change the selector to `.announcement :deep(a)`. Scoped CSS adds `[data-v-…]` to the element before `:deep()`, and leaves the part inside unscoped.',
        tests: [
          {
            name: 'the compiled CSS reaches into v-html content',
            code: `const css = [...document.querySelectorAll('style')].map((s) => s.textContent).join('\\n')
expect(css).toMatch(/\\.announcement\\[data-v-[\\w-]+\\]\\s+a\\b/)`,
          },
        ],
        explain: 'Scoped CSS works by adding a `data-v-…` attribute to every element **Vue renders** and to your selectors. `v-html` content is created by the browser, so it never gets the attribute. `.announcement :deep(a)` compiles to `.announcement[data-v-…] a`, which only requires the attribute on the wrapper Vue did render.',
      },
    ],
  },

  internals: {
    beginner: `
A web page has two ways to receive a string. **\`textContent\`** says "here are some letters" — the browser shows them exactly. **\`innerHTML\`** says "here is some markup" — the browser reads it like a mini web page and builds real elements from it, attributes and all.

\`{{ }}\` and \`v-text\` use the first way. \`v-html\` uses the second. Every safety difference in this lesson comes from that one fact.
`,
    technical: [
      `
The template compiler turns each form into a different property on the element's vnode (real output from Vue 3.5's compiler):
`,
      {
        code: `// <p>{{ msg }}</p>
_createElementVNode("p", null, _toDisplayString(_ctx.msg), 1 /* TEXT */)

// <div v-html="html"></div>
_createElementVNode("div", { innerHTML: _ctx.html }, null, 8 /* PROPS */, ["innerHTML"])

// <span v-text="msg"></span>
_createElementVNode("span", { textContent: _toDisplayString(_ctx.msg) }, null, 8 /* PROPS */, ["textContent"])`,
        lang: 'js',
        title: 'compiled output',
      },
      `
At runtime, Vue's DOM layer simply assigns \`el.innerHTML = value\` (or sets the text). There is no escaping step for \`innerHTML\` — by design, since its whole purpose is to *not* escape.

Why didn't the \`<script>\` test run? The HTML standard says \`<script>\` elements created by \`innerHTML\` are not executed. But **event-handler content attributes** (\`onerror\`, \`onload\`, \`onfocus\` …) are compiled and run by the browser when their event fires, regardless of how the element was created. Combine that with an image that is guaranteed to fail (\`src="x"\`) and you have instant code execution.

**Why scoped styles miss it:** \`<style scoped>\` rewrites \`.announcement a\` to \`.announcement a[data-v-123]\` and the compiler stamps \`data-v-123\` on every element *in the template*. Nodes created from an \`innerHTML\` string are never stamped. \`:deep(a)\` moves the attribute check onto the wrapper: \`.announcement[data-v-123] a\`.

**Server-side rendering:** \`v-html\` content is written straight into the server's HTML output, so the same rules apply on the server — the risk does not go away because the HTML was produced by Node.
`,
    ],
    production: `
- **Ban it by default, allow it deliberately.** \`eslint-plugin-vue\` has a \`vue/no-v-html\` rule. Turn it on, and allow exceptions only in one reviewed place — for example a \`<SafeHtml :html="…">\` component that *always* sanitizes before rendering.
- **Sanitize at the point of rendering** with a maintained library (DOMPurify), with an explicit allowlist, and keep the library updated — sanitizer bypasses get discovered and fixed.
- **Also sanitize or validate on the server** when users submit rich text, because other consumers (emails, mobile apps, admin tools) may render the same data. Defense in depth: neither layer should assume the other did its job. And remember: frontend checks never replace server-side authorization.
- **Markdown is not automatically safe.** Many Markdown renderers pass raw HTML through (or have options for it). Treat their output as untrusted HTML and sanitize it.
- **Add a Content Security Policy** (and, where supported, Trusted Types) to limit the damage if something slips through — see [Secrets, CSP & dependency security](lesson:secrets-csp-dependencies).
- **Vue doesn't sanitize URLs either.** \`:href="user.website"\` happily renders \`javascript:…\`. Restrict schemes (\`https:\`, \`mailto:\`) for user-supplied URLs. More in [XSS & safe rendering](lesson:xss-safe-rendering).
`,
  },

  mistakes: [
    {
      title: 'Rendering user content with v-html',
      wrong: { code: `<div class="bio" v-html="user.bio"></div>`, lang: 'vue' },
      right: { code: `<p class="bio">{{ user.bio }}</p>\n<!-- or, if formatting is required: -->\n<div class="bio" v-html="safeBio"></div> <!-- safeBio = DOMPurify.sanitize(user.bio) -->`, lang: 'vue' },
      explanation: 'Whoever wrote the bio controls that markup in every visitor\'s browser. Use interpolation, or sanitize with an allowlist before rendering.',
    },
    {
      title: 'Blocklisting instead of allowlisting',
      wrong: { code: `const clean = html\n  .replace(/<script.*?>.*?<\\/script>/gi, '')\n  .replace(/onerror=/gi, '')`, lang: 'js' },
      right: { code: `const clean = DOMPurify.sanitize(html, {\n  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],\n})`, lang: 'js' },
      explanation: 'There are far too many dangerous tags, attributes, encodings and browser quirks to remove them one by one with regexes. Say what is allowed; drop everything else — and let a well-tested library do the parsing.',
    },
    {
      title: 'Expecting Vue syntax inside the HTML string',
      wrong: { code: `const html = '<p>Hello {{ name }}</p><router-link to="/cart">Cart</router-link>'\n// <div v-html="html"></div>`, lang: 'js' },
      right: { code: `<p>Hello {{ name }}</p>\n<RouterLink to="/cart">Cart</RouterLink>`, lang: 'vue' },
      explanation: '`v-html` content is plain HTML. Interpolations show as literal braces and components render as unknown tags. Build reusable UI with components, not HTML strings.',
    },
    {
      title: 'Scoped styles that silently don\'t apply',
      wrong: { code: `<style scoped>\n.article h2 { font-size: 1.4rem; }\n</style>`, lang: 'vue' },
      right: { code: `<style scoped>\n.article :deep(h2) { font-size: 1.4rem; }\n</style>`, lang: 'vue' },
      explanation: 'Elements inserted by `v-html` lack the `data-v-…` attribute. `:deep()` keeps the scoping on the wrapper only. CSS modules or a global stylesheet also work.',
    },
    {
      title: '"We escape it on the server, so v-html is fine"',
      wrong: { code: `// API returns comment.html, "already safe"\n<div v-html="comment.html"></div>`, lang: 'vue' },
      right: { code: `<div v-html="sanitize(comment.html)"></div>`, lang: 'vue' },
      explanation: 'Server-side cleaning is valuable, but data paths change: an old record, a new endpoint, an admin import. Sanitizing right before rendering is cheap insurance. Better still: if the server can send plain text, render it with `{{ }}`.',
    },
  ],

  debugging: [
    {
      symptom: 'Markup shows up as literal text like `<b>Hi</b>` on the page.',
      cause: 'The value is rendered with `{{ }}` or `v-text`, which always escape.',
      fix: 'That is usually correct! Only switch to `v-html` if the HTML is trusted or sanitized. Otherwise, render the formatting with template syntax (split the text into parts).',
    },
    {
      symptom: 'Compile error: "v-html will override element children".',
      cause: 'The element with `v-html` also has children in the template.',
      fix: 'Remove the children, or move `v-html` to an inner, empty element.',
    },
    {
      symptom: 'Styles don\'t apply to content inside `v-html`.',
      cause: 'Scoped CSS requires the `data-v-…` attribute, which `innerHTML`-created elements never get.',
      fix: 'Use `.wrapper :deep(selector)`, a CSS module, or a non-scoped stylesheet with a specific class prefix.',
    },
    {
      symptom: '`{{ }}`, `@click` or a component inside the HTML string does nothing.',
      cause: '`v-html` doesn\'t compile its content as a Vue template.',
      fix: 'Render that part with real template syntax or a component. If you need dynamic structure, use components, slots or [render functions](lesson:render-functions).',
    },
    {
      symptom: 'A security scan or code review flags `v-html`.',
      cause: 'The bound value can be influenced by users or third parties.',
      fix: 'Switch to interpolation, or route the value through a single sanitizing component with an explicit allowlist, and add a test that a known payload renders inert.',
    },
  ],

  bestPractices: [
    'Default to `{{ }}`. Treat every `v-html` as a security decision that needs a reason.',
    'Only bind `v-html` to HTML you control (shipped with the app or generated at build time) or HTML that has just passed through a maintained sanitizer.',
    'Sanitize with an allowlist (DOMPurify config), never a regex blocklist.',
    'Centralize rich-text rendering in one component that always sanitizes, and enable `vue/no-v-html` everywhere else.',
    'Prefer structured data + template syntax for highlighting, mentions and links — no HTML strings at all.',
    'Use `:deep()`, CSS modules or global styles to style `v-html` content.',
    'Layer defenses: server-side validation, client-side sanitization, a Content Security Policy.',
  ],

  useCases: [
    'Rendering help articles or announcements authored by your own team.',
    'Showing documentation converted from Markdown at build time (still sanitize if authors are not fully trusted).',
    'Displaying output of a trusted syntax highlighter for code snippets.',
    'User rich text (comments, bios, forum posts) — only after sanitizing with an allowlist.',
    'Previewing an email template your own system generated.',
  ],

  whenToUse: {
    use: [
      'The HTML was written by your team or produced by a trusted build step.',
      'The HTML is user-supplied but you sanitize it with DOMPurify (or similar) right before rendering.',
      'The markup structure is unknown in advance, so it cannot be expressed as a template.',
    ],
    avoid: [
      'Any raw user input, URL parameters or third-party API data.',
      'Formatting you could build with template syntax (highlighting, line breaks via CSS `white-space: pre-line`, links).',
      'Composing UI from template fragments — use components; `v-html` doesn\'t compile Vue syntax.',
      'Inserting strings that contain Vue components, directives or interpolations.',
    ],
  },

  comparison: {
    title: 'Ways to show text and markup',
    headers: ['', '`{{ }}` / `v-text`', '`v-html` (trusted HTML)', '`v-html` + sanitizer', 'split into parts + template'],
    rows: [
      ['Escapes HTML?', 'yes, always', '**no**', 'removes non-allowlisted markup', 'yes (each part is interpolated)'],
      ['Safe with user input?', 'yes', '**no**', 'yes, if the library is maintained and configured strictly', 'yes'],
      ['Renders formatting?', 'no', 'yes', 'only allowlisted tags', 'only what your template defines'],
      ['Vue syntax / components inside?', 'n/a', 'no', 'no', 'yes'],
      ['Scoped styles apply?', 'yes', 'only via `:deep()`', 'only via `:deep()`', 'yes'],
      ['Typical use', 'almost everything', 'your own content', 'user rich text', 'highlights, mentions, linkify'],
    ],
    note: 'For the full picture of XSS in Vue apps — URLs, styles, server rendering — continue with [XSS & safe rendering](lesson:xss-safe-rendering).',
  },

  quiz: [
    {
      id: 'v-html-q1',
      type: 'output',
      prompt: 'With `const msg = \'<b>Hi</b>\'`, what does the user see?',
      code: {
        lang: 'vue',
        code: `<p class="a">{{ msg }}</p>
<p class="b" v-html="msg"></p>`,
      },
      options: [
        '`.a` shows the characters <b>Hi</b>; `.b` shows a bold Hi',
        { text: 'Both show a bold Hi', why: 'Interpolation always escapes — it never turns a string into elements.' },
        { text: 'Both show the characters <b>Hi</b>', why: '`v-html` sets `innerHTML`, so the browser parses the tags.' },
        { text: '`.a` shows a bold Hi; `.b` shows the characters', why: 'It is the other way round: `{{ }}` is text, `v-html` is HTML.' },
      ],
      answer: 0,
      explanation: '`{{ }}` sets text, so the tags are shown literally. `v-html` sets `innerHTML`, so the browser creates a real `<b>` element.',
    },
    {
      id: 'v-html-q2',
      type: 'mcq',
      prompt: 'A teammate says: "I put `<script>alert(1)</script>` into our `v-html` comment field and nothing happened, so it\'s safe." What\'s the best response?',
      options: [
        { text: 'Agreed — if scripts don\'t run, no code can run.', why: 'Event-handler attributes such as `onerror` run code without any `<script>` tag.' },
        { text: 'Browsers skip `<script>` inserted via innerHTML, but attributes like `<img src=x onerror=…>` still execute — it is not safe.' },
        { text: 'It only proves Vue sanitizes `v-html` automatically.', why: 'Vue never sanitizes `v-html`; it assigns the string to `innerHTML` as-is.' },
        { text: 'It is safe as long as the site uses HTTPS.', why: 'HTTPS protects data in transit; it does nothing about code injected into your own page.' },
      ],
      answer: 1,
      explanation: 'The HTML standard doesn\'t execute `<script>` elements created by `innerHTML`, but event-handler attributes, `javascript:` URLs and other vectors still work. Absence of one attack proves nothing.',
    },
    {
      id: 'v-html-q3',
      type: 'bug',
      prompt: 'This profile card is vulnerable to XSS. Click the line that introduces the vulnerability.',
      code: {
        lang: 'vue',
        code: `<script setup>
const props = defineProps({
  user: { type: Object, required: true },
})
</script>

<template>
  <article class="profile">
    <h2>{{ user.name }}</h2>
    <img :src="user.avatarUrl" alt="" />
    <div class="bio" v-html="user.bio"></div>
  </article>
</template>`,
      },
      answerLine: 11,
      explanation: '`user.bio` is user-written and goes straight to `innerHTML`. The name is interpolated (escaped), and `:src` on an `<img>` cannot run script. Fix: `{{ user.bio }}`, or sanitize first.',
    },
    {
      id: 'v-html-q4',
      type: 'fill',
      prompt: 'Fill the blanks so the bio is sanitized before it is rendered as HTML.',
      code: {
        lang: 'js',
        code: `import DOMPurify from 'dompurify'

const safeBio = computed(() => DOMPurify.___(props.bio))

// template:
// <div class="bio" ___="safeBio"></div>`,
      },
      answer: [['sanitize'], ['v-html']],
      explanation: '`DOMPurify.sanitize()` returns a cleaned HTML string; only that string is bound with `v-html`.',
    },
    {
      id: 'v-html-q5',
      type: 'mcq',
      prompt: 'Which statements about `v-html` are true? **Select all that apply.**',
      options: [
        { text: 'Interpolations like `{{ total }}` inside the string are shown literally.' },
        { text: 'Scoped styles don\'t match its content unless you use `:deep()` (or similar).' },
        { text: 'Vue escapes dangerous characters before inserting it.', why: 'No escaping happens at all — that is the point of `v-html`.' },
        { text: 'It replaces whatever children the element had.' },
        { text: 'Vue removes `javascript:` URLs from links inside it.', why: 'Vue does no URL sanitizing anywhere — not in `v-html`, not in `:href`.' },
      ],
      answer: [0, 1, 3],
      explanation: '`v-html` is a raw `innerHTML` assignment: no template compilation, no scoping attributes, no escaping, and it overwrites children.',
    },
    {
      id: 'v-html-q6',
      type: 'output',
      prompt: 'What text does this paragraph display?',
      code: {
        lang: 'vue',
        code: `<script setup>
const total = 42
const html = '<b>Total:</b> {{ total }}'
</script>

<template>
  <p v-html="html"></p>
</template>`,
      },
      answer: 'Total: {{ total }}',
      accept: ['Total:{{ total }}', 'Total: {{total}}'],
      explanation: '`v-html` content is not a Vue template. The browser renders "Total:" in bold followed by the literal characters `{{ total }}`.',
    },
    {
      id: 'v-html-q7',
      type: 'short',
      prompt: 'In two or three sentences: when is it acceptable to use `v-html`, and what must be true of the string?',
      answer: 'When you need to render HTML whose structure isn\'t known in advance and the string is trusted — written by your team or produced by a trusted build step — or has just been passed through a maintained allowlist sanitizer such as DOMPurify. It must never contain raw user or third-party input, and you should still style it with :deep() and keep the usage centralized and reviewed.',
    },
  ],

  exercises: [
    {
      id: 'search-highlight',
      title: 'Highlight search matches without v-html',
      difficulty: 'intermediate',
      prompt: `
The starter highlights matches by building an HTML string and rendering it with \`v-html\`. It is case-sensitive, and one product is literally named \`<blink> Retro Speaker\` — which the starter turns into a real element. Rewrite it **without \`v-html\`**.

- \`<input class="search">\` is bound to \`query\`.
- Show one \`<li class="result">\` per product whose name contains the query, **case-insensitively** (all products when the query is empty).
- Inside each result, wrap every matching part in \`<mark>\`; everything else is plain text.
- Product names and queries must always render as **text** — never as HTML.
`,
      files: {
        'App.vue': `<script setup>
import { ref, computed } from 'vue'

const products = [
  { id: 1, name: 'Desk Lamp' },
  { id: 2, name: 'Lava Lamp' },
  { id: 3, name: 'Wooden Desk' },
  { id: 4, name: '<blink> Retro Speaker' },
]
const query = ref('')

const results = computed(() =>
  products.filter((p) => p.name.includes(query.value))
)

// ❌ builds HTML from data, then trusts it
function highlight(name) {
  if (!query.value) return name
  return name.split(query.value).join('<mark>' + query.value + '</mark>')
}
</script>

<template>
  <input v-model="query" class="search" placeholder="Search products…" />
  <ul>
    <li v-for="p in results" :key="p.id" class="result" v-html="highlight(p.name)"></li>
  </ul>
</template>`,
      },
      hints: [
        'Instead of returning an HTML string, return an **array of parts**: `[{ text: \'Desk \', match: false }, { text: \'Lamp\', match: true }]`.',
        'To find matches case-insensitively, search in `name.toLowerCase()` for `query.toLowerCase()` with `indexOf(needle, from)` in a loop, and slice the **original** name so the user\'s casing is kept.',
        'Render: `<template v-for="(part, i) in splitMatches(p.name)" :key="i"><mark v-if="part.match">{{ part.text }}</mark><template v-else>{{ part.text }}</template></template>`. Filter with `p.name.toLowerCase().includes(q)`.',
      ],
      solution: {
        explanation: 'Every piece of text — product names and the user\'s query — now goes through interpolation, so nothing can ever be parsed as HTML. Using `indexOf` instead of building a `RegExp` from the query also avoids a second classic bug: characters like `(` or `.` in the query would otherwise need escaping. (Simplified: locale-aware matching, such as accents or special case rules, would need more work.)',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const products = [
  { id: 1, name: 'Desk Lamp' },
  { id: 2, name: 'Lava Lamp' },
  { id: 3, name: 'Wooden Desk' },
  { id: 4, name: '<blink> Retro Speaker' },
]
const query = ref('')
const needle = computed(() => query.value.trim().toLowerCase())

const results = computed(() =>
  products.filter((p) => p.name.toLowerCase().includes(needle.value))
)

// Returns [{ text, match }] parts. No HTML anywhere.
function splitMatches(name) {
  const q = needle.value
  if (!q) return [{ text: name, match: false }]
  const lower = name.toLowerCase()
  const parts = []
  let from = 0
  while (from < name.length) {
    const at = lower.indexOf(q, from)
    if (at === -1) {
      parts.push({ text: name.slice(from), match: false })
      break
    }
    if (at > from) parts.push({ text: name.slice(from, at), match: false })
    parts.push({ text: name.slice(at, at + q.length), match: true })
    from = at + q.length
  }
  return parts
}
</script>

<template>
  <input v-model="query" class="search" placeholder="Search products…" />
  <ul>
    <li v-for="p in results" :key="p.id" class="result">
      <template v-for="(part, i) in splitMatches(p.name)" :key="i">
        <mark v-if="part.match">{{ part.text }}</mark>
        <template v-else>{{ part.text }}</template>
      </template>
    </li>
  </ul>
</template>`,
        },
      },
      tests: [
        {
          name: 'shows every product at first, names as text',
          code: `expect(findAll('.result')).toHaveLength(4)
expect(find('blink')).toBeNull()
expect(text()).toContain('<blink> Retro Speaker')`,
        },
        {
          name: 'filters case-insensitively',
          code: `await type('.search', 'LAMP')
expect(findAll('.result')).toHaveLength(2)`,
        },
        {
          name: 'wraps every match in <mark>, keeping original casing',
          code: `await type('.search', 'desk')
const marks = findAll('.result mark').map((m) => m.textContent)
expect(marks).toEqual(['Desk', 'Desk'])
expect(text()).toContain('Wooden Desk')`,
        },
        {
          name: 'a query containing markup is never injected',
          code: `await type('.search', '<bl')
expect(findAll('.result')).toHaveLength(1)
expect(find('blink')).toBeNull()
expect(text('.result mark')).toBe('<bl')`,
        },
      ],
    },
    {
      id: 'safe-formatter',
      title: 'Escape first, then format',
      difficulty: 'intermediate',
      prompt: `
Chat messages support a tiny formatting syntax. Write \`formatMessage(text)\` in **format.js** so its output is safe to render with \`v-html\`:

1. **Escape** \`&\`, \`<\`, \`>\`, \`"\` and \`'\` first (to \`&amp;\`, \`&lt;\`, \`&gt;\`, \`&quot;\`, \`&#39;\`).
2. Then convert \`**text**\` to \`<strong>text</strong>\`,
3. \`_text_\` to \`<em>text</em>\`,
4. and each newline to \`<br>\`.

App.vue already renders \`<div class="message" v-html="formatMessage(draft)">\` next to a \`<textarea class="draft">\`. Also export your escaping function as \`escapeHtml\`.

*This is a simplified formatter for learning. For full Markdown, use a Markdown library and sanitize its output.*
`,
      files: {
        'format.js': `// TODO: escape HTML before adding any tags of our own!
export function escapeHtml(text) {
  return text
}

export function formatMessage(text) {
  return text.replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
}`,
        'App.vue': `<script setup>
import { ref } from 'vue'
import { formatMessage } from './format.js'

const draft = ref('**Hello** _team_!')
</script>

<template>
  <textarea v-model="draft" class="draft" rows="3"></textarea>
  <!-- safe ONLY because formatMessage escapes before formatting -->
  <div class="message" v-html="formatMessage(draft)"></div>
</template>`,
      },
      hints: [
        'Order matters: escape the **whole** input first, so any `<` the user typed becomes `&lt;`. Only then add your own tags — they are the only real markup left.',
        'One replace can escape all five characters: `text.replace(/[&<>"\']/g, (ch) => ESCAPES[ch])` with a lookup object. Put `&` in the same pass so you never double-escape.',
        'Chain the formatting: `escapeHtml(text).replace(/\\*\\*(.+?)\\*\\*/g, \'<strong>$1</strong>\').replace(/_(.+?)_/g, \'<em>$1</em>\').replace(/\\n/g, \'<br>\')`.',
      ],
      solution: {
        explanation: 'After escaping, the string contains no markup at all — only text and entities. The formatter then adds a tiny, fixed set of tags with **no attributes**, so the final HTML can only contain `<strong>`, `<em>` and `<br>` that *we* wrote. The `**`, `_` and newline markers survive escaping because they are not special HTML characters. (Known simplification: `snake_case_words` would get italicised.)',
        files: {
          'format.js': `const ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch])
}

export function formatMessage(text) {
  return escapeHtml(text)
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/\\n/g, '<br>')
}`,
          'App.vue': `<script setup>
import { ref } from 'vue'
import { formatMessage } from './format.js'

const draft = ref('**Hello** _team_!')
</script>

<template>
  <textarea v-model="draft" class="draft" rows="3"></textarea>
  <!-- safe ONLY because formatMessage escapes before formatting -->
  <div class="message" v-html="formatMessage(draft)"></div>
</template>`,
        },
      },
      tests: [
        {
          name: 'escapes all five special characters',
          code: `const { escapeHtml } = requireModule('format.js')
expect(escapeHtml('Tom & "Jerry" <3 \\'cheese\\'')).toBe('Tom &amp; &quot;Jerry&quot; &lt;3 &#39;cheese&#39;')`,
        },
        {
          name: 'bold, italic and line breaks',
          code: `const { formatMessage } = requireModule('format.js')
expect(formatMessage('**hi** _there_\\nbye')).toBe('<strong>hi</strong> <em>there</em><br>bye')`,
        },
        {
          name: 'user markup is escaped, even inside bold',
          code: `const { formatMessage } = requireModule('format.js')
expect(formatMessage('<img src=x onerror=alert(1)>')).toBe('&lt;img src=x onerror=alert(1)&gt;')
expect(formatMessage('**<i>x</i>**')).toBe('<strong>&lt;i&gt;x&lt;/i&gt;</strong>')`,
        },
        {
          name: 'the rendered message contains only our tags',
          code: `await type('.draft', '**Deal** <img src=x onerror=alert(1)> <a href="javascript:alert(1)">win</a>')
expect(text('.message strong')).toBe('Deal')
expect(find('.message img')).toBeNull()
expect(find('.message a')).toBeNull()
expect(text('.message')).toContain('<img src=x onerror=alert(1)>')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'v-html-xss-basics',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is XSS, and why does `v-html` open the door to it while `{{ }}` doesn\'t?',
      answer: 'Cross-site scripting (XSS) is when an attacker gets their own JavaScript to run in your page, in another user\'s browser. `{{ }}` sets text content, so any markup in the value is shown as characters. `v-html` assigns the string to `innerHTML`, so the browser parses it — including attributes like `onerror` that run code. Binding user-controlled data to `v-html` lets that user run code for everyone who views it.',
      explanation: 'Text vs. markup: the browser only "obeys" strings that are handed to it as HTML.',
      whyAsked: 'A baseline security question for any frontend role — interviewers want to know you won\'t ship the most common vulnerability.',
      mistakes: ['Saying Vue sanitizes `v-html`.', 'Thinking XSS only means `<script>` tags.', 'Not explaining what an attacker can actually do (act as the user, read page data, change the UI).'],
      followUps: ['What would you do if product insists on rich-text comments?', 'Can `:href` bindings cause XSS too?'],
      modelAnswer: 'XSS means attacker-controlled script running in my page with my user\'s privileges — it can read what the page shows, send requests as the user, or fake the UI. Vue escapes interpolation by default: `{{ }}` puts values in as text, so `<img onerror>` is just characters. `v-html` sets `innerHTML`, which makes the browser parse the string, create elements and attach event-handler attributes that run code. So I only use `v-html` with HTML we control, or after sanitizing with something like DOMPurify.',
    },
    {
      id: 'v-html-script-tag-myth',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'A comment rendered with `v-html` contains `<script>alert(1)</script><img src="x" onerror="alert(2)">`. What happens in a modern browser?',
      options: [
        'alert(1) then alert(2)',
        'Only alert(1)',
        'Only alert(2)',
        'Nothing — innerHTML never runs any code',
      ],
      correctOption: 2,
      answer: 'Only `alert(2)`. The HTML standard says `<script>` elements inserted via `innerHTML` are not executed, but the `<img>` is created, its load fails, and its `onerror` attribute runs.',
      explanation: 'Script tags are inert through `innerHTML`; event-handler attributes are not. That asymmetry fools people who "test" with `<script>` only.',
      whyAsked: 'Separates people who memorised "v-html is bad" from those who understand how injection actually executes.',
      mistakes: ['Answering that both alerts fire.', 'Answering that nothing fires and concluding it is safe.', 'Not knowing other vectors (`javascript:` URLs, `onload`, `<iframe srcdoc>`).'],
      followUps: ['Name three other ways injected HTML can execute code.', 'How would a Content Security Policy change this outcome?'],
      modelAnswer: 'Only the second alert fires. Scripts created through `innerHTML` are never executed — that\'s in the HTML spec — but the image element is created, the bogus `src` fails to load, and the `onerror` handler runs. That\'s why "I tried a script tag and nothing happened" proves nothing; event attributes, `javascript:` URLs and other vectors still work. The fix is not to render untrusted HTML, or to sanitize it with an allowlist first. A strict CSP that disallows inline handlers would also block this one, as a second layer.',
    },
    {
      id: 'v-html-markdown-comments',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 4,
      question: 'Your forum lets users write comments in Markdown. How would you render them safely in a Vue app?',
      answer: 'Convert Markdown to HTML with a maintained library, then sanitize that HTML with an allowlist (DOMPurify) right before rendering with `v-html` — Markdown can contain raw HTML, and many renderers pass it through. Restrict link schemes to `https:`/`mailto:` and consider `rel="noopener noreferrer nofollow"` on links. Validate/sanitize on the server too, add a CSP, and wrap it all in one `<MarkdownView>` component so every comment goes through the same path.',
      explanation: 'Markdown → HTML is a conversion, not a sanitization. The output must be treated like any untrusted HTML.',
      code: {
        lang: 'js',
        code: `// static example — marked and dompurify are npm packages
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const html = computed(() =>
  DOMPurify.sanitize(marked.parse(props.source), {
    ALLOWED_TAGS: ['p', 'em', 'strong', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'blockquote'],
    ALLOWED_ATTR: ['href'],
  })
)`,
      },
      whyAsked: 'Real products need rich text. This tests whether you can deliver the feature without the vulnerability.',
      mistakes: ['Assuming the Markdown library makes output safe.', 'Sanitizing with regexes.', 'Only sanitizing on the server, or only on the client, with no reasoning about other consumers.'],
      followUps: ['Where would you cache the sanitized result?', 'How would you test that it stays safe after a library upgrade?', 'Could you avoid `v-html` by rendering the Markdown AST to components?'],
      modelAnswer: 'I\'d parse Markdown with a maintained library and treat its output as untrusted, because Markdown allows raw HTML. Before rendering, I sanitize with DOMPurify using an explicit allowlist of tags and only `href` attributes, and I restrict link schemes. That lives in one `MarkdownView` component, with `vue/no-v-html` enabled elsewhere. The backend also validates what\'s stored, and a CSP limits damage if anything slips through. I\'d add a test with known payloads so upgrades can\'t silently regress.',
    },
    {
      id: 'v-html-template-strings',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 3,
      question: 'A CMS returns `<p>Hi {{ user.name }}! <router-link to="/offers">See offers</router-link></p>`. Rendered with `v-html`, the braces show literally and the link doesn\'t work. Why — and what are the options?',
      answer: '`v-html` inserts plain HTML; Vue doesn\'t compile it as a template, so interpolation and components are not processed (`router-link` becomes an unknown element). Options: have the CMS return structured data and render it with real components; use placeholders that you replace with *escaped* values; or intercept clicks on plain `<a>` tags and call `router.push`. Compiling CMS strings at runtime with Vue\'s template compiler is risky — a template is code, so whoever writes it can run code.',
      explanation: 'Vue templates are compiled into JavaScript. Letting content become a template means letting content become code.',
      whyAsked: 'Common in CMS-driven sites; tests understanding of what `v-html` is (and isn\'t) and of the security boundary around templates.',
      mistakes: ['Suggesting the runtime compiler without mentioning that templates are executable code.', 'Trying to fix it with `nextTick`.', 'Doing string replacement of `{{ name }}` with unescaped user data (re-introducing XSS).'],
      followUps: ['How would you implement "click on a CMS link uses the router" safely?', 'What does the full (compiler-included) Vue build cost you?'],
      modelAnswer: '`v-html` just sets `innerHTML` — Vue never compiles that string, so `{{ }}` stays literal and `router-link` is an unknown tag. I\'d prefer the CMS to send structured blocks that I render with real components. If it must be HTML, I\'d replace placeholders with escaped values and handle navigation by listening for clicks on internal `<a>` links and calling `router.push`. I would not compile CMS strings as Vue templates at runtime, because templates compile to JavaScript — that turns content authors into code authors.',
    },
    {
      id: 'v-html-sanitize-where',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 5,
      question: 'Your team debates where to sanitize user rich text: when it\'s saved on the server, or when it\'s rendered in the Vue app. What do you recommend?',
      answer: 'Both, for different reasons. The server should validate and sanitize on input because several clients (web, mobile, email, admin tools) consume the data, and it can reject obviously malicious content. The client should still sanitize right before `v-html`, because it is the last point before execution, it protects against old records and new data paths, and sanitizer libraries get security updates you want applied at render time. Add a CSP as a third layer. Store the original if you need to re-sanitize with stricter rules later.',
      explanation: 'Defense in depth: each layer assumes the others might fail. Rendering is where the risk materializes, so the final check belongs there.',
      whyAsked: 'Architecture-level security judgment: trade-offs, multiple consumers, and not trusting a single layer.',
      mistakes: ['"The server already did it, so the client doesn\'t need to."', '"The client does it, so the server can store anything" — ignoring other consumers.', 'Forgetting to keep sanitizer libraries updated.'],
      followUps: ['Would you store raw or sanitized HTML?', 'How does CSP complement sanitization?', 'How do you prevent a future developer from adding a raw `v-html`?'],
      modelAnswer: 'I\'d sanitize in both places. The server validates and cleans on write because many consumers read the same data and should all get safe content. The Vue app still sanitizes immediately before `v-html` — it\'s the last moment before the browser executes anything, it covers legacy records and new endpoints, and the library\'s latest rules apply. I\'d centralize that in one SafeHtml component, enable `vue/no-v-html` elsewhere, and add a CSP so a miss isn\'t game over. Keeping the original input lets us re-sanitize if our rules tighten.',
    },
    {
      id: 'v-html-scoped-css',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'An article body rendered with `v-html` ignores the component\'s `<style scoped>` rules for `h2` and `a`. Why, and how do you fix it?',
      answer: 'Scoped CSS adds a `data-v-…` attribute to elements the template compiler renders and to your selectors. Elements created from the `v-html` string never get that attribute, so selectors like `.article h2[data-v-…]` don\'t match. Use `.article :deep(h2)` (compiles to `.article[data-v-…] h2`), a CSS module, or a global stylesheet with a specific prefix.',
      explanation: 'Scoping is done by attributes stamped at compile time; runtime HTML misses the stamp.',
      whyAsked: 'A frequent, confusing bug that tests understanding of how scoped CSS works under the hood.',
      mistakes: ['Removing `scoped` entirely and leaking styles app-wide.', 'Adding `!important`.', 'Not knowing `:deep()`.'],
      followUps: ['What does `:deep()` compile to?', 'When would CSS modules be a better choice?'],
      modelAnswer: 'Scoped styles work by stamping a `data-v` attribute on every element the template renders and appending it to each selector. `v-html` content is created by the browser from a string, so it never gets stamped and the scoped selectors can\'t match. I\'d write `.article :deep(h2)`, which keeps the attribute check on the wrapper and matches any `h2` inside. CSS modules or a prefixed global stylesheet also work.',
    },
    {
      id: 'v-html-coding-linkify',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 10,
      question: 'Linkify a chat message **without `v-html`**: URLs starting with `http://` or `https://` become `<a class="link">` elements; everything else stays plain text inside `<p class="msg">`. Bind the message to `<input class="text">`. Other schemes like `javascript:` must never become links.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const message = ref('Docs: https://vuejs.org/guide/ — read them!')
</script>

<template>
  <input v-model="message" class="text" />
  <!-- TODO: render links for http(s) URLs, text for everything else -->
  <p class="msg">{{ message }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'an https URL becomes a link',
          code: `const a = find('.msg a.link')
expect(a).toBeTruthy()
expect(a.getAttribute('href')).toBe('https://vuejs.org/guide/')
expect(a.textContent).toBe('https://vuejs.org/guide/')
expect(text('.msg')).toBe('Docs: https://vuejs.org/guide/ — read them!')`,
        },
        {
          name: 'several URLs, text in between preserved',
          code: `await type('.text', 'a http://x.test b https://y.test c')
expect(findAll('.msg a.link').map((a) => a.getAttribute('href'))).toEqual(['http://x.test', 'https://y.test'])
expect(text('.msg')).toBe('a http://x.test b https://y.test c')`,
        },
        {
          name: 'javascript: and markup stay text',
          code: `await type('.text', 'javascript:alert(1) <b>bold</b>')
expect(find('.msg a')).toBeNull()
expect(find('.msg b')).toBeNull()
expect(text('.msg')).toBe('javascript:alert(1) <b>bold</b>')`,
        },
      ],
      hints: [
        '`String.prototype.split` with a **capturing group** keeps the separators: `\'a https://x b\'.split(/(https?:\\/\\/\\S+)/)` → `[\'a \', \'https://x\', \' b\']`.',
        'Turn that into parts with a computed: each part is `{ text, isUrl }`, where `isUrl` is `/^https?:\\/\\//.test(text)`.',
        'Render with `<template v-for>`: `<a v-if="part.isUrl" class="link" :href="part.text">{{ part.text }}</a><template v-else>{{ part.text }}</template>`.',
      ],
      answer: 'Split the message on an `https?://` pattern with a capturing group, mark URL parts, and render them with `<a :href>`; everything else is interpolated. Only http(s) parts can become links, because only they match the pattern.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const message = ref('Docs: https://vuejs.org/guide/ — read them!')

const URL_PATTERN = /(https?:\\/\\/\\S+)/

const parts = computed(() =>
  message.value
    .split(URL_PATTERN)
    .filter((text) => text !== '')
    .map((text) => ({ text, isUrl: /^https?:\\/\\//.test(text) }))
)
</script>

<template>
  <input v-model="message" class="text" />
  <p class="msg">
    <template v-for="(part, i) in parts" :key="i">
      <a v-if="part.isUrl" class="link" :href="part.text" rel="noopener noreferrer" target="_blank">{{ part.text }}</a>
      <template v-else>{{ part.text }}</template>
    </template>
  </p>
</template>`,
        },
      },
      explanation: 'No HTML strings are built, so nothing can be injected. The allowlisted URL pattern also handles the second XSS vector — Vue does not sanitize `:href`, so only strings starting with `http://` or `https://` ever reach it.',
      whyAsked: 'A realistic task that tests whether you reach for `v-html` by reflex, and whether you know `:href` needs its own protection.',
      mistakes: ['Building `<a href="…">` strings and rendering them with `v-html`.', 'Linking anything that contains a colon, letting `javascript:` through.', 'Losing the text between URLs.'],
      followUps: ['How would you trim trailing punctuation like `.` or `)` from URLs?', 'Why add `rel="noopener noreferrer"` with `target="_blank"`?'],
      modelAnswer: 'I split the message with a regex that has a capturing group for `https?://` URLs, so the URLs are kept in the result. A computed maps each piece to `{ text, isUrl }`, and the template renders URL parts as anchors with `:href` and everything else via interpolation. Because no HTML string is ever built, there\'s nothing to inject, and because only http(s) matches, `javascript:` can never reach `:href` — which matters since Vue doesn\'t sanitize URLs.',
    },
  ],

  takeaways: [
    '`{{ }}` and `v-text` render text; `v-html` hands the string to `innerHTML` to be parsed as HTML — with no escaping at all.',
    'Never bind `v-html` to user or third-party content unless it has just passed through a maintained allowlist sanitizer like DOMPurify.',
    '`<script>` tags don\'t run via `innerHTML`, but event attributes like `onerror` do — "a script tag did nothing" proves nothing.',
    '`v-html` content isn\'t compiled (no `{{ }}`, directives or components) and isn\'t scoped — style it with `:deep()`.',
    'Many "HTML" features (highlights, mentions, links) are safer as structured data rendered with normal template syntax.',
    'Layer your defenses: server validation, client-side sanitization at render time, and a Content Security Policy.',
  ],
}
