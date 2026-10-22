import { expect, test } from '@playwright/test'

// Every visualizer × preset renders without crashing or logging errors, and
// survives a first interaction.
const COMBOS = {
  scoreboard: [null],
  reactivity: ['compare', 'ref', 'reactive', 'computed', 'watch'],
  'dependency-tracker': ['cart', 'chain'],
  'component-flow': ['props', 'emits', 'v-model', 'slots', 'scoped-slots', 'provide-inject', 'pinia'],
  lifecycle: [null],
  router: ['basics', 'dynamic', 'nested', 'guards', 'lazy'],
  pinia: ['cart', 'local-vs-shared'],
  vdom: ['list', 'keys', 'text'],
  performance: ['updates', 'computed-cache', 'debounce', 'lazy-routes', 'virtual-list', 'shallow'],
  'directive-lab': ['interpolation', 'v-bind', 'v-on', 'v-if', 'v-show', 'v-for', 'v-model', 'class', 'style'],
  'concept-diagram': [null],
  comparison: [null],
  'event-loop': ['promises', 'timers', 'async-await', 'nexttick'],
  'rendering-lab': ['teleport', 'keep-alive', 'transition', 'dynamic'],
  'dom-tree': [null],
}

for (const [type, presets] of Object.entries(COMBOS)) {
  test(`visualizer ${type} renders every preset`, async ({ page }) => {
    const errors = []
    page.on('pageerror', (e) => errors.push(e.message))
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
    for (const p of presets) {
      await page.goto(`/visualizers?v=${type}${p ? `&p=${p}` : ''}`)
      const stage = page.locator('.viz__stage')
      await expect(stage).toBeVisible()
      await expect(stage).not.toContainText('crashed')
      const button = stage.locator('button:not([disabled])').first()
      if (await button.count()) await button.click()
      await page.waitForTimeout(300)
      await expect(stage).not.toContainText('crashed')
    }
    expect(errors).toEqual([])
  })
}

test('a guided experiment is checked in the hidden sandbox and reports honestly', async ({ page }) => {
  await page.goto('/learn/reactivity/ref')
  const exp = page.locator('.exp').first()
  await exp.scrollIntoViewIfNeeded()
  await exp.getByRole('button', { name: /check my change/i }).click()
  // Nothing was changed, so the check must fail and say why.
  await expect(exp.locator('.exp__fail')).toContainText('the score starts at 10')
  await expect(exp.locator('.exp__grading')).toHaveCount(0)
})
