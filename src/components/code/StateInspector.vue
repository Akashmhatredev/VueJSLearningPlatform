<script setup>
// Live view of the root component's reactive state, streamed from the sandbox.
// Primitive refs (and Options API data) can be edited here to watch the UI react.
defineProps({
  state: { type: Object, default: null },
})
const emit = defineEmits(['set'])

const editable = (entry) => ['ref', 'data', 'shallowRef'].includes(entry.kind) && ['number', 'string', 'boolean'].includes(typeof entry.value)

function show(v) {
  if (v === '__undefined__') return 'undefined'
  if (typeof v === 'string') return JSON.stringify(v)
  return JSON.stringify(v, (k, x) => (x === '__undefined__' ? undefined : x), 2)
}

function onInput(key, entry, e) {
  const t = typeof entry.value
  const raw = t === 'boolean' ? e.target.checked : e.target.value
  const value = t === 'number' ? (raw === '' ? 0 : Number(raw)) : raw
  if (t === 'number' && Number.isNaN(value)) return
  emit('set', key, value)
}
</script>

<template>
  <div class="inspector">
    <p v-if="!state" class="inspector__empty">Run the code to inspect the root component's reactive state.</p>
    <p v-else-if="!Object.keys(state).length" class="inspector__empty">
      The root component exposes no reactive state. Declare a <code>ref()</code> or <code>reactive()</code> in it.
    </p>
    <table v-else class="inspector__table">
      <caption class="visually-hidden">Reactive state of the root component</caption>
      <thead>
        <tr>
          <th scope="col">name</th>
          <th scope="col">kind</th>
          <th scope="col">value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(entry, key) in state" :key="key">
          <th scope="row" class="mono">{{ key }}</th>
          <td><span class="kind" :class="`kind--${entry.kind}`">{{ entry.kind }}</span></td>
          <td>
            <template v-if="editable(entry)">
              <input
                v-if="typeof entry.value === 'boolean'"
                type="checkbox"
                :checked="entry.value"
                :aria-label="`Set ${key}`"
                @change="onInput(key, entry, $event)"
              />
              <input
                v-else
                class="inspector__input"
                :type="typeof entry.value === 'number' ? 'number' : 'text'"
                :value="entry.value"
                :aria-label="`Set ${key}`"
                @change="onInput(key, entry, $event)"
                @keydown.enter="onInput(key, entry, $event)"
              />
            </template>
            <pre v-else class="inspector__val">{{ show(entry.value) }}</pre>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="state && Object.keys(state).length" class="inspector__hint">
      Edit a value and press Enter — the preview updates because the ref changed, not because the page re-ran.
    </p>
  </div>
</template>

<style scoped>
.inspector {
  height: 100%;
  overflow: auto;
  background: var(--code-bg);
  color: var(--code-text);
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.inspector__empty,
.inspector__hint {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  color: var(--code-muted);
}
.inspector__empty code {
  background: var(--code-bg-2);
  border-color: var(--code-line);
  color: var(--code-text);
}
.inspector__table th,
.inspector__table td {
  text-align: left;
  vertical-align: top;
  padding: 6px var(--s-3);
  border-bottom: 1px solid var(--code-line);
}
.inspector__table thead th {
  color: var(--code-muted);
  font-weight: 700;
  font-size: 0.68rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.inspector__table tbody th {
  color: #9fd8ff;
  font-weight: 700;
}
.kind {
  display: inline-block;
  padding: 0 6px;
  border: 1.5px solid currentColor;
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.kind--ref,
.kind--shallowRef {
  color: var(--acid);
}
.kind--reactive {
  color: #c9b8ff;
}
.kind--computed {
  color: #7ee2b8;
}
.kind--readonly,
.kind--const {
  color: var(--code-muted);
}
.kind--data {
  color: #ffd166;
}
.inspector__val {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font: inherit;
  color: #ffd166;
}
.inspector__input {
  width: 100%;
  max-width: 220px;
  padding: 2px 6px;
  border: 1.5px solid var(--code-line);
  background: var(--code-bg-2);
  color: var(--acid);
  font: inherit;
}
.inspector__input:focus {
  outline: 2px solid var(--acid);
}
</style>
