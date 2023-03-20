/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { ReactNode } from 'react'
import { exportMarkdownFromLexical } from '../../'
import { $getRoot, EditorState } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin'
import ReactDiffViewer from 'react-diff-viewer'

export function convertLexicalStateToMarkdown(state: EditorState) {
  return new Promise<string>((resolve) => {
    state.read(() => {
      resolve(exportMarkdownFromLexical($getRoot()))
    })
  })
}

export function MarkdownDiffView({ initialCode }: { initialCode: string }) {
  const [editor] = useLexicalComposerContext()
  const [currentMarkdown, setCurrentMarkdown] = React.useState('')

  React.useEffect(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((markdown) => {
        console.log({ markdown })
        setCurrentMarkdown(markdown)
      })
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  const onChange = React.useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then(setCurrentMarkdown)
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  console.log(currentMarkdown, editor.getEditorState())

  return (
    <>
      <OnChangePlugin onChange={onChange} />
      <ReactDiffViewer oldValue={initialCode} newValue={currentMarkdown} splitView={true} />
    </>
  )
}

interface DiffViewContextValue {
  set: React.Dispatch<React.SetStateAction<boolean>>
  value: boolean
}
const DiffViewOnContext = React.createContext<DiffViewContextValue>({
  value: false,
  set: () => {
    throw new Error('DiffViewOnContext not set')
  },
})

export interface DiffViewerProps {
  children: React.ReactNode
  initialCode: string
}

export const useDiffViewOn = () => {
  const { value, set } = React.useContext(DiffViewOnContext)
  return [value, set] as const
}

export const DiffViewerToggle: React.FC<DiffViewerProps> = ({ children, initialCode }) => {
  const [diffViewOn] = useDiffViewOn()
  return (
    <div>
      <div style={{ display: diffViewOn ? 'none' : 'block' }}>{children}</div>
      {diffViewOn ? <MarkdownDiffView initialCode={initialCode} /> : null}
    </div>
  )
}

export const DiffViewContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [diffViewOn, setDiffViewOn] = React.useState(false)

  return (
    <DiffViewOnContext.Provider
      value={{
        value: diffViewOn,
        set: setDiffViewOn,
      }}
    >
      {children}
    </DiffViewOnContext.Provider>
  )
}
