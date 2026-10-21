import { describe, expect, it, vi } from 'vitest'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { toMarkdown } from 'mdast-util-to-markdown'
import { gfmTableFromMarkdown, gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { gfmTable } from 'micromark-extension-gfm-table'
import type * as Mdast from 'mdast'
import { MAX_TABLE_PASTE_CELLS, parseTableClipboard, readTableClipboard } from '../plugins/table/tableClipboard'

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

  it('round-trips a wrapped HTML document with entities and Markdown punctuation as literal cells', () => {
    // Representative browser-copy serialization, not an actual OS clipboard capture.
    const html =
      '<!doctype html><html><head><meta charset="utf-8"></head><body><!--StartFragment--><div><span><table><tbody><tr><td>A &amp; B</td><td>&lt;tag&gt; | *literal* [label](url) "quote"</td><td></td></tr></tbody></table></span></div><!--EndFragment--></body></html>'
    expect(values('wrong\tfallback', html)).toEqual([['A & B', '<tag> | *literal* [label](url) "quote"', '']])
    const rows = parseTableClipboard(clipboard('wrong\tfallback', html))!
    const table: Mdast.Table = { type: 'table', children: rows.map((children) => ({ type: 'tableRow', children })) }
    const markdown = toMarkdown(table, { extensions: [gfmTableToMarkdown()] })
    const result = fromMarkdown(markdown, { extensions: [gfmTable()], mdastExtensions: [gfmTableFromMarkdown()] })
    const withoutPositions = JSON.parse(
      JSON.stringify(result.children[0], (key, value: unknown) => (key === 'position' ? undefined : value))
    ) as Mdast.Table
    expect(withoutPositions).toEqual({ ...table, align: [null, null, null] })
  })

  it('prefers a valid entirely empty HTML region over nonempty TSV', () => {
    expect(values('do not\tinsert', '<div><table><tr><td></td><td><br></td></tr><tr><td>&nbsp;</td><td> </td></tr></table></div>')).toEqual(
      [
        ['', ''],
        ['', '']
      ]
    )
  })

  it('normalizes HTML whitespace while preserving plain TSV whitespace', () => {
    const plain = '  alpha  beta  \t tail '
    expect(values(plain)).toEqual([['  alpha  beta  ', ' tail ']])
    expect(values(plain, '<table><tr><td>  alpha&nbsp; beta  </td><td><div> tail </div></td></tr></table>')).toEqual([
      ['alpha beta', 'tail']
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

  it.each([
    [10, 1000],
    [1000, 10]
  ])('accepts the exact cell budget (%i rows by %i columns)', (height, width) => {
    const rows = parseTableClipboard(clipboard((Array(width).fill('x').join('\t') + '\n').repeat(height)))!
    expect(rows).toHaveLength(height)
    expect(rows.every((row) => row.length === width)).toBe(true)
  })

  it('rejects oversized TSV before normalizing the entire million-cell input', () => {
    // Exactly the accepted source-size limit, but 100 times the allowed cell count.
    const text = ('\t'.repeat(999) + '\n').repeat(1000)
    // Capture the original method; Reflect.apply below preserves its receiver.
    // eslint-disable-next-line @typescript-eslint/unbound-method
    const replace = String.prototype.replace
    let normalizedCells = 0
    const spy = vi.spyOn(String.prototype, 'replace').mockImplementation(function (this: string, ...args) {
      if (args[0] instanceof RegExp && args[0].source === '\\r\\n?') normalizedCells++
      return Reflect.apply(replace, this, args) as string
    })
    let result
    try {
      result = parseTableClipboard(clipboard(text))
    } finally {
      spy.mockRestore()
    }
    expect(result).toBeNull()
    expect(normalizedCells).toBeLessThanOrEqual(MAX_TABLE_PASTE_CELLS + 1)
  })

  it.each(['0', '2'])('does not let rowspan=%s cross HTML row-group boundaries', (rowspan) => {
    expect(
      values(
        '',
        `<table><tbody><tr><td rowspan="${rowspan}">A</td><td>B</td></tr></tbody><tbody><tr><td>C</td><td>D</td></tr></tbody></table>`
      )
    ).toEqual([
      ['A', 'B'],
      ['C', 'D']
    ])
  })

  it('distinguishes rejected sources from ordinary text and preserves valid fallback priority', () => {
    const oversizedHTML = '<table>' + '<tr><td colspan="1000">A</td></tr>'.repeat(11) + '</table>'
    expect(readTableClipboard(clipboard('', oversizedHTML))).toBe('rejected')
    expect(readTableClipboard(clipboard('', '<table/>' + ' '.repeat(1000000)))).toBe('rejected')
    expect(readTableClipboard(clipboard(Array(1002).fill('x').join('\t')))).toBe('rejected')
    expect(readTableClipboard(clipboard('line\n'.repeat(1001) + 'x\ty'))).toBe('rejected')
    expect(readTableClipboard(clipboard('ordinary prose'))).toBeNull()
    expect(readTableClipboard(clipboard('line\n'.repeat(1001)))).toBeNull()
    expect(values('safe\tfallback', oversizedHTML)).toEqual([['safe', 'fallback']])
    expect(values(Array(1002).fill('x').join('\t'), '<table><tr><td>safe</td></tr></table>')).toEqual([['safe']])
  })

  it('returns independent empty cells', () => {
    const rows = parseTableClipboard(clipboard('\t\n\t'))!
    rows[0][0].children.push({ type: 'text', value: 'changed' })
    expect(rows[0][1].children).toEqual([])
    expect(rows[1][0].children).toEqual([])
  })
})
