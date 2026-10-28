import type * as Mdast from 'mdast'

// Bound rectangular expansion, particularly for untrusted colspan/rowspan values.
const MAX_SOURCE_LENGTH = 1000000
export const MAX_TABLE_PASTE_CELLS = 10000
const MAX_DIMENSION = 1000

type ClipboardRegion = Mdast.TableCell[][] | null | 'rejected'

function textCell(value = ''): Mdast.TableCell {
  return { type: 'tableCell', children: value ? [{ type: 'text', value }] : [] }
}

function rectangle(rows: Mdast.TableCell[][]): ClipboardRegion {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (!width) return null
  if (width > MAX_DIMENSION || rows.length > MAX_DIMENSION || width * rows.length > MAX_TABLE_PASTE_CELLS) return 'rejected'
  return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? textCell()))
}

/** Parse at least two TSV records with at least two fields each, including quotes. */
function parseTSV(text: string): ClipboardRegion {
  const rows: Mdast.TableCell[][] = []
  let row: Mdast.TableCell[] = []
  let value = ''
  let quoted = false
  let closedQuote = false
  let atFieldStart = true
  let endedRow = false
  let width = 0
  let height = 0
  let minimumWidth = Infinity
  let rowWidth = 0
  let oversized = text.length > MAX_SOURCE_LENGTH

  function finishCell() {
    rowWidth++
    width = Math.max(width, rowWidth)
    oversized ||= width > MAX_DIMENSION || height + 1 > MAX_DIMENSION || width * (height + 1) > MAX_TABLE_PASTE_CELLS
    // Keep scanning the shape after reaching the allocation budget. A large
    // single tabbed line still belongs to ordinary paste, not a rejected grid.
    if (!oversized) row.push(textCell(value.replace(/\r\n?/g, '\n')))
    value = ''
    closedQuote = false
    atFieldStart = true
  }

  function finishRow() {
    finishCell()
    minimumWidth = Math.min(minimumWidth, rowWidth)
    height++
    if (!oversized) rows.push(row)
    row = []
    rowWidth = 0
  }

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    endedRow = false
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          if (!oversized) value += '"'
          index++
        } else {
          quoted = false
          closedQuote = true
        }
      } else if (!oversized) {
        value += char
      }
    } else if (char === '\t') {
      finishCell()
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      finishRow()
      endedRow = true
    } else if (closedQuote) {
      return null
    } else if (char === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
    } else {
      if (!oversized) value += char
      atFieldStart = false
    }
  }
  if (quoted) return null
  // One final record separator terminates the last row; it does not add a new row.
  if (!endedRow) finishRow()
  if (height < 2 || minimumWidth < 2) return null
  return oversized ? 'rejected' : rectangle(rows)
}

function standaloneTable(document: Document): HTMLTableElement | null {
  const tables = document.body.querySelectorAll('table')
  if (tables.length !== 1) return null
  const table = tables[0]
  const pending: Node[] = [document.body]
  while (pending.length) {
    const node = pending.pop()!
    if (node === table || node.nodeType === 8) continue
    if (node.nodeType === 3) {
      if (node.textContent?.trim()) return null
      continue
    }
    if (node.nodeType !== 1) return null
    const tag = (node as Element).tagName
    if (['META', 'STYLE', 'LINK'].includes(tag)) continue
    // Clipboard producers commonly wrap tables in div/span or this custom element.
    if (!['BODY', 'DIV', 'SPAN', 'GOOGLE-SHEETS-HTML-ORIGIN'].includes(tag)) return null
    for (const child of Array.from(node.childNodes)) pending.push(child)
  }
  return table
}

function cellText(cell: HTMLTableCellElement): string {
  // GFM has no block/merged cells. Retain readable text without importing arbitrary
  // nodes, active content, or nested editors from the clipboard into a table cell.
  const copy = cell.cloneNode(true) as HTMLTableCellElement
  copy.querySelectorAll('script, style, template').forEach((element) => {
    element.remove()
  })
  copy.querySelectorAll('br').forEach((element) => {
    element.replaceWith('\n')
  })
  copy.querySelectorAll('p, div, li, pre, blockquote, h1, h2, h3, h4, h5, h6').forEach((element) => {
    element.append('\n')
  })
  return copy.textContent.replace(/\s+/g, ' ').trim()
}

function parseHTML(html: string): ClipboardRegion {
  if (!html || typeof DOMParser === 'undefined') return null
  const table = standaloneTable(new DOMParser().parseFromString(html, 'text/html'))
  if (!table?.rows.length) return null
  if (table.rows.length > MAX_DIMENSION) return 'rejected'
  const rows: Mdast.TableCell[][] = Array.from({ length: table.rows.length }, () => [])
  let groupEnd = 0
  for (let y = 0; y < table.rows.length; y++) {
    if (y === groupEnd) {
      groupEnd = y + 1
      while (groupEnd < table.rows.length && table.rows[groupEnd].parentElement === table.rows[y].parentElement) groupEnd++
    }
    let x = 0
    for (const cell of Array.from(table.rows[y].cells)) {
      while (rows[y][x]) x++
      const width = cell.colSpan
      // Row spans, including rowspan=0, stop at the current HTML row group.
      const height = Math.min(cell.rowSpan || groupEnd - y, groupEnd - y)
      if (x + width > MAX_DIMENSION || (x + width) * rows.length > MAX_TABLE_PASTE_CELLS) return 'rejected'
      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          // Malformed overlapping spans are not safe to reinterpret as a region.
          if (rows[y + dy][x + dx]) return null
          rows[y + dy][x + dx] = dy === 0 && dx === 0 ? textCell(cellText(cell)) : textCell()
        }
      }
      x += width
    }
  }
  return rectangle(rows)
}

/**
 * Read a region while distinguishing rejected oversized tables from ordinary text.
 * A rejected region must not fall through to rich-text paste and create a nested table.
 */
export function readTableClipboard(data: Pick<DataTransfer, 'getData'>): ClipboardRegion {
  const html = data.getData('text/html')
  const text = data.getData('text/plain')
  const htmlRegion = html.length <= MAX_SOURCE_LENGTH ? parseHTML(html) : /<table[\s/>]/i.test(html) ? 'rejected' : null
  if (Array.isArray(htmlRegion)) return htmlRegion
  const textRegion = parseTSV(text)
  if (Array.isArray(textRegion)) return textRegion
  return htmlRegion === 'rejected' || textRegion === 'rejected' ? 'rejected' : null
}

/**
 * Read a standalone HTML table or TSV region of at least 2×2 cells. Ordinary text
 * (including multiline prose) and rejected regions return null.
 * HTML formatting is intentionally downgraded to text; merged-cell coverage is empty.
 */
export function parseTableClipboard(data: Pick<DataTransfer, 'getData'>): Mdast.TableCell[][] | null {
  const result = readTableClipboard(data)
  return Array.isArray(result) ? result : null
}
