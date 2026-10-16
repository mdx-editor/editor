/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  $addUpdateTag,
  $getNodeByKey,
  $getRoot,
  BLUR_COMMAND,
  FOCUS_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_HIGH,
  DecoratorNode,
  EditorConfig,
  KEY_BACKSPACE_COMMAND,
  LexicalEditor,
  LexicalEditorWithDispose,
  SELECTION_CHANGE_COMMAND,
  COMMAND_PRIORITY_LOW
} from 'lexical'
import * as Mdast from 'mdast'
import { Node } from 'unist'
import React from 'react'
import {
  NESTED_EDITOR_UPDATED_COMMAND,
  codeBlockEditorDescriptors$,
  defaultCodeBlockLanguage$,
  directiveDescriptors$,
  editorInFocus$,
  exportVisitors$,
  importVisitors$,
  jsxComponentDescriptors$,
  jsxIsAvailable$,
  lexicalTheme$,
  nestedEditorChildren$,
  rootEditor$,
  historyState$,
  usedLexicalNodes$
} from '.'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { LexicalExtensionEditorComposer } from '@lexical/react/LexicalExtensionEditorComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import classNames from 'classnames'
import { exportLexicalTreeToMdast } from '../../exportMarkdownFromLexical'
import { importMdastTreeToLexical } from '../../importMarkdownToLexical'
import styles from '../../styles/ui.module.css'
import { mergeRegister } from '@lexical/utils'
import { VoidEmitter } from '../../utils/voidEmitter'
import { isPartOftheEditorUI } from '../../utils/isPartOftheEditorUI'
import { isMdastEqualIgnoringPositions } from '../../utils/mdastEquality'
import { useCellValues, usePublisher, useRealm } from '@mdxeditor/gurx'
import { DirectiveNode } from '../directives'
import { LexicalJsxNode } from '../jsx/LexicalJsxNode'
import { createExtensionEditor, editorHasSharedHistory } from './lexicalExtensions'

/**
 * The value of the {@link NestedEditorsContext} React context.
 * @group Custom Editor Primitives
 */
export interface NestedEditorsContextValue<T extends Node> {
  /**
   * The parent lexical editor
   */
  parentEditor: LexicalEditor
  /**
   * The parent editor config
   */
  config: EditorConfig
  /**
   * The mdast node that is being edited
   */
  mdastNode: T
  /**
   * The lexical node that is being edited
   */
  lexicalNode: DecoratorNode<any> & {
    /**
     * Use this method to update the mdast node. This will also update the mdast tree of the parent editor.
     */
    setMdastNode: (mdastNode: any) => void
  }
  /**
   * Subscribe to the emitter and implement the logic to focus the custom editor.
   */
  focusEmitter: VoidEmitter
}

/**
 * Use this context to provide the necessary values to the {@link NestedLexicalEditor} React component.
 * Place it as a wrapper in your custom lexical node decorators.
 * @group Custom Editor Primitives
 */
export const NestedEditorsContext = React.createContext<NestedEditorsContextValue<Node> | undefined>(undefined)

/**
 * A hook to get the current {@link NestedEditorsContext} value. Use this in your custom editor components.
 * @group Custom Editor Primitives
 */
export function useNestedEditorContext<T extends Mdast.RootContent>() {
  const context = React.useContext(NestedEditorsContext) as NestedEditorsContextValue<T> | undefined
  if (!context) {
    throw new Error('useNestedEditor must be used within a NestedEditorsProvider')
  }
  return context
}

/**
 * A hook that returns a function that can be used to update the mdast node. Use this in your custom editor components.
 * @group Custom Editor Primitives
 */
export function useMdastNodeUpdater<T extends Mdast.RootContent>() {
  const { parentEditor, mdastNode, lexicalNode } = useNestedEditorContext<T>()

  return function updateMdastNode(node: Partial<T>) {
    parentEditor.update(
      () => {
        $addUpdateTag('history-push')
        const currentNode = $getNodeByKey(lexicalNode.getKey()) as DirectiveNode | LexicalJsxNode | null
        if (currentNode) {
          currentNode.setMdastNode({ ...mdastNode, ...node } as any)
        }
      },
      { discrete: true }
    )
    parentEditor.dispatchCommand(NESTED_EDITOR_UPDATED_COMMAND, undefined)
  }
}

