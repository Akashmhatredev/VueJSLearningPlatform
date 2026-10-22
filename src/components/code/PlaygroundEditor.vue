<script setup>
// The interactive playground: edit real Vue SFCs, compile them in a worker and
// run them in a sandboxed iframe. Used by lessons, exercises, interview coding
// questions and the standalone /playground page.
import { computed, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { Check, ChevronLeft, ChevronRight, Copy, FilePlus2, FlaskConical, Footprints, Play, RotateCcw, X } from 'lucide-vue-next'
import CodeEditor from './CodeEditor.vue'
import ConsolePanel from './ConsolePanel.vue'
import StateInspector from './StateInspector.vue'
import TestResults from './TestResults.vue'
import TabsBar from '../ui/TabsBar.vue'
import RichText from '../learning/RichText.vue'
import { useSandbox } from '../../composables/useSandbox.js'
import { useCopy } from '../../composables/useCopy.js'
import { warmCompiler } from '../../services/sandbox/compilerClient.js'

const props = defineProps({
  files: { type: Object, required: true }, // { 'App.vue': '...' }
  entry: { type: String, default: undefined },
  title: { type: String, default: 'Playground' },
  tests: { type: Array, default: () => [] }, // [{ name, code }]
  guide: { type: Array, default: () => [] }, // [{ file?, lines: [..], text }]
  variants: { type: Array, default: () => [] }, // [{ id, label, files }] alternative examples/solutions
  autorun: { type: Boolean, default: true }, // run once when scrolled into view (not counted as a learner run)
  height: { type: String, default: '420px' },
})
const emit = defineEmits(['run', 'tests', 'change'])

const uid = useId()
const sandbox = useSandbox()
const { iframe, status, logs, state, testResults } = sandbox
const { copy, copied } = useCopy()

const original = shallowRef(structuredClone({ ...props.files }))
const current = ref(structuredClone({ ...props.files }))
const fileNames = computed(() => Object.keys(current.value))
const activeFile = ref(props.entry && current.value[props.entry] ? props.entry : fileNames.value[0])
// The lesson's own files are always one of the choices, so learners can get back to them.
const sameFiles = (a, b) => JSON.stringify(a) === JSON.stringify(b)
const variantOptions = computed(() => {
  if (!props.variants.length) return []
  const hasDefault = props.variants.some((v) => sameFiles(v.files, props.files))
  return hasDefault ? props.variants : [{ id: '__lesson', label: 'Lesson example', files: props.files }, ...props.variants]
})
const variantId = ref(variantOptions.value.find((v) => sameFiles(v.files, props.files))?.id ?? null)
const newFileName = ref(null)
const newFileError = ref('')
const bottomTab = ref('console')
const guideOn = ref(false)
const guideStep = ref(0)
const root = ref(null)
const hasRun = ref(false)

const isDirty = computed(() => JSON.stringify(current.value) !== JSON.stringify(original.value))
const errorCount = computed(() => logs.value.filter((l) => l.level === 'error').length)
const busy = computed(() => ['compiling', 'loading', 'testing'].includes(status.value))
const langOf = (name) => (name.endsWith('.vue') ? 'vue' : name.endsWith('.css') ? 'css' : name.endsWith('.html') ? 'html' : 'js')

const bottomTabs = computed(() => [
  { id: 'console', label: 'Console', badge: errorCount.value || null },
  { id: 'state', label: 'Reactive state' },
  ...(props.tests.length ? [{ id: 'tests', label: 'Tests', badge: testResults.value ? `${testResults.value.filter((r) => r.pass).length}/${testResults.value.length}` : null }] : []),
])

const currentGuide = computed(() => (guideOn.value ? props.guide[guideStep.value] : null))
// Guide steps use `lines: [start, end]` (or `[line]` for a single line).
const guidedLines = computed(() => {
  const g = currentGuide.value
  if (!g || (g.file && g.file !== activeFile.value)) return []
  const [a, b = a] = g.lines
  return Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i)
})
watch(currentGuide, (g) => {
  if (g?.file && current.value[g.file] !== undefined) activeFile.value = g.file
})

async function run({ learner = true } = {}) {
  hasRun.value = true
  bottomTab.value = bottomTab.value === 'tests' ? 'console' : bottomTab.value
  const res = await sandbox.run(current.value, { entry: props.entry })
  if (learner) emit('run', res)
  return res
}

async function runTests() {
  if (!props.tests.length) return null
  hasRun.value = true
  bottomTab.value = 'tests'
  const res = await sandbox.run(current.value, { entry: props.entry, mode: 'test', tests: props.tests })
  const results = res.results ?? []
  emit('tests', { results, passed: results.length > 0 && results.every((r) => r.pass), files: current.value })
  return results
}

