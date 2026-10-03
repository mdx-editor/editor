import { expect, test, type Locator, type Page } from '@playwright/test'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { directiveFromMarkdown } from 'mdast-util-directive'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { mdxjs } from 'micromark-extension-mdxjs'
import { directive } from 'micromark-extension-directive'
import { gfmTable } from 'micromark-extension-gfm-table'

async function placeCaretAtEnd(element: Locator) {
  await element.click()
  const editable = element.locator('xpath=ancestor-or-self::*[@contenteditable="true"][1]')
  await expect(editable).toBeFocused()
  await editable.press('End')
}

function withoutPositions(value: unknown, inEstree = false): unknown {
  if (Array.isArray(value)) return value.map((item: unknown) => withoutPositions(item, inEstree))
  if (value === null || typeof value !== 'object') return value
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== 'position' && !(inEstree && ['start', 'end', 'loc', 'range'].includes(key)))
      .map(([key, child]) => [key, withoutPositions(child, inEstree || key === 'estree')])
  )
}

function parseContent(markdown: string) {
  const tree = fromMarkdown(markdown, {
    extensions: [mdxjs(), directive(), gfmTable()],
    mdastExtensions: [mdxFromMarkdown(), directiveFromMarkdown(), gfmTableFromMarkdown()]
  })
  // Only source coordinates change when blank lines normalize on reload. Keep
  // all nodes, attributes, imports, parser metadata, and semantic list starts.
  return withoutPositions(tree)
}

async function readMarkdown(page: Page) {
  await page.getByRole('button', { name: 'Get Markdown', exact: true }).click()
  return (await page.getByLabel('Exported markdown').textContent()) ?? ''
}

const occurrences = (text: string, search: string) => text.split(search).length - 1

test.beforeEach(async ({ page }) => {
  await page.goto('/?story=bug-733--nested-jsx-imports&mode=preview')
  await expect(page.getByRole('button', { name: 'Insert Zazz', exact: true })).toBeVisible()
})

test('inserting JSX into an admonition exports its import at the document root', async ({ page }) => {
  await placeCaretAtEnd(
    page
      .locator('p')
      .filter({ hasText: /^Admonition content/ })
      .last()
  )
  await page.getByRole('button', { name: 'Insert Zazz', exact: true }).click()
  await expect(page.getByText('Zazz', { exact: true })).toHaveCount(1)
  const markdown = await readMarkdown(page)
  expect(markdown, 'Nested JSX must receive a root-level import').toMatch(/^import Zazz from '@zazz'/)
  expect(markdown).toContain('<Zazz />')
  expect(markdown).toContain(":::tip\nimport Existing from '@existing'")
  expect(occurrences(markdown, "import Zazz from '@zazz'")).toBe(1)
  await page.getByRole('button', { name: 'Reload saved Markdown', exact: true }).click()
  expect(parseContent(await readMarkdown(page))).toEqual(parseContent(markdown))
})

test('root and nested references share one import after repeated insertion and reload', async ({ page }) => {
  await placeCaretAtEnd(page.getByText('Root content', { exact: true }))
  await page.getByRole('button', { name: 'Insert Zazz', exact: true }).click()
  await expect(page.getByText('Zazz', { exact: true })).toHaveCount(1)
  await placeCaretAtEnd(
    page
      .locator('p')
      .filter({ hasText: /^Admonition content/ })
      .last()
  )
  await page.getByRole('button', { name: 'Insert Zazz', exact: true }).click()
  await expect(page.getByText('Zazz', { exact: true })).toHaveCount(2)
  const markdown = await readMarkdown(page)
  expect(occurrences(markdown, '<Zazz />')).toBe(2)
  expect(occurrences(markdown, "import Zazz from '@zazz'")).toBe(1)
  await page.getByRole('button', { name: 'Reload saved Markdown', exact: true }).click()
  expect(parseContent(await readMarkdown(page))).toEqual(parseContent(markdown))
})

test('inserting inline JSX into a table preserves the cell and imports the component once', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await placeCaretAtEnd(page.getByRole('cell', { name: 'Table content', exact: true }).locator('p'))
  await page.getByRole('button', { name: 'Insert Badge', exact: true }).click()
  await expect(page.getByText('Badge', { exact: true })).toHaveCount(1)
  const markdown = await readMarkdown(page)
  expect(markdown).toMatch(/^import \{ Badge \} from '@components'/)
  expect(markdown).toContain('Table content<Badge />')
  expect(occurrences(markdown, "import { Badge } from '@components'")).toBe(1)
  expect(errors).toEqual([])
  await page.getByRole('button', { name: 'Reload saved Markdown', exact: true }).click()
  expect(parseContent(await readMarkdown(page))).toEqual(parseContent(markdown))
})
