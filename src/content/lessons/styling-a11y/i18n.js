// Lesson: Internationalization, localization & RTL — Intl APIs, a simplified
// home-made i18n plugin, vue-i18n (static), plurals and right-to-left layouts.

const mainJs = `import { createApp } from 'vue'
import App from './App.vue'
import { createI18n } from './i18n.js'
import messages from './messages.js'

const i18n = createI18n({ locale: 'en-US', fallbackLocale: 'en-US', messages })

createApp(App).use(i18n).mount('#app')`

const i18nJs = `import { ref, inject } from 'vue'

const I18N_KEY = Symbol('i18n')

// A deliberately small i18n plugin — SIMPLIFIED for learning.
// vue-i18n adds message compilation, named number/date formats, lazy loading,
// missing-key warnings, SSR support and devtools integration.
export function createI18n({ locale = 'en-US', fallbackLocale = 'en-US', messages = {} }) {
  const current = ref(locale)

  function lookup(loc, key) {
    return key.split('.').reduce((node, part) => node?.[part], messages[loc])
  }

  function n(value, options) {
    return new Intl.NumberFormat(current.value, options).format(value)
  }

  function d(value, options) {
    return new Intl.DateTimeFormat(current.value, options).format(value)
  }

  function t(key, params = {}) {
    let message = lookup(current.value, key) ?? lookup(fallbackLocale, key)
    if (message === undefined) return key // show the key so gaps are visible
    if (typeof message === 'object') {
      // Plural forms like { one, few, many, other }, chosen by the locale's own rules
      const category = new Intl.PluralRules(current.value).select(params.count ?? 0)
      message = message[category] ?? message.other
    }
    return message.replace(/\\{(\\w+)\\}/g, (match, name) => {
      if (!(name in params)) return match
      const value = params[name]
      return typeof value === 'number' ? n(value) : String(value) // localise numbers too
    })
  }

  const i18n = { locale: current, availableLocales: Object.keys(messages), t, n, d }

  return {
    ...i18n,
    install(app) {
      app.provide(I18N_KEY, i18n)
      app.config.globalProperties.$t = t
    },
  }
}

export function useI18n() {
  const i18n = inject(I18N_KEY, null)
  if (!i18n) throw new Error('useI18n() needs app.use(i18n) first')
  return i18n
}`

const messagesBroken = `export default {
  'en-US': {
    title: 'Shop',
    language: 'Language',
    addToCart: 'Add to cart',
    added: 'Added {when}',
    cart: '{count} items in your cart', // one string for every count…
    cities: 'Pick-up points',
    updated: 'Prices updated on {date}',
  },
  'de-DE': {
    title: 'Shop',
    language: 'Sprache',
    addToCart: 'In den Warenkorb',
    added: 'Hinzugefügt {when}',
    cart: '{count} Artikel im Warenkorb', // German "Artikel" is the same in singular and plural
    cities: 'Abholstellen',
    updated: 'Preise aktualisiert am {date}',
  },
  'ar-EG': {
    title: 'المتجر',
    language: 'اللغة',
    addToCart: 'أضف إلى السلة',
    added: 'أضيف {when}',
    // Arabic uses all six plural categories
    cart: {
      zero: 'السلة فارغة',
      one: 'منتج واحد في السلة',
      two: 'منتجان في السلة',
      few: '{count} منتجات في السلة',
      many: '{count} منتجًا في السلة',
      other: '{count} منتج في السلة',
    },
    cities: 'نقاط الاستلام',
    updated: 'آخر تحديث للأسعار: {date}',
  },
}`

const messagesFixed = messagesBroken
  .replace(
    "cart: '{count} items in your cart', // one string for every count…",
    "cart: { one: '{count} item in your cart', other: '{count} items in your cart' },",
  )
  .replace(
    /\n}$/,
    `
  'fr-FR': {
    title: 'Boutique',
    language: 'Langue',
    addToCart: 'Ajouter au panier',
    added: 'Ajouté {when}',
    // French uses the singular for 0 and 1
    cart: { one: '{count} article dans votre panier', other: '{count} articles dans votre panier' },
    cities: 'Points de retrait',
    updated: 'Prix mis à jour le {date}',
  },
}`,
  )

const appBroken = `<script setup>
import { ref, computed } from 'vue'
import { useI18n } from './i18n.js'
import ProductCard from './ProductCard.vue'

const { locale, availableLocales, t, d } = useI18n()

const products = [
  { id: 1, name: 'Trail shoes', price: 89.9, addedDaysAgo: 3 },
  { id: 2, name: 'Rain jacket', price: 129, addedDaysAgo: 0 },
  { id: 3, name: 'Wool socks', price: 12.5, addedDaysAgo: 1 },
]
const cities = ['Zürich', 'Oslo', 'Århus', 'Berlin', 'Écully', 'Ängelholm']
const cartCount = ref(0)
const pricesUpdated = new Date(2026, 0, 15)

// Each language named in its own language: "Deutsch (Deutschland)", "العربية (مصر)"…
const languageName = (tag) => new Intl.DisplayNames([tag], { type: 'language' }).of(tag)

const sortedCities = computed(() => [...cities].sort())
</script>

<template>
  <div class="shop" :lang="locale">
    <header class="top">
      <h1>{{ t('title') }}</h1>
      <label class="picker">
        {{ t('language') }}
        <select v-model="locale" class="locale">
          <option v-for="tag in availableLocales" :key="tag" :value="tag">{{ languageName(tag) }}</option>
        </select>
      </label>
    </header>

    <p class="cart-summary">{{ t('cart', { count: cartCount }) }}</p>

    <ul class="products">
      <ProductCard v-for="p in products" :key="p.id" :product="p" @add="cartCount++" />
    </ul>

    <h2>{{ t('cities') }}</h2>
    <ul class="cities">
      <li v-for="city in sortedCities" :key="city">{{ city }}</li>
    </ul>

    <p class="updated">{{ t('updated', { date: d(pricesUpdated, { dateStyle: 'long' }) }) }}</p>
  </div>
</template>

<style>
.shop { font-family: system-ui, sans-serif; max-width: 30rem; color: #111827; }
.top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.5rem; }
.products, .cities { padding: 0; }
.cities li { list-style: none; }
.updated { color: #4b5563; font-size: 0.9rem; }
</style>`

const appFixed = appBroken
  .replace(
    "const sortedCities = computed(() => [...cities].sort())",
    `const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur']
const dir = computed(() => (RTL_LANGUAGES.includes(new Intl.Locale(locale.value).language) ? 'rtl' : 'ltr'))

// Locale-aware alphabetical order (Swedish puts Å and Ä after Z!)
const sortedCities = computed(() => [...cities].sort(new Intl.Collator(locale.value).compare))`,
  )
  .replace('<div class="shop" :lang="locale">', '<div class="shop" :lang="locale" :dir="dir">')

const cardBroken = `<script setup>
import { computed } from 'vue'
import { useI18n } from './i18n.js'

const props = defineProps({ product: { type: Object, required: true } })
const emit = defineEmits(['add'])
const { locale, t, n } = useI18n()

// The shop charges in euros whatever language you read it in.
const price = computed(() => n(props.product.price, { style: 'currency', currency: 'EUR' }))

const added = computed(() => {
  const rtf = new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' })
  return t('added', { when: rtf.format(-props.product.addedDaysAgo, 'day') })
})
</script>

<template>
  <li class="card">
    <h3 class="name">{{ product.name }}</h3>
    <p class="price">{{ price }}</p>
    <p class="added">{{ added }}</p>
    <button type="button" class="add-to-cart" @click="emit('add')">
      {{ t('addToCart') }} <span class="arrow" aria-hidden="true">→</span>
    </button>
  </li>
</template>

<style scoped>
.card { list-style: none; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.25rem 1rem; padding: 0.75rem 0; border-bottom: 1px solid #ddd; text-align: left; }
.name { margin: 0; font-size: 1rem; }
.price { margin: 0 0 0 auto; font-weight: 700; }
.added { width: 100%; margin: 0; color: #4b5563; }
.add-to-cart { margin-left: auto; padding: 0.3rem 0.75rem; border: 1px solid #767676; border-radius: 6px; background: #fff; cursor: pointer; }
</style>`

const cardFixed = cardBroken
  .replace('text-align: left; }', 'text-align: start; }')
  .replace('.price { margin: 0 0 0 auto;', '.price { margin: 0; margin-inline-start: auto;')
  .replace('.add-to-cart { margin-left: auto;', '.add-to-cart { margin-inline-start: auto;')
  .replace(
    '</style>',
    `/* Mirror icons that point "forward" in right-to-left layouts */
[dir='rtl'] .arrow { display: inline-block; transform: scaleX(-1); }
</style>`,
  )

const startFiles = {
  'main.js': mainJs,
  'App.vue': appBroken,
  'ProductCard.vue': cardBroken,
  'i18n.js': i18nJs,
  'messages.js': messagesBroken,
}

const norm = `const norm = (s) => s.replace(/\\s+/g, ' ').trim()`

