/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { ReactNode } from 'react'
import { exportMarkdownFromLexical } from '../..'
import { $getRoot, EditorState } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import ReactDiffViewer from 'react-diff-viewer'
export type ViewMode = 'editor' | 'markdown' | 'diff'
import { AutogrowTextarea, AutoGrowTextareaWrapper } from './styles.css'
import { themeClassName } from '../theme.css'

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

  const updateCurrentMarkdown = React.useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then(setCurrentMarkdown)
      .catch((rejection) => console.warn({ rejection }))
  }, [editor])

  React.useEffect(updateCurrentMarkdown, [editor, updateCurrentMarkdown])

  return <ReactDiffViewer oldValue={initialCode} newValue={currentMarkdown} splitView={true} />
}

export function MarkdownPlainTextEditor() {
  const [editor] = useLexicalComposerContext()
  const [currentMarkdown, setCurrentMarkdown] = React.useState('')
  const [, updateMarkdown] = React.useContext(MarkdownSourceContext)

  const updateCurrentMarkdown = React.useCallback(() => {
    convertLexicalStateToMarkdown(editor.getEditorState())
      .then((value) => {
        setCurrentMarkdown(value)
        updateMarkdown(value)
      })
      .catch((rejection) => console.warn({ rejection }))
  }, [editor, updateMarkdown])

  React.useEffect(updateCurrentMarkdown, [editor, updateCurrentMarkdown])

  return (
    <div className={AutoGrowTextareaWrapper} data-value={currentMarkdown}>
      <textarea
        defaultValue={currentMarkdown}
        className={AutogrowTextarea}
        onInput={({ target }) => {
          const value = (target as HTMLTextAreaElement).value
          updateMarkdown(value)
          ;((target as HTMLTextAreaElement).parentNode as HTMLDivElement).dataset.value = value
        }}
      />
    </div>
  )
}

type ViewModeContextValue = [ViewMode, React.Dispatch<React.SetStateAction<ViewMode>>]

const ViewModeContext = React.createContext<ViewModeContextValue>([
  'editor',
  () => {
    throw new Error('ViewModeContext not set')
  },
])

export interface ViewModeProps {
  children: React.ReactNode
  initialCode: string
}

export const useViewMode = () => {
  return React.useContext(ViewModeContext)
}

export const ViewModeToggler: React.FC<ViewModeProps> = ({ children, initialCode }) => {
  const [viewMode] = useViewMode()
  // keep the RTE always mounted, otherwise the state is lost
  return (
    <div className={themeClassName}>
      <div style={{ display: viewMode === 'editor' ? 'block' : 'none' }}>{children}</div>
      {viewMode === 'diff' ? <MarkdownDiffView initialCode={initialCode} /> : null}
      {viewMode === 'markdown' ? <MarkdownPlainTextEditor /> : null}
    </div>
  )
}

type MarkdownSourceContextValue = [React.MutableRefObject<string>, (markdown: string) => void]

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const MarkdownSourceContext = React.createContext<MarkdownSourceContextValue>([
  null as unknown as any,
  () => {
    throw new Error('MarkdownSourceContext not set')
  },
])

export const useMarkdownSource = () => {
  return React.useContext(MarkdownSourceContext)
}

export const ViewModeContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const markdownSource = React.useRef('')
  const updateMarkdownSource = React.useCallback((markdown: string) => {
    markdownSource.current = markdown
  }, [])

  return (
    <MarkdownSourceContext.Provider value={[markdownSource, updateMarkdownSource]}>
      <ViewModeContext.Provider value={React.useState<ViewMode>('editor')}>{children}</ViewModeContext.Provider>
    </MarkdownSourceContext.Provider>
  )
}
