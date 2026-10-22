// Validates every lesson file:
//  1. schema (see src/content/schema.js and CONTENT_GUIDE.md)
//  2. every runnable file set compiles with @vue/compiler-sfc
//  3. every exercise / coding question / project: the solution passes its tests,
//     and the starter fails at least one (so the tests actually test something)
//  4. experiment tests fail on the untouched playground (the learner must change something)
//
// Limit to some lessons with:  LESSONS=ref,computed npx vitest run tests/unit/content.test.js
import { describe, expect, it } from 'vitest'
import { loadContent } from '../../plugins/content-index.js'
import { validateCurriculum, validateLesson } from '../../src/content/schema.js'
import { compile, runProjectTests } from './sandbox-runner.js'

const content = await loadContent(process.cwd())
const only = process.env.LESSONS ? process.env.LESSONS.split(',').map((s) => s.trim()) : null
const lessonIds = content.levels.flatMap((l) => l.lessons.map((x) => x.id))
const selected = Object.entries(content.lessons).filter(([id]) => !only || only.includes(id))

const failing = (r) => r.results.filter((x) => !x.pass).map((x) => `${x.name}: ${x.error}`)

describe('curriculum', () => {
  it('every lesson file can be imported', () => {
    expect(content.failures.filter((f) => !only || only.some((id) => f.file.endsWith(`/${id}.js`)))).toEqual([])
  })

  it('has consistent ids, folders and unique interview question ids', () => {
    expect(validateCurriculum(content)).toEqual([])
  })
})

describe.each(selected)('lesson %s', (id, lesson) => {
  it('matches the content schema', () => {
    expect(validateLesson(lesson, { fileId: id, lessonIds })).toEqual([])
  })

  it('every runnable example compiles', async () => {
    const sets = []
    if (lesson.playground) sets.push(['playground', lesson.playground.files, lesson.playground.entry])
    for (const v of lesson.playground?.variants ?? []) sets.push([`variant ${v.id}`, v.files])
    for (const ex of lesson.exercises ?? []) {
      sets.push([`exercise ${ex.id} starter`, ex.files])
      if (ex.solution?.files) sets.push([`exercise ${ex.id} solution`, ex.solution.files])
    }
    for (const q of lesson.interview ?? []) {
      if (q.starter?.files) sets.push([`question ${q.id} starter`, q.starter.files])
      if (q.solution?.files) sets.push([`question ${q.id} solution`, q.solution.files])
    }
    if (lesson.solution?.files) sets.push(['project solution', lesson.solution.files, lesson.solution.entry])
    const problems = []
    for (const [label, files, entry] of sets) {
      const res = await compile(files, entry)
      for (const e of res.errors) problems.push(`${label} › ${e.file}: ${e.message.split('\n')[0]}`)
    }
    expect(problems).toEqual([])
  })

  const graded = []
  for (const ex of lesson.exercises ?? []) {
    if (ex.tests?.length) graded.push([`exercise ${ex.id}`, ex.files, ex.solution?.files, ex.tests])
  }
  for (const q of lesson.interview ?? []) {
    if (q.starter?.files && q.tests?.length) graded.push([`question ${q.id}`, q.starter.files, q.solution?.files, q.tests])
  }
  if (lesson.kind === 'project' && lesson.playground?.tests?.length) {
    graded.push(['project', lesson.playground.files, lesson.solution?.files, lesson.playground.tests, lesson.solution?.entry])
  }

  for (const [label, starter, solution, tests, entry] of graded) {
    it(`${label}: solution passes every test`, async () => {
      expect(solution, 'solution files are missing').toBeTruthy()
      const r = await runProjectTests(solution, tests, entry)
      expect(r.compileErrors ?? [], 'solution does not compile').toEqual([])
      expect(failing(r), 'failing tests on the solution').toEqual([])
    })
    it(`${label}: starter fails at least one test`, async () => {
      const r = await runProjectTests(starter, tests, entry)
      if (r.compileErrors) return // a starter that does not compile yet certainly fails
      expect(r.results.some((x) => !x.pass), 'every test already passes on the starter code').toBe(true)
    })
  }

  for (const exp of lesson.playground?.experiments ?? []) {
    if (!exp.tests?.length) continue
    it(`experiment ${exp.id}: needs a change to pass`, async () => {
      const r = await runProjectTests(lesson.playground.files, exp.tests, lesson.playground.entry)
      expect(r.compileErrors ?? []).toEqual([])
      expect(r.results.some((x) => !x.pass), 'experiment already passes without any change').toBe(true)
    })
  }
})
