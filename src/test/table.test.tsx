import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { $createParagraphNode, $createTextNode, $getRoot, $isParagraphNode, createEditor, type LexicalEditor } from 'lexical'
import * as Mdast from 'mdast'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { RealmWithPlugins } from '../RealmWithPlugins'
import { corePlugin, NESTED_EDITOR_UPDATED_COMMAND, rootEditor$ } from '../plugins/core'
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

  it.each(['blur', 'nested editor update'])('adds a root Undo step only when a cell changed (%s)', async (trigger) => {
    let rootEditor!: LexicalEditor
    const ref = React.createRef<MDXEditorMethods>()
    const { container } = render(
      <MDXEditor
        ref={ref}
        markdown={'| a | b |\n| - | - |\n| c | d |'}
        plugins={[
          {
            postInit: (realm) => {
              rootEditor = realm.getValue(rootEditor$)!
            }
          },
          tablePlugin()
        ]}
      />
    )
    await waitFor(() => {
      expect(container.querySelector('tbody td [contenteditable="true"]')).not.toBeNull()
    })
    const history = getPeerDependencyFromEditor<typeof HistoryExtension>(rootEditor, HistoryExtension.name)!.output.historyState.value
    const cellElement = container.querySelector<HTMLElement>('tbody td [contenteditable="true"]')!
    const cellEditor = (cellElement as HTMLElement & { __lexicalEditor: LexicalEditor }).__lexicalEditor
    const saveCell = () => {
      act(() => {
        if (trigger === 'blur') {
          fireEvent.blur(cellElement, { relatedTarget: null })
        } else {
          cellEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
        }
      })
    }

    // History only pushes the previous state once it has recorded one.
    act(() => {
      rootEditor.update(
        () => {
          $getRoot().append($createParagraphNode().append($createTextNode('after')))
        },
        { discrete: true }
      )
    })
    const undoDepth = history.undoStack.length

    saveCell()
    expect(history.undoStack).toHaveLength(undoDepth)

    act(() => {
      cellEditor.update(
        () => {
          const paragraph = $getRoot().getFirstChildOrThrow()
          if (!$isParagraphNode(paragraph)) {
            throw new Error('Expected the cell to contain a paragraph')
          }
          paragraph.append($createTextNode('x'))
        },
        { discrete: true }
      )
    })
    saveCell()
    expect(history.undoStack).toHaveLength(undoDepth + 1)
    expect(ref.current!.getMarkdown()).toContain('| cx |')
  })
})
