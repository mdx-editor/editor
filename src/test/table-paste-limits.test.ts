import { $getRoot, createEditor } from 'lexical'
import type * as Mdast from 'mdast'
import { describe, expect, it } from 'vitest'
import { $createTableNode, TableNode } from '../plugins/table/TableNode'

const blank = (): Mdast.TableCell => ({ type: 'tableCell', children: [] })

describe('table paste destination bounds', () => {
  it('rejects cross-dimensional amplification without allocating a million cells', () => {
    const editor = createEditor({
      nodes: [TableNode],
      onError: (error) => {
        throw error
      }
    })
    editor.update(
      () => {
        const table = $createTableNode({ type: 'table', children: [{ type: 'tableRow', children: Array.from({ length: 1000 }, blank) }] })
        $getRoot().append(table)
        const tallRegion = Array.from({ length: 1000 }, () => [blank()])
        expect(table.canPasteCells(0, 0, tallRegion)).toBe(false)
        table.pasteCells(0, 0, tallRegion)
        expect(table.getRowCount()).toBe(1)
        expect(table.getColCount()).toBe(1000)
        expect(
          table.canPasteCells(
            0,
            0,
            Array.from({ length: 10 }, () => [blank()])
          )
        ).toBe(true)
        expect(
          table.canPasteCells(
            0,
            1,
            Array.from({ length: 10 }, () => [blank()])
          )
        ).toBe(false)
      },
      { discrete: true }
    )
  })
})
