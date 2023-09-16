import React from 'react'
import { RealmPluginInitializer, useHasPlugin } from './gurx'
import { corePlugin, corePluginHooks } from './plugins/core'
import { lexicalTheme } from './styles/lexicalTheme'
import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import styles from './styles/ui.module.css'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js'
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary.js'
import classNames from 'classnames'
import { ToMarkdownOptions } from './exportMarkdownFromLexical'
import { noop } from './utils/fp'

const LexicalProvider: React.FC<{ children: JSX.Element | string | (JSX.Element | string)[] }> = ({ children }) => {
  const [initialRootEditorState, nodes, readOnly] = corePluginHooks.useEmitterValues(
    'initialRootEditorState',
    'usedLexicalNodes',
    'readOnly'
  )
  return (
    <LexicalComposer
      initialConfig={{
        editable: !readOnly,
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
  const [contentEditableClassName, composerChildren, topAreaChildren, editorWrappers, placeholder] = corePluginHooks.useEmitterValues(
    'contentEditableClassName',
    'composerChildren',
    'topAreaChildren',
    'editorWrappers',
    'placeholder'
  )
  return (
    <>
      {topAreaChildren.map((Child, index) => (
        <Child key={index} />
      ))}
      <RenderRecurisveWrappers wrappers={editorWrappers}>
        <div className={classNames(styles.rootContentEditableWrapper)}>
          <RichTextPlugin
            contentEditable={<ContentEditable className={classNames(styles.contentEditable, contentEditableClassName)} />}
            placeholder={
              <div className={classNames(styles.contentEditable, styles.placeholder, contentEditableClassName)}>
                <p>{placeholder}</p>
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          ></RichTextPlugin>
        </div>
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
  /**
   * pass if you would like to have the editor automatically focused when mounted.
   */
  autoFocus?: boolean | { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean }
  /**
   * Triggered when focus leaves the editor
   */
  onBlur?: (e: FocusEvent) => void
  /**
   * The placeholder contents, displayed when the editor is empty.
   */
  placeholder?: React.ReactNode
  /**
   * pass if you would like to have the editor in read-only mode.
   * Note: Don't use this mode to render content for consumption - render the markdown using a library of your choice instead.
   */
  readOnly?: boolean
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

  /**
   * Sets focus on input
   */
  focus: (callbackFn?: (() => void) | undefined, opts?: { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean }) => void
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
  const editorRootElementRef = React.useRef<HTMLDivElement | null>(null)
  const setEditorRootElementRef = corePluginHooks.usePublisher('editorRootElementRef')

  React.useEffect(() => {
    const popupContainer = document.createElement('div')
    popupContainer.classList.add(styles.editorRoot)
    if (className) {
      className.split(' ').forEach((c) => {
        popupContainer.classList.add(c);
      });
    }
    document.body.appendChild(popupContainer)
    editorRootElementRef.current = popupContainer
    setEditorRootElementRef(editorRootElementRef)
    return () => {
      document.body.removeChild(popupContainer)
    }
  }, [className, editorRootElementRef, setEditorRootElementRef])
  return <div className={classNames(styles.editorRoot, styles.editorWrapper, className, 'mdxeditor')}>{children}</div>
}

const Methods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const realm = corePluginHooks.useRealmContext()
  const hasDiffSourcePlugin = useHasPlugin('diff-source')

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          if (hasDiffSourcePlugin) {
            //@ts-expect-error we're accessing values from the diff-source plugin, but TS does not know about this. Typecast can be done, but we should import from the plugin.
            if (realm.getKeyValue('viewMode') === 'source') {
              // @ts-expect-error see above
              return realm.getKeyValue('markdownSourceEditorValue') as string
            }
          }
          return realm.getKeyValue('markdown')
        },
        setMarkdown: (markdown) => {
          realm.pubKey('setMarkdown', markdown)
        },
        focus: (callbackFn?: (() => void) | undefined, opts?: { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean }) => {
          realm.getKeyValue('rootEditor')?.focus(callbackFn, opts)
        }
      }
    },
    [realm, hasDiffSourcePlugin]
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
          onBlur: props.onBlur ?? noop,
          toMarkdownOptions: props.toMarkdownOptions ?? DEFAULT_MARKDOWN_OPTIONS,
          autoFocus: props.autoFocus ?? false,
          placeholder: props.placeholder ?? '',
          readOnly: Boolean(props.readOnly)
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
