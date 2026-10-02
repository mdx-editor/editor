import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Realm } from '@mdxeditor/gurx'
import { $createTextNode, $getRoot, HISTORY_PUSH_TAG, type LexicalEditor, type ParagraphNode } from 'lexical'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor, type MDXEditorMethods } from '../MDXEditor'
import { activeEditor$, editorInFocus$, rootEditor$ } from '../plugins/core'
import { createExtensionEditor } from '../plugins/core/lexicalExtensions'
import { toolbarPlugin } from '../plugins/toolbar'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'
import { ConditionalContents } from '../plugins/toolbar/primitives/toolbar'

function renderConditionalToolbar(suppressSharedHistory = false) {
  let realm!: Realm
  let editor!: LexicalEditor
  const ref = React.createRef<MDXEditorMethods>()
  render(
    <MDXEditor
      ref={ref}
      markdown="Initial"
      suppressSharedHistory={suppressSharedHistory}
      plugins={[
        {
          postInit: (r) => {
            realm = r
            editor = r.getValue(rootEditor$)!
          }
        },
        toolbarPlugin({
          toolbarContents: () => (
            <ConditionalContents
              options={[
                { when: (focused) => focused?.editorType === 'codeblock', contents: () => <span>Code toolbar</span> },
                { fallback: () => <UndoRedo /> }
              ]}
            />
          )
        })
      ]}
    />
  )
  const remount = () => {
    const rootNode = editor.getEditorState().read(() => $getRoot())
    act(() => {
      realm.pub(editorInFocus$, { editorType: 'codeblock', rootNode, editorRef: null })
    })
    expect(screen.queryByRole('radio', { name: /Undo/ })).not.toBeInTheDocument()
    act(() => {
      realm.pub(editorInFocus$, { editorType: 'lexical', rootNode, editorRef: editor })
    })
  }
  const edit = () =>
    act(() => {
      editor.update(
        () => {
          $getRoot().getFirstChildOrThrow().selectEnd()
        },
        { discrete: true }
      )
      editor.update(
        () => {
          $getRoot().getFirstChildOrThrow<ParagraphNode>().append($createTextNode(' edit'))
        },
        { discrete: true, tag: HISTORY_PUSH_TAG }
      )
    })
  return { realm, editor, ref, remount, edit }
}

const undo = () => screen.getByRole('radio', { name: /Undo/ })
const redo = () => screen.getByRole('radio', { name: /Redo/ })

describe('UndoRedo lifecycle', () => {
  it('restores undo and redo availability when conditional toolbar contents remount', async () => {
    const { ref, remount, edit } = renderConditionalToolbar()
    expect(undo()).toBeDisabled()
    expect(redo()).toBeDisabled()
    edit()
    await waitFor(() => {
      expect(undo()).toBeEnabled()
    })

    remount()
    expect(undo()).toBeEnabled()
    expect(redo()).toBeDisabled()
    fireEvent.click(undo())
    await waitFor(() => {
      expect(ref.current?.getMarkdown()).toBe('Initial')
    })
    remount()
    expect(undo()).toBeDisabled()
    expect(redo()).toBeEnabled()
    fireEvent.click(redo())
    await waitFor(() => {
      expect(ref.current?.getMarkdown()).toBe('Initial edit')
    })
  })

  it.each([false, true])('keeps an unchanged document disabled after remount (history suppressed: %s)', (suppressed) => {
    const { remount } = renderConditionalToolbar(suppressed)
    remount()
    expect(undo()).toBeDisabled()
    expect(redo()).toBeDisabled()
  })

  it('reads the active editor history instead of retaining another editor availability', () => {
    const { realm, editor, edit } = renderConditionalToolbar()
    edit()
    expect(undo()).toBeEnabled()
    const local = createExtensionEditor({ name: 'undo-redo-local', namespace: 'undo-redo-local', nodes: [], historyMode: 'table-local' })
    const noHistory = createExtensionEditor({ name: 'undo-redo-none', namespace: 'undo-redo-none', nodes: [], historyMode: 'none' })
    try {
      for (const activeEditor of [local, noHistory, null]) {
        act(() => {
          realm.pub(activeEditor$, activeEditor)
        })
        expect(undo()).toBeDisabled()
        expect(redo()).toBeDisabled()
      }
      act(() => {
        realm.pub(activeEditor$, editor)
      })
      expect(undo()).toBeEnabled()
      expect(redo()).toBeDisabled()
    } finally {
      local.dispose()
      noHistory.dispose()
    }
  })
})
