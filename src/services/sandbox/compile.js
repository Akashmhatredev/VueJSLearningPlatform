// Compiles a set of playground files into sandbox modules.
//
//   .vue  -> @vue/compiler-sfc (script setup, templates, scoped CSS, CSS modules)
//   .js   -> as written
//   .css  -> injected stylesheet module
//
// Every module is then rewritten from ES module syntax to a tiny registry
// format (`__require__` / `__exports__`) using Babel's AST, and loops get a
// guard so an accidental infinite loop throws instead of freezing the tab.
// Nothing here executes user code — execution happens only inside the
// sandboxed iframe.

export const EXTERNALS = ['vue', 'pinia', 'vue-router']

function hashId(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(16).padStart(8, '0').slice(0, 8)
}

function errorText(e) {
  return String(e?.message ?? e).trim()
}

export function compileVue(filename, source, sfc) {
  const errors = []
  const { descriptor, errors: parseErrors } = sfc.parse(source, { filename, sourceMap: false })
  for (const e of parseErrors) {
    const frame = e.loc ? '\n' + sfc.generateCodeFrame(source, e.loc.start.offset, e.loc.end.offset) : ''
    errors.push({ file: filename, message: errorText(e) + frame })
  }
  if (errors.length) return { errors }

  for (const block of [descriptor.script, descriptor.scriptSetup]) {
    if (block?.lang && block.lang !== 'js') {
      return {
        errors: [{ file: filename, message: `lang="${block.lang}" is not supported in this playground — use plain JavaScript.` }],
      }
    }
  }

  const id = hashId(filename)
  const scopeId = `data-v-${id}`
  const scoped = descriptor.styles.some((s) => s.scoped)
  let code = ''

  try {
    if (descriptor.script || descriptor.scriptSetup) {
      // Dev-mode compilation (template compiled separately): setup() returns its
      // bindings, so the state inspector and tests can read `setupState`.
      const script = sfc.compileScript(descriptor, {
        id,
        inlineTemplate: false,
        genDefaultAs: '__sfc__',
        sourceMap: false,
      })
      code += script.content
      if (descriptor.template) {
        const t = compileTemplate(descriptor, filename, id, scoped, script.bindings, sfc)
        if (t.errors) return { errors: t.errors }
        code += t.code
      }
    } else {
      code += 'const __sfc__ = {}\n'
      if (descriptor.template) {
        const t = compileTemplate(descriptor, filename, id, scoped, undefined, sfc)
        if (t.errors) return { errors: t.errors }
        code += t.code
      }
    }
  } catch (e) {
    return { errors: [{ file: filename, message: errorText(e) }] }
  }

  if (scoped) code += `\n__sfc__.__scopeId = ${JSON.stringify(scopeId)}`
  code += `\n__sfc__.__file = ${JSON.stringify(filename)}\n__sfc__.__name = __sfc__.__name || ${JSON.stringify(filename.replace(/.*\//, '').replace(/\.vue$/, ''))}\nexport default __sfc__\n`

  return { code, descriptor, id, scoped }
}

function compileTemplate(descriptor, filename, id, scoped, bindings, sfc) {
  const res = sfc.compileTemplate({
    source: descriptor.template.content,
    filename,
    id,
    scoped,
    slotted: descriptor.slotted,
    compilerOptions: { bindingMetadata: bindings, scopeId: scoped ? `data-v-${id}` : undefined },
  })
  if (res.errors.length) {
    return {
      errors: res.errors.map((e) => ({
        file: filename,
        message:
          typeof e === 'string'
            ? e
            : errorText(e) +
              (e.loc ? '\n' + sfc.generateCodeFrame(descriptor.template.content, e.loc.start.offset, e.loc.end.offset) : ''),
      })),
    }
  }
  return {
    code: '\n' + res.code.replace(/\nexport (function|const) render/, '\n$1 render') + '\n__sfc__.render = render\n',
  }
}

