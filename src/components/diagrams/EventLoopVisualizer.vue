<script setup>
// Event loop stepper. Each preset is a hand-written trace of how a browser runs
// the snippet; the output orders were verified by running the code.
import { computed } from 'vue'
import AnimationControls from './AnimationControls.vue'
import CodeBlock from '../code/CodeBlock.vue'
import RichText from '../learning/RichText.vue'
import { useStepPlayer } from '../../composables/useStepPlayer.js'

const props = defineProps({
  preset: { type: String, default: 'promises' },
})

const PRESETS = {
  promises: {
    code: `console.log('A')
setTimeout(() => console.log('B'), 0)
Promise.resolve().then(() => console.log('C'))
console.log('D')`,
    steps: [
      { line: 1, stack: ['main script'], out: ['A'], text: 'The script starts on the **call stack** and runs top to bottom. `A` is logged immediately.' },
      { line: 2, stack: ['main script'], apis: ['timer 0ms → B'], out: ['A'], text: '`setTimeout` hands the callback to the browser’s timer. Even with 0 ms it can only run **later**, as a separate task.' },
      { line: 2, stack: ['main script'], tasks: ['() => log(B)'], out: ['A'], text: 'The timer finishes almost instantly and puts its callback in the **task queue**. It still has to wait for the stack to be empty.' },
      { line: 3, stack: ['main script'], tasks: ['() => log(B)'], micro: ['() => log(C)'], out: ['A'], text: '`.then()` on a resolved promise queues its callback as a **microtask** — a higher-priority queue.' },
      { line: 4, stack: ['main script'], tasks: ['() => log(B)'], micro: ['() => log(C)'], out: ['A', 'D'], text: '`D` is logged. Synchronous code always finishes first.' },
      { stack: [], tasks: ['() => log(B)'], micro: ['() => log(C)'], out: ['A', 'D'], text: 'The script is done and the stack is empty. Before taking the next task, the event loop **drains every microtask**.' },
      { line: 3, stack: ['then callback'], tasks: ['() => log(B)'], out: ['A', 'D', 'C'], text: 'The microtask runs: `C` is logged.' },
      { line: 2, stack: ['timeout callback'], out: ['A', 'D', 'C', 'B'], text: 'Microtasks are empty, so the loop takes the next **task**: the timer callback logs `B`. Final order: **A, D, C, B**.' },
    ],
  },
  timers: {
    code: `setTimeout(() => console.log('slow'), 100)
setTimeout(() => console.log('fast'), 0)
console.log('sync')`,
    steps: [
      { line: 1, stack: ['main script'], apis: ['timer 100ms → slow'], out: [], text: 'The first timer is registered for 100 ms. Nothing is logged yet.' },
      { line: 2, stack: ['main script'], apis: ['timer 100ms → slow', 'timer 0ms → fast'], out: [], text: 'A second timer is registered for 0 ms.' },
      { line: 3, stack: ['main script'], apis: ['timer 100ms → slow'], tasks: ['() => log(fast)'], out: ['sync'], text: '`sync` is logged. Meanwhile the 0 ms timer has expired and queued its callback.' },
      { line: 2, stack: ['timeout callback'], apis: ['timer 100ms → slow'], out: ['sync', 'fast'], text: 'The stack is empty, so the queued task runs: `fast`.' },
      { line: 1, stack: ['timeout callback'], out: ['sync', 'fast', 'slow'], text: 'About 100 ms later the slow timer’s callback is queued and runs: `slow`. Delays are a *minimum*, not a guarantee.' },
    ],
  },
  'async-await': {
    code: `async function load() {
  console.log('1 start')
  await null
  console.log('3 after await')
}
load()
console.log('2 sync code continues')`,
    steps: [
      { line: 6, stack: ['main script', 'load()'], out: [], text: 'Calling an `async` function runs its body **synchronously** — until the first `await`.' },
      { line: 2, stack: ['main script', 'load()'], out: ['1 start'], text: '`1 start` is logged right away.' },
      { line: 3, stack: ['main script'], micro: ['resume load() after await'], out: ['1 start'], text: '`await` pauses `load()` and returns to the caller. The rest of the function is scheduled as a **microtask**.' },
      { line: 7, stack: ['main script'], micro: ['resume load() after await'], out: ['1 start', '2 sync code continues'], text: 'The caller keeps going: `2 sync code continues`.' },
      { line: 4, stack: ['load() (resumed)'], out: ['1 start', '2 sync code continues', '3 after await'], text: 'The stack is empty, so the microtask resumes `load()`: `3 after await`. That is why code after `await` runs later.' },
    ],
  },
  nexttick: {
    code: `// inside a component, el shows {{ count }}
count.value++
console.log(el.textContent)   // ?
await nextTick()
console.log(el.textContent)   // ?`,
    steps: [
      { line: 2, stack: ['your handler'], micro: ['Vue: flush render jobs'], out: [], text: 'Changing state does **not** update the DOM immediately. Vue queues the component’s re-render as a job, flushed in a **microtask**.' },
      { line: 3, stack: ['your handler'], micro: ['Vue: flush render jobs'], out: ['0'], text: 'The DOM still shows the old value, so this logs `0`. This batching is why ten changes in a row cause only one re-render.' },
      { line: 4, stack: ['your handler'], micro: ['Vue: flush render jobs', 'resume after nextTick()'], out: ['0'], text: '`await nextTick()` pauses your function until *after* Vue’s flush.' },
      { line: 4, stack: ['Vue scheduler'], micro: ['resume after nextTick()'], out: ['0'], dom: '1', text: 'The stack is free: Vue flushes its queue, re-renders and patches the DOM — it now shows `1`.' },
      { line: 5, stack: ['your handler (resumed)'], out: ['0', '1'], dom: '1', text: 'Your code resumes after the flush and reads the updated DOM: `1`.' },
    ],
  },
}

