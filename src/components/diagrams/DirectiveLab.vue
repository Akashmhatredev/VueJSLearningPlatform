<script setup>
// Directive lab: a real Vue demo per directive plus a live DOM inspector.
// The inspector serialises the actual DOM and logs real MutationObserver
// records, so learners see exactly what each directive does to the page.
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, useTemplateRef } from 'vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'

const props = defineProps({
  directive: { type: String, default: 'v-if' },
})

const s = reactive({
  name: 'Ada',
  url: 'https://vuejs.org',
  tip: 'Vue docs',
  locked: true,
  clicks: 0,
  keyLog: [],
  show: true,
  items: [
    { id: 1, text: 'Learn v-for' },
    { id: 2, text: 'Add keys' },
    { id: 3, text: 'Ship it' },
  ],
  nextId: 4,
  draft: '',
  agree: false,
  size: 'M',
  active: true,
  error: false,
  color: '#1d3bf0',
  px: 22,
})

const CODE = {
  interpolation: `<input v-model="name" />
<p>Hello, {{ name }}!</p>`,
  'v-bind': `<a :href="url" :title="tip">Docs</a>
<button :disabled="locked">Buy</button>`,
  'v-on': `<button @click="clicks++">Clicked {{ clicks }}×</button>
<input @keyup.enter="onEnter" placeholder="type + Enter" />`,
  'v-if': `<label><input type="checkbox" v-model="show" /> show</label>
<p v-if="show">I exist only while show is true</p>`,
  'v-show': `<label><input type="checkbox" v-model="show" /> show</label>
<p v-show="show">I stay in the DOM — only hidden</p>`,
  'v-for': `<ul>
  <li v-for="item in items" :key="item.id">{{ item.text }}</li>
</ul>`,
  'v-model': `<input v-model="draft" />
<input type="checkbox" v-model="agree" />
<select v-model="size"><option>S</option><option>M</option><option>L</option></select>`,
  class: `<p :class="{ active: isActive, error: hasError }">Status</p>`,
  style: `<p :style="{ color: color, fontSize: px + 'px' }">Styled text</p>`,
}

const NOTES = {
  interpolation: 'Interpolation updates a **text node**. Try typing `<b>hi</b>`: it shows literally — interpolation escapes HTML, it never injects markup.',
  'v-bind': 'Watch the attributes: unticking “locked” *removes* the `disabled` attribute entirely, because `false` means “no attribute”.',
  'v-on': 'Listeners never appear in the HTML — Vue attaches them with `addEventListener`. Only the text changes when you click.',
  'v-if': 'Untick “show”: the `<p>` is **removed** and Vue leaves a `<!--v-if-->` comment as a placeholder. Tick it again and a new element is created.',
  'v-show': 'Untick “show”: the `<p>` stays in the DOM and only gets `style="display: none;"`. Nothing is destroyed or re-created.',
  'v-for': 'Each item becomes an `<li>`. With keys, Vue moves existing elements when you shuffle instead of rewriting their text.',
  'v-model': 'v-model sets the input’s `value`/`checked` *properties*, which do not show as attributes — compare the live values on the right with the HTML.',
  class: 'The `class` attribute is rebuilt from the object: each key whose value is truthy becomes a class.',
  style: 'Vue writes inline styles; camelCase keys like `fontSize` become `font-size` in the DOM.',
}

const directive = computed(() => (CODE[props.directive] ? props.directive : 'v-if'))
const root = useTemplateRef('demo')
const snapshot = ref([])
const changed = ref(new Set())
const log = ref([])
let observer = null
let prev = []

function describe(node) {
  if (!node) return '?'
  if (node.nodeType === 3) return 'text'
  if (node.nodeType === 8) return `<!--${node.data}-->`
  return `<${node.tagName.toLowerCase()}>`
}

function serialize(node, depth, out) {
  const pad = '  '.repeat(depth)
  for (const child of node.childNodes) {
    if (child.nodeType === 3) {
      const t = child.textContent.replace(/\s+/g, ' ').trim()
      if (t) out.push(pad + t)
    } else if (child.nodeType === 8) {
      out.push(`${pad}<!--${child.data}-->`)
    } else if (child.nodeType === 1) {
      const attrs = [...child.attributes]
        .filter((a) => !/^data-v-/.test(a.name))
        .map((a) => (a.value === '' ? ` ${a.name}` : ` ${a.name}="${a.value}"`))
        .join('')
      const tag = child.tagName.toLowerCase()
      if (['input', 'br', 'img'].includes(tag)) out.push(`${pad}<${tag}${attrs}>`)
      else if (!child.childNodes.length) out.push(`${pad}<${tag}${attrs}></${tag}>`)
      else {
        out.push(`${pad}<${tag}${attrs}>`)
        serialize(child, depth + 1, out)
        out.push(`${pad}</${tag}>`)
      }
    }
  }
  return out
}

