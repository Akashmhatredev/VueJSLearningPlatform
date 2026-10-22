// A simplified virtual-DOM diff for teaching. Real Vue adds compiler hints
// (patch flags, static hoisting, block trees) and a longest-increasing-
// subsequence move algorithm; this keeps only the core idea.
//
// vnode: { tag, key?, text?, children? }

export function h(tag, props = {}, children) {
  const node = { tag, key: props.key }
  if (typeof children === 'string') node.text = children
  else if (Array.isArray(children)) node.children = children
  return node
}

/**
 * Returns { ops: string[], oldMarks: Map<path,mark>, newMarks: Map<path,mark> }
 * marks: 'changed' | 'added' | 'removed' | 'moved'
 */
export function diff(oldTree, newTree) {
  const ops = []
  const oldMarks = new Map()
  const newMarks = new Map()

  function label(n) {
    return `<${n.tag}${n.key !== undefined ? ` key=${n.key}` : ''}>`
  }

  function walk(a, b, pa, pb) {
    if (a.tag !== b.tag || a.key !== b.key) {
      ops.push(`replace ${label(a)} with ${label(b)}`)
      oldMarks.set(pa, 'removed')
      newMarks.set(pb, 'added')
      return
    }
    if (a.text !== b.text && (a.text !== undefined || b.text !== undefined)) {
      ops.push(`setText ${label(b)}: "${a.text ?? ''}" → "${b.text ?? ''}"`)
      oldMarks.set(pa, 'changed')
      newMarks.set(pb, 'changed')
    }
    const ac = a.children ?? []
    const bc = b.children ?? []
    const keyed = ac.length + bc.length > 0 && [...ac, ...bc].every((c) => c.key !== undefined)
    if (keyed) diffKeyed(ac, bc, pa, pb)
    else diffIndexed(ac, bc, pa, pb)
  }

  function diffIndexed(ac, bc, pa, pb) {
    const common = Math.min(ac.length, bc.length)
    for (let i = 0; i < common; i++) walk(ac[i], bc[i], `${pa}.${i}`, `${pb}.${i}`)
    for (let i = common; i < bc.length; i++) {
      ops.push(`create ${label(bc[i])}${bc[i].text ? ` "${bc[i].text}"` : ''} at position ${i}`)
      newMarks.set(`${pb}.${i}`, 'added')
    }
    for (let i = common; i < ac.length; i++) {
      ops.push(`remove ${label(ac[i])}${ac[i].text ? ` "${ac[i].text}"` : ''} at position ${i}`)
      oldMarks.set(`${pa}.${i}`, 'removed')
    }
  }

  function diffKeyed(ac, bc, pa, pb) {
    const oldIndex = new Map(ac.map((c, i) => [c.key, i]))
    const newKeys = new Set(bc.map((c) => c.key))
    const kept = ac.filter((c) => newKeys.has(c.key)).map((c) => c.key)
    let cursor = 0
    bc.forEach((c, i) => {
      if (!oldIndex.has(c.key)) {
        ops.push(`create ${label(c)}${c.text ? ` "${c.text}"` : ''} and insert at position ${i}`)
        newMarks.set(`${pb}.${i}`, 'added')
        return
      }
      const j = oldIndex.get(c.key)
      if (kept[cursor] !== c.key) {
        ops.push(`move ${label(c)} to position ${i}`)
        newMarks.set(`${pb}.${i}`, 'moved')
        oldMarks.set(`${pa}.${j}`, 'moved')
        kept.splice(kept.indexOf(c.key), 1)
        kept.splice(cursor, 0, c.key)
      }
      cursor++
      walk(ac[j], c, `${pa}.${j}`, `${pb}.${i}`)
    })
    ac.forEach((c, j) => {
      if (!newKeys.has(c.key)) {
        ops.push(`remove ${label(c)}${c.text ? ` "${c.text}"` : ''}`)
        oldMarks.set(`${pa}.${j}`, 'removed')
      }
    })
  }

  walk(oldTree, newTree, '0', '0')
  return { ops, oldMarks, newMarks }
}

/** Flatten a tree into rows for rendering: [{ path, depth, node }]. */
export function flatten(tree, path = '0', depth = 0, out = []) {
  out.push({ path, depth, node: tree })
  ;(tree.children ?? []).forEach((c, i) => flatten(c, `${path}.${i}`, depth + 1, out))
  return out
}
