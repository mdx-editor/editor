import { expect, test, type Page } from '@playwright/test'

const storyUrl = '/?story=basics--table&mode=preview'

async function focusedCell(page: Page) {
  return page.evaluate(() => {
    const cell = document.activeElement?.closest('tbody td, tbody th')
    if (!cell) {
      return null
    }
    const row = cell.parentElement!
    // The first cell of every row holds the row menu.
    const colIndex = Array.from(row.children).indexOf(cell) - 1
    const rowIndex = Array.from(row.parentElement!.children).indexOf(row)
    return [colIndex, rowIndex]
  })
}

async function tableSize(page: Page) {
  const colCount = await page.getByRole('button', { name: 'Column menu' }).count()
  const rowCount = await page.getByRole('button', { name: 'Row menu' }).count()
  return [colCount, rowCount]
}

test.beforeEach(async ({ page }) => {
  await page.goto(storyUrl)
  await expect(page.getByRole('button', { name: 'Column menu' }).first()).toBeVisible()
})

test('focuses the new column when inserting right of the last column', async ({ page }) => {
  const [colCount] = await tableSize(page)
  await page.getByRole('button', { name: 'Column menu' }).last().click()
  await page.getByRole('button', { name: 'Insert a column to the right of this one' }).click()

  await expect(page.getByRole('button', { name: 'Column menu' })).toHaveCount(colCount + 1)
  await expect.poll(() => focusedCell(page)).toEqual([colCount, 0])
})

test('focuses the new row when inserting below the last row', async ({ page }) => {
  const [, rowCount] = await tableSize(page)
  await page.getByRole('button', { name: 'Row menu' }).last().click()
  await page.getByRole('button', { name: 'Insert a row below this one' }).click()

  await expect(page.getByRole('button', { name: 'Row menu' })).toHaveCount(rowCount + 1)
  await expect.poll(() => focusedCell(page)).toEqual([0, rowCount])
})

test('focuses the new row when adding a row to the bottom', async ({ page }) => {
  const [, rowCount] = await tableSize(page)
  await page.locator('table tfoot button').click()

  await expect(page.getByRole('button', { name: 'Row menu' })).toHaveCount(rowCount + 1)
  await expect.poll(() => focusedCell(page)).toEqual([0, rowCount])
})

test('focuses the new column when adding a column to the right', async ({ page }) => {
  const [colCount] = await tableSize(page)
  await page.locator('table tbody tr:first-child > th:last-child button').click()

  await expect(page.getByRole('button', { name: 'Column menu' })).toHaveCount(colCount + 1)
  await expect.poll(() => focusedCell(page)).toEqual([colCount, 0])
})
