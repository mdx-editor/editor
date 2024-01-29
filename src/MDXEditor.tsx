import React from 'react'
import {
  composerChildren$,
  contentEditableClassName$,
  corePlugin,
  editorRootElementRef$,
  editorWrappers$,
  initialRootEditorState$,
  placeholder$,
  readOnly$,
  topAreaChildren$,
  usedLexicalNodes$,
  markdownSourceEditorValue$,
  viewMode$,
  markdown$,
  setMarkdown$,
  rootEditor$,
  insertMarkdown$
} from './plugins/core'
import { RealmPlugin, RealmWithPlugins } from './RealmWithPlugins'
import { useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'

import { lexicalTheme } from './styles/lexicalTheme'
import { LexicalComposer } from '@lexical/react/LexicalComposer.js'
import styles from './styles/ui.module.css'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin.js'
import { ContentEditable } from '@lexical/react/LexicalContentEditable.js'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary.js'
import classNames from 'classnames'
import { ToMarkdownOptions } from './exportMarkdownFromLexical'
import { noop } from './utils/fp'
import { IconKey } from './plugins/core/Icon'

const LexicalProvider: React.FC<{ children: JSX.Element | string | (JSX.Element | string)[] }> = ({ children }) => {
  const [initialRootEditorState, nodes, readOnly] = useCellValues(initialRootEditorState$, usedLexicalNodes$, readOnly$)
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
  const [contentEditableClassName, composerChildren, topAreaChildren, editorWrappers, placeholder] = useCellValues(
    contentEditableClassName$,
    composerChildren$,
    topAreaChildren$,
    editorWrappers$,
    placeholder$
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

const DEFAULT_MARKDOWN_OPTIONS: ToMarkdownOptions = {
  listItemIndent: 'one'
}

const DefaultIcon = React.lazy(() => import('./plugins/core/Icon'))

const IconFallback = () => {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none"></svg>
}
const defaultIconComponentFor = (name: IconKey) => {
  return (
    <React.Suspense fallback={<IconFallback />}>
      <DefaultIcon name={name} />
    </React.Suspense>
  )
}

/**
 * The interface for the {@link MDXEditor} object reference.
 *
 * @example
 * ```tsx
 *  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
 *  <MDXEditor ref={mdxEditorRef} />
 * ```
 * @group MDXEditor
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
   * Inserts markdown at the current cursor position. Use the focus if necessary.
   */
  insertMarkdown: (value: string) => void

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
  const setEditorRootElementRef = usePublisher(editorRootElementRef$)

  React.useEffect(() => {
    const popupContainer = document.createElement('div')
    popupContainer.classList.add(styles.editorRoot)
    popupContainer.classList.add(styles.popupContainer)
    if (className) {
      className
        .trim()
        .split(' ')
        .forEach((c) => {
          popupContainer.classList.add(c)
        })
    }
    document.body.appendChild(popupContainer)
    editorRootElementRef.current = popupContainer
    setEditorRootElementRef(editorRootElementRef)
    return () => {
      popupContainer.remove()
    }
  }, [className, editorRootElementRef, setEditorRootElementRef])
  return <div className={classNames(styles.editorRoot, styles.editorWrapper, className, 'mdxeditor')}>{children}</div>
}

const Methods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const realm = useRealm()

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          if (realm.getValue(viewMode$) === 'source') {
            return realm.getValue(markdownSourceEditorValue$)
          }

          return realm.getValue(markdown$)
        },
        setMarkdown: (markdown) => {
          realm.pub(setMarkdown$, markdown)
        },
        insertMarkdown: (markdown) => {
          realm.pub(insertMarkdown$, markdown)
        },
        focus: (callbackFn?: (() => void) | undefined, opts?: { defaultSelection?: 'rootStart' | 'rootEnd'; preventScroll?: boolean }) => {
          realm.getValue(rootEditor$)?.focus(callbackFn, opts)
        }
      }
    },
    [realm]
  )
  return null
}

/**
 * The props for the {@link MDXEditor} React component.
 * @group MDXEditor
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
   * Triggered when the markdown parser encounters an error. The payload includes the invalid source and the error message.
   */
  onError?: (payload: { error: string; source: string }) => void
  /**
   * The markdown options used to generate the resulting markdown.
   * See {@link https://github.com/syntax-tree/mdast-util-to-markdown#options | the mdast-util-to-markdown docs} for the full list of options.
   */
  toMarkdownOptions?: ToMarkdownOptions
  /**
   * The plugins to use in the editor.
   */
  plugins?: RealmPlugin[]
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
  /**
   * Use this prop to customize the icons used across the editor. Pass a function that returns an icon (JSX) for a given icon key.
   */
  iconComponentFor?: (name: IconKey) => JSX.Element
  /**
   * Set to false if you want to suppress the processing of HTML tags.
   */
  suppressHtmlProcessing?: boolean
}

/**
 * The MDXEditor React component.
 * @group MDXEditor
 */
export const MDXEditor = React.forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => {
  return (
    <RealmWithPlugins
      plugins={[
        corePlugin({
          contentEditableClassName: props.contentEditableClassName ?? '',
          initialMarkdown: props.markdown,
          onChange: props.onChange ?? noop,
          onBlur: props.onBlur ?? noop,
          toMarkdownOptions: props.toMarkdownOptions ?? DEFAULT_MARKDOWN_OPTIONS,
          autoFocus: props.autoFocus ?? false,
          placeholder: props.placeholder ?? '',
          readOnly: Boolean(props.readOnly),
          iconComponentFor: props.iconComponentFor ?? defaultIconComponentFor,
          suppressHtmlProcessing: props.suppressHtmlProcessing ?? false,
          onError: props.onError ?? noop
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
    </RealmWithPlugins>
  )
})
