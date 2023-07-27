/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary'
// TODO: add this to the thematic break plugin
import { HorizontalRulePlugin } from '@lexical/react/LexicalHorizontalRulePlugin'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import classNames from 'classnames'
import React from 'react'
import { theme as contentTheme } from '../content/theme'
import { EditorSystemComponent, useEmitterValues, usePublisher } from '../system/EditorSystemComponent'
import { ViewMode } from '../types/ViewMode'
import { PatchedMarkdownShortcutPlugin } from './MarkdownShortcutPlugin'
import { ViewModeToggler } from './SourcePlugin'
import { ToolbarPlugin } from './ToolbarPlugin'
import {
  BlockTypeSelect,
  BoldItalicUnderlineButtons,
  CodeBlockButton,
  CodeFormattingButton,
  FrontmatterButton,
  HorizontalRuleButton,
  ImageButton,
  LinkButton,
  ListButtons,
  SandpackButton,
  TableButton,
  ToolbarSeparator
} from './ToolbarPlugin/toolbarComponents'
import styles from './styles.module.css'
import { SandpackConfig } from '../plugins/sandpack/realmPlugin'
import { JsxComponentDescriptor } from '../plugins/jsx/realmPlugin'

/**
 * The properties of the {@link MDXEditor} react component
 */
export interface MDXEditorProps {
  /**
   * The markdown content to be edited.
   * Notice: this is the initial value of the editor.
   * If you want to change the value of the editor, use the `setMarkdown` method.
   */
  markdown: string
  /**
   * The configuration for the sandpack editor that's used for the fenced code blocks.
   * @see the {@link SandpackConfig} interface for more details.
   */
  sandpackConfig?: SandpackConfig
  /**
   * The markdown content to use for the diff view mode. If not provided, the contents of the `markdown` prop will be used.
   */
  headMarkdown?: string
  /**
   * The configuration for the JSX components used in the markdown content.
   * @see the {@link JsxComponentDescriptor} interface for more details.
   */
  jsxComponentDescriptors?: JsxComponentDescriptor[]
  /**
   * The list of suggestions to be shown in the link autocomplete dialog dropdown.
   */
  linkAutocompleteSuggestions?: string[]
  /**
   * The list of suggestions to be shown in the image autocomplete dialog dropdown.
   */
  imageAutoCompleteSuggestions?: string[]
  /**
   * The set of components to be rendered in the toolbar.
   */
  toolbarComponents?: React.ComponentType[]
  /**
   * The initial view mode for the editor. Defaults to `ViewMode.editor`.
   */
  viewMode?: ViewMode
  /**
   * Triggered when the markdown content changes.
   */
  onChange?: (markdown: string) => void
  /**
   * The CSS class name to be applied to the wrapper element of the component.
   */
  className?: string
  /**
   * The CSS class name to be applied to the content editable element.
   */
  contentEditableClassName?: string
  /**
   * The options to be used when parsing the markdown content.
   * @see the {@link MarkdownParseOptions} interface for more details.
   */
  markdownParseOptions?: never
  /**
   * The {@link https://lexical.dev/ | Lexical nodes} used by the editor.
   */
  lexicalNodes?: never
  /**
   * The options used when converting the lexical tree to markdown.
   * @see the {@link LexicalConvertOptions} interface for more details.
   */
  lexicalConvertOptions?: never
  /**
   * The supported code block languages.
   */
  codeBlockLanguages?: Record<string, string>
  /**
   * Implement this so that users can drag and drop or paste images into the editor.
   * Pass an implementation that takes a file as an argument, and returns Promise<string>, where string is the url of the image to be inserted.
   * @example
   * ```
   *async function imageUploadHandler(image: File) {
   *  const formData = new FormData()
   *  formData.append('image', image)
   *  const response = await fetch('/uploads/new', { method: 'POST', body: formData })
   *  const json = (await response.json()) as { url: string }
   *  return json.url
   *}
   * ```
   */
  imageUploadHandler?: (image: File) => Promise<string>
  customLeafDirectiveEditors?: never
}

const defaultToolbarComponents = [
  BoldItalicUnderlineButtons,
  ToolbarSeparator,

  CodeFormattingButton,
  ToolbarSeparator,

  ListButtons,
  ToolbarSeparator,
  BlockTypeSelect,
  ToolbarSeparator,
  LinkButton,
  ImageButton,
  TableButton,
  HorizontalRuleButton,
  FrontmatterButton,

  ToolbarSeparator,

  CodeBlockButton,
  SandpackButton
]

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

/**
 * The MDXEditor React component. See {@link MDXEditorProps} for the list of available props and the {@link MDXEditorMethods} for the methods exposed through the ref.
 */
export const MDXEditor = React.forwardRef<MDXEditorMethods, MDXEditorProps>(
  (
    {
      markdown,
      headMarkdown,
      onChange,
      viewMode,
      linkAutocompleteSuggestions,
      imageAutoCompleteSuggestions,
      className,
      contentEditableClassName,
      toolbarComponents = defaultToolbarComponents,
      imageUploadHandler,
      customLeafDirectiveEditors = []
    },
    ref
  ) => {
    const editorRootElementRef = React.useRef<HTMLDivElement>(null)
    return (
      <div className={classNames(styles.editorRoot, styles.editorWrapper, className)} ref={editorRootElementRef}>
        <LexicalComposer
          initialConfig={{
            namespace: 'MDXEditor',
            theme: contentTheme,
            onError: (error: Error) => {
              throw error
            }
          }}
        >
          <EditorSystemComponent
            markdownSource={markdown}
            headMarkdown={headMarkdown || markdown}
            //sandpackConfig={sandpackConfig}
            onChange={onChange}
            viewMode={viewMode}
            linkAutocompleteSuggestions={linkAutocompleteSuggestions}
            imageAutocompleteSuggestions={imageAutoCompleteSuggestions}
            editorRootElementRef={editorRootElementRef as any}
            toolbarComponents={toolbarComponents}
            imageUploadHandler={imageUploadHandler}
            customLeafDirectiveEditors={customLeafDirectiveEditors}
          >
            <ToolbarPlugin />
            <ViewModeToggler>
              <RichTextPlugin
                contentEditable={<ContentEditable className={classNames(styles.contentEditable, contentEditableClassName)} />}
                placeholder={<div></div>}
                ErrorBoundary={LexicalErrorBoundary}
              />
            </ViewModeToggler>
            <HorizontalRulePlugin />
            <PatchedMarkdownShortcutPlugin />
            <MDXMethods mdxRef={ref} />
          </EditorSystemComponent>
        </LexicalComposer>
      </div>
    )
  }
)

const MDXMethods: React.FC<{ mdxRef: React.ForwardedRef<MDXEditorMethods> }> = ({ mdxRef }) => {
  const [markdownSource] = useEmitterValues('markdownSource')
  const setMarkdown = usePublisher('setMarkdown')

  React.useImperativeHandle(
    mdxRef,
    () => {
      return {
        getMarkdown: () => {
          return markdownSource
        },
        setMarkdown
      }
    },
    [markdownSource, setMarkdown]
  )
  return null
}