async function compileStyles(filename, descriptor, id, sfc) {
  let css = ''
  const modules = {}
  const errors = []
  for (const style of descriptor.styles) {
    if (style.lang && style.lang !== 'css') {
      errors.push({ file: filename, message: `<style lang="${style.lang}"> is not supported here — use plain CSS.` })
      continue
    }
    const res = await sfc.compileStyleAsync({
      source: style.content,
      filename,
      id,
      scoped: style.scoped,
      modules: !!style.module,
    })
    if (res.errors.length) {
      errors.push(...res.errors.map((e) => ({ file: filename, message: errorText(e) })))
      continue
    }
    css += `/* ${filename} */\n${res.code}\n`
    if (style.module) modules[typeof style.module === 'string' ? style.module : '$style'] = res.modules
  }
  return { css, modules, errors }
}

/**
 * Rewrites ES module syntax into the sandbox registry format and adds loop
 * guards. Returns { code, deps }.
 */
export function transformModule(code, filename, sfc, resolve = (spec) => spec) {
  const ast = sfc.babelParse(code, { sourceType: 'module', plugins: [] }).program
  const s = new sfc.MagicString(code)
  const deps = new Set()
  const header = []
  let n = 0
  const req = (src) => {
    deps.add(src)
    return `__require__(${JSON.stringify(resolve(src) ?? src)}, ${JSON.stringify(filename)})`
  }
  const getter = (name, expr) =>
    `Object.defineProperty(__exports__, ${JSON.stringify(name)}, { enumerable: true, configurable: true, get: () => ${expr} });`
  const nameOf = (node) => (node.type === 'Identifier' ? node.name : node.value)

  for (const node of ast.body) {
    if (node.type === 'ImportDeclaration') {
      const v = `__i${n++}`
      const parts = [`const ${v} = ${req(node.source.value)};`]
      for (const spec of node.specifiers) {
        if (spec.type === 'ImportDefaultSpecifier') parts.push(`const ${spec.local.name} = ${v}.default;`)
        else if (spec.type === 'ImportNamespaceSpecifier') parts.push(`const ${spec.local.name} = ${v};`)
        else parts.push(`const ${spec.local.name} = ${v}[${JSON.stringify(nameOf(spec.imported))}];`)
      }
      s.overwrite(node.start, node.end, parts.join(' '))
    } else if (node.type === 'ExportDefaultDeclaration') {
      const d = node.declaration
      if ((d.type === 'FunctionDeclaration' || d.type === 'ClassDeclaration') && d.id) {
        s.remove(node.start, d.start)
        header.push(getter('default', d.id.name))
      } else {
        s.overwrite(node.start, d.start, '__exports__.default = ')
      }
    } else if (node.type === 'ExportNamedDeclaration') {
      if (node.declaration) {
        const d = node.declaration
        s.remove(node.start, d.start)
        const names =
          d.type === 'VariableDeclaration'
            ? d.declarations.flatMap((decl) => sfc.extractIdentifiers(decl.id).map((i) => i.name))
            : [d.id.name]
        for (const name of names) header.push(getter(name, name))
      } else if (node.source) {
        const v = `__i${n++}`
        const parts = [`const ${v} = ${req(node.source.value)};`]
        for (const spec of node.specifiers) {
          if (spec.type === 'ExportNamespaceSpecifier') parts.push(getter(nameOf(spec.exported), v))
          else parts.push(getter(nameOf(spec.exported), `${v}[${JSON.stringify(nameOf(spec.local))}]`))
        }
        s.overwrite(node.start, node.end, parts.join(' '))
      } else {
        for (const spec of node.specifiers) header.push(getter(nameOf(spec.exported), spec.local.name))
        s.remove(node.start, node.end)
      }
    } else if (node.type === 'ExportAllDeclaration') {
      const v = `__i${n++}`
      const out = node.exported
        ? `const ${v} = ${req(node.source.value)}; ${getter(nameOf(node.exported), v)}`
        : `const ${v} = ${req(node.source.value)}; __exportAll__(__exports__, ${v});`
      s.overwrite(node.start, node.end, out)
    }
  }

  // Loop guards, dynamic import() and import.meta
  const LOOPS = ['ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement']
  sfc.walk(ast, {
    enter(node) {
      const isDynamicImport = node.type === 'ImportExpression' || (node.type === 'CallExpression' && node.callee?.type === 'Import')
      if (isDynamicImport) {
        const src = node.type === 'ImportExpression' ? node.source : node.arguments[0]
        if (src?.type !== 'StringLiteral') {
          throw Object.assign(new Error('import() needs a plain string path in the sandbox, e.g. import(\'./Page.vue\').'), { loc: node.loc?.start })
        }
        deps.add(src.value)
        s.overwrite(node.start, node.end, `__import__(${JSON.stringify(resolve(src.value) ?? src.value)}, ${JSON.stringify(filename)})`)
        return
      }
      if (node.type === 'MetaProperty' && node.meta?.name === 'import') {
        s.overwrite(node.start, node.end, '__importMeta__')
        return
      }
      if (!LOOPS.includes(node.type)) return
      const body = node.body
      const guard = `__guard__(${JSON.stringify(filename)});`
      if (body.type === 'BlockStatement') s.appendLeft(body.start + 1, guard)
      else {
        s.prependLeft(body.start, `{${guard}`)
        s.appendRight(body.end, '}')
      }
    },
  })

  if (header.length) s.prepend(header.join('\n') + '\n')
  return { code: s.toString(), deps: [...deps] }
}

