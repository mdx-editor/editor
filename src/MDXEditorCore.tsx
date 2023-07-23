import React from 'react'
import { RealmPluginInitializer } from './gurx'
import { corePlugin, corePluginHooks } from './plugins/core/realmPlugin'
import { theme as contentTheme } from './content/theme'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { $createParagraphNode, $createTextNode, $getRoot, ParagraphNode, TextNode } from 'lexical'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import styles from './ui/styles.module.css'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import classNames from 'classnames'

const LexicalProvider: React.FC<{ children: JSX.Element | string | (JSX.Element | string)[] }> = ({ children }) => {
  return (
    <LexicalComposer
      initialConfig={{
        editorState: () => {
          $getRoot().append($createParagraphNode().append($createTextNode('Hello')))
        },
        namespace: 'MDXEditor',
        theme: contentTheme,
        nodes: [ParagraphNode, TextNode],
        onError: (error: Error) => {
          throw error
        }
      }}
    >
      {children}
    </LexicalComposer>
  )
}

const CaptureLexicalEditor: React.FC = () => {
  const setEditor = corePluginHooks.usePublisher('rootEditor')
  const [lexicalEditor] = useLexicalComposerContext()
  React.useEffect(() => setEditor(lexicalEditor), [lexicalEditor, setEditor])
  return null
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
}

export const MDXEditorCore: React.FC<MDXEditorCoreProps> = (props) => {
  return (
    <RealmPluginInitializer
      plugins={[
        corePlugin({
          contentEditableClassName: props.contentEditableClassName ?? ''
        })
      ]}
    >
      <LexicalProvider>
        <RichTextEditor />
        <CaptureLexicalEditor />
      </LexicalProvider>
    </RealmPluginInitializer>
  )
}
