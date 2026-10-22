// Lesson: Attribute binding with v-bind

const productApp = `<script setup>
import { ref } from 'vue'

const product = ref({
  id: 42,
  name: 'Mechanical keyboard',
  stock: 3,
})
const sku = 'KB-42'
const isFavourite = ref(false)

function buyOne() {
  product.value.stock--
}
</script>

<template>
  <article class="card" :data-sku="sku">
    <h2 :title="product.stock + ' left in stock'">{{ product.name }}</h2>
    <progress class="stock" :value="product.stock" max="10"></progress>
    <a class="details" :href="'/products/' + product.id">Details</a>
    <button class="fav" :aria-pressed="isFavourite" @click="isFavourite = !isFavourite">☆ Favourite</button>
    <button class="buy" @click="buyOne">Buy one</button>
  </article>
</template>`

const plainBind = `const button = document.querySelector('.buy')
const link = document.querySelector('.details')

function render() {
  link.setAttribute('href', '/products/' + product.id)
  if (product.stock === 0) {
    button.setAttribute('disabled', '')
  } else {
    button.removeAttribute('disabled')
  }
}

// ...and call render() after EVERY change to product
product.stock--
render()`

const vueBind = `<template>
  <a class="details" :href="'/products/' + product.id">Details</a>
  <button class="buy" :disabled="product.stock === 0" @click="buyOne">
    Buy one
  </button>
</template>

<!-- Vue adds / updates / removes the attributes
     whenever product changes. No render() to call. -->`

