import React from 'react'
import { RealmPluginInitializer } from './gurx'
import { corePlugin, corePluginHooks } from './plugins/core'
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

/**
 * The properties of the {@link MDXEditor} React component.
 */
export interface MDXEditorProps {
  /**
   * the CSS class to apply to the content editable element of the editor.
   * Use this to style the various content elements like lists and blockquotes.
   */
  contentEditableClassName?: string
  /**
   * The markdown to edit. Notice that this is read only when the component is mounted.
   * To change the component content dynamically, use the `MDXEditorMethods.setMarkdown` method.
   */
  markdown: string
  /**
   * Triggered when the editor value changes. The callback is not throttled, you can use any throttling mechanism
   * if you intend to do auto-saving.
   */
  onChange?: (markdown: string) => void
  /**
   * The markdown options used to generate the resulting markdown.
   * See {@link https://github.com/syntax-tree/mdast-util-to-markdown#options | the mdast-util-to-markdown docs} for the full list of options.
   */
  toMarkdownOptions?: ToMarkdownOptions
  /**
   * The plugins to use in the editor.
   */
  plugins?: React.ComponentProps<typeof RealmPluginInitializer>['plugins']
  /**
   * The class name to apply to the root component element. Use this if you want to change the editor dimensions, maximum height, etc.
   * For a content-specific styling, Use `contentEditableClassName` property.
   */
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
    <div className={classNames(styles.editorRoot, styles.editorWrapper, className, 'mdxeditor')} ref={editorRootElementRef}>
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

/**
 * The MDXEditor React component. See {@link MDXEditorProps} for the list of properties supported and the {@link MDXEditorMethods} for the methods accessible through the ref.
 */
export const MDXEditor = React.forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => {
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
      <EditorRootElement className={props.className}>
        <LexicalProvider>
          <RichTextEditor />
        </LexicalProvider>
      </EditorRootElement>
      <Methods mdxRef={ref} />
    </RealmPluginInitializer>
  )
})
