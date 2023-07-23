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
}

export const MDXEditorCore: React.FC<MDXEditorCoreProps> = (props) => {
  return (
    <RealmPluginInitializer
      plugins={[
        corePlugin({
          contentEditableClassName: props.contentEditableClassName ?? '',
          initialMarkdown: props.markdown
        })
      ]}
    >
      <LexicalProvider>
        <RichTextEditor />
      </LexicalProvider>
    </RealmPluginInitializer>
  )
}