const def = PRESETS[props.preset] ?? PRESETS.promises
const player = useStepPlayer(() => def.steps, { interval: 2400 })
const step = computed(() => player.frame.value ?? def.steps[0])
</script>

<template>
  <div class="el">
    <div class="el__top">
      <CodeBlock :code="def.code" lang="js" title="the code" :highlight="step.line ? [step.line] : []" :copyable="false" />
      <div class="el__console code-panel">
        <div class="code-panel__bar"><span class="code-panel__title"><span class="dot" />console</span></div>
        <ol class="el__out mono">
          <li v-for="(o, i) in step.out" :key="i" :class="{ 'is-new': i === step.out.length - 1 }">› {{ o }}</li>
          <li v-if="!step.out.length" class="el__empty">(nothing yet)</li>
        </ol>
        <p v-if="preset === 'nexttick'" class="el__dom mono">DOM shows: <strong>{{ step.dom ?? '0' }}</strong></p>
      </div>
    </div>
    <div class="el__lanes">
      <section class="el__lane">
        <p class="label">call stack</p>
        <ol class="el__stack">
          <li v-for="(f, i) in [...(step.stack ?? [])].reverse()" :key="f + i" class="el__frame">{{ f }}</li>
          <li v-if="!step.stack?.length" class="el__empty">empty</li>
        </ol>
      </section>
      <section class="el__lane">
        <p class="label">browser APIs (timers)</p>
        <ul>
          <li v-for="a in step.apis ?? []" :key="a" class="el__item el__item--api">{{ a }}</li>
          <li v-if="!step.apis?.length" class="el__empty">—</li>
        </ul>
      </section>
      <section class="el__lane el__lane--micro">
        <p class="label">microtask queue · runs first</p>
        <ul>
          <li v-for="m in step.micro ?? []" :key="m" class="el__item el__item--micro">{{ m }}</li>
          <li v-if="!step.micro?.length" class="el__empty">empty</li>
        </ul>
      </section>
      <section class="el__lane">
        <p class="label">task queue</p>
        <ul>
          <li v-for="t in step.tasks ?? []" :key="t" class="el__item">{{ t }}</li>
          <li v-if="!step.tasks?.length" class="el__empty">empty</li>
        </ul>
      </section>
    </div>
    <div class="el__explain" aria-live="polite">
      <RichText :value="step.text" />
    </div>
    <AnimationControls :player="player" label="Event loop" />
  </div>
</template>

<style scoped>
.el {
  display: grid;
  gap: var(--s-3);
}
.el__top {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr);
  gap: var(--s-3);
}
.el__console {
  box-shadow: none;
}
.el__out {
  list-style: none;
  margin: 0;
  padding: var(--s-3);
  font-size: 0.85rem;
  min-height: 110px;
}
.el__out li {
  margin: 0;
}
.el__out li.is-new {
  color: var(--acid);
}
.el__dom {
  margin: 0;
  padding: var(--s-2) var(--s-3);
  border-top: 2px solid var(--code-line);
  font-size: 0.8rem;
}
.el__lanes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--s-2);
}
.el__lane {
  border: var(--border-thin);
  background: var(--surface);
  padding: var(--s-2);
  min-height: 130px;
}
.el__lane--micro {
  background: var(--note-yellow);
}
.el__lane .label {
  margin: 0 0 6px;
  color: var(--muted);
}
.el__lane ul,
.el__stack {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 4px;
}
.el__lane li + li {
  margin: 0;
}
.el__frame,
.el__item {
  font-family: var(--font-mono);
  font-size: 0.72rem;
  padding: 4px 6px;
  border: 2px solid var(--line);
  background: var(--surface-2);
  animation: drop 220ms steps(3);
}
.el__frame {
  background: var(--acid);
  color: var(--acid-ink);
}
.el__item--micro {
  background: #fff;
  color: #1a1a1a;
}
.el__item--api {
  border-style: dashed;
}
.el__empty {
  font-size: 0.75rem;
  color: var(--muted);
}
.el__explain {
  padding: var(--s-3) var(--s-4);
  border: var(--border);
  background: var(--note-yellow);
  min-height: 70px;
}
.el__explain :deep(p) {
  margin: 0;
}
@keyframes drop {
  from {
    transform: translateY(-8px);
    opacity: 0;
  }
}
@media (max-width: 800px) {
  .el__top {
    grid-template-columns: 1fr;
  }
  .el__lanes {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
