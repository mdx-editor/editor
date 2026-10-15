import type * as Mdast from 'mdast'

// Bound rectangular expansion, particularly for untrusted colspan/rowspan values.
const MAX_SOURCE_LENGTH = 1000000
export const MAX_TABLE_PASTE_CELLS = 10000
const MAX_DIMENSION = 1000

function textCell(value = ''): Mdast.TableCell {
  return { type: 'tableCell', children: value ? [{ type: 'text', value }] : [] }
}

function rectangle(rows: Mdast.TableCell[][]): Mdast.TableCell[][] | null {
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0)
  if (!width || width > MAX_DIMENSION || rows.length > MAX_DIMENSION || width * rows.length > MAX_TABLE_PASTE_CELLS) return null
  return rows.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? textCell()))
}

/** Parse spreadsheet TSV, including quoted tabs/newlines and doubled quotes. */
function parseTSV(text: string): Mdast.TableCell[][] | null {
  const rows: Mdast.TableCell[][] = []
  let row: Mdast.TableCell[] = []
  let value = ''
  let quoted = false
  let closedQuote = false
  let hasTab = false
  let endedRow = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    endedRow = false
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          value += '"'
          index++
        } else {
          quoted = false
          closedQuote = true
        }
      } else {
        value += char
      }
    } else if (char === '\t' || char === '\n' || char === '\r') {
      row.push(textCell(value.replace(/\r\n?/g, '\n')))
      value = ''
      closedQuote = false
      if (char === '\t') {
        hasTab = true
      } else {
        if (char === '\r' && text[index + 1] === '\n') index++
        rows.push(row)
        row = []
        endedRow = true
      }
      if (row.length > MAX_DIMENSION || rows.length > MAX_DIMENSION) return null
    } else if (closedQuote) {
      return null
    } else if (char === '"' && value === '') {
      quoted = true
    } else {
      value += char
    }
  }
  if (quoted || !hasTab) return null
  // One final record separator terminates the last row; it does not add a new row.
  if (!endedRow) {
    row.push(textCell(value.replace(/\r\n?/g, '\n')))
    rows.push(row)
  }
  return rectangle(rows)
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

function parseHTML(html: string): Mdast.TableCell[][] | null {
  if (!html || typeof DOMParser === 'undefined') return null
  const table = standaloneTable(new DOMParser().parseFromString(html, 'text/html'))
  if (!table?.rows.length || table.rows.length > MAX_DIMENSION) return null
  const rows: Mdast.TableCell[][] = Array.from({ length: table.rows.length }, () => [])
  for (let y = 0; y < table.rows.length; y++) {
    let x = 0
    for (const cell of Array.from(table.rows[y].cells)) {
      while (rows[y][x]) x++
      const width = cell.colSpan
      const height = Math.min(cell.rowSpan || rows.length - y, rows.length - y)
      if (x + width > MAX_DIMENSION || (x + width) * rows.length > MAX_TABLE_PASTE_CELLS) return null
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
 * Read a standalone HTML table or tab-delimited spreadsheet region. Ordinary text
 * (including multiline prose) returns null so the normal cell paste can handle it.
 * HTML formatting is intentionally downgraded to text; merged-cell coverage is empty.
 */
export function parseTableClipboard(data: Pick<DataTransfer, 'getData'>): Mdast.TableCell[][] | null {
  const html = data.getData('text/html')
  const text = data.getData('text/plain')
  return (html.length <= MAX_SOURCE_LENGTH ? parseHTML(html) : null) ?? (text.length <= MAX_SOURCE_LENGTH ? parseTSV(text) : null)
}
