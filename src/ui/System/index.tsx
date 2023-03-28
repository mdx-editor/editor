import { getRealmFactory, realmFactoryToComponent, system } from '../../gurx'
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_CRITICAL, LexicalEditor, SELECTION_CHANGE_COMMAND } from 'lexical'
import React, { PropsWithChildren } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export const [EditorSystem] = system((r) => {
  const editor = r.node<LexicalEditor | null>(null, true)
  const currentFormat = r.node(0, true)

  r.sub(editor, (theEditor) => {
    if (theEditor) {
      theEditor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection()
          if ($isRangeSelection(selection)) {
            r.pub(currentFormat, selection.format)
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    }
  })

  return {
    editor,
    currentFormat,
  }
}, [])

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(getRealmFactory(EditorSystem), {}, ({ children }: PropsWithChildren) => {
  return <div>{children}</div>
})

export const CaptureLexicalEditor = () => {
  const setEditor = usePublisher('editor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
}