/**
 * A hook that returns a function that removes the lexical node from the editor.
 * @group Custom Editor Primitives
 */
export function useLexicalNodeRemove() {
  const { parentEditor, lexicalNode } = useNestedEditorContext()

  return () => {
    parentEditor.update(() => {
      const node = $getNodeByKey(lexicalNode.getKey())
      node!.selectNext()
      node!.remove()
    })
  }
}

/**
 * A nested editor React component that allows editing of the contents of complex markdown nodes that have nested markdown content (for example, custom directives or JSX elements).
 *
 * @example
 * You can use a type param to specify the type of the mdast node
 *
 * ```tsx
 *
 * interface CalloutDirectiveNode extends LeafDirective {
 *   name: 'callout'
 *   children: Mdast.PhrasingContent[]
 * }
 *
 * return <NestedLexicalEditor<CalloutDirectiveNode> getContent={node => node.children} getUpdatedMdastNode={(node, children) => ({ ...node, children })} />
 * ```
 * @group Custom Editor Primitives
 */
export const NestedLexicalEditor = function <T extends Mdast.RootContent>(props: {
  /**
   * A function that returns the phrasing content of the mdast node. In most cases, this will be the `children` property of the mdast node, but you can also have multiple nested nodes with their own children.
   */
  getContent: (mdastNode: T) => Mdast.RootContent[]

  /**
   * A function that should return the updated mdast node based on the original mdast node and the new content (serialized as mdast tree) produced by the editor.
   */
  getUpdatedMdastNode: (mdastNode: T, children: Mdast.RootContent[]) => T

  /**
   * Props passed to the {@link https://github.com/facebook/lexical/blob/main/packages/lexical-react/src/LexicalContentEditable.tsx | ContentEditable} component.
   */
  contentEditableProps?: React.ComponentProps<typeof ContentEditable>

  /**
   * Whether or not the editor edits blocks (multiple paragraphs)
   */
  block?: boolean
}) {
  const { getContent, getUpdatedMdastNode, contentEditableProps, block = false } = props
  const { parentEditor, mdastNode, lexicalNode, focusEmitter } = useNestedEditorContext<T>()
  const updateMdastNode = useMdastNodeUpdater<T>()
  const removeNode = useLexicalNodeRemove()
  const content = getContent(mdastNode)
  const realm = useRealm()

  const [
    rootEditor,
    importVisitors,
    exportVisitors,
    usedLexicalNodes,
    jsxComponentDescriptors,
    directiveDescriptors,
    codeBlockEditorDescriptors,
    defaultCodeBlockLanguage,
    jsxIsAvailable,
    nestedEditorChildren,
    lexicalTheme
  ] = useCellValues(
    rootEditor$,
    importVisitors$,
    exportVisitors$,
    usedLexicalNodes$,
    jsxComponentDescriptors$,
    directiveDescriptors$,
    codeBlockEditorDescriptors$,
    defaultCodeBlockLanguage$,
    jsxIsAvailable$,
    nestedEditorChildren$,
    lexicalTheme$
  )

  const setEditorInFocus = usePublisher(editorInFocus$)

  const [editor, setEditor] = React.useState<LexicalEditorWithDispose | null>(null)

  React.useEffect(() => {
    if (!rootEditor) {
      return
    }
    const editor = createExtensionEditor({
      name: '@mdxeditor/nested',
      nodes: usedLexicalNodes,
      theme: lexicalTheme,
      namespace: 'NestedEditor',
      parentEditor,
      historyMode: editorHasSharedHistory(rootEditor) ? 'nested-shared' : 'nested-external',
      historyState: realm.getValue(historyState$),
      initialEditorState: () => {
        let theContent: Mdast.PhrasingContent[] | Mdast.RootContent[] = content
        if (block) {
          if (theContent.length === 0) {
            theContent = [{ type: 'paragraph', children: [] }]
          }
        } else {
          theContent = [{ type: 'paragraph', children: content as Mdast.PhrasingContent[] }]
        }

        importMdastTreeToLexical({
          root: $getRoot(),
          mdastRoot: {
            type: 'root',
            children: theContent
          },
          visitors: importVisitors,
          directiveDescriptors,
          codeBlockEditorDescriptors,
          defaultCodeBlockLanguage,
          jsxComponentDescriptors
        })
      }
    })
    setEditor(editor)
    return () => {
      editor.dispose()
    }
    // The editor owns the complete mount-time plugin/configuration snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  React.useEffect(() => {
    if (!editor) {
      return
    }
    focusEmitter.subscribe(() => {
      editor.focus()
    })
    return () => {
      focusEmitter.subscribe(() => undefined)
    }
  }, [editor, focusEmitter])

  React.useEffect(() => {
    if (!editor) {
      return
    }
    function updateParentNode() {
      editor!.getEditorState().read(() => {
        const mdast = exportLexicalTreeToMdast({
          root: $getRoot(),
          visitors: exportVisitors,
          jsxComponentDescriptors,
          jsxIsAvailable,
          addImportStatements: false
        })
        const content: Mdast.RootContent[] = block ? mdast.children : (mdast.children[0] as Mdast.Paragraph)!.children
        const updatedMdastNode = getUpdatedMdastNode(structuredClone(mdastNode) as any, content as any)
        const currentMdastNode = parentEditor.getEditorState().read(() => {
          return ($getNodeByKey(lexicalNode.getKey()) as DirectiveNode | LexicalJsxNode | null)?.getMdastNode()
        })
        // Blur and view mode switches save unconditionally. Rewriting an
        // unchanged node would push an extra root Undo step.
        if (isMdastEqualIgnoringPositions(currentMdastNode, updatedMdastNode)) {
          return
        }
        updateMdastNode(updatedMdastNode)
      })
    }

    return mergeRegister(
      editor.registerCommand(
        FOCUS_COMMAND,
        () => {
          setEditorInFocus({ editorType: 'lexical', rootNode: lexicalNode, editorRef: editor })
          return false
        },
        COMMAND_PRIORITY_LOW
      ),
      editor.registerCommand(
        BLUR_COMMAND,
        (payload) => {
          const relatedTarget = payload.relatedTarget as HTMLElement | null
          if (isPartOftheEditorUI(relatedTarget, rootEditor!.getRootElement()!)) {
            return false
          }
          updateParentNode()
          setEditorInFocus(null)
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      // triggered by codemirror
      editor.registerCommand(
        NESTED_EDITOR_UPDATED_COMMAND,
        () => {
          updateParentNode()
          return true
        },
        COMMAND_PRIORITY_EDITOR
      ),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          setEditorInFocus({ editorType: 'lexical', rootNode: lexicalNode, editorRef: editor })
          return false
        },
        COMMAND_PRIORITY_HIGH
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        (_, editor) => {
          const editorElement = editor.getRootElement()
          // the innerText here is actually the text before backspace takes effect.
          if (editorElement?.innerText === '\n') {
            removeNode()
            return true
          }
          return false
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [
    block,
    editor,
    exportVisitors,
    getUpdatedMdastNode,
    jsxComponentDescriptors,
    jsxIsAvailable,
    lexicalNode,
    mdastNode,
    parentEditor,
    removeNode,
    setEditorInFocus,
    updateMdastNode,
    rootEditor
  ])

  if (!editor) {
    return null
  }

  return (
    <LexicalExtensionEditorComposer initialEditor={editor}>
      <RichTextPlugin
        contentEditable={
          <ContentEditable {...contentEditableProps} className={classNames(styles.nestedEditor, contentEditableProps?.className)} />
        }
        placeholder={null}
        ErrorBoundary={LexicalErrorBoundary}
      />
      {nestedEditorChildren.map((Child, index) => (
        <Child key={index} />
      ))}
    </LexicalExtensionEditorComposer>
  )
}
