/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { $getRoot } from 'lexical'
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
  useEmitterValues,
  ViewModeToggler,
} from '../../'
import * as styles from './styles.css'
import { CaptureLexicalEditor, EditorSystemComponent } from '../../system'

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
  availableJsxImports: AvailableJsxImports
}

const SimpleFormatDisplay = () => {
  const [format, listType, blockType] = useEmitterValues('currentFormat', 'currentListType', 'currentBlockType')
  return (
    <div>
      {format} - {listType} - {blockType}
    </div>
  )
}

export const Wrapper: React.FC<WrappedEditorProps> = ({ markdown, availableJsxImports, sandpackConfig }) => {
  return (
    <SandpackConfigContext.Provider value={sandpackConfig}>
      <EditorSystemComponent markdownSource={markdown} availableJsxImports={availableJsxImports}>
        <LexicalComposer initialConfig={standardConfig(markdown)}>
          <CaptureLexicalEditor />
          <SimpleFormatDisplay />
          <ToolbarPlugin />
          <ViewModeToggler initialCode={markdown}>
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
        </LexicalComposer>
      </EditorSystemComponent>
    </SandpackConfigContext.Provider>
  )
}
