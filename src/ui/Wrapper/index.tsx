/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { $getRoot } from 'lexical'
import React from 'react'
import {
  CodeHighlightPlugin,
  contentTheme,
  importMarkdownToLexical,
  JsxComponentDescriptors,
  LinkDialogPlugin,
  ToolbarPlugin,
  UsedLexicalNodes,
  useEmitterValues,
  ViewModeToggler,
} from '../../'
import { EditorSystemComponent } from '../../system'
import { SandpackConfigValue } from '../../system/Sandpack'
import * as styles from './styles.css'

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
  jsxComponentDescriptors: JsxComponentDescriptors
  onChange?: (markdown: string) => void
}

const Debugger = () => {
  return null
  const [format, listType, blockType] = useEmitterValues('currentFormat', 'currentListType', 'currentBlockType')
  return (
    <div>
      {format} - {listType} - {blockType}
    </div>
  )
}

export const Wrapper: React.FC<WrappedEditorProps> = ({ markdown, jsxComponentDescriptors, sandpackConfig, onChange }) => {
  return (
    <LexicalComposer initialConfig={standardConfig(markdown)}>
      <EditorSystemComponent
        markdownSource={markdown}
        jsxComponentDescriptors={jsxComponentDescriptors}
        sandpackConfig={sandpackConfig}
        onChange={onChange}
      >
        <Debugger />
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
        <HistoryPlugin />
      </EditorSystemComponent>
    </LexicalComposer>
  )
}
