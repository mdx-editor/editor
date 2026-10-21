import { $getNodeByKey, $getRoot, createEditor } from 'lexical'
import type * as Mdast from 'mdast'
import { describe, expect, it } from 'vitest'
import { $createTableNode, $isTableNode, TableNode } from '../plugins/table/TableNode'

const cell = (value: string): Mdast.TableCell => ({
  type: 'tableCell',
  children: value ? [{ type: 'strong', children: [{ type: 'text', value }] }] : []
})

function $table(key: string): TableNode {
  const node = $getNodeByKey(key)
  if (!$isTableNode(node)) throw new Error('Expected a table node')
  return node
}

describe('table paste rectangular model', () => {
  it('matches overwrite and growth without changing untouched rich cells, alignment, source or history', () => {
    const editor = createEditor({
      nodes: [TableNode],
      onError: (error) => {
        throw error
      }
    })
    let cases = 0
    for (const height of [1, 2, 4]) {
      for (const width of [1, 2, 4]) {
        for (const y of [0, height - 1]) {
          for (const x of [0, width - 1]) {
            for (const sourceHeight of [1, 3]) {
              for (const sourceWidth of [2, 3]) {
                const original: Mdast.Table = {
                  type: 'table',
                  align: Array.from({ length: width }, (_, i) => (i % 2 ? 'right' : 'left')),
                  children: Array.from({ length: height }, (_, row) => ({
                    type: 'tableRow',
                    children: Array.from({ length: width }, (_, col) => cell(`before ${row},${col}`))
                  }))
                }
                const source = Array.from({ length: sourceHeight }, (_, row) =>
                  Array.from({ length: sourceWidth }, (_, col) => cell((row + col) % 2 ? `after ${row},${col}` : ''))
                )
                const unchangedSource = structuredClone(source)
                let key = ''
                editor.update(
                  () => {
                    const table = $createTableNode(structuredClone(original))
                    key = table.getKey()
                    $getRoot().clear().append(table)
                  },
                  { discrete: true }
                )
                const before = editor.getEditorState()
                editor.update(
                  () => {
                    const table = $table(key)
                    table.pasteCells(x, y, source)
                  },
                  { discrete: true }
                )
                const result = editor.getEditorState().read(() => $table(key).getMdastNode())
                const nextHeight = Math.max(height, y + sourceHeight)
                const nextWidth = Math.max(width, x + sourceWidth)
                const expected = Array.from({ length: nextHeight }, (_, row) => ({
                  type: 'tableRow',
                  children: Array.from({ length: nextWidth }, (_, col) => {
                    if (row >= y && row < y + sourceHeight && col >= x && col < x + sourceWidth) return source[row - y][col - x]
                    return row < height && col < width ? original.children[row].children[col] : cell('')
                  })
                }))
                expect(result.children).toEqual(expected)
                expect(result.align).toEqual([...original.align!, ...Array<null>(nextWidth - width).fill(null)])
                expect(source).toEqual(unchangedSource)
                expect(result.children[y].children[x]).not.toBe(source[0][0])
                expect(before.read(() => $table(key).getMdastNode())).toEqual(original)
                cases++
              }
            }
          }
        }
      }
    }
    expect(cases).toBe(144)
  })
})
