// Compiles playground projects off the main thread so typing and animations
// stay smooth while the (large) SFC compiler works.
import './worker-shim.js'
import * as sfc from 'vue/compiler-sfc'
import { compileProject } from './compile.js'

self.onmessage = async (e) => {
  const { id, files, entry } = e.data
  try {
    const result = await compileProject(files, sfc, { entry })
    self.postMessage({ id, ...result })
  } catch (err) {
    self.postMessage({ id, modules: [], css: '', externals: [], errors: [{ file: '', message: String(err?.message ?? err) }] })
  }
}

self.postMessage({ ready: true, version: sfc.version })
