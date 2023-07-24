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
  plugins?: React.ComponentProps<typeof RealmPluginInitializer>['plugins']
}

const DEFAULT_MARKDOWN_OPTIONS: ToMarkdownOptions = {
  listItemIndent: 'one'
}

/**
 * The interface for the {@link MDXEditor} object reference.
 *
 * @example
 * ```tsx
 *  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
 *  <MDXEditor ref={mdxEditorRef} />
 * ```
 */
export interface MDXEditorMethods {
  /**
   * Gets the current markdown value.
   */
  getMarkdown: () => string

  /**
   * Updates the markdown value of the editor.
   */
  setMarkdown: (value: string) => void
}

export const MDXEditorCore = React.forwardRef<MDXEditorMethods, MDXEditorCoreProps>((props, ref) => {
  return (
    <RealmPluginInitializer
      plugins={[
        corePlugin({
          contentEditableClassName: props.contentEditableClassName ?? '',
          initialMarkdown: props.markdown,
          onChange: props.onChange ?? noop,
          toMarkdownOptions: props.toMarkdownOptions ?? DEFAULT_MARKDOWN_OPTIONS
        }),
        ...(props.plugins || [])
      ]}
    >
      <LexicalProvider>
        <RichTextEditor />
      </LexicalProvider>
      <Methods mdxRef={ref} />
    </RealmPluginInitializer>
  )
})

const Methods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const realm = corePluginHooks.useRealmContext()

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          return realm.getKeyValue('markdown')
        },
        setMarkdown: (markdown) => {
          realm.pubKey('setMarkdown', markdown)
        }
      }
    },
    [realm]
  )
  return null
}
