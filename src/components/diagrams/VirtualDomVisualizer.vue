<script setup>
// Virtual DOM visualizer (conceptual). Old tree, new tree, highlighted changes
// and the resulting DOM operations from a simplified diff (utils/vdomDiff.js).
// The "keys" preset also renders two REAL lists to show the index-key bug.
import { computed, ref } from 'vue'
import { diff, flatten, h } from '../../utils/vdomDiff.js'

const props = defineProps({
  preset: { type: String, default: 'list' },
})

const preset = computed(() => (['list', 'keys', 'text'].includes(props.preset) ? props.preset : 'list'))

// ----- state
const score = ref(0)
const prevScore = ref(0)
const items = ref(['Milk', 'Eggs', 'Bread'])
const prevItems = ref([...items.value])
const keyed = ref(false)
let counter = 0
const extra = ['Apples', 'Rice', 'Tea', 'Jam', 'Oats', 'Figs']

function bump() {
  prevScore.value = score.value
  score.value++
}
function mutate(kind) {
  prevItems.value = [...items.value]
  const next = [...items.value]
  // words stay unique so they can double as keys
  const word = extra[counter % extra.length] + (counter >= extra.length ? ` ${Math.floor(counter / extra.length) + 1}` : '')
  counter++
  if (kind === 'append') next.push(word)
  if (kind === 'prepend') next.unshift(word)
  if (kind === 'remove-first') next.shift()
  if (kind === 'reverse') next.reverse()
  items.value = next
}

const trees = computed(() => {
  if (preset.value === 'text') {
    const t = (n) => h('div', {}, [h('h2', {}, `Score: ${n}`), h('button', {}, '+1')])
    return [t(prevScore.value), t(score.value)]
  }
  const useKeys = preset.value === 'keys' ? true : keyed.value
  const list = (arr) => h('ul', {}, arr.map((t) => h('li', useKeys ? { key: t } : {}, t)))
  return [list(prevItems.value), list(items.value)]
})
const result = computed(() => diff(trees.value[0], trees.value[1]))
const oldRows = computed(() => flatten(trees.value[0]))
const newRows = computed(() => flatten(trees.value[1]))

// keys preset: two real lists with inputs
const people = ref([
  { id: 1, name: 'Ada' },
  { id: 2, name: 'Linus' },
  { id: 3, name: 'Grace' },
])
const resetPeople = () =>
  (people.value = [
    { id: 1, name: 'Ada' },
    { id: 2, name: 'Linus' },
    { id: 3, name: 'Grace' },
  ])
</script>

<template>
  <div class="vd">
    <div class="vd__controls cluster">
      <template v-if="preset === 'text'">
        <button type="button" class="btn btn--sm btn--acid" @click="bump">score++</button>
      </template>
      <template v-else>
        <button type="button" class="btn btn--sm btn--acid" @click="mutate('append')">add at end</button>
        <button type="button" class="btn btn--sm btn--acid" @click="mutate('prepend')">add at start</button>
        <button type="button" class="btn btn--sm" :disabled="!items.length" @click="mutate('remove-first')">remove first</button>
        <button type="button" class="btn btn--sm" @click="mutate('reverse')">reverse</button>
        <label v-if="preset === 'list'" class="checkbox"><input v-model="keyed" type="checkbox" /> use <code>:key</code></label>
      </template>
    </div>

    <div class="vd__trees">
      <section class="vd__tree">
        <p class="label">previous virtual tree</p>
        <ul>
          <li v-for="r in oldRows" :key="r.path" :style="{ paddingLeft: r.depth * 18 + 'px' }">
            <span class="vd__node" :class="`is-${result.oldMarks.get(r.path) || 'same'}`">
              &lt;{{ r.node.tag }}<span v-if="r.node.key !== undefined" class="vd__key"> key={{ r.node.key }}</span>&gt;<span v-if="r.node.text" class="vd__text"> {{ r.node.text }}</span>
            </span>
          </li>
        </ul>
      </section>
      <div class="vd__arrow" aria-hidden="true">diff →</div>
      <section class="vd__tree">
        <p class="label">next virtual tree</p>
        <ul>
          <li v-for="r in newRows" :key="r.path" :style="{ paddingLeft: r.depth * 18 + 'px' }">
            <span class="vd__node" :class="`is-${result.newMarks.get(r.path) || 'same'}`">
              &lt;{{ r.node.tag }}<span v-if="r.node.key !== undefined" class="vd__key"> key={{ r.node.key }}</span>&gt;<span v-if="r.node.text" class="vd__text"> {{ r.node.text }}</span>
            </span>
          </li>
        </ul>
      </section>
    </div>

    <div class="vd__ops">
      <p class="label">DOM operations needed ({{ result.ops.length }})</p>
      <ol aria-live="polite">
        <li v-for="(op, i) in result.ops" :key="i" class="mono">{{ op }}</li>
        <li v-if="!result.ops.length" class="muted">Nothing changed yet — use the buttons. Identical trees mean zero DOM work.</li>
      </ol>
      <p class="vd__legend">
        <span class="vd__node is-changed">changed</span> <span class="vd__node is-added">added</span> <span class="vd__node is-removed">removed</span>
        <span class="vd__node is-moved">moved</span>
      </p>
    </div>

    <div v-if="preset === 'keys'" class="vd__real">
      <p class="label">real Vue lists — type a note next to each name, then remove the first person</p>
      <div class="vd__realgrid">
        <div>
          <p class="mono vd__cap">:key="index" ✗</p>
          <ul>
            <li v-for="(p, i) in people" :key="i"><span>{{ p.name }}</span> <input class="input" :aria-label="`note for ${p.name} (index key)`" placeholder="note" /></li>
          </ul>
        </div>
        <div>
          <p class="mono vd__cap">:key="person.id" ✓</p>
          <ul>
            <li v-for="p in people" :key="p.id"><span>{{ p.name }}</span> <input class="input" :aria-label="`note for ${p.name} (id key)`" placeholder="note" /></li>
          </ul>
        </div>
      </div>
      <div class="cluster">
        <button type="button" class="btn btn--sm btn--danger" :disabled="!people.length" @click="people = people.slice(1)">remove first person</button>
        <button type="button" class="btn btn--sm btn--ghost" @click="resetPeople">reset</button>
      </div>
      <p class="vd__insight">With index keys, Vue thinks “item 0 still exists, its text changed” and reuses the first DOM row — so the note you typed for Ada stays on the first row, now showing Linus. With id keys, Ada’s row is removed and every note stays with its person.</p>
    </div>

    <p class="muted vd__note">Conceptual model: real Vue also uses compiler hints (patch flags, static hoisting) and a smarter move algorithm, so it often does even less work than shown.</p>
  </div>
