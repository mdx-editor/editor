import { describe, expect, it } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import type * as Mdast from 'mdast'
import { parseTableClipboard } from '../plugins/table/tableClipboard'

function clipboard(text: string, html = '') {
  return { getData: (type: string) => (type === 'text/html' ? html : text) }
}

function values(text: string, html = '') {
  return parseTableClipboard(clipboard(text, html))?.map((row) =>
    row.map((cell) => cell.children.map((child) => ('value' in child ? child.value : '')).join(''))
  )
}

describe('table clipboard regions', () => {
  it('leaves ordinary text, multiline prose and CSV to the normal paste handler', () => {
    for (const text of ['', 'hello', 'first\nsecond', 'a,b\nc,d', '"a\tb"']) {
      expect(parseTableClipboard(clipboard(text))).toBeNull()
    }
  })

  it('parses TSV and pads ragged rows without losing trailing empty cells', () => {
    expect(values('a\tb\t\r\nc\td\r\n')).toEqual([
      ['a', 'b', ''],
      ['c', 'd', '']
    ])
    expect(values('\t')).toEqual([['', '']])
    expect(values('a\tb\n\n')).toEqual([
      ['a', 'b'],
      ['', '']
    ])
  })

  it('handles quoted tabs, embedded newlines and escaped quotes', () => {
    expect(values('"a\tb"\t"line 1\r\nline 2"\n"say ""hello"""\t tail ')).toEqual([
      ['a\tb', 'line 1\nline 2'],
      ['say "hello"', ' tail ']
    ])
  })

  it('round-trips quoted multiline cells and Markdown punctuation through GFM', () => {
    const rows = parseTableClipboard(clipboard('"line 1\nline 2"\t"a|b *literal*"'))!
    const table: Mdast.Table = { type: 'table', children: rows.map((children) => ({ type: 'tableRow', children })) }
    const markdown = toMarkdown(table, { extensions: [gfmTableToMarkdown()] })
    const result = fromMarkdown(markdown, { extensions: [gfmTable()], mdastExtensions: [gfmTableFromMarkdown()] })
    const removePositions = (value: unknown): unknown =>
      JSON.parse(JSON.stringify(value, (key, item: unknown) => (key === 'position' ? undefined : item)))
    expect(removePositions(result.children[0])).toEqual({ ...table, align: [null, null] })
  })

  it('rejects malformed quoted TSV', () => {
    expect(parseTableClipboard(clipboard('a\t"unfinished'))).toBeNull()
    expect(parseTableClipboard(clipboard('a\t"closed"junk'))).toBeNull()
  })

  it('prefers HTML and recognizes spreadsheet metadata and wrapper elements', () => {
    expect(
      values(
        'fallback\ttext',
        '<meta charset="utf-8"><style>td { color: red }</style><!--StartFragment--><google-sheets-html-origin><div><table><thead><tr><th>A &amp; B</th><th></th></tr></thead><tbody><tr><td>C</td></tr></tbody></table></div></google-sheets-html-origin><!--EndFragment-->'
      )
    ).toEqual([
      ['A & B', ''],
      ['C', '']
    ])
  })

  it('flattens inline and block content and excludes active content', () => {
    expect(
      values(
        '',
        '<table><tr><td><p><strong>Bold</strong> <a href="https://example.com">link</a></p><div>Next<br>line</div><script>alert(1)</script></td></tr></table>'
      )
    ).toEqual([['Bold link Next line']])
  })

  it('expands merged cells with empty placeholders and normalizes rows', () => {
    expect(values('', '<table><tr><td rowspan="2">A</td><td colspan="2">B</td></tr><tr><td>C</td><td>D</td></tr></table>')).toEqual([
      ['A', 'B', ''],
      ['', 'C', 'D']
    ])
  })

  it('rejects mixed HTML and nested tables, falling back to valid TSV', () => {
    for (const html of [
      '<p>Before</p><table><tr><td>A</td></tr></table>',
      '<div>Before<table><tr><td>A</td></tr></table></div>',
      '<table><tr><td>A<table><tr><td>B</td></tr></table></td></tr></table>',
      '<table><tr><td>A</td></tr></table><table><tr><td>B</td></tr></table>'
    ]) {
      expect(parseTableClipboard(clipboard('ordinary', html))).toBeNull()
      expect(values('a\tb', html)).toEqual([['a', 'b']])
    }
  })

  it('rejects empty tables and excessive rectangular expansion', () => {
    expect(parseTableClipboard(clipboard('', '<table></table>'))).toBeNull()
    expect(parseTableClipboard(clipboard('x'.repeat(1000000) + '\t'))).toBeNull()
    expect(parseTableClipboard(clipboard(Array(1002).fill('x').join('\t')))).toBeNull()
    expect(parseTableClipboard(clipboard('', `<table>${'<tr><td colspan="1000">A</td></tr>'.repeat(11)}</table>`))).toBeNull()
  })

  it('returns independent empty cells', () => {
    const rows = parseTableClipboard(clipboard('\t\n\t'))!
    rows[0][0].children.push({ type: 'text', value: 'changed' })
    expect(rows[0][1].children).toEqual([])
    expect(rows[1][0].children).toEqual([])
  })
})
