<script setup>
import { nextTick, ref, watch } from 'vue'
import { AlertCircle, AlertTriangle, ChevronRight, Info, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  logs: { type: Array, required: true },
})
const emit = defineEmits(['clear'])
const list = ref(null)

watch(
  () => props.logs.length,
  async () => {
    await nextTick()
    if (list.value) list.value.scrollTop = list.value.scrollHeight
  },
)
</script>

<template>
  <div class="console">
    <div ref="list" class="console__list" role="log" aria-label="Console output" aria-live="polite">
      <p v-if="!logs.length" class="console__empty">Console is empty. <code>console.log()</code> output, Vue warnings and errors appear here.</p>
      <div v-for="l in logs" :key="l.id" class="line" :class="`line--${l.level}`">
        <AlertCircle v-if="l.level === 'error'" :size="14" class="line__icon" aria-label="error" />
        <AlertTriangle v-else-if="l.level === 'warn'" :size="14" class="line__icon" aria-label="warning" />
        <Info v-else-if="l.level === 'info'" :size="14" class="line__icon" aria-label="info" />
        <ChevronRight v-else :size="14" class="line__icon" aria-hidden="true" />
        <pre class="line__text">{{ l.text }}</pre>
        <span v-if="l.count > 1" class="line__count" :aria-label="`repeated ${l.count} times`">{{ l.count }}</span>
      </div>
    </div>
    <button type="button" class="console__clear" aria-label="Clear console" @click="emit('clear')">
      <Trash2 :size="14" aria-hidden="true" />
    </button>
  </div>
</template>

<style scoped>
.console {
  position: relative;
  height: 100%;
  background: var(--code-bg);
  color: var(--code-text);
}
.console__list {
  height: 100%;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 0.78rem;
}
.console__empty {
  margin: 0;
  padding: var(--s-3) var(--s-4);
  color: var(--code-muted);
}
.console__empty code {
  background: var(--code-bg-2);
  border-color: var(--code-line);
  color: var(--code-text);
}
.line {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 5px var(--s-4) 5px var(--s-3);
  border-bottom: 1px solid var(--code-line);
}
.line__icon {
  flex: none;
  margin-top: 2px;
  color: var(--code-muted);
}
.line__text {
  margin: 0;
  flex: 1;
  white-space: pre-wrap;
  word-break: break-word;
  font: inherit;
}
.line--error {
  background: rgba(229, 52, 26, 0.16);
  color: #ffb4a6;
}
.line--error .line__icon {
  color: #ff7a63;
}
.line--warn {
  background: rgba(255, 209, 102, 0.12);
  color: #ffe2a3;
}
.line--warn .line__icon {
  color: #ffd166;
}
.line__count {
  flex: none;
  min-width: 1.6em;
  padding: 0 5px;
  background: var(--code-line);
  border-radius: 0;
  text-align: center;
}
.console__clear {
  position: absolute;
  top: 6px;
  right: 10px;
  border: 1.5px solid var(--code-line);
  background: var(--code-bg-2);
  color: var(--code-muted);
  padding: 4px 6px;
}
.console__clear:hover {
  color: #1a1a1a;
  background: var(--acid);
}
</style>