export function resolvePath(spec, from, files) {
  if (EXTERNALS.includes(spec)) return spec
  if (!spec.startsWith('.') && !spec.startsWith('/')) return null
  const base = spec.startsWith('/') ? [] : from.split('/').slice(0, -1)
  for (const part of spec.split('/')) {
    if (part === '.' || part === '') continue
    if (part === '..') base.pop()
    else base.push(part)
  }
  const joined = base.join('/')
  for (const candidate of [joined, `${joined}.vue`, `${joined}.js`, `${joined}/index.js`]) {
    if (candidate in files) return candidate
  }
  return null
}

/**
 * Compile a whole playground project.
 * @param {Record<string,string>} files  filename -> source
 * @returns {{ modules: {id:string, code:string}[], css: string, errors: {file,message}[], externals: string[], entry: string }}
 */
export async function compileProject(files, sfc, { entry } = {}) {
  const modules = []
  const errors = []
  const externals = new Set(['vue'])
  let css = ''
  const names = Object.keys(files)
  const resolvedEntry = entry ?? (names.includes('main.js') ? 'main.js' : names.includes('App.vue') ? 'App.vue' : names[0])

  for (const filename of names) {
    const source = files[filename]
    try {
      let code
      if (filename.endsWith('.vue')) {
        const res = compileVue(filename, source, sfc)
        if (res.errors) {
          errors.push(...res.errors)
          continue
        }
        code = res.code
        const st = await compileStyles(filename, res.descriptor, res.id, sfc)
        errors.push(...st.errors)
        css += st.css
        if (Object.keys(st.modules).length) {
          code = code.replace(
            /\nexport default __sfc__\n$/,
            `\n__sfc__.__cssModules = ${JSON.stringify(st.modules)}\nexport default __sfc__\n`,
          )
        }
      } else if (filename.endsWith('.css')) {
        modules.push({ id: filename, code: `__css__(${JSON.stringify(`/* ${filename} */\n` + source)})` })
        continue
      } else if (filename.endsWith('.js')) {
        code = source
      } else {
        continue // other files (README, html) are shown but not executed
      }
      const out = transformModule(code, filename, sfc, (spec) => resolvePath(spec, filename, files))
      for (const dep of out.deps) {
        if (EXTERNALS.includes(dep)) {
          externals.add(dep)
          continue
        }
        if (!resolvePath(dep, filename, files)) {
          errors.push({
            file: filename,
            message: `Cannot resolve import "${dep}". This sandbox provides vue, pinia, vue-router and the files in this project.`,
          })
        }
      }
      modules.push({ id: filename, code: out.code })
    } catch (e) {
      const loc = e?.loc ? ` (${e.loc.line}:${e.loc.column})` : ''
      errors.push({ file: filename, message: `${errorText(e)}${loc}` })
    }
  }
  return { modules, css, errors, externals: [...externals], entry: resolvedEntry }
}