function refresh(records = []) {
  if (!root.value) return
  const lines = serialize(root.value, 0, [])
  const before = new Set(prev)
  changed.value = new Set(lines.map((l, i) => (!before.has(l) && prev.length ? i : -1)).filter((i) => i >= 0))
  prev = lines
  snapshot.value = lines
  const entries = []
  for (const r of records) {
    if (r.type === 'attributes') {
      if (/^data-v-/.test(r.attributeName)) continue
      const has = r.target.hasAttribute(r.attributeName)
      entries.push(`${describe(r.target)} attribute "${r.attributeName}" ${has ? `set to "${r.target.getAttribute(r.attributeName)}"` : 'removed'}`)
    } else if (r.type === 'characterData') {
      entries.push(`text changed to "${r.target.textContent.trim()}"`)
    } else if (r.type === 'childList') {
      r.addedNodes.forEach((n) => (n.nodeType !== 3 || n.textContent.trim()) && entries.push(`${describe(n)} inserted`))
      r.removedNodes.forEach((n) => (n.nodeType !== 3 || n.textContent.trim()) && entries.push(`${describe(n)} removed`))
    }
  }
  if (entries.length) log.value = [...entries.reverse(), ...log.value].slice(0, 8)
}

onMounted(async () => {
  await nextTick()
  refresh()
  observer = new MutationObserver((records) => refresh(records))
  observer.observe(root.value, { subtree: true, childList: true, attributes: true, characterData: true })
})
onBeforeUnmount(() => observer?.disconnect())

function onEnter(e) {
  s.keyLog = [`Enter pressed with “${e.target.value}”`, ...s.keyLog].slice(0, 3)
  e.target.value = ''
}
function addItem() {
  s.items.push({ id: s.nextId, text: `Item ${s.nextId}` })
  s.nextId++
}
function shuffle() {
  s.items = [...s.items].sort(() => Math.random() - 0.5)
}
</script>