export default {
  id: 'v-bind',
  title: 'Attribute binding with v-bind',
  summary: 'v-bind (or just :) connects an HTML attribute to your data, so links, images, disabled states and ARIA attributes always match the current state.',
  difficulty: 'beginner',
  minutes: 22,
  prerequisites: ['template-syntax'],
  related: ['class-style-bindings', 'v-on-events', 'props', 'fallthrough-attrs', 'xss-safe-rendering', 'accessibility-fundamentals'],
  tags: ['v-bind', ':', 'attribute binding', 'dynamic attributes', 'boolean attributes', 'disabled', 'aria', 'same-name shorthand'],
  apis: [
    { name: 'v-bind:attr / :attr', summary: 'Binds an attribute or DOM property to a JavaScript expression.' },
    { name: ':attr (same-name shorthand)', summary: 'Vue 3.4+: `:id` is short for `:id="id"`.' },
    { name: 'v-bind="object"', summary: 'Binds every key of an object as an attribute.' },
    { name: ':[name]', summary: 'Dynamic argument: the attribute name itself comes from an expression.' },
    { name: '.prop / .attr', summary: 'Modifiers that force binding as a DOM property or as an HTML attribute.' },
  ],
  docs: [
    { label: 'Vue Guide — Template Syntax: Attribute Bindings', url: 'https://vuejs.org/guide/essentials/template-syntax.html#attribute-bindings' },
    { label: 'API — v-bind', url: 'https://vuejs.org/api/built-in-directives.html#v-bind' },
    { label: 'Vue Guide — Security: Potential Dangers', url: 'https://vuejs.org/guide/best-practices/security.html#potential-dangers' },
  ],

  intro: `
HTML attributes — \`href\`, \`src\`, \`disabled\`, \`title\`, \`aria-label\` — often depend on data: the link goes to *this* product, the button is disabled *while saving*. Mustaches don't work inside attributes, so Vue gives you a directive for it:

\`\`\`vue
<a v-bind:href="profileUrl">Profile</a>
<a :href="profileUrl">Profile</a>   <!-- the same, with the shorthand -->
\`\`\`

\`v-bind:href="profileUrl"\` means: *"keep the \`href\` attribute equal to the value of the expression \`profileUrl\`."* When \`profileUrl\` changes, Vue updates the attribute. You will almost always write the shorthand \`:\`.
`,

  why: `
In plain JavaScript, every attribute that depends on data needs manual upkeep: \`setAttribute\` when it changes, \`removeAttribute\` when it should disappear, and a \`render()\` call after *every* state change. Miss one and your "Buy" button stays clickable after the product sold out.

\`v-bind\` makes attributes **declarative**: you state the rule once — *"disabled when stock is 0"* — and Vue enforces it forever. Without it you couldn't write data-driven links, images, form constraints or accessibility attributes in a template at all, because \`href="{{ url }}"\` is just a literal string.
`,

  eli15: `
Supermarkets have **electronic shelf labels**: little screens instead of paper price tags. When the head office changes a price in the computer, every label in every store updates by itself.

\`v-bind\` turns an HTML attribute into one of those electronic labels. \`:href="product.url"\` says *"this link's address is connected to \`product.url\` in my data"*. Change the data, and the attribute on the page changes with it. No one has to walk around replacing paper tags.
`,

  analogy: {
    title: 'Electronic shelf labels',
    body: `
A paper tag says "€4.99" forever — that's a **static** attribute like \`href="/about"\`. An electronic label is wired to the store's database — that's \`:href="aboutUrl"\`.

Some labels just show or hide an "OUT OF STOCK" banner — like **boolean attributes** (\`disabled\`, \`hidden\`), which are either present or absent. And if the database says "no price" (\`null\`), the label goes blank — Vue removes the attribute.
`,
    mapping: [
      ['paper price tag', 'a static attribute: `title="Hello"`'],
      ['electronic label', 'a bound attribute: `:title="greeting"`'],
      ['the store database', 'your reactive state'],
      ['"out of stock" banner on/off', 'boolean attributes like `:disabled="stock === 0"`'],
      ['label goes blank', 'binding `null`/`undefined` removes the attribute'],
    ],
  },

  visual: {
    type: 'directive-lab',
    props: { directive: 'v-bind' },
    title: 'v-bind in the real DOM',
    caption: 'Change the bound values and watch the attributes in the live DOM: updated, added and removed. Notice what happens to a boolean attribute when the value becomes false.',
    alt: 'An interactive lab with controls for a URL, a title and a disabled flag. The template uses :href, :title and :disabled; the live DOM panel shows the resulting element and highlights each attribute as it changes, appears or disappears.',
  },

  syntax: [
    `
#### The basics
`,
    {
      code: `<img :src="product.imageUrl" :alt="product.name" />
<a :href="'/users/' + user.id">Profile</a>
<input :placeholder="hint" :maxlength="limit" />
<button :disabled="isSaving">Save</button>
<button :aria-expanded="menuOpen" aria-controls="menu">Menu</button>`,
      lang: 'vue',
      title: 'common bindings',
    },
    `
The value is a JavaScript **expression**, exactly like inside \`{{ }}\`: a variable, \`'/users/' + user.id\`, a ternary, a function call.

#### What ends up in the DOM

1. **Strings and numbers** become the attribute value: \`:title="'3 left'"\` → \`title="3 left"\`.
2. **\`null\` or \`undefined\` remove the attribute** entirely. This is the universal "no attribute" value.
3. **Boolean attributes** (\`disabled\`, \`checked\`, \`hidden\`, \`required\`, \`readonly\`…) are present when the value is truthy (or \`''\`) and **removed** for other falsy values. \`:disabled="false"\` → no \`disabled\` attribute.
4. **Other attributes keep \`false\` as text** (Vue 3): \`:aria-pressed="false"\` → \`aria-pressed="false"\` — exactly what ARIA needs. Use \`null\` if you want the attribute gone.
5. \`class\` and \`style\` accept objects and arrays — they get their own lesson: [Class & style bindings](lesson:class-style-bindings).

#### Same-name shorthand (Vue 3.4+)
`,
    {
      code: `<script setup>
const id = 'search-box'
const placeholder = 'Search products…'
</script>

<template>
  <!-- same as :id="id" :placeholder="placeholder" -->
  <input :id :placeholder />
</template>`,
      lang: 'vue',
      title: 'same-name shorthand',
    },
    `
#### Binding many attributes at once

\`v-bind\` with no argument takes an **object** and binds every key:
`,
    {
      code: `<script setup>
const fieldAttrs = { type: 'email', placeholder: 'you@example.com', required: true }
</script>

<template>
  <input v-bind="fieldAttrs" />
  <!-- renders: <input type="email" placeholder="you@example.com" required> -->
</template>`,
      lang: 'vue',
      title: 'object syntax',
    },
    `
If the same attribute appears both in the object and individually, **the one declared later wins** (Vue 3 merges in order): \`<input v-bind="fieldAttrs" type="text">\` ends up as \`type="text"\`.

#### Dynamic attribute names
`,
    {
      code: `<script setup>
import { ref } from 'vue'
const labelAttr = ref('aria-label')  // could switch to 'title'
</script>

<template>
  <button :[labelAttr]="'Close dialog'">✕</button>
</template>`,
      lang: 'vue',
      title: 'dynamic argument',
      static: true,
    },
    `
The expression inside \`[ ]\` must produce a string (or \`null\` to remove the binding), and it can't contain spaces or quotes — use a computed property for anything complex. You'll rarely need this.

#### Attributes vs. DOM properties

HTML *attributes* are the text in your markup (\`value="hi"\`). DOM *properties* are fields on the live JavaScript element object (\`input.value\`). Vue picks the right one for you: if the element has a matching property (like \`value\` or \`checked\`), it usually sets the property; otherwise it sets the attribute. You can force either with modifiers:
`,
    {
      code: `<div :text-content.prop="message"></div>  <!-- force a DOM property -->
<div .text-content="message"></div>       <!-- .prop shorthand -->
<my-widget :config.attr="json" />         <!-- force an HTML attribute -->
<my-widget ^config="json" />              <!-- .attr shorthand -->`,
      lang: 'vue',
      title: '.prop and .attr modifiers (rarely needed)',
      static: true,
    },
    {
      callout: 'warn',
      title: 'User-controlled URLs',
      text: 'Vue escapes text, but it does not sanitise URLs. `<a :href="user.website">` will happily render `javascript:alert(1)`. Validate URLs (allow only `http:`/`https:`) on the server when they are saved, and treat bound URLs from users as untrusted. See [XSS & safe rendering](lesson:xss-safe-rendering).',
    },
    {
      callout: 'version',
      text: 'The same-name shorthand (`:id` meaning `:id="id"`) requires Vue 3.4+. The `.attr` modifier and its `^` shorthand were added in Vue 3.2.',
    },
  ],

  walkthrough: {
    title: 'App.vue',
    lang: 'vue',
    code: productApp,
    intro: 'A product card with five different bindings. Watch how each one maps state to an attribute.',
    steps: [
      { lines: [4, 10], text: 'The state: a product object, a constant SKU and a reactive `isFavourite` flag.' },
      { lines: [18], text: '`:data-sku="sku"` sets a custom `data-*` attribute — handy for analytics or test selectors. `sku` is a constant, so it is set once.' },
      { lines: [19], text: '`:title` builds a tooltip from an expression. It updates every time `product.stock` changes — hover the heading after buying.' },
      { lines: [20], text: '`:value` on `<progress>` drives the bar. `max="10"` has no colon, so it is a plain static string.' },
      { lines: [21], text: 'A link built from data: `\'/products/\' + product.id` → `/products/42`. This is the job mustaches cannot do in attributes.' },
      { lines: [22], text: '`:aria-pressed="isFavourite"` tells screen readers whether the toggle is on. Because `aria-pressed` is not a boolean attribute, Vue 3 renders `false` as the text `"false"` — exactly what ARIA expects.' },
      { lines: [23], text: 'The Buy button has no binding yet — so it stays clickable even when the stock hits zero. You will fix that in the first experiment.' },
    ],
  },

  playground: {
    title: 'Product card',
    objective: 'Add and change attribute bindings, then inspect the DOM to see exactly what Vue renders.',
    files: { 'App.vue': productApp },
    expected: 'A card for **Mechanical keyboard** with a stock bar, a Details link to `/products/42`, a Favourite toggle and a Buy button. Inspect the elements: `data-sku="KB-42"`, `aria-pressed="false"`, and the title changes as you buy.',
    experiments: [
      {
        id: 'sold-out',
        task: 'Disable the **Buy one** button when the stock reaches **0**.',
        hint: 'Add `:disabled="product.stock === 0"` to the `.buy` button.',
        tests: [
          {
            name: 'enabled while in stock, disabled at 0',
            code: `expect(find('.buy').disabled).toBe(false)
await click('.buy')
await click('.buy')
await click('.buy')
expect(find('.buy').disabled).toBe(true)
expect(find('.buy').hasAttribute('disabled')).toBe(true)`,
          },
        ],
        explain: '`disabled` is a boolean attribute: Vue adds it (`disabled=""`) when the expression is truthy and removes it when falsy. One rule, enforced on every render.',
      },
      {
        id: 'new-tab',
        task: 'Make the Details link open in a new tab safely. Create `const externalLink = { target: \'_blank\', rel: \'noopener noreferrer\' }` and bind the whole object onto the link with `v-bind="externalLink"`.',
        hint: '`v-bind` with no argument spreads an object\'s keys as attributes: `<a class="details" :href="…" v-bind="externalLink">`.',
        tests: [
          {
            name: 'the link has target and rel',
            code: `expect(attr('.details', 'target')).toBe('_blank')
expect(attr('.details', 'rel')).toContain('noopener')
expect(attr('.details', 'href')).toBe('/products/42')`,
          },
        ],
        explain: 'Object binding is great for groups of attributes that travel together. `rel="noopener"` stops the new tab from controlling your page through `window.opener`.',
      },
      {
        id: 'same-name',
        task: 'Give the card an `id` of **product-42** using the **same-name shorthand**: declare `const id = \'product-\' + product.value.id` and write `<article class="card" :id …>`.',
        hint: 'With Vue 3.4+, `:id` alone means `:id="id"` — the variable must be called `id`.',
        tests: [{ name: 'the card has id="product-42"', code: `expect(find('.card').id).toBe('product-42')` }],
        explain: 'The shorthand only saves typing when the attribute and the variable share a name. It needs Vue 3.4 or newer.',
      },
      {
        id: 'inspect-false',
        task: 'Inspect the Favourite button in your browser\'s dev tools, then click it a few times. Watch `aria-pressed`. Now temporarily change the binding to `:aria-pressed="isFavourite || null"` and click again.',
        hint: 'Compare `"false"`, `"true"` and a missing attribute.',
        explain: 'With a plain boolean, Vue 3 writes `aria-pressed="false"`/`"true"` because `aria-pressed` is not a boolean attribute. Binding `null` removes the attribute entirely — the universal way to say "no attribute".',
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Keeping attributes in sync: by hand vs v-bind',
    props: {
      left: { label: 'Plain JavaScript', lang: 'js', code: plainBind },
      right: { label: 'Vue with v-bind', lang: 'vue', code: vueBind },
      points: [
        'Plain JS needs `setAttribute` and `removeAttribute` — and the right one each time.',
        'Plain JS must re-run `render()` after every change; Vue re-evaluates bindings automatically.',
        'Boolean attributes: Vue adds `disabled` for truthy values and removes it for falsy ones.',
        'The Vue version reads as a rule: "disabled when stock is 0".',
      ],
    },
    caption: 'Same behaviour, but with v-bind the rule is written once and can never be forgotten.',
    alt: 'Two panels. Left: plain JavaScript with a render function that calls setAttribute for href and either setAttribute or removeAttribute for disabled, and a reminder to call render after every change. Right: a Vue template with :href and :disabled bindings.',
  },

  internals: {
    beginner: `
When the template compiles, every bound attribute becomes a little rule: "this attribute = that expression". On each render Vue evaluates the expressions; if a value changed since last time, it updates just that attribute on the real element — setting it, changing it or removing it. Unchanged attributes are not touched.
`,
    technical: [
      `
The compiler turns bindings into the element's *props* object in the render function and marks the node with a \`PROPS\` patch flag plus the list of dynamic keys, so the runtime only compares those keys on update.

At runtime, \`patchProp\` in \`@vue/runtime-dom\` decides how to apply each key:

- \`class\` and \`style\` have dedicated handlers (normalising objects/arrays).
- Keys like \`onClick\` become event listeners.
- Otherwise, if the element has a DOM property with that name (\`key in el\`), Vue usually sets the **property** — with exceptions for keys that must stay attributes (for example \`form\`, or \`width\`/\`height\` on images and video).
- Else it sets an **attribute**: \`null\`/\`undefined\` → \`removeAttribute\`; for known boolean attributes, falsy values (except \`''\`) → remove, truthy → \`setAttribute(key, '')\`; anything else → \`setAttribute(key, value)\`.
`,
      {
        code: `// A simplified model of attribute patching — not Vue's real source
function patchAttr(el, key, value) {
  if (value == null) return el.removeAttribute(key)
  if (BOOLEAN_ATTRS.has(key)) {
    return value || value === '' ? el.setAttribute(key, '') : el.removeAttribute(key)
  }
  el.setAttribute(key, String(value))   // false becomes "false" for non-boolean attrs
}`,
        lang: 'js',
        title: 'attribute rules (simplified)',
      },
    ],
    production: `
- **Accessibility:** bind ARIA state to your data (\`:aria-expanded\`, \`:aria-pressed\`, \`:aria-invalid\`, \`:aria-busy\`) so assistive technology always hears the truth. See [Accessibility fundamentals](lesson:accessibility-fundamentals).
- **Test hooks:** \`data-test\` / \`data-testid\` attributes give tests stable selectors that don't break when styling changes.
- **Props:** on a component, \`:count="5"\` passes the *number* 5, while \`count="5"\` passes the *string* "5" — a common source of type warnings. See [Props](lesson:props).
- **Never spread untrusted objects.** \`v-bind="dataFromApi"\` can add arbitrary attributes — including inline event-handler attributes such as \`onclick\` — which is an injection risk. Bind known keys explicitly.
- **URLs from users** must be validated (scheme allowlist) server-side; add \`rel="noopener noreferrer"\` to \`target="_blank"\` links to untrusted sites.
`,
  },

  mistakes: [
    {
      title: 'Forgetting the colon',
      wrong: { code: `<button disabled="isSaving">Save</button>   <!-- ALWAYS disabled -->`, lang: 'vue' },
      right: { code: `<button :disabled="isSaving">Save</button>`, lang: 'vue' },
      explanation: 'Without `:` the value is the literal string "isSaving". A boolean attribute that is present at all — with any text — disables the button permanently.',
    },
    {
      title: 'Using mustaches inside attributes',
      wrong: { code: `<img src="{{ product.imageUrl }}" />`, lang: 'vue' },
      right: { code: `<img :src="product.imageUrl" />`, lang: 'vue' },
      explanation: 'Interpolation only works in text content. In an attribute it is just characters, and the browser requests an image literally named `{{ product.imageUrl }}`.',
    },
    {
      title: 'Expecting `false` to remove every attribute',
      wrong: { code: `<div :title="hasHint && hint">…</div>  <!-- title="false" when hasHint is false -->`, lang: 'vue' },
      right: { code: `<div :title="hasHint ? hint : null">…</div>`, lang: 'vue' },
      explanation: 'In Vue 3, `false` only removes *boolean* attributes. For everything else it becomes the text "false". Use `null` or `undefined` to remove an attribute.',
    },
    {
      title: 'Passing a string when you meant a number or boolean',
      wrong: { code: `<RatingStars max="5" readonly="false" />`, lang: 'vue' },
      right: { code: `<RatingStars :max="5" :readonly="false" />`, lang: 'vue' },
      explanation: 'Without `:`, attribute values are always strings: `"5"` and `"false"` (and the string "false" is truthy!). With `:`, the value is the JavaScript expression: the number 5 and the boolean false.',
    },
  ],

  debugging: [
    {
      symptom: 'A button is always disabled, no matter the state.',
      cause: '`disabled="something"` without a colon — a static, always-present boolean attribute.',
      fix: 'Bind it: `:disabled="something"`.',
    },
    {
      symptom: 'An element has `title="false"` or `href="undefined"`-like values.',
      cause: 'A non-boolean attribute received `false`, or an expression produced the wrong value.',
      fix: 'Return `null`/`undefined` to remove the attribute; check the expression in the Vue DevTools.',
    },
    {
      symptom: 'Images point at a path like `product.imageUrl` and 404.',
      cause: 'Missing `:` — the attribute is the literal expression text.',
      fix: 'Write `:src="product.imageUrl"`.',
    },
    {
      symptom: 'A child component warns `Invalid prop: type check failed for prop "max". Expected Number, got String`.',
      cause: 'The prop was passed as a static attribute (`max="5"`).',
      fix: 'Bind it so it is evaluated as JavaScript: `:max="5"`.',
    },
    {
      symptom: 'A dynamic argument like `:[ \'aria-\' + name ]` does not compile.',
      cause: 'Dynamic argument expressions cannot contain spaces or quotes.',
      fix: 'Move the expression into a computed property and bind `:[attrName]`.',
    },
  ],

  bestPractices: [
    'Use the `:` shorthand everywhere; it is what the whole Vue ecosystem writes.',
    'Bind `null` to remove an attribute; rely on `false` only for boolean attributes.',
    'Bind ARIA attributes to the same state that drives the visuals.',
    'Use `v-bind="obj"` for groups of attributes you control — never for untrusted data.',
    'Validate user-supplied URLs; add `rel="noopener noreferrer"` to `target="_blank"` links.',
    'Bind numbers and booleans with `:` so components receive real types, not strings.',
  ],

  useCases: [
    'Links and images from data: `:href`, `:src`, `:alt`.',
    'Form states and constraints: `:disabled`, `:required`, `:maxlength`, `:placeholder`.',
    'Accessibility state: `:aria-expanded`, `:aria-pressed`, `:aria-invalid`, `:aria-label`.',
    'Custom data attributes for analytics or tests: `:data-product-id`.',
    'Passing props to child components: `<ProductCard :product="item" :on-sale="true" />`.',
  ],

  whenToUse: {
    use: [
      'Any attribute or prop whose value depends on data.',
      'Any non-string value you pass to a component (numbers, booleans, objects, arrays).',
      'Boolean attributes that should switch on and off.',
    ],
    avoid: [
      'Attributes that never change — write them statically (`type="button"`, `max="10"`).',
      'Building classes and inline styles with string concatenation — use the object/array syntax of `:class` and `:style`.',
      'Spreading objects from untrusted sources with `v-bind="…"`.',
    ],
  },

  comparison: {
    title: 'Four ways to set an attribute',
    headers: ['', 'Static `href="/about"`', '`:href="url"`', '`href="{{ url }}"`', 'Plain JS `setAttribute`'],
    rows: [
      ['Value', 'fixed text', 'a JavaScript expression', 'the literal text `{{ url }}`', 'whatever you set'],
      ['Updates when data changes', 'never (it is fixed)', 'automatically', 'never — it does not work', 'only when you call it again'],
      ['Removing the attribute', 'delete it from the markup', 'bind `null` (or falsy for boolean attrs)', '—', '`removeAttribute()`'],
      ['Use it for', 'constants', 'anything data-driven', 'nothing (mistake)', 'non-Vue code only'],
    ],
  },

  quiz: [
    {
      id: 'v-bind-q1',
      type: 'mcq',
      prompt: '`<a :href="url">` is shorthand for…',
      options: [
        { text: '`<a v-bind:href="url">`' },
        { text: '`<a v-on:href="url">`', why: '`v-on` is for events and its shorthand is `@`.' },
        { text: '`<a href="{{ url }}">`', why: 'Mustaches do not work in attributes; that renders the literal text.' },
        { text: '`<a v-model:href="url">`', why: '`v-model` is for two-way binding of form inputs and components.' },
      ],
      answer: 0,
      explanation: '`:` is the shorthand for `v-bind:`. Both bind the attribute to a JavaScript expression.',
    },
    {
      id: 'v-bind-q2',
      type: 'output',
      prompt: 'With `const count = ref(2)`, what does Vue render for this button?',
      code: { lang: 'vue', code: `<button :disabled="count > 3">Add</button>` },
      options: [
        { text: '`<button>Add</button>`' },
        { text: '`<button disabled="false">Add</button>`', why: '`disabled` is a boolean attribute, so a falsy value removes it instead of writing "false".' },
        { text: '`<button disabled="">Add</button>`', why: '`2 > 3` is false, and a false boolean attribute is removed.' },
        { text: '`<button :disabled="count > 3">Add</button>`', why: 'The `:` syntax only exists in the template; the DOM never contains it.' },
      ],
      answer: 0,
      explanation: '`count > 3` is `false`, so Vue omits the boolean `disabled` attribute entirely.',
    },
    {
      id: 'v-bind-q3',
      type: 'output',
      prompt: 'With `const open = ref(false)`, what does Vue 3 render?',
      code: { lang: 'vue', code: `<button :aria-expanded="open">Menu</button>` },
      options: [
        { text: '`<button aria-expanded="false">Menu</button>`' },
        { text: '`<button>Menu</button>`', why: 'Only *boolean* attributes are removed for `false`. `aria-expanded` is not one, so Vue 3 keeps it as the text "false".' },
        { text: '`<button aria-expanded="">Menu</button>`', why: 'An empty value is what boolean attributes get when truthy; this is not a boolean attribute.' },
        { text: '`<button aria-expanded="null">Menu</button>`', why: 'The value is `false`, and it is written as the string "false".' },
      ],
      answer: 0,
      explanation: 'Vue 3 writes `false` as `"false"` for non-boolean attributes — which is exactly what ARIA attributes need. Bind `null` to remove an attribute.',
    },
    {
      id: 'v-bind-q4',
      type: 'bug',
      prompt: 'The product image never loads — the browser requests a file called `product.imageUrl`. Click the buggy line.',
      code: {
        lang: 'vue',
        code: `<script setup>
const product = {
  name: 'Desk lamp',
  imageUrl: '/img/lamp.png',
}
</script>

<template>
  <h2>{{ product.name }}</h2>
  <img src="product.imageUrl" :alt="product.name" />
</template>`,
      },
      answerLine: 10,
      explanation: '`src` has no colon, so it is the static string "product.imageUrl". Write `:src="product.imageUrl"`.',
    },
    {
      id: 'v-bind-q5',
      type: 'fill',
      prompt: 'Bind the link to the user\'s profile page, e.g. `/users/7` (shorthand or full form).',
      code: { lang: 'vue', code: `<a ___="'/users/' + user.id">Profile</a>` },
      answer: [[':href', 'v-bind:href']],
      explanation: '`:href` evaluates `\'/users/\' + user.id` as JavaScript and keeps the attribute in sync.',
    },
    {
      id: 'v-bind-q6',
      type: 'mcq',
      prompt: 'Which value reliably **removes** any attribute (boolean or not) when bound with `v-bind`?',
      options: [
        { text: '`null` (or `undefined`)' },
        { text: '`false`', why: '`false` removes boolean attributes only; other attributes get the text "false" in Vue 3.' },
        { text: '`\'\'` (empty string)', why: 'An empty string keeps the attribute — for boolean attributes it even counts as "on".' },
        { text: '`0`', why: '`0` is written as the text "0" for normal attributes.' },
      ],
      answer: 0,
      explanation: '`null` and `undefined` mean "no attribute" for every kind of attribute.',
    },
    {
      id: 'v-bind-q7',
      type: 'short',
      prompt: 'Users can enter a "website" on their profile, which you render as `<a :href="user.website">`. Why is that risky, and what would you do?',
      answer: 'Vue escapes text but does not sanitise URLs, so a user could save `javascript:...` and run code when someone clicks the link. Validate URLs on the server when saving (allow only http/https), optionally check the scheme again on the client, and add `rel="noopener noreferrer"` for links opened in a new tab.',
    },
  ],

  exercises: [
    {
      id: 'contact-card',
      title: 'Wire up a contact card',
      difficulty: 'beginner',
      prompt: `
Bind the attributes of this contact card to \`user\`:

- \`<img class="avatar">\`: \`src\` = \`user.avatar\`, \`alt\` = **Photo of** + the name (e.g. "Photo of Ada Lovelace").
- \`<a class="email">\`: \`href\` = \`mailto:\` + the email.
- \`<button class="call">\`: **disabled** when \`user.phone\` is empty.
- The tests change \`user\`, so every attribute must really be bound.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '',
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%23ffe14d'/%3E%3C/svg%3E",
})
</script>

<template>
  <article class="contact">
    <img class="avatar" width="64" height="64" />
    <h2>{{ user.name }}</h2>
    <a class="email">Send email</a>
    <button class="call">Call</button>
  </article>
</template>`,
      },
      hints: [
        'Every attribute that depends on `user` needs a `:` in front of it.',
        "Build strings with `+`: `:alt=\"'Photo of ' + user.name\"` and `:href=\"'mailto:' + user.email\"`.",
        'An empty string is falsy, so `:disabled="!user.phone"` disables the button until a phone number exists.',
      ],
      solution: {
        explanation: 'Each attribute is now a rule that reads from `user`. When the tests change the phone or the name, Vue re-evaluates the bindings and patches only the attributes whose values changed.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const user = ref({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  phone: '',
  avatar: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%23ffe14d'/%3E%3C/svg%3E",
})
</script>

<template>
  <article class="contact">
    <img class="avatar" width="64" height="64" :src="user.avatar" :alt="'Photo of ' + user.name" />
    <h2>{{ user.name }}</h2>
    <a class="email" :href="'mailto:' + user.email">Send email</a>
    <button class="call" :disabled="!user.phone">Call</button>
  </article>
</template>`,
        },
      },
      tests: [
        { name: 'avatar src and alt', code: `expect(attr('.avatar', 'src')).toBe(state.user.avatar); expect(attr('.avatar', 'alt')).toBe('Photo of Ada Lovelace')` },
        { name: 'mailto link', code: `expect(attr('.email', 'href')).toBe('mailto:ada@example.com')` },
        {
          name: 'call button follows the phone number',
          code: `expect(find('.call').disabled).toBe(true)
state.user.phone = '+44 20 7946 0000'
await nextTick()
expect(find('.call').disabled).toBe(false)`,
        },
        {
          name: 'alt text follows the name',
          code: `state.user.name = 'Grace Hopper'
await nextTick()
expect(attr('.avatar', 'alt')).toBe('Photo of Grace Hopper')`,
        },
      ],
    },
    {
      id: 'field-config',
      title: 'Bind a whole attribute object',
      difficulty: 'beginner',
      prompt: `
A form-builder gives you an object of attributes for one field. Bind the **whole object** onto \`<input class="field">\` with \`v-bind="fieldAttrs"\`, and make the **Optional** button toggle \`fieldAttrs.required\`.

Expected DOM at the start: \`type="email"\`, \`placeholder="you@example.com"\`, \`maxlength="60"\` and the \`required\` attribute. After clicking \`.toggle-required\`, \`required\` must disappear; clicking again brings it back.
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const fieldAttrs = ref({
  type: 'email',
  placeholder: 'you@example.com',
  maxlength: 60,
  required: true,
})
</script>

<template>
  <label>
    Email
    <input class="field" />
  </label>
  <button class="toggle-required">Optional</button>
</template>`,
      },
      hints: [
        '`v-bind` without an argument takes an object: `<input class="field" v-bind="fieldAttrs" />`.',
        'For the button: `@click="fieldAttrs.required = !fieldAttrs.required"`.',
        'Because `required` is a boolean attribute, `false` removes it — no extra code needed.',
      ],
      solution: {
        explanation: 'Object binding spreads every key as an attribute and keeps them reactive. Flipping `required` to `false` removes the boolean attribute; `maxlength: 60` becomes `maxlength="60"`.',
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const fieldAttrs = ref({
  type: 'email',
  placeholder: 'you@example.com',
  maxlength: 60,
  required: true,
})
</script>

<template>
  <label>
    Email
    <input class="field" v-bind="fieldAttrs" />
  </label>
  <button class="toggle-required" @click="fieldAttrs.required = !fieldAttrs.required">Optional</button>
</template>`,
        },
      },
      tests: [
        {
          name: 'all attributes are bound',
          code: `expect(attr('.field', 'type')).toBe('email')
expect(attr('.field', 'placeholder')).toBe('you@example.com')
expect(attr('.field', 'maxlength')).toBe('60')
expect(find('.field').hasAttribute('required')).toBe(true)`,
        },
        {
          name: 'the button toggles required',
          code: `await click('.toggle-required')
expect(find('.field').hasAttribute('required')).toBe(false)
await click('.toggle-required')
expect(find('.field').hasAttribute('required')).toBe(true)`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'v-bind-why',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What does `v-bind` do, and why can\'t you just use `{{ }}` inside an attribute?',
      answer: '`v-bind:attr="expression"` (shorthand `:attr`) keeps an attribute or DOM property in sync with a JavaScript expression. Mustache interpolation only works in text content; inside an attribute it is treated as literal characters, so `href="{{ url }}"` renders the text `{{ url }}`.',
      explanation: 'Text → `{{ }}`. Attributes → `:`.',
      whyAsked: 'Fundamental — and a very common beginner bug.',
      mistakes: ['Thinking mustaches work in attributes as in Vue 1 or some other template languages.', 'Not knowing the shorthand.'],
      followUps: ['What happens if the expression returns null?', 'What is the same-name shorthand?'],
      modelAnswer: "v-bind connects an attribute to a JavaScript expression, so the attribute always reflects the current state — I normally write the colon shorthand, like :href or :disabled. Mustaches are only for text content; in an attribute they're just characters, so the browser would get the literal braces. With v-bind, Vue evaluates the expression on every render and only touches the DOM when the value actually changes.",
    },
    {
      id: 'v-bind-false-values',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 3,
      question: 'In Vue 3, what do these render? `<button :disabled="false">`, `<div :aria-hidden="false">`, `<img :title="null">`',
      options: [
        'disabled removed · aria-hidden="false" · title removed',
        'disabled="false" · aria-hidden="false" · title="null"',
        'disabled removed · aria-hidden removed · title removed',
        'disabled="" · aria-hidden="" · title=""',
      ],
      correctOption: 0,
      answer: '`disabled` is a boolean attribute, so `false` removes it. `aria-hidden` is not boolean, so Vue 3 renders `aria-hidden="false"`. `null` removes any attribute, so there is no `title`.',
      explanation: 'Boolean attributes: falsy → removed. Other attributes: `false` → "false". `null`/`undefined` → always removed.',
      whyAsked: 'Tests precise knowledge of a Vue 3 change that matters for accessibility.',
      mistakes: ['Assuming `false` removes every attribute (Vue 2 behaviour for many attributes).', 'Not knowing which attributes count as boolean.'],
      followUps: ['Why is the Vue 3 behaviour better for ARIA?', 'How would you remove aria-hidden conditionally?'],
      modelAnswer: "The button has no disabled attribute, because disabled is a boolean attribute and Vue removes it for falsy values. The div gets aria-hidden equals the string false, because in Vue 3 non-boolean attributes keep false as text — which is what ARIA expects. The img has no title, because null and undefined always remove the attribute. So: null to remove anything, booleans for boolean attributes.",
    },
    {
      id: 'v-bind-attr-vs-prop',
      difficulty: 'advanced',
      type: 'conceptual',
      minutes: 4,
      question: 'What is the difference between an HTML attribute and a DOM property, and how does Vue decide which one to set for a binding?',
      answer: 'Attributes are the strings in markup (`getAttribute`); properties are fields on the live element object and can be any type (`input.value`, `el.checked`). They often start linked but can diverge (typing changes `input.value`, not the `value` attribute). For a binding, Vue sets a DOM property when the element has a property with that name (`key in el`), except for a list of keys that must be attributes; otherwise it sets the attribute. `.prop` forces a property and `.attr` forces an attribute.',
      explanation: 'Vue mostly picks correctly; the modifiers exist for custom elements and edge cases.',
      code: {
        lang: 'vue',
        code: `<input :value="name" />              <!-- DOM property: input.value -->
<div :data-id="id"></div>          <!-- attribute: data-id -->
<my-chart .config="chartConfig" />  <!-- force property on a custom element -->`,
      },
      whyAsked: 'Distinguishes deep DOM knowledge; relevant when integrating web components or debugging form inputs.',
      mistakes: ['Thinking attributes and properties are the same thing.', 'Not knowing `.prop`/`.attr` exist.'],
      followUps: ['Why does typing into an input not change its `value` attribute?', 'How does this matter for web components?'],
      modelAnswer: "An attribute is the string in the HTML; a property is a field on the DOM object, which can hold any type and may diverge from the attribute — typing into an input changes input.value but not the value attribute. When I bind something, Vue checks whether the element has a property with that key and, apart from a few keys that must stay attributes, sets the property; otherwise it sets the attribute. For custom elements or edge cases I can force it with .prop or .attr, or their shorthands, the dot and the caret.",
    },
    {
      id: 'v-bind-always-disabled',
      difficulty: 'beginner',
      type: 'debugging',
      minutes: 2,
      question: 'A Submit button is disabled even when the form is valid. The template has `<button disabled="!canSubmit">Submit</button>`. What is wrong?',
      answer: 'The colon is missing, so `disabled` is a static attribute with the string value "!canSubmit". A boolean attribute that is present at all disables the button. Fix: `:disabled="!canSubmit"`.',
      explanation: 'Without `v-bind`, Vue never evaluates the expression.',
      whyAsked: 'A frequent real bug; tests attention to detail and understanding of boolean attributes.',
      mistakes: ['Looking for a bug in `canSubmit` logic first.', 'Thinking `disabled="false"` would enable the button.'],
      followUps: ['Would `disabled="false"` enable it?', 'How would you also communicate this to screen readers?'],
      modelAnswer: "It's missing the colon, so the attribute is the literal text '!canSubmit'. For a boolean attribute like disabled, the mere presence of the attribute disables the button, whatever the text says. Binding it with :disabled makes Vue evaluate the expression and add or remove the attribute. Even disabled='false' as a static attribute would still disable it.",
    },
    {
      id: 'v-bind-user-urls',
      difficulty: 'advanced',
      type: 'scenario',
      minutes: 4,
      question: 'Profiles show a user-supplied website (`<a :href="user.website" target="_blank">`) and, for flexibility, an `extraAttrs` object from the API spread with `v-bind`. A security review flags both. What are the risks and how do you fix them?',
      answer: 'Vue does not sanitise URLs, so `javascript:` URLs can execute code when clicked; validate on save (allowlist `http:`/`https:`) and optionally re-check on render. `target="_blank"` to untrusted sites needs `rel="noopener noreferrer"`. Spreading an untrusted object can inject arbitrary attributes — including inline handlers such as `onclick` with a string value, which the browser executes — so bind only known keys explicitly. Server-side validation is the real defence.',
      explanation: 'Escaping text is automatic; URLs and attribute names are not.',
      code: {
        lang: 'vue',
        code: `<script setup>
import { computed } from 'vue'
const props = defineProps({ user: Object })
const safeWebsite = computed(() => {
  try {
    const url = new URL(props.user.website)
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
})
</script>

<template>
  <a v-if="safeWebsite" :href="safeWebsite" target="_blank" rel="noopener noreferrer">Website</a>
</template>`,
      },
      whyAsked: 'Security-minded frontend work is expected at mid/senior level; Vue\'s security guide calls out these exact cases.',
      mistakes: ['Saying "Vue escapes everything, so it is safe".', 'Fixing only on the client.', 'Forgetting `rel` on `target="_blank"`.'],
      followUps: ['How does `v-html` compare?', 'What would a Content Security Policy add?'],
      modelAnswer: "Vue escapes text content, but it doesn't sanitise URLs or attribute names. A website value like javascript:alert(1) would run when clicked, so the server should validate on save with an http/https allowlist, and I'd re-check on render with a computed that returns null for anything else. Links opening in a new tab to untrusted sites get rel noopener noreferrer. Spreading an API object with v-bind is worse: it can add any attribute, including onclick strings that the browser executes, so I'd bind known keys explicitly. A Content Security Policy is good defence in depth on top.",
    },
    {
      id: 'v-bind-string-vs-number',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 2,
      question: 'What is the difference between `<Pager total="10" />` and `<Pager :total="10" />`?',
      answer: 'Without `:`, the prop receives the string "10". With `:`, the value is the JavaScript expression `10`, so the prop receives the number 10. The same applies to booleans (`"false"` is a truthy string), arrays and objects. If the prop is declared as `Number`, the static version triggers a type warning.',
      explanation: 'Static attributes are always strings; bound attributes are JavaScript values.',
      whyAsked: 'Common source of subtle bugs (`"10" + 1 === "101"`) and prop validation warnings.',
      mistakes: ['Assuming Vue converts types automatically.', 'Passing `disabled="false"` and expecting false.'],
      followUps: ['How do you pass a boolean prop as true with no value?', 'How would prop validation surface this bug?'],
      modelAnswer: "Static attributes are always strings, so total equals '10' passes the string ten, while :total equals 10 evaluates JavaScript and passes the number. With a prop declared as Number, the static version gives a type warning, and math on it can go wrong, like string concatenation. Booleans are the classic trap: a static 'false' is a non-empty, truthy string. So any non-string value gets a colon.",
    },
    {
      id: 'v-bind-coding-pager',
      difficulty: 'beginner',
      type: 'coding',
      minutes: 6,
      question: 'Finish the pager: `.prev` is disabled on page 1, `.next` is disabled on the last page, and `.page-label` has `aria-label` = **Page X of Y**.',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const page = ref(1)
const totalPages = 3
</script>

<template>
  <nav class="pager">
    <button class="prev" @click="page--">Previous</button>
    <span class="page-label">{{ page }} / {{ totalPages }}</span>
    <button class="next" @click="page++">Next</button>
  </nav>
</template>`,
        },
      },
      tests: [
        { name: 'on page 1: prev disabled, next enabled', code: `expect(find('.prev').disabled).toBe(true); expect(find('.next').disabled).toBe(false)` },
        { name: 'aria-label describes the page', code: `expect(attr('.page-label', 'aria-label')).toBe('Page 1 of 3'); await click('.next'); expect(attr('.page-label', 'aria-label')).toBe('Page 2 of 3')` },
        {
          name: 'on the last page: next disabled',
          code: `await click('.next')
await click('.next')
expect(text('.page-label')).toBe('3 / 3')
expect(find('.next').disabled).toBe(true)
expect(find('.prev').disabled).toBe(false)`,
        },
      ],
      hints: ['`:disabled="page === 1"` on Previous.', "Build the label: `:aria-label=\"'Page ' + page + ' of ' + totalPages\"`."],
      answer: 'Bind `:disabled` on both buttons to boundary checks and build the `aria-label` from `page` and `totalPages`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref } from 'vue'

const page = ref(1)
const totalPages = 3
</script>

<template>
  <nav class="pager">
    <button class="prev" :disabled="page === 1" @click="page--">Previous</button>
    <span class="page-label" :aria-label="'Page ' + page + ' of ' + totalPages">{{ page }} / {{ totalPages }}</span>
    <button class="next" :disabled="page === totalPages" @click="page++">Next</button>
  </nav>
</template>`,
        },
      },
      explanation: 'Disabled states and accessible labels are derived from the same `page` state as the visible text, so they can never disagree.',
      whyAsked: 'A small, realistic component that combines boolean attributes and accessibility.',
      mistakes: ['Guarding only in the click handler and leaving buttons clickable.', 'Forgetting accessible labels.'],
      followUps: ['Should the click handlers still guard the boundaries?', 'How would you announce page changes to screen readers?'],
      modelAnswer: "I'd bind disabled on Previous to page equals one and on Next to page equals totalPages, and build the aria-label from the same state. Everything derives from page, so the visuals, the disabled states and the screen-reader label always agree. In production I'd also guard in the handlers, since disabled is UI, not enforcement.",
    },
  ],

  takeaways: [
    '`v-bind:attr="expr"` — almost always written `:attr="expr"` — keeps an attribute in sync with data.',
    'Mustaches don\'t work in attributes; `:` does.',
    '`null`/`undefined` remove any attribute; `false` removes only boolean attributes (others get "false" in Vue 3).',
    '`v-bind="obj"` binds many attributes; `:id` alone is the same-name shorthand (3.4+).',
    'Static attributes are strings; bind with `:` to pass numbers, booleans and objects.',
    'Vue does not sanitise URLs — validate user-supplied links.',
  ],
}
