import React from 'react'
import { RealmPluginInitializer } from './gurx'
import { corePlugin, corePluginHooks } from './plugins/core/realmPlugin'
import { theme as contentTheme } from './content/theme'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import styles from './ui/styles.module.css'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import classNames from 'classnames'
import { ToMarkdownOptions } from './export'
import { noop } from './utils/fp'

const LexicalProvider: React.FC<{ children: JSX.Element | string | (JSX.Element | string)[] }> = ({ children }) => {
  const [initialRootEditorState, nodes] = corePluginHooks.useEmitterValues('initialRootEditorState', 'usedLexicalNodes')
  return (
    <LexicalComposer
      initialConfig={{
        editorState: initialRootEditorState,
        namespace: 'MDXEditor',
        theme: contentTheme,
        nodes: nodes,
        onError: (error: Error) => {
          throw error
        }
      }}
    >
      {children}
    </LexicalComposer>
  )
}

const RichTextEditor: React.FC = () => {
  const [contentEditableClassName] = corePluginHooks.useEmitterValues('contentEditableClassName')
  return (
    <RichTextPlugin
      contentEditable={<ContentEditable className={classNames(styles.contentEditable, contentEditableClassName)} />}
      placeholder={<div></div>}
      ErrorBoundary={LexicalErrorBoundary}
    />
  )
}

interface MDXEditorCoreProps {
  contentEditableClassName?: string
  markdown: string
  onChange?: (markdown: string) => void
  toMarkdownOptions?: ToMarkdownOptions
}

const DEFAULT_MARKDOWN_OPTIONS: ToMarkdownOptions = {
  listItemIndent: 'one'
}

export const MDXEditorCore: React.FC<MDXEditorCoreProps> = (props) => {
  return (
    <RealmPluginInitializer
      plugins={[
        corePlugin({
          contentEditableClassName: props.contentEditableClassName ?? '',
          initialMarkdown: props.markdown,
          onChange: props.onChange ?? noop,
          toMarkdownOptions: props.toMarkdownOptions ?? DEFAULT_MARKDOWN_OPTIONS
        })
      ]}
    >
      <LexicalProvider>
        <RichTextEditor />
      </LexicalProvider>
    </RealmPluginInitializer>
  )
}
