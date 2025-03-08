import { useCellValue, useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'
import React from 'react'
import { RealmPlugin, RealmWithPlugins } from './RealmWithPlugins'
import {
  Translation,
  composerChildren$,
  contentEditableClassName$,
  spellCheck$,
  corePlugin,
  editorRootElementRef$,
  editorWrappers$,
  insertMarkdown$,
  markdown$,
  markdownSourceEditorValue$,
  placeholder$,
  rootEditor$,
  setMarkdown$,
  topAreaChildren$,
  useTranslation,
  viewMode$,
  contentEditableRef$
} from './plugins/core'

import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import classNames from 'classnames'
import { ToMarkdownOptions } from './exportMarkdownFromLexical'
import { lexicalTheme } from './styles/lexicalTheme'
import styles from './styles/ui.module.css'
import { noop } from './utils/fp'
import { createLexicalComposerContext, LexicalComposerContext, LexicalComposerContextType } from '@lexical/react/LexicalComposerContext'
import { EditorThemeClasses, LexicalEditor } from 'lexical'
import { IconKey, defaultSvgIcons } from './defaultSvgIcons'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'

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
  const onRef = (_contentEditableRef: HTMLDivElement) => {
    setContentEditableRef({ current: _contentEditableRef })
  }

  const [contentEditableClassName, spellCheck, composerChildren, topAreaChildren, editorWrappers, placeholder] = useCellValues(
    contentEditableClassName$,
    spellCheck$,
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
    callbackFn?: (() => void) | undefined,
    opts?: {
      defaultSelection?: 'rootStart' | 'rootEnd'
      preventScroll?: boolean
    }
  ) => void
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
}> = ({ children, className }) => {
  const editorRootElementRef = React.useRef<HTMLDivElement | null>(null)
  const setEditorRootElementRef = usePublisher(editorRootElementRef$)

  React.useEffect(() => {
    const popupContainer = document.createElement('div')
    popupContainer.classList.add(
      'mdxeditor-popup-container',
      styles.editorRoot,
      styles.popupContainer,
      ...(className ?? '').trim().split(' ').filter(Boolean)
    )
    document.body.appendChild(popupContainer)
    editorRootElementRef.current = popupContainer
    setEditorRootElementRef(editorRootElementRef)
    return () => {
      popupContainer.remove()
    }
  }, [className, editorRootElementRef, setEditorRootElementRef])
  return <div className={classNames('mdxeditor', styles.editorRoot, styles.editorWrapper, className)}>{children}</div>
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
        focus: (
          callbackFn?: (() => void) | undefined,
          opts?: {
            defaultSelection?: 'rootStart' | 'rootEnd'
            preventScroll?: boolean
          }
        ) => {
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
          lexicalTheme: props.lexicalTheme
        }),
        ...(props.plugins ?? [])
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
