<script setup>
// Illustration for ref(): a real ref drives a mock "screen". After each change
// we read the actual DOM text back, so the log reports what really happened.
import { computed, nextTick, ref, useTemplateRef } from 'vue'
import HandArrow from '../ui/HandArrow.vue'

const props = defineProps({
  label: { type: String, default: 'score' },
  start: { type: Number, default: 0 },
})

const value = ref(props.start)
const pulse = ref(0)
const log = ref([])
const screenText = useTemplateRef('screenText')
const templateSample = computed(() => `<h2>Score: {{ ${props.label} }}</h2>`)

async function change(delta) {
  const before = value.value
  value.value = delta === null ? props.start : before + delta
  if (value.value === before) return
  pulse.value++
  await nextTick() // Vue has patched the DOM by now
  log.value = [
    { id: pulse.value, text: `${props.label}.value: ${before} → ${value.value}`, dom: screenText.value?.textContent ?? '' },
    ...log.value,
  ].slice(0, 4)
}
</script>

<template>
  <div class="sb">
    <div class="sb__stage graph-paper">
      <div class="sb__box" :class="{ 'is-pulse': pulse % 2 === 1, 'is-pulse2': pulse % 2 === 0 && pulse > 0 }">
        <span class="label">ref</span>
        <span class="sb__name mono">{{ label }}</span>
        <span class="sb__slot">
          <span class="sb__key mono">.value</span>
          <span :key="value" class="sb__val">{{ value }}</span>
        </span>
      </div>

      <div class="sb__arrow" :class="{ 'is-firing': pulse > 0 }" :key="'a' + pulse" aria-hidden="true">
        <HandArrow variant="right" width="120" />
        <span class="hand sb__note">Vue notices the change</span>
      </div>

      <div class="sb__screen">
        <div class="sb__chrome" aria-hidden="true"><span /><span /><span /></div>
        <div class="sb__page">
          <h3 ref="screenText" class="sb__h">Score: <span :key="value" class="sb__flip">{{ value }}</span></h3>
          <p class="sb__tpl mono">{{ templateSample }}</p>
        </div>
      </div>
    </div>

    <div class="sb__controls cluster">
      <button type="button" class="btn btn--acid btn--sm" @click="change(1)">{{ label }}.value++</button>
      <button type="button" class="btn btn--sm" @click="change(-1)">{{ label }}.value--</button>
      <button type="button" class="btn btn--sm btn--ghost" @click="change(null)">reset</button>
    </div>

    <ol class="sb__log" aria-live="polite" aria-label="What happened">
      <li v-if="!log.length" class="muted">Click a button. Each change is logged with what the DOM says afterwards.</li>
      <li v-for="entry in log" :key="entry.id">
        <span class="mono">{{ entry.text }}</span> <span class="sb__then">→ DOM now reads “{{ entry.dom }}”</span>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.sb {
  display: grid;
  gap: var(--s-4);
}
.sb__stage {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: var(--s-4);
  padding: var(--s-5);
  border: var(--border-thin);
}
.sb__box {
  display: grid;
  gap: 6px;
  padding: var(--s-3) var(--s-4);
  background: var(--kraft);
  color: #1a1a1a;
  border: var(--border);
  box-shadow: var(--shadow-sm);
  min-width: 150px;
}
.sb__box .label {
  color: #4a3a20;
}
.sb__name {
  font-weight: 800;
  font-size: 1.1rem;
}
.sb__slot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-3);
  padding: 6px 10px;
  background: #fffef0;
  border: 2px dashed #1a1a1a;
}
.sb__key {
  font-size: 0.8rem;
  color: #6b5a3a;
}
.sb__val {
  font-family: var(--font-display);
  font-weight: 900;
  font-size: 1.8rem;
  line-height: 1;
  animation: pop 260ms steps(3);
}
.is-pulse,
.is-pulse2 {
  animation: shake 240ms steps(3);
}
.sb__arrow {
  display: grid;
  justify-items: center;
  color: var(--red-text);
  opacity: 0.35;
}
.sb__arrow.is-firing {
  opacity: 1;
  animation: fire 600ms steps(4);
}
.sb__note {
  font-size: 1.1rem;
  transform: rotate(-3deg);
  text-align: center;
}
.sb__screen {
  border: var(--border);
  background: #fff;
  color: #1a1a1a;
  min-width: 190px;
  box-shadow: var(--shadow-sm);
}
.sb__chrome {
  display: flex;
  gap: 5px;
  padding: 6px 8px;
  border-bottom: 2px solid #1a1a1a;
  background: #f1eee5;
}
.sb__chrome span {
  width: 9px;
  height: 9px;
  border: 1.5px solid #1a1a1a;
}
.sb__page {
  padding: var(--s-3) var(--s-4);
}
.sb__h {
  font-size: 1.5rem;
  margin: 0 0 4px;
  font-stretch: 100%;
}
.sb__flip {
  display: inline-block;
  background: var(--acid);
  padding: 0 4px;
  animation: flip 320ms steps(3);
}
.sb__tpl {
  font-size: 0.68rem;
  color: #6b6b66;
  margin: 0;
}
.sb__log {
  list-style: none;
  margin: 0;
  padding: var(--s-3) var(--s-4);
  border: var(--border-thin);
  background: var(--surface-2);
  font-size: 0.86rem;
  min-height: 3.2em;
}
.sb__log li + li {
  margin-top: 2px;
}
.sb__then {
  color: var(--muted);
}
@keyframes pop {
  0% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes flip {
  0% {
    transform: rotateX(90deg);
  }
  100% {
    transform: rotateX(0);
  }
}
@keyframes shake {
  33% {
    transform: rotate(-2deg);
  }
  66% {
    transform: rotate(2deg);
  }
}
@keyframes fire {
  0% {
    transform: translateX(-10px);
  }
  100% {
    transform: translateX(0);
  }
}
@media (max-width: 700px) {
  .sb__stage {
    grid-template-columns: 1fr;
    justify-items: center;
  }
  .sb__arrow :deep(svg) {
    transform: rotate(90deg);
  }
}
</style>
