/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { CODE, ElementTransformer, Transformer, TRANSFORMERS } from '@lexical/markdown'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { LinkPlugin as LexicalLinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin'
import classNames from 'classnames'
import { $getRoot } from 'lexical'
import React from 'react'
import {
  $createCodeBlockNode,
  contentTheme,
  importMarkdownToLexical,
  JsxComponentDescriptors,
  LinkDialogPlugin,
  ToolbarPlugin,
  UsedLexicalNodes,
  ViewMode,
  ViewModeToggler,
} from '../../'
import { EditorSystemComponent } from '../../system'
import { NodeDecorators } from '../../system/NodeDecorators'
import { SandpackConfigValue } from '../../system/Sandpack'
import ListMaxIndentLevelPlugin from '../ListIndentPlugin'
import { CodeBlockEditor } from '../NodeDecorators/CodeBlockEditor'
import { FrontmatterEditor } from '../NodeDecorators/FrontmatterEditor'
import { JsxEditor } from '../NodeDecorators/JsxEditor'
import { SandpackEditor } from '../NodeDecorators/SandpackEditor'
import { TableEditor } from '../NodeDecorators/TableEditor'
import styles from '../styles.module.css'

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
  headMarkdown: string
  sandpackConfig: SandpackConfigValue
  jsxComponentDescriptors: JsxComponentDescriptors
  linkAutocompleteSuggestions?: string[]
  viewMode?: ViewMode
  onChange?: (markdown: string) => void
  className?: string
}

const nodeDecorators: NodeDecorators = {
  FrontmatterEditor,
  JsxEditor,
  SandpackEditor,
  CodeBlockEditor,
  TableEditor,
}

// insert CM code block type rather than the default one
function patchMarkdownTransformers(transformers: Transformer[]) {
  const codeTransformer = transformers.find((t) => t === CODE) as ElementTransformer

  codeTransformer.replace = (parentNode, _children, match) => {
    const codeBlockNode = $createCodeBlockNode({ code: '', language: match ? match[1] : '', meta: '' })
    parentNode.replace(codeBlockNode)
    setTimeout(() => codeBlockNode.select(), 80)
  }

  return transformers
}

export const Wrapper: React.FC<WrappedEditorProps> = ({
  markdown,
  headMarkdown,
  jsxComponentDescriptors,
  sandpackConfig,
  onChange,
  viewMode,
  linkAutocompleteSuggestions,
  className,
}) => {
  const editorRootElementRef = React.useRef<HTMLDivElement>(null)
  return (
    <div className={classNames(styles.editorRoot, styles.editorWrapper, className)} ref={editorRootElementRef}>
      <LexicalComposer initialConfig={standardConfig(markdown)}>
        <EditorSystemComponent
          headMarkdown={headMarkdown}
          markdownSource={markdown}
          jsxComponentDescriptors={jsxComponentDescriptors}
          sandpackConfig={sandpackConfig}
          onChange={onChange}
          viewMode={viewMode}
          nodeDecorators={nodeDecorators}
          linkAutocompleteSuggestions={linkAutocompleteSuggestions}
          editorRootElementRef={editorRootElementRef as any}
        >
          <ToolbarPlugin />
          <ViewModeToggler>
            <RichTextPlugin
              contentEditable={<ContentEditable className={styles.contentEditable} />}
              placeholder={<div></div>}
              ErrorBoundary={LexicalErrorBoundary}
            />
          </ViewModeToggler>
          <LexicalLinkPlugin />
          <HorizontalRulePlugin />
          <ListPlugin />
          <ListMaxIndentLevelPlugin maxDepth={7} />
          <TabIndentationPlugin />
          <LinkDialogPlugin />
          <HistoryPlugin />
          <MarkdownShortcutPlugin transformers={patchMarkdownTransformers(TRANSFORMERS)} />
        </EditorSystemComponent>
      </LexicalComposer>
    </div>
  )
}
