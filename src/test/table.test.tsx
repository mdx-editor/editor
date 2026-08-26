import { fireEvent, render, screen } from '@testing-library/react'
import { $createParagraphNode, $getRoot, createEditor } from 'lexical'
import * as Mdast from 'mdast'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { RealmWithPlugins } from '../RealmWithPlugins'
import { corePlugin } from '../plugins/core'
import { TableEditor } from '../plugins/table/TableEditor'
import { $createTableNode, TableNode } from '../plugins/table/TableNode'
import { tablePlugin } from '../plugins/table'

const tableMdast: Mdast.Table = {
  type: 'table',
  align: [null],
  children: [
    {
      type: 'tableRow',
      children: [{ type: 'tableCell', children: [{ type: 'text', value: 'Header' }] }]
    }
  ]
}

describe('table editor', () => {
  it('ignores delete actions from a stale table editor', async () => {
    const errors: Error[] = []
    const parentEditor = createEditor({
      namespace: 'stale-table-test',
      nodes: [TableNode],
      onError(error) {
        errors.push(error)
      }
    })
    let staleTable!: TableNode

    parentEditor.update(
      () => {
        staleTable = $createTableNode(tableMdast)
        $getRoot().append(staleTable)
      },
      { discrete: true }
    )
    parentEditor.update(
      () => {
        $getRoot().clear().append($createParagraphNode())
      },
      { discrete: true }
    )

    render(
      <RealmWithPlugins
        plugins={[
          corePlugin({
            initialMarkdown: '',
            contentEditableClassName: '',
            spellCheck: true,
            autoFocus: false,
            onChange: () => undefined,
            toMarkdownOptions: {},
            readOnly: false,
            iconComponentFor: () => <span />,
            translation: (_key, defaultValue) => defaultValue
          }),
          tablePlugin()
        ]}
      >
        <TableEditor lexicalTable={staleTable} mdastNode={tableMdast} parentEditor={parentEditor} />
      </RealmWithPlugins>
    )

    fireEvent.click(await screen.findByRole('button', { name: 'Delete table' }))

    expect(errors).toEqual([])
  })
})