function reset() {
  current.value = structuredClone(original.value)
  if (!current.value[activeFile.value]) activeFile.value = Object.keys(current.value)[0]
  testResults.value = null
  run({ learner: false })
}

function loadFiles(files, { asOriginal = false } = {}) {
  current.value = structuredClone(files)
  if (asOriginal) original.value = structuredClone(files)
  if (!current.value[activeFile.value]) activeFile.value = Object.keys(files)[0]
  run({ learner: false })
}

function chooseVariant(id) {
  const v = variantOptions.value.find((x) => x.id === id)
  if (!v) return
  variantId.value = id
  loadFiles(v.files, { asOriginal: true })
}

const STARTERS = {
  // `<\/script>` keeps the SFC parser from ending this <script> block early.
  vue: (name) => `<script setup>\nimport { ref } from 'vue'\n\nconst message = ref('Hello from ${name}')\n<\/script>\n\n<template>\n  <p>{{ message }}</p>\n</template>\n`,
  js: () => `import { ref } from 'vue'\n\nexport function useExample() {\n  const value = ref(0)\n  return { value }\n}\n`,
  css: () => `/* styles */\n`,
}

function startNewFile() {
  newFileName.value = ''
  newFileError.value = ''
}

function addFile() {
  const name = (newFileName.value ?? '').trim()
  if (!/^[\w-]+(\/[\w-]+)*\.(vue|js|css)$/.test(name)) {
    newFileError.value = 'Use a name like Card.vue, useCart.js or styles.css'
    return
  }
  if (current.value[name] !== undefined) {
    newFileError.value = `${name} already exists`
    return
  }
  const ext = name.split('.').pop()
  current.value = { ...current.value, [name]: STARTERS[ext](name.replace(/.*\//, '')) }
  activeFile.value = name
  newFileName.value = null
}

function removeFile(name) {
  const next = { ...current.value }
  delete next[name]
  current.value = next
  if (activeFile.value === name) activeFile.value = Object.keys(next)[0]
}

const entryName = computed(() => props.entry ?? (current.value['main.js'] !== undefined ? 'main.js' : 'App.vue'))

watch(current, (v) => emit('change', v), { deep: true })

// Autorun when the playground first scrolls into view, so the preview is never empty.
let observer = null
onMounted(() => {
  if (!props.autorun) return
  if (typeof IntersectionObserver === 'undefined') return run({ learner: false })
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer.disconnect()
        observer = null
        if (!hasRun.value) run({ learner: false })
      }
    },
    { rootMargin: '200px' },
  )
  observer.observe(root.value)
  warmCompiler()
})
onBeforeUnmount(() => observer?.disconnect())

defineExpose({ run, runTests, reset, loadFiles, files: current })
</script>

