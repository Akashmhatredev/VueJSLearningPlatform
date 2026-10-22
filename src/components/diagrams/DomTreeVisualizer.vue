<script setup>
// HTML → DOM tree. Uses DOMParser, which builds an inert document (scripts
// never run), so it is safe to parse whatever the learner types.
import { computed, defineComponent, h, ref } from 'vue'

const props = defineProps({
  html: {
    type: String,
    default: '<main>\n  <h1>My list</h1>\n  <ul>\n    <li>Milk</li>\n    <li class="done">Eggs</li>\n  </ul>\n  <button id="add">Add</button>\n</main>',
  },
})

// Recursive branch renderer for the tree.
const DomBranch = defineComponent({
  name: 'DomBranch',
  props: { nodes: Array, selected: String, depth: { type: Number, default: 2 } },
  emits: ['select'],
  setup(p, { emit }) {
    return () =>
      h(
        'ul',
        { class: 'dom__list', role: 'group' },
        p.nodes.map((n) =>
          h('li', { key: n.path, role: 'treeitem', 'aria-expanded': n.children?.length ? 'true' : undefined }, [
            h(
              'button',
              {
                type: 'button',
                class: ['dom__node', `dom__node--${n.kind}`, { 'is-sel': p.selected === n.path }],
                onClick: () => emit('select', n.path),
              },
              n.kind === 'element'
                ? [h('span', { class: 'dom__tag' }, `<${n.tag}>`), n.attrs.length ? h('span', { class: 'dom__attrs' }, ' ' + n.attrs.join(' ')) : null]
                : n.kind === 'text'
                  ? `"${n.text}"`
                  : `<!-- ${n.text} -->`,
            ),
            n.children?.length ? h(DomBranch, { nodes: n.children, selected: p.selected, depth: p.depth + 1, onSelect: (v) => emit('select', v) }) : null,
          ]),
        ),
      )
  },
})

const source = ref(props.html)
const selected = ref(null)
const SAMPLES = {
  list: props.html,
  'auto-fix': '<p>Unclosed paragraph\n<p>Another one\n<ul><li>Item one<li>Item two</ul>',
  table: '<table>\n  <tr><td>Rows get a tbody</td></tr>\n</table>',
}

function toTree(node, path) {
  if (node.nodeType === 3) {
    const t = node.textContent.replace(/\s+/g, ' ').trim()
    return t ? { kind: 'text', text: t, path } : null
  }
  if (node.nodeType === 8) return { kind: 'comment', text: node.data.trim(), path }
  if (node.nodeType !== 1) return null
  const tag = node.tagName.toLowerCase()
  const attrs = [...node.attributes].map((a) => `${a.name}="${a.value}"`)
  const children = [...node.childNodes].map((c, i) => toTree(c, `${path} > ${c.nodeType === 1 ? c.tagName.toLowerCase() : '#text'}${c.nodeType === 1 ? `:nth-child(${i + 1})` : ''}`)).filter(Boolean)
  return { kind: 'element', tag, attrs, children, path }
}

const tree = computed(() => {
  if (typeof DOMParser === 'undefined') return []
  const doc = new DOMParser().parseFromString(source.value, 'text/html')
  return [...doc.body.childNodes].map((c, i) => toTree(c, `body > ${c.nodeType === 1 ? c.tagName.toLowerCase() : '#text'}`)).filter(Boolean)
})

const count = computed(() => {
  let n = 0
  const walk = (nodes) => nodes.forEach((x) => (n++, x.children && walk(x.children)))
  walk(tree.value)
  return n
})
</script>

<template>
  <div class="dom">
    <div class="dom__samples cluster">
      <span class="label">examples:</span>
      <button v-for="(html, name) in SAMPLES" :key="name" type="button" class="btn btn--sm" @click="source = html">{{ name }}</button>
    </div>
    <div class="dom__grid">
      <label class="field">
        <span class="label">HTML you write</span>
        <textarea v-model="source" class="textarea mono dom__src" rows="10" spellcheck="false" />
      </label>
      <div class="dom__tree" role="tree" aria-label="DOM tree built by the browser">
        <p class="label">DOM tree the browser builds · {{ count }} nodes</p>
        <ul class="dom__root">
          <li class="dom__el"><span class="dom__tag">document</span></li>
          <li class="dom__el dom__indent"><span class="dom__tag">&lt;body&gt;</span></li>
        </ul>
        <DomBranch :nodes="tree" :selected="selected" @select="selected = $event" />
      </div>
    </div>
    <p class="dom__path mono" aria-live="polite">{{ selected ? `selected: ${selected}` : 'Click a node to see its path — the same path document.querySelector would use.' }}</p>
  </div>
</template>


<style scoped>
.dom {
  display: grid;
  gap: var(--s-3);
}
.dom__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr);
  gap: var(--s-3);
  align-items: start;
}
.dom__src {
  font-size: 0.82rem;
  min-height: 220px;
}
.dom__tree {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  overflow-x: auto;
  max-height: 360px;
  overflow-y: auto;
}
.dom__tree > .label {
  margin: 0 0 var(--s-2);
  color: var(--muted);
}
.dom__root {
  list-style: none;
  margin: 0;
  padding: 0;
}
.dom__indent {
  padding-left: 18px;
}
.dom__tree :deep(.dom__list) {
  list-style: none;
  margin: 0;
  padding-left: 36px;
  border-left: 2px dashed color-mix(in srgb, var(--line) 30%, transparent);
}
.dom__tree :deep(.dom__list .dom__list) {
  padding-left: 18px;
  margin-left: 8px;
}
.dom__tree :deep(li) {
  margin: 3px 0;
}
.dom__tree :deep(.dom__node) {
  border: 2px solid var(--line);
  background: var(--surface-2);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 1px 7px;
  text-align: left;
  color: var(--text);
}
.dom__tree :deep(.dom__node--text) {
  border-style: dashed;
  background: var(--note-yellow);
}
.dom__tree :deep(.dom__node--comment) {
  opacity: 0.7;
}
.dom__tree :deep(.dom__node.is-sel) {
  background: var(--acid);
  color: var(--acid-ink);
  box-shadow: 3px 3px 0 var(--shadow-color);
}
.dom__tree :deep(.dom__tag) {
  font-weight: 800;
  font-family: var(--font-mono);
  font-size: 0.75rem;
}
.dom__tree :deep(.dom__attrs) {
  color: var(--cobalt-text);
}
.dom__path {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  border: var(--border-thin);
  background: var(--note-yellow);
  font-size: 0.8rem;
  overflow-x: auto;
}
@media (max-width: 800px) {
  .dom__grid {
    grid-template-columns: 1fr;
  }
}
</style>
