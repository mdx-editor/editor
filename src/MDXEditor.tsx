import { useCellValue, useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'
import React, { JSX } from 'react'
import {
  activeEditor$,
  AdditionalLexicalNode,
  bottomAreaChildren$,
  composerChildren$,
  contentEditableClassName$,
  contentEditableRef$,
  corePlugin,
  editorRootElementRef$,
  editorWrappers$,
  exportVisitors$,
  insertMarkdown$,
  jsxComponentDescriptors$,
  jsxIsAvailable$,
  markdown$,
  markdownSourceEditorValue$,
  placeholder$,
  rootEditor$,
  contentEditableWrapperElement$,
  setMarkdown$,
  spellCheck$,
  toMarkdownExtensions$,
  toMarkdownOptions$,
  topAreaChildren$,
  Translation,
  useTranslation,
  viewMode$,
  editorWrapperElementRef$
} from './plugins/core'
import { RealmPlugin, RealmWithPlugins } from './RealmWithPlugins'

import { createLexicalComposerContext, LexicalComposerContext, LexicalComposerContextType } from '@lexical/react/LexicalComposerContext'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import classNames from 'classnames'
import { EditorState, EditorThemeClasses, LexicalEditor } from 'lexical'
import { defaultSvgIcons, IconKey } from './defaultSvgIcons'
import { ToMarkdownOptions } from './exportMarkdownFromLexical'
import { lexicalTheme } from './styles/lexicalTheme'
import styles from './styles/ui.module.css'
import { noop } from './utils/fp'
import { getSelectionAsMarkdown } from './utils/lexicalHelpers'

const LexicalProvider: React.FC<{
  children: JSX.Element | string | (JSX.Element | string)[]
}> = ({ children }) => {
  const rootEditor = useCellValue(rootEditor$)!
  const composerContextValue = React.useMemo(() => {
    return [rootEditor, createLexicalComposerContext(null, lexicalTheme)] as [LexicalEditor, LexicalComposerContextType]
  }, [rootEditor])

  return <LexicalComposerContext.Provider value={composerContextValue}>{children}</LexicalComposerContext.Provider>
}

const RichTextEditor: React.FC = () => {
  const t = useTranslation()
  const setContentEditableRef = usePublisher(contentEditableRef$)
  const setEditorRootWrapperElement = usePublisher(contentEditableWrapperElement$)
  const onRef = (el: HTMLDivElement | null) => {
    setEditorRootWrapperElement(el)
    setContentEditableRef(el ? ({ current: el } as React.RefObject<HTMLDivElement>) : null)
  }

  const [contentEditableClassName, spellCheck, composerChildren, topAreaChildren, editorWrappers, placeholder, bottomAreaChildren] =
    useCellValues(
      contentEditableClassName$,
      spellCheck$,
      composerChildren$,
      topAreaChildren$,
      editorWrappers$,
      placeholder$,
      bottomAreaChildren$
    )
  return (
    <>
      {topAreaChildren.map((Child, index) => (
        <Child key={index} />
      ))}
      <RenderRecursiveWrappers wrappers={editorWrappers}>
        <div className={classNames(styles.rootContentEditableWrapper, 'mdxeditor-root-contenteditable')}>
          <RichTextPlugin
            contentEditable={
              <div ref={onRef}>
                <ContentEditable
                  className={classNames(styles.contentEditable, contentEditableClassName)}
                  ariaLabel={t('contentArea.editableMarkdown', 'editable markdown')}
                  spellCheck={spellCheck}
                />
              </div>
            }
            placeholder={
              <div className={classNames(styles.contentEditable, styles.placeholder, contentEditableClassName)}>
                <p>{placeholder}</p>
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
      </RenderRecursiveWrappers>
      {composerChildren.map((Child, index) => (
        <Child key={index} />
      ))}
      {bottomAreaChildren.map((Child, index) => (
        <Child key={index} />
      ))}
    </>
  )
}

const DEFAULT_MARKDOWN_OPTIONS: ToMarkdownOptions = {
  listItemIndent: 'one'
}

const defaultIconComponentFor = (name: IconKey) => {
  return defaultSvgIcons[name]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function defaultTranslation(key: string, defaultValue: string, interpolations = {}) {
  let value = defaultValue
  for (const [k, v] of Object.entries(interpolations)) {
    value = value.replaceAll(`{{${k}}}`, String(v))
  }
  return value
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
  focus: (
    callbackFn?: () => void,
    opts?: {
      defaultSelection?: 'rootStart' | 'rootEnd'
      preventScroll?: boolean
    }
  ) => void

  /**
   * gets the underlying Lexical contentEditable HTML content
   */
  getContentEditableHTML: () => string

  /**
   * Gets the markdown representation of the current selection.
   * Returns an empty string if there is no selection, if selection is collapsed, or if editor is in source/diff mode.
   */
  getSelectionMarkdown: () => string
}

const RenderRecursiveWrappers: React.FC<{
  wrappers: React.ComponentType<{ children: React.ReactNode }>[]
  children: React.ReactNode
}> = ({ wrappers, children }) => {
  if (wrappers.length === 0) {
    return <>{children}</>
  }
  const Wrapper = wrappers[0]
  return (
    <Wrapper>
      <RenderRecursiveWrappers wrappers={wrappers.slice(1)}>{children}</RenderRecursiveWrappers>
    </Wrapper>
  )
}

const EditorRootElement: React.FC<{
  children: React.ReactNode
  className?: string
  overlayContainer?: HTMLElement | null
}> = ({ children, className, overlayContainer }) => {
  const editorRootElementRef = React.useRef<HTMLDivElement | null>(null)
  const wrapperElementRef = React.useRef<HTMLDivElement | null>(null)
  const setEditorRootElementRef = usePublisher(editorRootElementRef$)
  const setEditorWrapperElementRef = usePublisher(editorWrapperElementRef$)

  React.useEffect(() => {
    const popupContainer = document.createElement('div')
    popupContainer.classList.add(
      'mdxeditor-popup-container',
      styles.editorRoot,
      styles.popupContainer,
      ...(className ?? '').trim().split(' ').filter(Boolean)
    )
    const container = overlayContainer ?? document.body
    container.appendChild(popupContainer)
    editorRootElementRef.current = popupContainer
    setEditorRootElementRef(editorRootElementRef as React.RefObject<HTMLDivElement>)
    setEditorWrapperElementRef(wrapperElementRef as React.RefObject<HTMLDivElement>)
    return () => {
      popupContainer.remove()
    }
  }, [className, editorRootElementRef, overlayContainer, setEditorRootElementRef, setEditorWrapperElementRef])
  return (
    <div className={classNames('mdxeditor', styles.editorRoot, styles.editorWrapper, className)} ref={wrapperElementRef}>
      {children}
    </div>
  )
}

const Methods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const realm = useRealm()

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          const viewMode = realm.getValue(viewMode$)
          if (viewMode === 'source' || viewMode === 'diff') {
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
        focus: (
          callbackFn?: () => void,
          opts?: {
            defaultSelection?: 'rootStart' | 'rootEnd'
            preventScroll?: boolean
          }
        ) => {
          realm.getValue(rootEditor$)?.focus(callbackFn, opts)
        },
        getContentEditableHTML: () => {
          return realm.getValue(contentEditableRef$)?.current.innerHTML ?? ''
        },
        getSelectionMarkdown: () => {
          // Return empty string in source/diff mode
          const viewMode = realm.getValue(viewMode$)
          if (viewMode === 'source' || viewMode === 'diff') {
            return ''
          }

          // Use activeEditor$ for nested editor support
          const activeEditor = realm.getValue(activeEditor$)
          if (!activeEditor) {
            return ''
          }

          // Get all export parameters from realm
          const visitors = realm.getValue(exportVisitors$)
          const toMarkdownExtensions = realm.getValue(toMarkdownExtensions$)
          const toMarkdownOptions = realm.getValue(toMarkdownOptions$)
          const jsxComponentDescriptors = realm.getValue(jsxComponentDescriptors$)
          const jsxIsAvailable = realm.getValue(jsxIsAvailable$)

          return getSelectionAsMarkdown(activeEditor, {
            visitors,
            toMarkdownExtensions,
            toMarkdownOptions,
            jsxComponentDescriptors,
            jsxIsAvailable
          })
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
   * Controls the spellCheck value for the content editable element of the editor.
   * Defaults to true, use false to disable spell checking.
   */
  spellCheck?: boolean
  /**
   * The markdown to edit. Notice that this is read only when the component is mounted.
   * To change the component content dynamically, use the `MDXEditorMethods.setMarkdown` method.
   */
  markdown: string
  /**
   * Triggered when the editor value changes. The callback is not throttled, you can use any throttling mechanism
   * if you intend to do auto-saving.
   * @param initialMarkdownNormalize - set to true if the change is triggered when the initial markdown is set. This can happen due to variety of reasons - for example, additional whitespace, bullet symbols different than the configured ones, etc.
   */
  onChange?: (markdown: string, initialMarkdownNormalize: boolean) => void
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
   * The class name to apply to the root component element, including the toolbar and the popups. For styling the content editable area,  Use `contentEditableClassName` property.
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
   * Set to true if you want to suppress the processing of HTML tags.
   */
  suppressHtmlProcessing?: boolean
  /**
   * Pass your own translation function if you want to localize the editor.
   */
  translation?: Translation
  /**
   * Whether to apply trim() to the initial markdown input (default: true)
   */
  trim?: boolean

  /**
   * A custom lexical theme to use for the editor.
   */
  lexicalTheme?: EditorThemeClasses

  /**
   * Optional container element to use for rendering editor popups.
   * Defaults to document.body.
   */
  overlayContainer?: HTMLElement | null
  /**
   * Certain collaboration plugins require that the history is disabled for the editor.
   */
  suppressSharedHistory?: boolean
  /**
   * The initial state of the lexical editor. Pass null to disable any initiation.
   */
  editorState?: EditorState | undefined | null

  /**
   * Additional lexical nodes to include in the editor.
   */
  additionalLexicalNodes?: AdditionalLexicalNode[]

  /**
   * The lexical editor namespace.
   */
  lexicalEditorNamespace?: string
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
          spellCheck: props.spellCheck ?? true,
          initialMarkdown: props.markdown,
          onChange: props.onChange ?? noop,
          onBlur: props.onBlur ?? noop,
          toMarkdownOptions: props.toMarkdownOptions ?? DEFAULT_MARKDOWN_OPTIONS,
          autoFocus: props.autoFocus ?? false,
          placeholder: props.placeholder ?? '',
          readOnly: Boolean(props.readOnly),
          iconComponentFor: props.iconComponentFor ?? defaultIconComponentFor,
          suppressHtmlProcessing: props.suppressHtmlProcessing ?? false,
          onError: props.onError ?? noop,
          translation: props.translation ?? defaultTranslation,
          trim: props.trim ?? true,
          lexicalTheme: props.lexicalTheme,
          ...('editorState' in props ? { editorState: props.editorState } : {}),
          suppressSharedHistory: props.suppressSharedHistory ?? false,
          additionalLexicalNodes: props.additionalLexicalNodes ?? [],
          lexicalEditorNamespace: props.lexicalEditorNamespace ?? 'MDXEditor'
        }),
        ...(props.plugins ?? [])
      ]}
    >
      <EditorRootElement className={props.className} overlayContainer={props.overlayContainer}>
        <LexicalProvider>
          <RichTextEditor />
        </LexicalProvider>
      </EditorRootElement>
      <Methods mdxRef={ref} />
    </RealmWithPlugins>
  )
})