</template>

<style scoped>
.vd {
  display: grid;
  gap: var(--s-3);
}
.vd__trees {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: var(--s-3);
  align-items: stretch;
}
.vd__tree {
  border: var(--border-thin);
  padding: var(--s-3);
  background: var(--surface);
  overflow-x: auto;
}
.vd__tree .label {
  margin: 0 0 var(--s-2);
  color: var(--muted);
}
.vd__tree ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.vd__tree li {
  margin: 0;
}
.vd__node {
  display: inline-block;
  font-family: var(--font-mono);
  font-size: 0.78rem;
  padding: 2px 7px;
  border: 2px solid var(--line);
  background: var(--surface-2);
  white-space: nowrap;
}
.vd__node.is-changed {
  background: var(--acid);
  color: var(--acid-ink);
}
.vd__node.is-added {
  background: #c9f3a6;
  color: #1a1a1a;
}
.vd__node.is-removed {
  background: #ffc2b5;
  color: #1a1a1a;
  text-decoration: line-through;
}
.vd__node.is-moved {
  background: var(--cobalt);
  color: #fff;
}
.vd__key {
  color: inherit;
  opacity: 0.7;
}
.vd__arrow {
  align-self: center;
  font-family: var(--font-hand);
  font-size: 1.4rem;
  color: var(--red-text);
  transform: rotate(-4deg);
}
.vd__ops {
  border: var(--border);
  background: var(--note-yellow);
  padding: var(--s-3) var(--s-4);
}
.vd__ops .label {
  margin: 0 0 6px;
}
.vd__ops ol {
  margin: 0 0 var(--s-2);
  padding-left: 1.4em;
  font-size: 0.82rem;
}
.vd__legend {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.vd__real {
  border: var(--border-thin);
  padding: var(--s-3);
  display: grid;
  gap: var(--s-3);
  background: var(--surface);
}
.vd__real > .label {
  margin: 0;
}
.vd__realgrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--s-4);
}
.vd__realgrid ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 6px;
}
.vd__realgrid li {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0;
}
.vd__realgrid li span {
  min-width: 52px;
  font-weight: 700;
}
.vd__realgrid .input {
  min-height: 34px;
  padding: 2px 8px;
}
.vd__cap {
  margin: 0 0 6px;
  font-weight: 800;
}
.vd__insight {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border-left: 6px solid var(--cobalt);
  background: var(--note-blue);
}
.vd__note {
  margin: 0;
  font-size: 0.8rem;
}
@media (max-width: 800px) {
  .vd__trees {
    grid-template-columns: 1fr;
  }
  .vd__arrow {
    justify-self: center;
    transform: rotate(80deg);
  }
  .vd__realgrid {
    grid-template-columns: 1fr;
  }
}
</style>
