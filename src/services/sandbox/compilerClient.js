// One shared compiler worker for every playground on the page.
let worker = null
let seq = 0
const pending = new Map()

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./compiler.worker.js', import.meta.url), { type: 'module' })
  worker.onmessage = (e) => {
    const { id } = e.data
    if (id === undefined) return // ready ping
    pending.get(id)?.resolve(e.data)
    pending.delete(id)
  }
  worker.onerror = (e) => {
    for (const p of pending.values()) {
      p.resolve({ modules: [], css: '', externals: [], errors: [{ file: '', message: `Compiler failed to load: ${e.message ?? 'unknown error'}` }] })
    }
    pending.clear()
    worker = null
  }
  return worker
}

/** Compile playground files. Resolves with { modules, css, errors, externals, entry }. */
export function compileFiles(files, entry) {
  const id = ++seq
  return new Promise((resolve) => {
    pending.set(id, { resolve })
    getWorker().postMessage({ id, files: JSON.parse(JSON.stringify(files)), entry })
  })
}

/** Start loading the compiler early (e.g. when a playground scrolls into view). */
export function warmCompiler() {
  getWorker()
}