export default {
  id: 'i18n',
  title: 'Internationalization, localization & RTL',
  summary: 'Prepare a Vue app for any language and region: translated messages with plurals, locale-aware numbers, dates and sorting with Intl, and layouts that flip for right-to-left scripts.',
  difficulty: 'intermediate',
  minutes: 55,
  prerequisites: ['provide-inject', 'computed', 'plugins-app-config'],
  related: ['accessibility-fundamentals', 'styling-in-vue', 'responsive-dynamic-styles', 'composable-design', 'lazy-routes-scroll', 'hydration', 'design-systems'],
  tags: ['i18n', 'l10n', 'internationalization', 'localization', 'Intl', 'NumberFormat', 'DateTimeFormat', 'PluralRules', 'RelativeTimeFormat', 'ListFormat', 'Collator', 'vue-i18n', 'rtl', 'dir', 'lang', 'logical properties', 'BCP 47'],
  apis: [
    { name: 'Intl.NumberFormat', summary: 'Locale-aware numbers, currencies, percentages, units and compact notation.' },
    { name: 'Intl.DateTimeFormat', summary: 'Locale-aware dates and times, including time zones (`timeZone` option).' },
    { name: 'Intl.RelativeTimeFormat', summary: 'Phrases like "yesterday", "in 3 days", "vor 3 Tagen".' },
    { name: 'Intl.PluralRules', summary: 'Returns the plural category (zero, one, two, few, many, other) a number needs in a language.' },
    { name: 'Intl.ListFormat', summary: 'Joins lists the local way: "tea, coffee, and juice" / "tea, coffee und juice".' },
    { name: 'Intl.Collator', summary: 'Locale-aware string comparison for sorting and searching.' },
    { name: 'Intl.DisplayNames', summary: 'Names of languages, regions and currencies in a given language.' },
    { name: 'dir / lang attributes', summary: 'Declare text direction (`ltr`, `rtl`, `auto`) and language on an element.' },
  ],
  docs: [
    { label: 'Vue Guide — Plugins (an i18n plugin example)', url: 'https://vuejs.org/guide/reusability/plugins.html' },
    { label: 'Vue I18n documentation', url: 'https://vue-i18n.intlify.dev/' },
    { label: 'MDN — Intl', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl' },
    { label: 'W3C — Language tags in HTML and XML', url: 'https://www.w3.org/International/articles/language-tags/' },
    { label: 'W3C — Structural markup and right-to-left text in HTML', url: 'https://www.w3.org/International/questions/qa-html-dir' },
    { label: 'MDN — CSS logical properties and values', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values' },
  ],

  intro: `
**Internationalization** (*i18n* — "i", eighteen letters, "n") is the engineering work that lets an app *adapt* to different languages and regions: no hard-coded text, no hard-coded formats, layouts that can flip direction.

**Localization** (*l10n*) is the adaptation itself for one *locale* — a language plus regional conventions, written as a *BCP 47 language tag* like \`en-US\`, \`de-DE\`, \`pt-BR\` or \`ar-EG\`. It means translated text, the local way to write \`1,234.50\` (or \`1.234,50\`), dates, plural forms, sort order — and for Arabic, Hebrew, Persian or Urdu, a right-to-left layout.

Vue core doesn't include an i18n system. You get two things: the browser's built-in **\`Intl\`** APIs for formatting, and a translation layer — either a small plugin you write (you'll build one) or a library such as **vue-i18n**.
`,

  why: `
Look at a piece of code that seems harmless:

\`\`\`js
const label = 'You have ' + count + ' items. Total: $' + total.toFixed(2)
\`\`\`

It breaks in many ways at once. "1 items" is wrong even in English. Other languages put the number in a different place in the sentence, or have three, four or six plural forms. German writes \`1.234,50\`, not \`1234.50\`. The currency is hard-coded. And a translator can't translate "You have" without seeing the whole sentence.

Retrofitting i18n into a large app means finding every such string and format by hand. Building it in from the start costs little: messages live in one place, formatting goes through \`Intl\`, CSS uses direction-neutral properties — and adding a language becomes a translation task, not a refactor.
`,

  eli15: `
Imagine writing a comic that will be printed in many countries.

- You don't draw the words *into* the picture — you leave **speech bubbles** and keep the text in a separate file per language. That's *messages*: \`t('addToCart')\` looks up "Add to cart", "In den Warenkorb" or "أضف إلى السلة".
- Prices, dates and numbers are written differently around the world. Instead of memorising every country's rules, you ask a built-in expert, **\`Intl\`**, to write them: \`€1,234.50\` in the US, \`1.234,50 €\` in Germany.
- Some languages count differently: English has "1 item / 2 items", Polish has more forms, Arabic has six. \`Intl.PluralRules\` tells you which form a number needs.
- Arabic and Hebrew are read **right to left**, so the whole page should flip like a mirror. One attribute, \`dir="rtl"\`, plus CSS that says "start/end" instead of "left/right" does most of the work.
`,

  analogy: {
    title: 'A comic printed in many countries',
    body: `
A smart comic publisher prepares pages with empty speech bubbles and keeps every language's text in its own file. Prices on the shop sign are filled in by a local printer who knows the local currency format. For the Arabic edition, the pages are mirrored so the story flows from right to left — but the publisher's logo is *not* mirrored.

Your Vue app works the same way: templates have *keys* instead of text, \`Intl\` is the local printer, and \`dir="rtl"\` with logical CSS mirrors the layout while things that aren't directional stay as they are.
`,
    mapping: [
      ['empty speech bubbles', 'message keys in templates: `t(\'addToCart\')`'],
      ['one text file per language', 'a messages object per locale (`en-US`, `de-DE`, `ar-EG`)'],
      ['the local printer who knows formats', '`Intl.NumberFormat`, `DateTimeFormat`, `PluralRules`…'],
      ['mirroring pages for Arabic', '`dir="rtl"` + CSS logical properties'],
      ['the logo that is never mirrored', 'icons and content without direction (logos, checkmarks, clocks)'],
      ['the edition label on the cover', 'the `lang` attribute: tells browsers and screen readers the language'],
    ],
  },

  visual: {
    type: 'concept-diagram',
    title: 'What happens inside t(\'cart\', { count: 3 })',
    caption: 'A translation call is a small pipeline: look up, choose a plural form, fill in placeholders with localised values.',
    alt: 'A left-to-right pipeline of five boxes: the call t cart with count 3; message lookup in the current locale with fallback; Intl.PluralRules choosing the category few for 3 in Arabic; interpolation where the count placeholder becomes the localised number; and the rendered sentence inside an element with lang and dir attributes.',
    props: {
      layout: 'row',
      nodes: [
        { id: 'call', label: "t('cart', { count: 3 })", note: 'in a template', tone: 'acid' },
        { id: 'lookup', label: 'Message lookup', note: 'messages[locale] → fallback', tone: 'paper' },
        { id: 'plural', label: 'Plural category', note: 'Intl.PluralRules → "few"', tone: 'cobalt' },
        { id: 'fill', label: 'Interpolation', note: '{count} → n(3) → "٣"', tone: 'kraft' },
        { id: 'out', label: 'Rendered text', note: '<div lang="ar-EG" dir="rtl">', tone: 'ink' },
      ],
      edges: [
        { from: 'call', to: 'lookup', label: 'locale.value' },
        { from: 'lookup', to: 'plural', label: 'object of forms' },
        { from: 'plural', to: 'fill', label: 'pick form' },
        { from: 'fill', to: 'out', label: 'string' },
      ],
      steps: [
        { focus: ['call'], text: 'A component asks for a message by **key** and passes parameters. Because `t()` reads the reactive `locale`, the component re-renders when the language changes.' },
        { focus: ['lookup'], edges: ['call->lookup'], text: 'The key is looked up in the current locale\'s messages. If it is missing there, the **fallback locale** is tried; if it is missing everywhere, the key itself is shown so the gap is visible.' },
        { focus: ['plural'], edges: ['lookup->plural'], text: 'If the message has plural forms, `Intl.PluralRules` decides which one this number needs. For Arabic, 3 is **"few"**; in English it would be **"other"**; in French, 0 is **"one"**.' },
        { focus: ['fill'], edges: ['plural->fill'], text: 'Placeholders like `{count}` are replaced. Numbers go through `Intl.NumberFormat` too — Egyptian Arabic formatting uses Arabic-Indic digits.' },
        { focus: ['out'], edges: ['fill->out'], text: 'The finished sentence is rendered inside an element whose `lang` and `dir` match the locale, so screen readers pronounce it correctly and the layout flows right to left.' },
      ],
    },
  },

  syntax: [
    `
#### 1. Locale-aware formatting with \`Intl\` (built into JavaScript)
`,
    {
      code: `const locale = 'de-DE'

new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(1234.5)
// "1.234,50 €"   (en-US: "€1,234.50") — the currency is data, not derived from the locale

new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(new Date(2026, 0, 15))
// "15. Januar 2026"   (en-US: "January 15, 2026")

new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(-3, 'day')
// "vor 3 Tagen"   (en-US: "3 days ago")

new Intl.ListFormat(locale, { type: 'conjunction' }).format(['tea', 'coffee', 'juice'])
// "tea, coffee und juice"   (en-US: "tea, coffee, and juice")

new Intl.PluralRules('pl').select(22)       // "few"  → "22 pliki"
new Intl.PluralRules('pl').select(25)       // "many" → "25 plików"

;['Zürich', 'Århus', 'Berlin'].sort(new Intl.Collator('sv').compare)
// ["Berlin", "Zürich", "Århus"] — in Swedish, Å comes after Z

new Intl.DisplayNames(['de'], { type: 'language' }).of('de')   // "Deutsch"`,
      lang: 'js',
      title: 'the Intl toolbox',
    },
    `
#### 2. Messages with placeholders and plural forms

Whole sentences, never fragments. Placeholders mark where values go; plural messages list one form per **plural category** the language uses (\`zero\`, \`one\`, \`two\`, \`few\`, \`many\`, \`other\` — \`other\` is always required).
`,
    {
      code: `export default {
  'en-US': {
    cart: { one: '{count} item in your cart', other: '{count} items in your cart' },
    greeting: 'Welcome back, {name}!',
  },
  'pl-PL': {
    cart: { one: '{count} produkt', few: '{count} produkty', many: '{count} produktów', other: '{count} produktu' },
    greeting: 'Witaj ponownie, {name}!',
  },
}`,
      lang: 'js',
      title: 'messages.js',
    },
    `
#### 3. vue-i18n (a separate library, not part of Vue core)

For real projects, the community-standard library is [vue-i18n](https://vue-i18n.intlify.dev/) (Nuxt apps typically use the \`@nuxtjs/i18n\` module, which builds on it). The shape is the same as the plugin you'll build:
`,
    {
      code: `// main.js  —  npm install vue-i18n
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import enUS from './locales/en-US.json'

const i18n = createI18n({
  legacy: false,                 // Composition API mode (useI18n)
  locale: 'en-US',
  fallbackLocale: 'en-US',
  messages: { 'en-US': enUS },
  numberFormats: {
    'en-US': { currency: { style: 'currency', currency: 'EUR' } },
  },
})

createApp(App).use(i18n).mount('#app')`,
      lang: 'js',
      title: 'vue-i18n setup (static example)',
      static: true,
    },
    {
      code: `<script setup>
import { useI18n } from 'vue-i18n'

const { t, n, d, locale } = useI18n()
// locale is a ref: locale.value = 'de-DE' switches language
</script>

<template>
  <h1>{{ t('title') }}</h1>
  <!-- message: "Your cart is empty | {count} item | {count} items" -->
  <p>{{ t('cart', cartCount) }}</p>
  <p>{{ n(89.9, 'currency') }} · {{ d(new Date(), 'short') }}</p>
  <button>{{ $t('addToCart') }}</button>   <!-- global $t also works in templates -->
</template>`,
      lang: 'vue',
      title: 'vue-i18n in a component (static example)',
      static: true,
    },
    {
      callout: 'note',
      title: 'vue-i18n plurals',
      text: 'vue-i18n writes plural forms as pipe-separated choices, and its default choice rule fits English-like languages. For languages with richer plural systems (Polish, Russian, Arabic…), configure the `pluralRules` option — check the "Pluralization" page of the vue-i18n docs for your version.',
    },
    `
#### 4. Direction and language: \`dir\`, \`lang\` and logical CSS
`,
    {
      code: `<!-- index.html: set on the root, update when the locale changes -->
<html lang="ar-EG" dir="rtl">

<!-- user-generated text of unknown direction: let the browser detect it -->
<p dir="auto">{{ comment.body }}</p>
<span>Posted by <bdi>{{ comment.author }}</bdi></span>`,
      lang: 'html',
      title: 'direction markup',
    },
    {
      code: `/* physical (breaks in RTL)          logical (flips automatically) */
.badge  { margin-left: 0.5rem; }    .badge  { margin-inline-start: 0.5rem; }
.card   { text-align: left; }       .card   { text-align: start; }
.drawer { right: 0; }               .drawer { inset-inline-end: 0; }
.quote  { border-left: 3px solid; } .quote  { border-inline-start: 3px solid; }

/* mirror icons that mean "forward/back" — not logos, checkmarks or clocks */
[dir='rtl'] .icon-forward { transform: scaleX(-1); }`,
      lang: 'css',
      title: 'logical properties',
    },
    {
      callout: 'tip',
      text: 'Flexbox and grid already follow the writing direction: `flex-direction: row` starts on the right in an RTL container. Most layout bugs in RTL come from physical properties (`left`, `margin-right`, `text-align: left`) and absolute positioning.',
    },
  ],

  walkthrough: {
    title: 'i18n.js (the playground\'s simplified plugin)',
    lang: 'js',
    code: i18nJs,
    intro: 'This tiny plugin powers the playground. It is simplified on purpose — but every idea in it exists in vue-i18n too.',
    steps: [
      { lines: [3], text: 'A `Symbol` as the injection key: unique, so no other plugin can accidentally provide something under the same name.' },
      { lines: [8, 9], text: '`createI18n` receives the starting locale, a fallback and all messages. The current locale is a **ref** — changing it re-renders everything that called `t()`, `n()` or `d()`.' },
      { lines: [11, 13], text: '`lookup` walks dotted keys like `\'cart.title\'` through the messages of one locale. Optional chaining (`?.`) returns `undefined` instead of crashing on missing branches.' },
      { lines: [15, 21], text: '`n()` and `d()` are thin wrappers around `Intl.NumberFormat` and `Intl.DateTimeFormat`, always using the current locale.' },
      { lines: [23, 25], text: 'Try the current locale, then the fallback. A completely missing key returns the key itself — ugly on purpose, so missing translations get noticed.' },
      { lines: [26, 30], text: 'Plural messages are objects. `Intl.PluralRules` returns the category this number needs in this language; we fall back to `other`, which every language has.' },
      { lines: [31, 35], text: 'Placeholders like `{count}` are replaced from `params`. Numbers go through `n()`, so "3" becomes "٣" in Egyptian Arabic. Unknown placeholders are left visible.' },
      { lines: [38, 46], text: 'The plugin object: `install(app)` provides the API to every component and registers a global `$t` for templates — the same pattern as the i18n example in Vue\'s plugin guide.' },
      { lines: [49, 53], text: '`useI18n()` injects the API and fails loudly if the plugin was never installed, instead of returning `undefined` and crashing later.' },
    ],
  },

  playground: {
    title: 'An international shop',
    objective: 'Switch languages and watch numbers, dates and plurals adapt — then fix the plural, direction and sorting bugs and add French.',
    files: startFiles,
    expected: 'A shop with a language picker (each language named in its own language), three products with euro prices and "Added yesterday / today / 3 days ago", a cart summary, a list of pick-up points and a "prices updated" date. Switch to **العربية**: text and digits change, but the layout doesn\'t flip, and "Add to cart" once shows **"1 items in your cart"** in English. Compare with the **Complete version** variant.',
    experiments: [
      {
        id: 'plural',
        task: 'Click **Add to cart** once in English: it says **"1 items in your cart"**. In `messages.js`, turn the English `cart` message into plural forms so it reads **"1 item in your cart"** and **"2 items in your cart"** (and "0 items in your cart").',
        hint: 'Replace the string with an object: `cart: { one: \'{count} item in your cart\', other: \'{count} items in your cart\' }`. `t()` already picks the form with `Intl.PluralRules`.',
        tests: [
          {
            name: '0 items, 1 item, 2 items',
            code: `expect(text('.cart-summary')).toBe('0 items in your cart')
await click('.add-to-cart')
expect(text('.cart-summary')).toBe('1 item in your cart')
await click('.add-to-cart')
expect(text('.cart-summary')).toBe('2 items in your cart')`,
          },
        ],
        explain: 'English has two plural categories (`one`, `other`). The code didn\'t change at all — only the data. Look at the Arabic message: it has six forms, and the same `t()` handles it, because the rules come from `Intl.PluralRules`, not from `if (count === 1)`.',
      },
      {
        id: 'add-french',
        task: 'Add French: in `messages.js`, add a `\'fr-FR\'` locale with `title: \'Boutique\'`, `addToCart: \'Ajouter au panier\'` (and translate the other keys if you like). Then pick it in the language list.',
        hint: 'Copy the `\'en-US\'` block, rename the key to `\'fr-FR\'` and translate. The language picker is built from `Object.keys(messages)`, and prices are formatted by `Intl` — no other change is needed.',
        tests: [
          {
            name: 'French can be selected and formats prices the French way',
            code: `${norm}
expect(exists('.locale option[value="fr-FR"]')).toBe(true)
await select('.locale', 'fr-FR')
expect(text('h1')).toBe('Boutique')
expect(text('.add-to-cart')).toContain('Ajouter au panier')
const expected = norm(new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(89.9))
expect(text('.price')).toBe(expected)`,
          },
        ],
        explain: 'Adding a language is a data change because the code never contains text or formats. Any key you didn\'t translate falls back to English — visible, but not broken. Note that the price stays in **euros**: the locale decides *how* to write money, not *which* currency it is.',
      },
      {
        id: 'rtl',
        task: 'Switch to Arabic: the text is right-to-left but the layout isn\'t. Add a `dir` attribute to `.shop` that is **"rtl"** for Arabic (and Hebrew, Persian, Urdu) and **"ltr"** otherwise.',
        hint: 'In `App.vue`: `const RTL = [\'ar\', \'he\', \'fa\', \'ur\']` and `const dir = computed(() => RTL.includes(new Intl.Locale(locale.value).language) ? \'rtl\' : \'ltr\')`, then `:dir="dir"` on `.shop`. Bonus: in `ProductCard.vue`, replace `margin-left`/`text-align: left` with `margin-inline-start`/`text-align: start`, and mirror the → icon.',
        tests: [
          {
            name: 'Arabic is rtl, English is ltr',
            code: `await select('.locale', 'ar-EG')
expect(attr('.shop', 'dir')).toBe('rtl')
expect(attr('.shop', 'lang')).toBe('ar-EG')
await select('.locale', 'en-US')
expect(attr('.shop', 'dir')).toBe('ltr')`,
          },
        ],
        explain: 'The `dir` attribute changes the base direction for text, inline layout, flexbox and grid. Physical CSS like `margin-left: auto` doesn\'t follow it — that\'s why the bonus matters. In a real app you would set `lang` and `dir` on `<html>` (`document.documentElement`) whenever the locale changes.',
      },
      {
        id: 'collator',
        task: 'The pick-up points are sorted with `.sort()`, which puts **Ängelholm**, **Århus** and **Écully** after **Zürich**. Sort them with the locale\'s rules instead.',
        hint: 'Use `[...cities].sort(new Intl.Collator(locale.value).compare)` inside the computed — it re-sorts when the locale changes.',
        tests: [
          {
            name: 'cities are in locale-aware alphabetical order',
            code: `const shown = findAll('.cities li').map((li) => li.textContent.trim())
const expected = [...shown].sort(new Intl.Collator('en-US').compare)
expect(shown).toEqual(expected)
expect(shown[0]).toBe('Ängelholm')`,
          },
        ],
        explain: 'Plain `.sort()` compares UTF-16 code units, and accented capitals like `Ä` (U+00C4) come after `Z`. A collator knows each language\'s alphabet: in English, Å sorts with A; switch to a Swedish collator and Å and Ä move after Z — both correct for their readers.',
      },
    ],
    variants: [
      { id: 'start', label: 'Starting point', files: startFiles },
      {
        id: 'complete',
        label: 'Complete version (plurals, French, RTL, collator, logical CSS)',
        files: {
          'main.js': mainJs,
          'App.vue': appFixed,
          'ProductCard.vue': cardFixed,
          'i18n.js': i18nJs,
          'messages.js': messagesFixed,
        },
      },
    ],
  },

  animation: {
    type: 'comparison',
    title: 'Concatenation vs messages',
    caption: 'The same feature, built two ways. Only one survives translation.',
    alt: 'Side by side. Left: a sentence built by concatenating English fragments with a number and a hard-coded dollar sign. Right: a translation call with a plural-aware message and a currency formatted by Intl.NumberFormat. Bullet points list why the right side works across languages.',
    props: {
      left: {
        label: 'String concatenation',
        lang: 'js',
        code: `const summary =
  'You have ' + count + ' items. ' +
  'Total: $' + total.toFixed(2)

// "You have 1 items. Total: $1234.50"`,
      },
      right: {
        label: 'Messages + Intl',
        lang: 'js',
        code: `// en-US: { summary: { one: 'You have {count} item. Total: {total}',
//                     other: 'You have {count} items. Total: {total}' } }
const summary = t('summary', {
  count,
  total: n(total, { style: 'currency', currency: order.currency }),
})
// "You have 1 item. Total: $1,234.50"`,
      },
      points: [
        'Fragments force English word order on every language; a whole sentence lets translators reorder freely.',
        'Plural forms come from `Intl.PluralRules`, so languages with 3, 4 or 6 forms just add them to their messages.',
        'Number and currency formatting follow the locale; the currency itself comes from the data.',
        'Translators see one complete sentence with named placeholders — the context they need.',
      ],
    },
  },

  internals: {
    beginner: `
Translation is a **lookup table** per language: key in, sentence out. Formatting is not translation — it follows rules (separators, date order, plural forms), and modern JavaScript ships those rules in **\`Intl\`**, so you never write them yourself.

Vue's job is simply to re-render when the language changes. Because \`t()\` reads a reactive \`locale\`, switching languages re-runs every template that used it — just like any other reactive state.
`,
    technical: [
      `
**Where the rules come from.** JavaScript engines implement \`Intl\` using locale data from the Unicode CLDR project (typically through the ICU library). That's why \`Intl.PluralRules('ar').select(11)\` knows the answer is \`many\`. Data and coverage depend on the engine version, so tests should compute expected strings with \`Intl\` rather than hard-coding them — output can contain non-breaking spaces (U+00A0, U+202F) and direction marks.

**Locale negotiation.** Pass a BCP 47 tag (\`de-AT\`, \`zh-Hant-TW\`) or a list of them. If the engine lacks an exact match it falls back (e.g. to \`de\`); \`new Intl.NumberFormat(tag).resolvedOptions().locale\` tells you what it actually used, and \`Intl.NumberFormat.supportedLocalesOf([...])\` filters to supported ones. An invalid tag such as \`en_US\` (underscore) throws a \`RangeError\`.

**Plural categories** are \`zero\`, \`one\`, \`two\`, \`few\`, \`many\` and \`other\`. English uses \`one\`/\`other\`; French uses \`one\` for 0 and 1; Polish uses \`one\`, \`few\` (2–4, 22–24…), \`many\` (5–21, 25…) and \`other\` (fractions); Arabic uses all six. Ordinals ("1st, 2nd, 3rd") use \`new Intl.PluralRules(locale, { type: 'ordinal' })\`.
`,
      {
        code: `const rules = new Intl.PluralRules('pl')
;[1, 2, 5, 12, 22, 25, 1.5].map((n) => rules.select(n))
// ["one", "few", "many", "many", "few", "many", "other"]

new Intl.PluralRules('en', { type: 'ordinal' }).select(22)   // "two" → "22nd"`,
        lang: 'js',
        title: 'plural categories are not "1 vs many"',
      },
      `
**Reactivity.** In the playground plugin, \`locale\` is a ref and \`t()\` reads \`locale.value\`, so any render (or \`computed\`) that calls \`t()\` subscribes to it. A string computed *once* in \`setup\` — \`const title = t('title')\` — is a plain value and will **not** update when the language changes. Call \`t()\` in the template or in a \`computed\`.

**Cost of formatters.** Creating an \`Intl\` formatter does real work (resolving locale data), while calling \`.format()\` on an existing one is cheaper. For long lists, create the formatter once per locale/options combination (for example in a \`computed\`) instead of inside every item. vue-i18n caches formatters for its named formats.

**Bidirectional text.** Browsers lay out mixed-direction text with the Unicode Bidirectional Algorithm. A Latin product name or a phone number inside Arabic text usually works, but user-generated strings of unknown direction can scramble surrounding punctuation — isolate them with \`<bdi>\` or \`dir="auto"\`.
`,
    ],
    production: [
      `
- **Use a library for real apps.** vue-i18n (or \`@nuxtjs/i18n\` in Nuxt) brings message syntax, named number/date formats, fallbacks, devtools and SSR support. Precompiling messages at build time with the official bundler plugin lets you ship its smaller runtime-only build.
- **Lazy-load locales.** Ship the default locale in the main bundle and load others on demand:
`,
      {
        code: `// i18n.js (vue-i18n, composition mode) — simplified
export async function setLocale(i18n, locale) {
  if (!i18n.global.availableLocales.includes(locale)) {
    const messages = await import(\`./locales/\${locale}.json\`)   // separate chunk per locale
    i18n.global.setLocaleMessage(locale, messages.default)
  }
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  document.documentElement.dir = isRtl(locale) ? 'rtl' : 'ltr'
  localStorage.setItem('locale', locale)
}`,
        lang: 'js',
        title: 'lazy-loading messages',
        static: true,
      },
      `
- **Choosing the locale.** Respect an explicit user choice first (saved preference or a locale in the URL like \`/de/products\`), then \`navigator.languages\`, then a default. Don't infer language from IP address, and don't use flags for languages — a flag is a country, and many languages span many countries.
- **URLs and SEO.** For indexable content, give each language its own URL and (with SSR/SSG) \`hreflang\` alternate links. See [CSR, SSR & SSG](lesson:rendering-strategies).
- **Server/client consistency.** If the server renders \`toLocaleString()\` with its own default locale or time zone and the browser renders another, you get [hydration mismatches](lesson:hydration). Always pass the app's locale (and a \`timeZone\` where relevant) explicitly.
- **Dates and time zones.** Store and transmit instants in UTC (ISO 8601); format on display with the user's time zone, or the event's time zone when that is what matters (a concert in Tokyo).
- **Translation workflow.** Stable keys, a comment or screenshot for context, complete sentences with named placeholders, and CI checks for missing keys. *Pseudo-localization* (e.g. "[Ŝĥöö ññ]" with padding) shows hard-coded strings and layouts that cannot grow — translated text is often longer than English.
- **Accessibility overlaps.** Keep \`<html lang>\` correct so screen readers use the right voice; mark inline foreign phrases with \`lang\`. See [Accessibility fundamentals](lesson:accessibility-fundamentals).
`,
    ],
  },

  mistakes: [
    {
      title: 'Building sentences from fragments',
      wrong: { code: `t('youHave') + ' ' + count + ' ' + t('items')`, lang: 'js' },
      right: { code: `t('cartSummary', { count })\n// en: { one: 'You have {count} item', other: 'You have {count} items' }`, lang: 'js' },
      explanation: 'Word order, grammar and plural forms differ between languages. Translate whole sentences with named placeholders so translators can rearrange them.',
    },
    {
      title: 'Deriving the currency from the locale',
      wrong: { code: `const currency = locale === 'de-DE' ? 'EUR' : 'USD'\nn(price, { style: 'currency', currency })`, lang: 'js' },
      right: { code: `// the order knows its currency; the locale only decides the format\nn(order.total, { style: 'currency', currency: order.currency })`, lang: 'js' },
      explanation: 'A German-speaking customer can pay in Swiss francs; an English speaker can shop in euros. Converting a number into a different currency symbol without converting the amount is a real money bug.',
    },
    {
      title: 'Physical CSS in a layout that must flip',
      wrong: { code: `.price { margin-left: auto; }\n.card { text-align: left; padding-right: 1rem; }`, lang: 'css' },
      right: { code: `.price { margin-inline-start: auto; }\n.card { text-align: start; padding-inline-end: 1rem; }`, lang: 'css' },
      explanation: 'Logical properties are relative to the writing direction, so one stylesheet works for both LTR and RTL. Physical properties stay on the same side and break the mirrored layout.',
    },
    {
      title: 'Translating once in setup',
      wrong: { code: `const { t } = useI18n()\nconst heading = t('title') // a plain string, frozen in the first language`, lang: 'js' },
      right: { code: `const { t } = useI18n()\nconst heading = computed(() => t('title')) // or call t('title') in the template`, lang: 'js' },
      explanation: '`<script setup>` runs once. A string computed there never re-evaluates, so it ignores later locale changes. Calls inside templates or `computed()` re-run because they read the reactive locale.',
    },
    {
      title: 'Relying on the runtime\'s default locale',
      wrong: { code: `price.toLocaleString()\ndate.toLocaleDateString()`, lang: 'js' },
      right: { code: `price.toLocaleString(locale.value)\nnew Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(date)`, lang: 'js' },
      explanation: 'Without a locale argument, the output depends on the browser or server settings — the same code prints "5/3/2026" on one machine and "3/5/2026" on another, and SSR can mismatch on hydration. Pass the app\'s locale explicitly.',
    },
  ],

  debugging: [
    {
      symptom: 'The UI shows "1 items" or wrong plural forms in some languages.',
      cause: 'A single string is used for every count, or plurals are chosen with `count === 1`.',
      fix: 'Use plural messages per category and select with `Intl.PluralRules` (vue-i18n: plural choices and, for complex languages, `pluralRules`).',
    },
    {
      symptom: 'Raw keys like `checkout.title` appear on screen.',
      cause: 'The key is missing in both the current and fallback locale, has a typo, or the locale file hasn\'t finished loading.',
      fix: 'Check the key path, add it to the fallback locale, await lazy loading before switching `locale`, and add a missing-key check to CI.',
    },
    {
      symptom: 'Some text changes language when you switch, other text stays in the old language.',
      cause: 'Those strings were computed once in `setup` (or in a module) instead of reactively.',
      fix: 'Call `t()` in the template or inside `computed()`; don\'t store translated strings in state.',
    },
    {
      symptom: 'In Arabic, text flows right to left but icons, margins and the price position look wrong.',
      cause: '`dir="rtl"` is missing on the root, or the CSS uses physical properties and absolute `left`/`right` positions.',
      fix: 'Set `dir` (and `lang`) on `<html>`; switch to logical properties; mirror directional icons only.',
    },
    {
      symptom: '`RangeError: Incorrect locale information provided`.',
      cause: 'An invalid locale tag reached `Intl`, e.g. `en_US` from a backend or an empty string.',
      fix: 'Normalise tags to BCP 47 (`en-US`) at the boundary and fall back to a default when a tag is invalid.',
    },
    {
      symptom: 'Hydration warnings around prices or dates in an SSR app.',
      cause: 'Server and browser formatted with different default locales or time zones.',
      fix: 'Pass the same locale and `timeZone` explicitly on both sides, or render time-sensitive values on the client only.',
    },
  ],

  bestPractices: [
    'Keep every user-facing string in messages from day one — even if you only ship one language.',
    'Translate whole sentences with named placeholders; never concatenate translated fragments.',
    'Model plurals with categories and `Intl.PluralRules`; always provide `other`.',
    'Format numbers, currencies, dates, relative times and lists with `Intl`, passing the app\'s locale explicitly.',
    'Treat currency and time zone as data that comes with the value, not something derived from the language.',
    'Sort and compare user-visible strings with `Intl.Collator` (or `localeCompare` with a locale).',
    'Set `lang` and `dir` on `<html>` when the locale changes; use `dir="auto"`/`<bdi>` for user content.',
    'Write CSS with logical properties so RTL works without a second stylesheet.',
    'Lazy-load non-default locales and persist the user\'s choice.',
    'Use vue-i18n (or `@nuxtjs/i18n`) for production apps; keep a home-made plugin for learning or very small needs.',
  ],

  useCases: [
    'Shops showing prices, delivery dates and cart counts to customers in several countries.',
    'Dashboards with locale-aware numbers ("1.3M" vs "1,3 Mio."), dates and relative times ("updated 5 minutes ago").',
    'Apps serving Arabic, Hebrew, Persian or Urdu speakers that need right-to-left layouts.',
    'Sorting names, cities or products alphabetically for readers of different languages.',
    'Language pickers that show each language in its own name with `Intl.DisplayNames`.',
  ],

  whenToUse: {
    use: [
      'Any app that may ever have users in more than one language or region — the cost of preparing early is small.',
      '`Intl` formatting even in single-language apps: it is correct, built in and needs no library.',
      'vue-i18n when you have real translations, plural-heavy content, lazy-loaded locales or SSR.',
      'Logical CSS properties by default, even before you support RTL.',
    ],
    avoid: [
      'A home-made translation system for a large production app — message syntax, tooling and edge cases add up.',
      'Machine-translating at runtime as a substitute for reviewed translations of core UI text.',
      'Hard-coded formats like `toFixed(2)` + "$", `MM/DD/YYYY` strings or `margin-left` in shared components.',
    ],
  },

  comparison: {
    title: 'The Intl toolbox (output from a current engine; exact strings can vary by version)',
    headers: ['', 'Use it for', 'en-US', 'de-DE'],
    rows: [
      ['`Intl.NumberFormat`', 'numbers, currency, percent, units, compact', '`€1,234.50`', '`1.234,50 €`'],
      ['`Intl.DateTimeFormat`', 'dates and times (`timeZone` option)', '`Mar 5, 2026`', '`05.03.2026`'],
      ['`Intl.RelativeTimeFormat`', '"ago" / "in" phrases', '`3 days ago`', '`vor 3 Tagen`'],
      ['`Intl.PluralRules`', 'choosing plural forms', '`select(1)` → `one`', '`select(1)` → `one`'],
      ['`Intl.ListFormat`', 'joining lists', '`tea, coffee, and juice`', '`tea, coffee und juice`'],
      ['`Intl.Collator`', 'sorting and comparing strings', 'Å sorts with A', 'Å sorts with A (Swedish: after Z)'],
      ['`Intl.DisplayNames`', 'names of languages, regions, currencies', '`German`', '`Deutsch`'],
    ],
    note: 'Examples: `1234.5` EUR, `new Date(2026, 2, 5)`, `-3` days, `["tea", "coffee", "juice"]`, the language `de`.',
  },

  quiz: [
    {
      id: 'i18n-q1',
      type: 'mcq',
      prompt: 'Why does `Intl.NumberFormat` require a separate `currency` option instead of using the locale\'s currency?',
      options: [
        { text: 'Because the locale decides how money is *written*, while the currency is part of the data — a German speaker can pay in USD.' },
        { text: 'Because locales don\'t contain region information.', why: 'Tags like `de-DE` do include a region — but the region still doesn\'t tell you what currency an amount is in.' },
        { text: 'It\'s a historical mistake; most apps should derive it from the locale.', why: 'Deriving it would show "€" in front of an amount that is actually in dollars — a real money bug.' },
        { text: 'Only to support cryptocurrencies.', why: 'Currencies are ISO 4217 codes such as EUR, USD or JPY; the option exists for every currency.' },
      ],
      answer: 0,
      explanation: '`new Intl.NumberFormat(\'de-DE\', { style: \'currency\', currency: \'USD\' }).format(89.9)` gives "89,90 $": German formatting, US dollars. Leaving out `currency` with `style: \'currency\'` throws a `TypeError`.',
    },
    {
      id: 'i18n-q2',
      type: 'output',
      prompt: 'What does this print (in a current browser or Node.js)?',
      code: {
        lang: 'js',
        code: `const list = new Intl.ListFormat('en', { type: 'conjunction' })
console.log(list.format(['tea', 'coffee', 'juice']))`,
      },
      options: [
        { text: '`tea, coffee, and juice`' },
        { text: '`tea, coffee, juice`', why: 'That would be `join(\', \')`. A conjunction list adds "and".' },
        { text: '`tea and coffee and juice`', why: 'ListFormat follows English conventions: commas, then "and" before the last item.' },
        { text: '`tea,coffee,juice`', why: 'That is the default `Array.prototype.join()` output.' },
      ],
      answer: 0,
      explanation: 'English list formatting uses commas and a final ", and". German gives "tea, coffee und juice"; Japanese "tea、coffee、juice".',
    },
    {
      id: 'i18n-q3',
      type: 'bug',
      prompt: 'This card looks right in English but wrong in Arabic (`dir="rtl"`): the price hugs the wrong edge. Click the line responsible.',
      code: {
        lang: 'css',
        code: `.card {
  display: flex;
  align-items: baseline;
  gap: 1rem;
}
.name {
  font-weight: 600;
}
.price {
  margin-left: auto;
}`,
      },
      answerLine: 10,
      explanation: '`margin-left` is physical: it stays on the left even when the flex row runs right to left. `margin-inline-start: auto` pushes the price to the end edge in both directions.',
    },
    {
      id: 'i18n-q4',
      type: 'fill',
      prompt: 'Fill in the `Intl` constructors.',
      code: {
        lang: 'js',
        code: `new Intl.___('en', { numeric: 'auto' }).format(-1, 'day')   // "yesterday"
new Intl.___('pl').select(22)                                  // "few"`,
      },
      answer: [['RelativeTimeFormat'], ['PluralRules']],
      explanation: '`RelativeTimeFormat` writes phrases like "yesterday" or "in 3 days"; `PluralRules` returns the plural category a number needs.',
    },
    {
      id: 'i18n-q5',
      type: 'mcq',
      prompt: 'Select **all** practices that make an app ready for internationalization.',
      options: [
        { text: 'Keeping user-facing strings in message files instead of templates' },
        { text: 'Using CSS logical properties such as `margin-inline-start`' },
        { text: 'Storing dates as UTC/ISO strings and formatting them for display' },
        { text: 'Giving buttons a fixed width that fits the English label', why: 'Translations are often longer; fixed widths cause truncation and overflow.' },
        { text: 'Concatenating translated words to build sentences', why: 'Word order and grammar differ by language; translate whole sentences with placeholders.' },
      ],
      answer: [0, 1, 2],
      explanation: 'Externalised strings, direction-neutral CSS and format-on-display data are the core of i18n readiness. Fixed widths and fragment concatenation are classic blockers.',
    },
    {
      id: 'i18n-q6',
      type: 'short',
      prompt: 'Why should the `lang` attribute on `<html>` change when the user switches language?',
      answer: 'Screen readers use `lang` to choose the voice and pronunciation rules, browsers use it for hyphenation, spell-checking, font selection and translation offers, and search engines use it to understand the content. A wrong `lang` makes a screen reader read Arabic or German text with English pronunciation.',
    },
  ],

  exercises: [
    {
      id: 'intl-order-summary',
      title: 'Localise an order summary with Intl',
      difficulty: 'beginner',
      prompt: `
The order summary formats everything by hand in American English. Use \`Intl\` with the selected \`locale\` so every value follows the locale (and updates when it changes):

- \`.total\` — \`order.total\` as a currency using \`order.currency\` (\`Intl.NumberFormat\`, \`style: 'currency'\`).
- \`.date\` — \`order.placedAt\` with \`{ dateStyle: 'medium' }\` (\`Intl.DateTimeFormat\`).
- \`.items\` — \`order.items\` as a list with \`{ type: 'conjunction' }\` (\`Intl.ListFormat\`).
- \`.shipped\` — "2 days ago" with \`{ numeric: 'auto' }\` (\`Intl.RelativeTimeFormat\`, \`-order.shippedDaysAgo\`, unit \`'day'\`).

(The labels "Total:", "Placed:"… stay in English here — translating them is the job of messages.)
`,
      files: {
        'App.vue': `<script setup>
import { ref } from 'vue'

const locale = ref('en-US')
const order = {
  total: 1234.5,
  currency: 'EUR',
  placedAt: new Date(2026, 2, 5),
  items: ['Trail shoes', 'Rain jacket', 'Wool socks'],
  shippedDaysAgo: 2,
}
</script>

<template>
  <label>
    Locale
    <select v-model="locale" class="locale">
      <option value="en-US">English (US)</option>
      <option value="de-DE">Deutsch</option>
      <option value="ja-JP">日本語</option>
    </select>
  </label>

  <section class="summary" :lang="locale">
    <p>Total: <strong class="total">€{{ order.total.toFixed(2) }}</strong></p>
    <p>Placed: <span class="date">{{ order.placedAt.toDateString() }}</span></p>
    <p>Items: <span class="items">{{ order.items.join(', ') }}</span></p>
    <p>Shipped: <span class="shipped">{{ order.shippedDaysAgo }} days ago</span></p>
  </section>
</template>`,
      },
      hints: [
        'Create one `computed` per value so each re-runs when `locale` changes, e.g. `const total = computed(() => new Intl.NumberFormat(locale.value, { style: \'currency\', currency: order.currency }).format(order.total))`.',
        'Dates: `new Intl.DateTimeFormat(locale.value, { dateStyle: \'medium\' }).format(order.placedAt)`. Lists: `new Intl.ListFormat(locale.value, { type: \'conjunction\' }).format(order.items)`.',
        'Relative time: `new Intl.RelativeTimeFormat(locale.value, { numeric: \'auto\' }).format(-order.shippedDaysAgo, \'day\')` — negative means the past.',
      ],
      solution: {
        explanation: 'Each value is a `computed` that reads `locale.value`, so switching the select re-formats everything. `Intl` handles separators, symbol position, date order, list conjunctions ("and", "und", "、") and relative phrases; the currency stays EUR because it belongs to the order.',
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const locale = ref('en-US')
const order = {
  total: 1234.5,
  currency: 'EUR',
  placedAt: new Date(2026, 2, 5),
  items: ['Trail shoes', 'Rain jacket', 'Wool socks'],
  shippedDaysAgo: 2,
}

const total = computed(() =>
  new Intl.NumberFormat(locale.value, { style: 'currency', currency: order.currency }).format(order.total),
)
const placed = computed(() =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium' }).format(order.placedAt),
)
const items = computed(() =>
  new Intl.ListFormat(locale.value, { type: 'conjunction' }).format(order.items),
)
const shipped = computed(() =>
  new Intl.RelativeTimeFormat(locale.value, { numeric: 'auto' }).format(-order.shippedDaysAgo, 'day'),
)
</script>

<template>
  <label>
    Locale
    <select v-model="locale" class="locale">
      <option value="en-US">English (US)</option>
      <option value="de-DE">Deutsch</option>
      <option value="ja-JP">日本語</option>
    </select>
  </label>

  <section class="summary" :lang="locale">
    <p>Total: <strong class="total">{{ total }}</strong></p>
    <p>Placed: <span class="date">{{ placed }}</span></p>
    <p>Items: <span class="items">{{ items }}</span></p>
    <p>Shipped: <span class="shipped">{{ shipped }}</span></p>
  </section>
</template>`,
        },
      },
      tests: [
        {
          name: 'en-US: currency with grouping',
          code: `${norm}
expect(text('.total')).toBe(norm(new Intl.NumberFormat('en-US', { style: 'currency', currency: 'EUR' }).format(1234.5)))`,
        },
        {
          name: 'en-US: date, list and relative time',
          code: `${norm}
expect(text('.date')).toBe(norm(new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(2026, 2, 5))))
expect(text('.items')).toBe(norm(new Intl.ListFormat('en-US', { type: 'conjunction' }).format(['Trail shoes', 'Rain jacket', 'Wool socks'])))
expect(text('.shipped')).toBe(norm(new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' }).format(-2, 'day')))`,
        },
        {
          name: 'switching to de-DE re-formats everything',
          code: `${norm}
await select('.locale', 'de-DE')
const l = 'de-DE'
expect(text('.total')).toBe(norm(new Intl.NumberFormat(l, { style: 'currency', currency: 'EUR' }).format(1234.5)))
expect(text('.date')).toBe(norm(new Intl.DateTimeFormat(l, { dateStyle: 'medium' }).format(new Date(2026, 2, 5))))
expect(text('.items')).toBe(norm(new Intl.ListFormat(l, { type: 'conjunction' }).format(['Trail shoes', 'Rain jacket', 'Wool socks'])))
expect(text('.shipped')).toBe(norm(new Intl.RelativeTimeFormat(l, { numeric: 'auto' }).format(-2, 'day')))`,
        },
        {
          name: 'ja-JP works too',
          code: `${norm}
await select('.locale', 'ja-JP')
expect(text('.shipped')).toBe(norm(new Intl.RelativeTimeFormat('ja-JP', { numeric: 'auto' }).format(-2, 'day')))
expect(text('.items')).toBe(norm(new Intl.ListFormat('ja-JP', { type: 'conjunction' }).format(['Trail shoes', 'Rain jacket', 'Wool socks'])))`,
        },
      ],
    },
    {
      id: 'plural-translate',
      title: 'A plural-aware translate() function',
      difficulty: 'intermediate',
      prompt: `
Implement \`translate(locale, key, params)\` in \`i18n.js\` using the messages in \`messages.js\` (English and Polish):

- Look up \`messages[locale][key]\`; if missing, fall back to \`messages.en[key]\`; if still missing, return the **key** itself.
- If the message is an **object**, pick the form for \`params.count\` with \`new Intl.PluralRules(locale).select(count)\` (use \`other\` if that form is missing).
- Replace every \`{name}\` placeholder with \`params.name\`. Leave placeholders without a matching param unchanged.

Expected: \`translate('en', 'files', { count: 1 })\` → \`"1 file"\`, \`translate('pl', 'files', { count: 22 })\` → \`"22 pliki"\`, \`translate('pl', 'greeting', { name: 'Ada' })\` → \`"Cześć, Ada!"\`.

The page shows the result for the chosen language (\`.locale\`) and count (\`.count\`) in \`.result\`.
`,
      files: {
        'i18n.js': `import messages from './messages.js'

// TODO: fallback to English, plural forms via Intl.PluralRules, {placeholder} interpolation
export function translate(locale, key, params = {}) {
  return messages[locale]?.[key] ?? key
}`,
        'messages.js': `export default {
  en: {
    greeting: 'Hello, {name}!',
    save: 'Save',
    files: { one: '{count} file', other: '{count} files' },
  },
  pl: {
    greeting: 'Cześć, {name}!',
    // Polish: one (1), few (2–4, 22–24…), many (5–21, 25…), other (fractions)
    files: { one: '{count} plik', few: '{count} pliki', many: '{count} plików', other: '{count} pliku' },
  },
}`,
        'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { translate } from './i18n.js'

const locale = ref('en')
const count = ref(1)
const result = computed(() => translate(locale.value, 'files', { count: count.value }))
</script>

<template>
  <label>
    Language
    <select v-model="locale" class="locale">
      <option value="en">English</option>
      <option value="pl">Polski</option>
    </select>
  </label>
  <label>
    Files
    <input v-model.number="count" class="count" type="number" min="0" />
  </label>
  <p class="result" :lang="locale">{{ result }}</p>
</template>`,
      },
      hints: [
        'Start with the lookup: `let message = messages[locale]?.[key] ?? messages.en[key]`, and `if (message === undefined) return key`.',
        'For plurals: `if (typeof message === \'object\') { const cat = new Intl.PluralRules(locale).select(params.count ?? 0); message = message[cat] ?? message.other }`.',
        'For placeholders use `message.replace(/\\{(\\w+)\\}/g, (match, name) => (name in params ? String(params[name]) : match))`.',
      ],
      solution: {
        explanation: 'The function never contains a language rule itself: `Intl.PluralRules` knows that Polish 22 is `few` and 25 is `many`, and the messages supply the words. The fallback chain (locale → English → key) keeps the UI usable while translations are incomplete, and leaving unknown placeholders visible makes mistakes easy to spot. A production version would also format numbers with `Intl.NumberFormat` (Polish writes 1,5, not 1.5).',
        files: {
          'i18n.js': `import messages from './messages.js'

export function translate(locale, key, params = {}) {
  let message = messages[locale]?.[key] ?? messages.en[key]
  if (message === undefined) return key

  if (typeof message === 'object') {
    const category = new Intl.PluralRules(locale).select(params.count ?? 0)
    message = message[category] ?? message.other
  }

  return message.replace(/\\{(\\w+)\\}/g, (match, name) => (name in params ? String(params[name]) : match))
}`,
          'messages.js': `export default {
  en: {
    greeting: 'Hello, {name}!',
    save: 'Save',
    files: { one: '{count} file', other: '{count} files' },
  },
  pl: {
    greeting: 'Cześć, {name}!',
    // Polish: one (1), few (2–4, 22–24…), many (5–21, 25…), other (fractions)
    files: { one: '{count} plik', few: '{count} pliki', many: '{count} plików', other: '{count} pliku' },
  },
}`,
          'App.vue': `<script setup>
import { ref, computed } from 'vue'
import { translate } from './i18n.js'

const locale = ref('en')
const count = ref(1)
const result = computed(() => translate(locale.value, 'files', { count: count.value }))
</script>

<template>
  <label>
    Language
    <select v-model="locale" class="locale">
      <option value="en">English</option>
      <option value="pl">Polski</option>
    </select>
  </label>
  <label>
    Files
    <input v-model.number="count" class="count" type="number" min="0" />
  </label>
  <p class="result" :lang="locale">{{ result }}</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'English plurals',
          code: `const { translate } = requireModule('i18n.js')
expect(translate('en', 'files', { count: 1 })).toBe('1 file')
expect(translate('en', 'files', { count: 0 })).toBe('0 files')
expect(translate('en', 'files', { count: 7 })).toBe('7 files')`,
        },
        {
          name: 'Polish one / few / many',
          code: `const { translate } = requireModule('i18n.js')
expect(translate('pl', 'files', { count: 1 })).toBe('1 plik')
expect(translate('pl', 'files', { count: 3 })).toBe('3 pliki')
expect(translate('pl', 'files', { count: 5 })).toBe('5 plików')
expect(translate('pl', 'files', { count: 12 })).toBe('12 plików')
expect(translate('pl', 'files', { count: 22 })).toBe('22 pliki')`,
        },
        {
          name: 'interpolation, fallback and missing keys',
          code: `const { translate } = requireModule('i18n.js')
expect(translate('pl', 'greeting', { name: 'Ada' })).toBe('Cześć, Ada!')
expect(translate('en', 'greeting', {})).toBe('Hello, {name}!')
expect(translate('pl', 'save')).toBe('Save')
expect(translate('pl', 'nope.missing')).toBe('nope.missing')`,
        },
        {
          name: 'the page updates for language and count',
          code: `expect(text('.result')).toBe('1 file')
await select('.locale', 'pl')
await type('.count', '22')
expect(text('.result')).toBe('22 pliki')
await type('.count', '25')
expect(text('.result')).toBe('25 plików')`,
        },
      ],
    },
  ],

  interview: [
    {
      id: 'i18n-vs-l10n',
      difficulty: 'beginner',
      type: 'conceptual',
      minutes: 2,
      question: 'What is the difference between internationalization and localization? What is a locale?',
      answer: 'Internationalization (i18n) is engineering the app so it *can* be adapted: externalised strings, locale-aware formatting, direction-neutral layouts, Unicode-safe data. Localization (l10n) is the adaptation for a specific locale: translations, local formats, imagery, legal text. A locale is a language plus regional conventions, written as a BCP 47 tag such as `en-US`, `de-AT` or `ar-EG`.',
      explanation: 'i18n is done once by developers; l10n is done per market, mostly by translators and local experts.',
      whyAsked: 'Basic vocabulary check before deeper i18n questions.',
      mistakes: ['Treating i18n as "translation".', 'Saying a locale is just a language (it includes region conventions like `en-US` vs `en-GB`).', 'Writing tags with underscores (`en_US`), which `Intl` rejects.'],
      followUps: ['Why do `en-US` and `en-GB` format dates differently?', 'What does the script subtag in `zh-Hant-TW` mean?'],
      modelAnswer: 'Internationalization is preparing the code — no hard-coded text or formats, layouts that can flip, data that\'s Unicode-safe — so the app can support any market. Localization is doing the adaptation for one locale: translations, number and date conventions, sometimes images or legal copy. A locale is a BCP 47 tag like `en-GB`: language plus region and sometimes script. For example, `en-US` writes 3/5/2026 for the 5th of March, while `en-GB` writes 05/03/2026.',
    },
    {
      id: 'i18n-concatenation-debug',
      difficulty: 'intermediate',
      type: 'debugging',
      minutes: 4,
      question: 'Translators say this message is impossible to translate correctly. Why, and how would you fix it?',
      code: {
        lang: 'vue',
        code: `<p>{{ t('youHave') }} {{ count }} {{ count === 1 ? t('message') : t('messages') }} {{ t('from') }} {{ sender }}</p>`,
      },
      answer: 'It glues translated fragments in English word order and decides plurals with `count === 1`. Other languages need a different order, grammatical agreement across the sentence, and more plural forms (Polish has four categories, Arabic six). Translators also see "from" without context. Fix: one message per sentence with named placeholders and plural forms, e.g. `inbox: { one: \'You have {count} message from {sender}\', other: \'You have {count} messages from {sender}\' }`, rendered with `t(\'inbox\', { count, sender })`, where plurals are selected via `Intl.PluralRules` (or vue-i18n plural syntax with `pluralRules`).',
      explanation: 'The unit of translation is the sentence, not the word.',
      whyAsked: 'This anti-pattern is extremely common and expensive to undo later.',
      mistakes: ['Suggesting translators "just reorder the keys".', 'Only fixing the plural and keeping the fragments.', 'Thinking two forms (singular/plural) are enough for every language.'],
      followUps: ['How do you give translators context for a key?', 'How would you format `count` inside the sentence?'],
      modelAnswer: 'The template builds a sentence from fragments, which hard-codes English word order and grammar, and the `count === 1` check assumes every language has two plural forms. I\'d replace it with one message containing named placeholders and plural categories, and let `Intl.PluralRules` — or vue-i18n\'s plural support — pick the form. Translators then see the whole sentence and can reorder it. I\'d also format the number with the locale so digits and separators are right.',
    },
    {
      id: 'i18n-plural-output',
      difficulty: 'intermediate',
      type: 'output',
      minutes: 2,
      question: 'What do these two lines return?',
      code: {
        lang: 'js',
        code: `new Intl.PluralRules('en').select(0)
new Intl.PluralRules('fr').select(0)`,
      },
      options: ['"other" and "other"', '"zero" and "zero"', '"other" and "one"', '"one" and "one"'],
      correctOption: 2,
      answer: '`"other"` for English ("0 items") and `"one"` for French ("0 article") — French uses the singular for 0 and 1.',
      explanation: 'Plural categories are defined per language by CLDR. `zero` is a category only in some languages (such as Arabic), not a special case for the number 0 everywhere.',
      whyAsked: 'Checks that the candidate doesn\'t assume English plural logic is universal.',
      mistakes: ['Assuming `select(0)` always returns `zero`.', 'Implementing plurals with `count === 1 ? one : other`.'],
      followUps: ['Which categories does Polish use?', 'How do you format ordinals like "1st", "2nd", "3rd"?'],
      modelAnswer: 'English returns "other" for 0, which is why we write "0 items". French returns "one" because French treats 0 like 1 — "0 article". Categories are language rules from CLDR, so `zero` only appears in languages that have it, like Arabic. That\'s exactly why plural selection should go through `Intl.PluralRules` rather than hand-written conditions.',
    },
    {
      id: 'i18n-rtl-scenario',
      difficulty: 'intermediate',
      type: 'scenario',
      minutes: 5,
      question: 'Your Vue app must launch in Arabic next quarter. What do you change beyond translating the strings?',
      answer: 'Set `lang="ar"` (with region if relevant) and `dir="rtl"` on `<html>` whenever the locale changes. Audit CSS for physical properties and replace them with logical ones (`margin-inline-start`, `inset-inline-end`, `text-align: start`); check absolutely positioned elements, transforms, animations and carousels. Mirror directional icons (arrows, back/forward chevrons, progress) but not logos, checkmarks, clocks or media play icons. Use `dir="auto"`/`<bdi>` for user-generated content. Load fonts that cover Arabic script and check line height. Format numbers and dates with `Intl` (digits may differ by locale), configure Arabic plural forms, and test with native speakers and screen readers. Component libraries must support RTL too.',
      explanation: 'RTL support is mostly a CSS and icon audit plus correct root attributes — if the codebase already uses logical properties, it is far less work.',
      whyAsked: 'Shows practical experience with bidirectional layouts rather than only translation files.',
      mistakes: ['Writing a separate RTL stylesheet full of overrides.', 'Mirroring everything, including logos and numbers.', 'Forgetting `lang`, so screen readers pronounce Arabic with the wrong voice.'],
      followUps: ['How would you catch physical CSS properties in code review or linting?', 'How do you handle a chart\'s x-axis in RTL?'],
      modelAnswer: 'First the root: `lang` and `dir="rtl"` on `<html>`, updated with the locale. Then a CSS audit — swap physical properties for logical ones, and check absolute positioning, transforms and animations that assume left-to-right. I\'d mirror icons that express direction, but not logos or checkmarks, and isolate user-generated text with `dir="auto"` or `<bdi>`. On the content side: fonts with Arabic coverage, `Intl` formatting, all six plural forms in messages, and a review by native speakers including a screen-reader pass.',
    },
    {
      id: 'i18n-library-comparison',
      difficulty: 'intermediate',
      type: 'comparison',
      minutes: 3,
      question: 'When is a small home-made `t()` plugin enough, and when would you use vue-i18n?',
      answer: 'A home-made plugin (like the playground\'s: provide/inject, a reactive locale, lookup, plurals via `Intl.PluralRules`) is fine for learning, prototypes or a widget with a handful of strings. vue-i18n is the better choice for real products: a full message syntax (named/list interpolation, plurals, linked messages), named number/date formats, fallbacks and missing-key handling, lazy loading helpers, SSR/Nuxt integration, devtools and build-time message compilation. Formatting itself should always use `Intl`, whichever layer you choose.',
      explanation: 'The core idea is tiny; the edge cases and tooling are what a library pays for.',
      whyAsked: 'Assesses judgement about build-vs-buy and understanding of what a library actually provides.',
      mistakes: ['Claiming Vue core includes i18n.', 'Building a custom system without plurals or fallbacks.', 'Using a library but still formatting numbers by hand.'],
      followUps: ['How does vue-i18n know which plural form to use for Polish?', 'How would you lazy-load locales with vue-i18n?'],
      modelAnswer: 'Vue core has no i18n, but a basic plugin is only a reactive locale, a provided `t()` and `Intl.PluralRules` — fine for a prototype or a tiny widget. For a product I\'d use vue-i18n because it handles message syntax, fallbacks, missing-key reporting, named formats, lazy loading, SSR and devtools, and its messages can be precompiled at build time. Either way, numbers, dates and lists go through `Intl`.',
    },
    {
      id: 'i18n-architecture',
      difficulty: 'advanced',
      type: 'architecture',
      minutes: 6,
      question: 'Design i18n for a large Vue SPA with 12 languages, SEO-relevant product pages and several feature teams.',
      answer: 'Use vue-i18n (or `@nuxtjs/i18n` if the app uses Nuxt for SSR/SSG). Organise messages per feature and per locale (`features/cart/locales/de-DE.json`) so teams own their strings, merged or lazy-loaded per route. Ship the default locale in the main bundle and lazy-load others. Put the locale in the URL (`/de/...`) for indexable pages, render them on the server with `hreflang` alternates, and persist the user\'s choice. Centralise formatting presets (currency, date styles) and pass locale and time zone explicitly to avoid hydration mismatches. Workflow: stable keys, context for translators, a translation management system, CI checks for missing/unused keys, pseudo-localization builds, and RTL/visual review for Arabic or Hebrew. Base components use logical CSS and accept translated labels; `lang`/`dir` are set centrally.',
      explanation: 'At scale, i18n is mostly about ownership, loading strategy and workflow — the translation function itself is the easy part.',
      whyAsked: 'A senior-level question combining bundling, routing, SSR/SEO and team process.',
      mistakes: ['One giant messages file every team edits.', 'Shipping all 12 languages in the main bundle.', 'Using a query parameter or cookie only, so search engines can\'t index language versions.'],
      followUps: ['How do you detect missing translations before release?', 'How do you keep server and client formatting identical?'],
      modelAnswer: 'I\'d standardise on vue-i18n, or the Nuxt module if we need SSR for SEO. Messages live next to each feature, split by locale and lazy-loaded per route, with only the default locale in the main bundle. Indexable pages get the locale in the URL plus `hreflang`, rendered on the server with explicit locale and time zone to avoid hydration mismatches. Formatting presets live in one place. And I\'d invest in workflow: a translation management system, context for translators, CI checks for missing keys, pseudo-localization, and RTL reviews.',
    },
    {
      id: 'i18n-coding-search',
      difficulty: 'intermediate',
      type: 'coding',
      minutes: 8,
      question: 'Make this pick-up point search locale-aware: results must be sorted with `Intl.Collator` (en-US), and the search must ignore case **and** accents — typing "zur" finds "Zürich", "ECU" finds "Écully".',
      starter: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const cities = ['Zürich', 'Oslo', 'Århus', 'Berlin', 'Écully', 'Ängelholm', 'Málaga', 'Kraków']
const query = ref('')

const results = computed(() => cities.filter((c) => c.includes(query.value)).sort())
</script>

<template>
  <label>
    Search pick-up points
    <input v-model="query" class="search" type="search" />
  </label>
  <ul class="results">
    <li v-for="city in results" :key="city">{{ city }}</li>
  </ul>
  <p class="count" role="status">{{ results.length }} found</p>
</template>`,
        },
      },
      tests: [
        {
          name: 'all cities in locale-aware order',
          code: `const shown = findAll('.results li').map((li) => li.textContent.trim())
expect(shown).toEqual(['Ängelholm', 'Århus', 'Berlin', 'Écully', 'Kraków', 'Málaga', 'Oslo', 'Zürich'])`,
        },
        {
          name: '"zur" finds Zürich',
          code: `await type('.search', 'zur')
expect(findAll('.results li').map((li) => li.textContent.trim())).toEqual(['Zürich'])`,
        },
        {
          name: '"ECU" finds Écully (case and accent insensitive)',
          code: `await type('.search', 'ECU')
expect(findAll('.results li').map((li) => li.textContent.trim())).toEqual(['Écully'])`,
        },
        {
          name: '"a" also matches accented letters, still sorted',
          code: `await type('.search', 'a')
expect(findAll('.results li').map((li) => li.textContent.trim())).toEqual(['Ängelholm', 'Århus', 'Kraków', 'Málaga'])
expect(text('.count')).toBe('4 found')`,
        },
      ],
      hints: [
        'Sort with `new Intl.Collator(\'en-US\').compare` instead of the default `.sort()`.',
        'Write a `fold(s)` helper that removes accents and case: `s.normalize(\'NFD\').replace(/[\\u0300-\\u036f]/g, \'\').toLowerCase()`.',
        'Filter with `fold(city).includes(fold(query.value.trim()))`.',
      ],
      answer: 'Fold both the query and each city to a case- and accent-free form (NFD normalisation, strip combining marks, lowercase) for matching, and sort the matches with `Intl.Collator(locale).compare`.',
      solution: {
        files: {
          'App.vue': `<script setup>
import { ref, computed } from 'vue'

const cities = ['Zürich', 'Oslo', 'Århus', 'Berlin', 'Écully', 'Ängelholm', 'Málaga', 'Kraków']
const query = ref('')

const collator = new Intl.Collator('en-US')
// "Écully" -> "ecully": split letters from accents (NFD), drop the accents, lowercase
const fold = (s) => s.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase()

const results = computed(() => {
  const q = fold(query.value.trim())
  return cities.filter((c) => fold(c).includes(q)).sort(collator.compare)
})
</script>

<template>
  <label>
    Search pick-up points
    <input v-model="query" class="search" type="search" />
  </label>
  <ul class="results">
    <li v-for="city in results" :key="city">{{ city }}</li>
  </ul>
  <p class="count" role="status">{{ results.length }} found</p>
</template>`,
        },
      },
      explanation: 'NFD normalisation splits "é" into "e" + a combining accent, which the regex removes, so matching ignores accents and case. Sorting uses a collator so accented names sit where readers expect. Folding is a simplification: letters like "Ł" have no decomposition, and some languages treat "ä" as a separate letter (or as "ae") — for exact-equality comparisons, `new Intl.Collator(locale, { sensitivity: \'base\' }).compare(a, b) === 0` is the locale-aware tool.',
      whyAsked: 'Search and sort over names is everyday work; the question reveals whether the candidate knows about Unicode normalisation and collation.',
      mistakes: ['Using `toLowerCase()` only, so "zur" never matches "Zürich".', 'Sorting with `<` or the default `.sort()`.', 'Creating a new `Intl.Collator` for every comparison inside the sort callback.'],
      followUps: ['How would the result order change for a Swedish user?', 'How would you highlight the matched part in the original (accented) string?'],
      modelAnswer: 'I\'d normalise both strings for matching — NFD to split base letters from accents, strip the combining marks, lowercase — so "zur" matches "Zürich". The visible list keeps the original names and is sorted with a single `Intl.Collator` for the user\'s locale, created once outside the sort. I\'d mention that folding is approximate: some letters don\'t decompose and some languages treat umlauts as distinct letters, so for equality checks a collator with `sensitivity: \'base\'` is more correct.',
    },
  ],

  takeaways: [
    'i18n prepares the code (no hard-coded text or formats, direction-neutral layout); l10n adapts it for a locale such as `de-DE` or `ar-EG`.',
    'Vue core has no i18n: use `Intl` for formatting and a translation layer — vue-i18n in production, a provide/inject plugin to learn the idea.',
    'Translate whole sentences with named placeholders; choose plural forms with `Intl.PluralRules` (languages have up to six categories).',
    'Format numbers, currencies, dates, relative times and lists with `Intl`, passing the locale explicitly; currency and time zone come from the data.',
    'Sort and compare strings with `Intl.Collator`; plain `.sort()` uses code-unit order.',
    'Set `lang` and `dir` on `<html>`, use CSS logical properties, mirror only directional icons, and isolate user content with `dir="auto"`/`<bdi>`.',
    'Call `t()` in templates or computeds so text updates when the locale changes, and lazy-load non-default locales.',
  ],
}
