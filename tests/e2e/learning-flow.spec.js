import { expect, test } from '@playwright/test'

// The core learning loop on the reference lesson: learn → run → quiz →
// exercise (graded by real tests in the sandbox) → complete → persists.
test('complete a lesson end to end and keep progress after reload', async ({ page }) => {
  await page.goto('/learn/reactivity/ref')
  await expect(page.getByRole('heading', { level: 1, name: /ref\(\): your first reactive value/i })).toBeVisible()

  // Completion is locked at first
  const finish = page.locator('#finish')
  await expect(finish.getByRole('button', { name: /mark lesson complete/i })).toBeDisabled()

  // 1. Experiment: run the live example in the sandbox
  const pg = page.locator('#playground')
  await pg.scrollIntoViewIfNeeded()
  await pg.locator('.pg__actions').getByRole('button', { name: /^run/i }).click()
  await expect(pg.locator('.pg__status').first()).toContainText('running')
  await expect(pg.frameLocator('iframe.pg__frame').first().locator('h2')).toHaveText('Score: 0')

  // 2. Understand: answer the auto-graded quiz questions
  const qs = page.locator('#quiz .qq')
  const answerOption = async (i, text) => {
    await qs.nth(i).locator('label.opt', { hasText: text }).click()
    await qs.nth(i).getByRole('button', { name: 'Check answer' }).click()
    await expect(qs.nth(i).locator('.fb--ok')).toBeVisible()
  }
  await answerOption(0, 'likes.value++')
  await answerOption(1, '16')
  await qs.nth(2).locator('.bugline').nth(3).click() // line 4: `let count = 0`
  await qs.nth(2).getByRole('button', { name: 'Check answer' }).click()
  await expect(qs.nth(2).locator('.fb--ok')).toBeVisible()
  const blanks = qs.nth(3).locator('input.blank')
  await blanks.nth(0).fill('ref')
  await blanks.nth(1).fill('value')
  await qs.nth(3).getByRole('button', { name: 'Check answer' }).click()
  await expect(qs.nth(3).locator('.fb--ok')).toBeVisible()
  await answerOption(4, 'Templates are compiled')
  await expect(page.locator('.quiz__score')).toContainText('5/5')

  // 3. Practice: load the solution and make the sandbox tests pass
  const ex = page.locator('#exercise-floor-counter')
  await ex.scrollIntoViewIfNeeded()
  await ex.getByRole('button', { name: /show solution/i }).click()
  await ex.getByRole('button', { name: /reveal anyway/i }).click()
  await ex.getByRole('button', { name: /load solution into the editor/i }).click()
  await ex.getByRole('button', { name: /run tests/i }).click()
  await expect(ex.locator('.tests__summary')).toContainText('4/4 passing')
  await expect(ex.locator('.ex__done')).toContainText('test-graded')

  // 4. Review: complete the lesson
  await finish.scrollIntoViewIfNeeded()
  const complete = finish.getByRole('button', { name: /mark lesson complete/i })
  await expect(complete).toBeEnabled()
  await complete.click()
  await expect(page.locator('.lsn__chips')).toContainText('completed ✓')

  // 5. Persistence: reload and check the dashboard
  await page.waitForTimeout(400) // let the throttled storage write land
  await page.reload()
  await expect(page.locator('.lsn__chips')).toContainText('completed ✓')
  await page.goto('/dashboard')
  await expect(page.getByText(/1 of \d+ lessons/i).first()).toBeVisible()
  await expect(page.locator('.stat').filter({ hasText: 'exercises passed' })).toContainText('1')
})

test('practice interview session from a lesson, with review', async ({ page }) => {
  await page.goto('/interview?topics=ref')
  await expect(page.getByRole('status').filter({ hasText: 'matching question' })).toContainText('6')
  await page.getByRole('button', { name: /start practice/i }).click()
  await expect(page).toHaveURL(/\/interview\/session\//)

  for (let i = 0; i < 6; i++) {
    const card = page.locator('.ses__q')
    if (await card.locator('.ses__opts').count()) {
      await card.locator('.ses__opt').first().click()
      await card.getByRole('button', { name: 'Submit answer' }).click()
      await expect(card.locator('.ses__verdict')).toBeVisible()
    } else if (!(await card.locator('.pg').count())) {
      await card.locator('textarea').fill('A ref wraps a value so Vue can track it.')
      await card.getByRole('button', { name: /reveal model answer/i }).click()
      await card.getByRole('button', { name: 'solid' }).click()
    }
    const next = page.getByRole('button', { name: /^next/i })
    if (await next.count()) await next.click()
  }
  await page.getByRole('button', { name: /finish & review/i }).click()
  await page.getByRole('dialog').getByRole('button', { name: /^finish$/i }).click()
  await expect(page.getByRole('heading', { name: 'How it went.' })).toBeVisible()
  await expect(page.locator('.review__stats')).toContainText('self-assessed')
})

test('global search finds an API and navigates to it', async ({ page }) => {
  await page.goto('/')
  await page.keyboard.press('ControlOrMeta+k')
  const input = page.getByRole('combobox')
  await expect(input).toBeFocused()
  await input.fill('nextTick')
  await expect(page.locator('.result').first()).toBeVisible()
  await input.press('Enter')
  await expect(page).toHaveURL(/\/learn\//)
})

test('mobile navigation and course map drawer work', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/learn/reactivity/ref')
  await page.getByRole('button', { name: 'Open menu' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Dashboard' })).toBeVisible()
  await page.getByRole('button', { name: 'Close menu' }).click()
  await page.getByRole('button', { name: /course map/i }).first().click()
  await expect(page.getByRole('complementary', { name: 'Course map' })).toBeVisible()
})

test('unknown routes show the 404 page', async ({ page }) => {
  await page.goto('/this/does/not/exist')
  await expect(page.getByRole('heading', { name: /doesn’t exist/i })).toBeVisible()
})
