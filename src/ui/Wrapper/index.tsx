/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot, LexicalEditor } from 'lexical'
import React from 'react'
import {
  AvailableJsxImports,
  CodeHighlightPlugin,
  contentTheme,
  importMarkdownToLexical,
  LinkDialogPlugin,
  SandpackConfigContext,
  SandpackConfigValue,
  ToolbarPlugin,
  UsedLexicalNodes,
  ViewModeContextProvider,
  ViewModeToggler,
} from '../../'
import * as styles from './styles.css'
import { getRealmFactory, realmFactoryToComponent, system } from '../../gurx'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'

export function standardConfig(markdown: string) {
  return {
    editorState: () => {
      importMarkdownToLexical($getRoot(), markdown)
    },
    namespace: 'MyEditor',
    theme: contentTheme,
    nodes: UsedLexicalNodes,
    onError: (error: Error) => console.error(error),
  }
}

interface WrappedEditorProps {
  markdown: string
  sandpackConfig: SandpackConfigValue
  availableImports: AvailableJsxImports
}

const [EditorSystem] = system((r) => {
  const editor = r.node<LexicalEditor | null>(null)

  r.sub(editor, (theEditor) => {
    console.log({ theEditor })
  })
  return {
    editor,
  }
}, [])

export const {
  Component: EditorSystemComponent,
  usePublisher,
  useEmitterValues,
} = realmFactoryToComponent(getRealmFactory(EditorSystem), {}, () => {
  return (
    <div>
      <LexicalComposer initialConfig={standardConfig('Hello markdown')}>
        <CaptureLexicalEditor />
        <RichTextPlugin
          contentEditable={<ContentEditable className={styles.ContentEditable} />}
          placeholder={<div></div>}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </LexicalComposer>
    </div>
  )
})

const CaptureLexicalEditor = () => {
  const setEditor = usePublisher('editor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
}

export const Wrapper: React.FC<WrappedEditorProps> = ({ markdown, availableImports, sandpackConfig }) => {
  return (
    <SandpackConfigContext.Provider value={sandpackConfig}>
      <LexicalComposer initialConfig={standardConfig(markdown)}>
        <ViewModeContextProvider>
          <ToolbarPlugin />
          <ViewModeToggler initialCode={markdown} availableImports={availableImports}>
            <RichTextPlugin
              contentEditable={<ContentEditable className={styles.ContentEditable} />}
              placeholder={<div></div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </ViewModeToggler>
          <LexicalLinkPlugin />
          <CodeHighlightPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <LinkDialogPlugin />
        </ViewModeContextProvider>
      </LexicalComposer>
    </SandpackConfigContext.Provider>
  )
}