<template>
  <div class="dl">
    <div class="dl__top">
      <CodeBlock :code="CODE[directive]" lang="vue" :title="`${directive} — template`" :copyable="false" />
      <div class="dl__stage">
        <p class="label">live demo</p>
        <div ref="demo" class="dl__demo">
          <template v-if="directive === 'interpolation'">
            <input v-model="s.name" aria-label="Name" />
            <p>Hello, {{ s.name }}!</p>
          </template>
          <template v-else-if="directive === 'v-bind'">
            <a :href="s.url" :title="s.tip" @click.prevent>Docs</a>
            <button type="button" :disabled="s.locked">Buy</button>
          </template>
          <template v-else-if="directive === 'v-on'">
            <button type="button" @click="s.clicks++">Clicked {{ s.clicks }}×</button>
            <input placeholder="type + Enter" aria-label="Type and press Enter" @keyup.enter="onEnter" />
          </template>
          <template v-else-if="directive === 'v-if'">
            <label><input v-model="s.show" type="checkbox" /> show</label>
            <p v-if="s.show">I exist only while show is true</p>
          </template>
          <template v-else-if="directive === 'v-show'">
            <label><input v-model="s.show" type="checkbox" /> show</label>
            <p v-show="s.show">I stay in the DOM — only hidden</p>
          </template>
          <template v-else-if="directive === 'v-for'">
            <ul>
              <li v-for="item in s.items" :key="item.id">{{ item.text }}</li>
            </ul>
          </template>
          <template v-else-if="directive === 'v-model'">
            <input v-model="s.draft" aria-label="Draft text" />
            <input v-model="s.agree" type="checkbox" aria-label="Agree" />
            <select v-model="s.size" aria-label="Size">
              <option>S</option>
              <option>M</option>
              <option>L</option>
            </select>
          </template>
          <template v-else-if="directive === 'class'">
            <p :class="{ active: s.active, error: s.error }">Status</p>
          </template>
          <template v-else-if="directive === 'style'">
            <p :style="{ color: s.color, fontSize: s.px + 'px' }">Styled text</p>
          </template>
        </div>

        <div class="dl__controls">
          <template v-if="directive === 'v-bind'">
            <label class="checkbox"><input v-model="s.locked" type="checkbox" /> locked</label>
            <label class="field"><span class="label">url</span><input v-model="s.url" class="input" /></label>
          </template>
          <template v-else-if="directive === 'v-on'">
            <p v-for="(k, i) in s.keyLog" :key="i" class="mono dl__keylog">{{ k }}</p>
          </template>
          <template v-else-if="directive === 'v-for'">
            <button type="button" class="btn btn--sm" @click="addItem">add item</button>
            <button type="button" class="btn btn--sm" :disabled="!s.items.length" @click="s.items.pop()">remove last</button>
            <button type="button" class="btn btn--sm" @click="shuffle">shuffle</button>
          </template>
          <template v-else-if="directive === 'v-model'">
            <p class="mono dl__values">draft = {{ JSON.stringify(s.draft) }} · agree = {{ s.agree }} · size = "{{ s.size }}"</p>
          </template>
          <template v-else-if="directive === 'class'">
            <label class="checkbox"><input v-model="s.active" type="checkbox" /> isActive</label>
            <label class="checkbox"><input v-model="s.error" type="checkbox" /> hasError</label>
          </template>
          <template v-else-if="directive === 'style'">
            <label class="field"><span class="label">color</span><input v-model="s.color" type="color" /></label>
            <label class="field"><span class="label">px {{ s.px }}</span><input v-model.number="s.px" type="range" min="12" max="40" /></label>
          </template>
        </div>
      </div>
    </div>

    <div class="dl__bottom">
      <div class="code-panel dl__dom">
        <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" />real DOM right now</span></div>
        <pre class="code-block code-block--plain"><code><span v-for="(line, i) in snapshot" :key="i + line" class="code-line" :class="{ 'is-hl': changed.has(i) }">{{ line }}{{ '\n' }}</span></code></pre>
      </div>
      <div class="dl__log">
        <p class="label">DOM operations (MutationObserver)</p>
        <ol aria-live="polite">
          <li v-if="!log.length" class="muted">Interact with the demo to see what changes.</li>
          <li v-for="(entry, i) in log" :key="i" class="mono">{{ entry }}</li>
        </ol>
      </div>
    </div>
    <p class="dl__note"><span class="label">notice</span> <RichText :value="NOTES[directive]" inline /></p>
  </div>
</template>

<style scoped>
.dl {
  display: grid;
  gap: var(--s-4);
}
.dl__top,
.dl__bottom {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--s-4);
  align-items: start;
}
.dl__stage {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  display: grid;
  gap: var(--s-3);
}
.dl__stage .label {
  margin: 0;
  color: var(--muted);
}
.dl__demo {
  background: #fff;
  color: #1a1a1a;
  border: 2px dashed #1a1a1a;
  padding: var(--s-3);
  display: grid;
  gap: var(--s-2);
  min-height: 90px;
  align-content: start;
}
.dl__demo :is(p, ul) {
  margin: 0;
}
.dl__demo input:not([type='checkbox']),
.dl__demo select {
  border: 2px solid #1a1a1a;
  padding: 4px 6px;
  background: #fff;
  color: #1a1a1a;
  max-width: 240px;
}
.dl__demo button {
  border: 2px solid #1a1a1a;
  background: var(--acid);
  color: #1a1a1a;
  font-weight: 700;
  padding: 4px 10px;
  width: fit-content;
}
.dl__demo button:disabled {
  opacity: 0.45;
}
.dl__demo a {
  width: fit-content;
}
.dl__demo .active {
  font-weight: 800;
  background: var(--acid);
}
.dl__demo .error {
  color: #b8220f;
  text-decoration: underline wavy;
}
.dl__controls {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2) var(--s-3);
  align-items: flex-end;
}
.dl__controls:empty {
  display: none;
}
.dl__controls .field {
  min-width: 140px;
}
.dl__keylog,
.dl__values {
  margin: 0;
  font-size: 0.8rem;
}
.dl__dom .code-block {
  max-height: 260px;
}
.dl__log {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface-2);
  font-size: 0.8rem;
}
.dl__log .label {
  margin: 0 0 var(--s-2);
  color: var(--muted);
}
.dl__log ol {
  margin: 0;
  padding-left: 1.3em;
}
.dl__note {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
}
.dl__note .label {
  background: var(--text);
  color: var(--bg);
  padding: 1px 6px;
  margin-right: 6px;
}
@media (max-width: 800px) {
  .dl__top,
  .dl__bottom {
    grid-template-columns: 1fr;
  }
}
</style>
