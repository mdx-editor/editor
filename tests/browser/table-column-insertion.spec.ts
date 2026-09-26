import { expect, test, type Page } from '@playwright/test'

const storyUrl = '/?story=basics--table&mode=preview'
const runtimeErrors = new WeakMap<Page, string[]>()

test.beforeEach(async ({ page }) => {
  const errors: string[] = []
  runtimeErrors.set(page, errors)
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`)
  })

  await page.goto(storyUrl)
  await expect(page.getByRole('button', { name: 'Column menu' })).toHaveCount(3)
})

test.afterEach(async ({ page }) => {
  expect(runtimeErrors.get(page) ?? [], 'unexpected browser runtime errors').toEqual([])
})

test('inserts a column to the left without locking the editor', async ({ page }) => {
  const columnMenus = page.getByRole('button', { name: 'Column menu' })

  await columnMenus.first().click()
  await page.getByRole('button', { name: 'Insert a column to the left of this one' }).click()
  await expect(columnMenus).toHaveCount(4)
})

test('inserts a column to the right without locking the editor', async ({ page }) => {
  const columnMenus = page.getByRole('button', { name: 'Column menu' })

  await columnMenus.first().click()
  await page.getByRole('button', { name: 'Insert a column to the right of this one' }).click()
  await expect(columnMenus).toHaveCount(4)
})