<template>
  <section ref="root" class="pg" :aria-label="title">
    <div class="pg__toolbar">
      <div class="pg__title">
        <span class="label">{{ title }}</span>
        <span v-if="isDirty" class="chip chip--acid pg__edited">edited</span>
      </div>
      <div class="pg__actions">
        <label v-if="variantOptions.length > 1" class="pg__variant">
          <span class="visually-hidden">Choose example version</span>
          <select class="select" :value="variantId" @change="chooseVariant($event.target.value)">
            <option v-for="v in variantOptions" :key="v.id" :value="v.id">{{ v.label }}</option>
          </select>
        </label>
        <button v-if="guide.length" type="button" class="btn btn--sm" :aria-pressed="guideOn" @click="guideOn = !guideOn">
          <Footprints :size="14" aria-hidden="true" /> Guide
        </button>
        <button type="button" class="btn btn--sm" :aria-label="copied ? 'Copied' : `Copy ${activeFile}`" @click="copy(current[activeFile])">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          <span class="pg__btntext">{{ copied ? 'Copied' : 'Copy' }}</span>
        </button>
        <button type="button" class="btn btn--sm" :disabled="busy" @click="reset">
          <RotateCcw :size="14" aria-hidden="true" /> <span class="pg__btntext">Reset</span>
        </button>
        <button v-if="tests.length" type="button" class="btn btn--sm btn--cobalt" :disabled="busy" @click="runTests">
          <FlaskConical :size="14" aria-hidden="true" /> Run tests
        </button>
        <button type="button" class="btn btn--sm btn--acid" :disabled="busy" title="Run (Ctrl/Cmd + Enter)" @click="run()">
          <Play :size="14" aria-hidden="true" /> {{ status === 'compiling' ? 'Compiling…' : 'Run' }}
        </button>
      </div>
    </div>

    <div v-if="currentGuide" class="pg__guide" role="region" aria-label="Guided walkthrough" aria-live="polite">
      <span class="pg__guide-step mono">step {{ guideStep + 1 }}/{{ guide.length }}</span>
      <RichText class="pg__guide-text" :value="currentGuide.text" />
      <div class="pg__guide-nav">
        <button type="button" class="btn btn--sm btn--icon" :disabled="guideStep === 0" aria-label="Previous step" @click="guideStep--">
          <ChevronLeft :size="16" aria-hidden="true" />
        </button>
        <button type="button" class="btn btn--sm btn--icon" :disabled="guideStep === guide.length - 1" aria-label="Next step" @click="guideStep++">
          <ChevronRight :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="pg__body" :style="{ '--pg-h': height }">
      <div class="pg__editor code-panel">
        <div class="code-panel__bar pg__files">
          <div class="pg__filetabs" role="tablist" aria-label="Files">
            <span v-for="name in fileNames" :key="name" class="pg__filetab-wrap" :class="{ 'is-active': activeFile === name }">
              <button
                :id="`${uid}-file-${name}`"
                type="button"
                role="tab"
                class="pg__filetab"
                :aria-selected="activeFile === name"
                @click="activeFile = name"
              >
                {{ name }}
              </button>
              <button
                v-if="name !== entryName && fileNames.length > 1"
                type="button"
                class="pg__filex"
                :aria-label="`Delete ${name}`"
                title="Delete file (Reset restores the original files)"
                @click="removeFile(name)"
              >
                <X :size="12" aria-hidden="true" />
              </button>
            </span>
          </div>
          <form v-if="newFileName !== null" class="pg__newfile" @submit.prevent="addFile">
            <label class="visually-hidden" :for="`${uid}-newfile`">New file name</label>
            <input
              :id="`${uid}-newfile`"
              v-model="newFileName"
              class="pg__newfile-input"
              placeholder="Card.vue"
              autocomplete="off"
              spellcheck="false"
              :aria-invalid="!!newFileError"
              :aria-describedby="newFileError ? `${uid}-newfile-err` : undefined"
              @keydown.esc="newFileName = null"
            />
            <button type="submit" class="code-panel__btn">Add</button>
            <span v-if="newFileError" :id="`${uid}-newfile-err`" class="pg__newfile-err" role="alert">{{ newFileError }}</span>
          </form>
          <button v-else type="button" class="code-panel__btn pg__addfile" aria-label="Add a file" title="Add a file" @click="startNewFile">
            <FilePlus2 :size="14" aria-hidden="true" />
          </button>
        </div>
        <div class="pg__editor-area" role="tabpanel" :aria-labelledby="`${uid}-file-${activeFile}`">
          <CodeEditor
            :key="activeFile"
            v-model="current[activeFile]"
            :lang="langOf(activeFile)"
            :label="`${activeFile} — editable code`"
            :guided-lines="guidedLines"
            @run="run()"
          />
        </div>
      </div>

      <div class="pg__right">
        <div class="pg__preview">
          <div class="pg__preview-bar">
            <span class="label">Preview</span>
            <span class="pg__status mono" role="status">
              <span class="pg__dot" :class="`is-${status}`" aria-hidden="true" />
              {{ { idle: 'not run yet', compiling: 'compiling…', loading: 'starting…', testing: 'testing…', running: 'running', error: 'error' }[status] }}
            </span>
          </div>
          <iframe
            ref="iframe"
            class="pg__frame"
            :title="`${title} — live preview`"
            sandbox="allow-scripts allow-modals allow-forms"
            referrerpolicy="no-referrer"
          />
          <p v-if="status === 'idle'" class="pg__idle hand">press RUN to see it live →</p>
        </div>
        <div class="pg__bottom code-panel">
          <div class="code-panel__bar pg__bottom-bar">
            <TabsBar v-model="bottomTab" :tabs="bottomTabs" label="Output panels" :id-prefix="`${uid}-out`" />
          </div>
          <div class="pg__bottom-area" role="tabpanel" :id="`${uid}-out-panel-${bottomTab}`" :aria-labelledby="`${uid}-out-tab-${bottomTab}`">
            <ConsolePanel v-if="bottomTab === 'console'" :logs="logs" @clear="sandbox.clearLogs()" />
            <StateInspector v-else-if="bottomTab === 'state'" :state="state" @set="sandbox.setState" />
            <TestResults v-else :results="testResults" :running="status === 'testing'" :tests="tests" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pg {
  border: var(--border);
  background: var(--surface);
  color: var(--text);
  box-shadow: var(--shadow);
}
.pg__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--s-2) var(--s-3);
  padding: var(--s-2) var(--s-3);
  border-bottom: var(--border);
  background: var(--surface-2);
}
.pg__title {
  display: flex;
  align-items: center;
  gap: var(--s-2);
  min-width: 0;
}
.pg__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-2);
  align-items: center;
}
.pg__variant .select {
  min-height: 34px;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-family: var(--font-mono);
}
.pg__guide {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: var(--s-3);
  align-items: center;
  padding: var(--s-3);
  border-bottom: var(--border);
  background: var(--note-yellow);
}
.pg__guide-step {
  font-weight: 800;
  font-size: 0.72rem;
  background: var(--text);
  color: var(--bg);
  padding: 2px 6px;
}
.pg__guide-text :deep(p) {
  margin: 0;
}
.pg__guide-nav {
  display: flex;
  gap: var(--s-2);
}
.pg__body {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  height: var(--pg-h);
  min-height: 360px;
}
.pg__editor {
  border: 0;
  border-right: var(--border);
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pg__files {
  padding: 0;
}
.pg__filetabs {
  display: flex;
  overflow-x: auto;
}
.pg__files {
  flex-wrap: wrap;
}
.pg__filetab-wrap {
  display: inline-flex;
  align-items: stretch;
  border-right: 2px solid var(--code-line);
}
.pg__filetab-wrap.is-active {
  background: var(--code-bg);
  box-shadow: inset 0 3px 0 var(--acid);
}
.pg__filex {
  border: 0;
  background: transparent;
  color: var(--code-muted);
  padding: 0 6px 0 0;
}
.pg__filex:hover {
  color: var(--red);
}
.pg__addfile {
  margin-left: auto;
}
.pg__newfile {
  display: flex;
  align-items: stretch;
  gap: 0;
  margin-left: auto;
  flex-wrap: wrap;
}
.pg__newfile-input {
  width: 150px;
  border: 0;
  border-left: 2px solid var(--code-line);
  background: var(--code-bg);
  color: var(--acid);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  padding: 0 8px;
}
.pg__newfile-err {
  flex-basis: 100%;
  padding: 2px 8px;
  font-size: 0.7rem;
  color: #ff9a85;
}
.pg__filetab {
  border: 0;
  background: transparent;
  color: var(--code-muted);
  font-family: var(--font-mono);
  font-size: 0.74rem;
  font-weight: 700;
  padding: 0 0.9em;
  min-height: 40px;
  white-space: nowrap;
}
.pg__filetab[aria-selected='true'] {
  color: var(--acid);
}
.pg__filetab:focus-visible {
  outline: 3px solid var(--acid);
  outline-offset: -3px;
}
.pg__editor-area {
  flex: 1;
  min-height: 0;
  overflow: auto;
}
.pg__right {
  display: grid;
  grid-template-rows: minmax(0, 1.2fr) minmax(0, 1fr);
  min-height: 0;
}
.pg__preview {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  border-bottom: var(--border);
}
.pg__preview-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px var(--s-3);
  border-bottom: var(--border-thin);
  background: var(--surface);
}
.pg__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.72rem;
  color: var(--muted);
}
.pg__dot {
  width: 10px;
  height: 10px;
  border: 2px solid var(--line);
  background: var(--surface-2);
}
.pg__dot.is-running {
  background: #39d353;
}
.pg__dot.is-compiling,
.pg__dot.is-loading,
.pg__dot.is-testing {
  background: var(--acid);
  animation: blink 0.6s steps(2) infinite;
}
.pg__dot.is-error {
  background: var(--red);
}
@keyframes blink {
  50% {
    opacity: 0.2;
  }
}
.pg__frame {
  flex: 1;
  width: 100%;
  border: 0;
  background: #fff;
  min-height: 0;
}
.pg__idle {
  position: absolute;
  inset: 40px 0 0;
  display: grid;
  place-items: center;
  margin: 0;
  font-size: 1.3rem;
  color: #6b6b66;
  pointer-events: none;
}
.pg__bottom {
  border: 0;
  box-shadow: none;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.pg__bottom-bar {
  padding: 0;
}
.pg__bottom-area {
  flex: 1;
  min-height: 0;
}

@media (max-width: 900px) {
  .pg__body {
    grid-template-columns: 1fr;
    height: auto;
  }
  .pg__editor {
    border-right: 0;
    border-bottom: var(--border);
    height: 340px;
  }
  .pg__right {
    grid-template-rows: 300px 220px;
  }
  .pg__btntext {
    display: none;
  }
  .pg__guide {
    grid-template-columns: 1fr auto;
  }
  .pg__guide-step {
    grid-column: 1 / -1;
    width: fit-content;
  }
}
</style>
