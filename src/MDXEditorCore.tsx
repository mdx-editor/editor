import React from 'react'
import { RealmPluginInitializer } from './gurx'
import { corePlugin, corePluginHooks } from './plugins/core/realmPlugin'
import { lexicalTheme } from './styles/lexicalTheme'
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import styles from './styles/ui.module.css'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
import classNames from 'classnames'
import { ToMarkdownOptions } from './exportMarkdownFromLexical'
import { noop } from './utils/fp'

const LexicalProvider: React.FC<{ children: JSX.Element | string | (JSX.Element | string)[] }> = ({ children }) => {
  const [initialRootEditorState, nodes] = corePluginHooks.useEmitterValues('initialRootEditorState', 'usedLexicalNodes')
  return (
    <LexicalComposer
      initialConfig={{
        editorState: initialRootEditorState,
        namespace: 'MDXEditor',
        theme: lexicalTheme,
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
  const [contentEditableClassName, composerChildren, topAreaChildren, editorWrappers] = corePluginHooks.useEmitterValues(
    'contentEditableClassName',
    'composerChildren',
    'topAreaChildren',
    'editorWrappers'
  )
  return (
    <>
      {topAreaChildren.map((Child, index) => (
        <Child key={index} />
      ))}
      <RenderRecurisveWrappers wrappers={editorWrappers}>
        <RichTextPlugin
          contentEditable={<ContentEditable className={classNames(styles.contentEditable, contentEditableClassName)} />}
          placeholder={<div></div>}
          ErrorBoundary={LexicalErrorBoundary}
        ></RichTextPlugin>
      </RenderRecurisveWrappers>
      {composerChildren.map((Child, index) => (
        <Child key={index} />
      ))}
    </>
  )
}

export interface MDXEditorCoreProps {
  contentEditableClassName?: string
  markdown: string
  onChange?: (markdown: string) => void
  toMarkdownOptions?: ToMarkdownOptions
  plugins?: React.ComponentProps<typeof RealmPluginInitializer>['plugins']
  className?: string
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
      <EditorRootElement>
        <LexicalProvider>
          <RichTextEditor />
        </LexicalProvider>
      </EditorRootElement>
      <Methods mdxRef={ref} />
    </RealmPluginInitializer>
  )
})

const RenderRecurisveWrappers: React.FC<{ wrappers: React.ComponentType<{ children: React.ReactNode }>[]; children: React.ReactNode }> = ({
  wrappers,
  children
}) => {
  if (wrappers.length === 0) {
    return <>{children}</>
  }
  const Wrapper = wrappers[0]
  return (
    <Wrapper>
      <RenderRecurisveWrappers wrappers={wrappers.slice(1)}>{children}</RenderRecurisveWrappers>
    </Wrapper>
  )
}

const EditorRootElement: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const editorRootElementRef = React.useRef<HTMLDivElement>(null)
  const setEditorRootElementRef = corePluginHooks.usePublisher('editorRootElementRef')

  React.useEffect(() => {
    setEditorRootElementRef(editorRootElementRef)
  }, [editorRootElementRef, setEditorRootElementRef])
  return (
    <div className={classNames(styles.editorRoot, styles.editorWrapper, className)} ref={editorRootElementRef}>
      {children}
    </div>
  )
}

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
