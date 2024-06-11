import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { mdxjs } from 'micromark-extension-mdxjs'
import {
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addMdastExtension$,
  addSyntaxExtension$,
  addToMarkdownExtension$,
  insertDecoratorNode$,
  jsxComponentDescriptors$,
  jsxIsAvailable$
} from '../core'
import { $createLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'
import * as Mdast from 'mdast'
import { Signal, map } from '@mdxeditor/gurx'
import { realmPlugin } from '../../RealmWithPlugins'
import { MdastMdxExpressionVisitor } from './MdastMdxExpressionVisitor'
import { LexicalMdxExpressionNode } from './LexicalMdxExpressionNode'
import { LexicalMdxExpressionVisitor } from './LexicalMdxExpressionVisitor'
import { GenericJsxEditor } from '../../jsx-editors/GenericJsxEditor'
import { JsxComponentDescriptor } from './utils'
import { MdastJsx } from './utils'

/**
 * Determines wether the given node is a JSX node.
 * @group JSX
 */
export function isMdastJsxNode(node: Mdast.Nodes): node is MdastJsx {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

/**
 * @group JSX
 */
export interface ExpressionValue {
  type: 'expression'
  value: string
}

const isExpressionValue = (value: string | ExpressionValue | null): value is ExpressionValue => {
  if (value !== null && typeof value === 'object' && 'type' in value && 'value' in value && typeof value.value === 'string') {
    return true
  }

  return false
}

export type JsxProperties = Record<string, string | ExpressionValue>

const toMdastJsxAttributes = (attributes: JsxProperties) =>
  Object.entries(attributes).map(
    ([name, value]) =>
      ({
        type: 'mdxJsxAttribute',
        name,
        value: isExpressionValue(value) ? { type: 'mdxJsxAttributeValueExpression', value: value.value } : value
      }) satisfies MdastJsx['attributes'][number]
  )

/**
 * A signal that inserts a new JSX node with the published payload.
 * @group JSX
 */
export const insertJsx$ = Signal<
  | {
      kind: 'text'
      name: string
      props: JsxProperties
      children?: MdxJsxTextElement['children']
    }
  | {
      kind: 'flow'
      name: string
      props: JsxProperties
      children?: MdxJsxFlowElement['children']
    }
>((r) => {
  r.link(
    r.pipe(
      insertJsx$,
      map(({ kind, name, children, props }) => {
        return () => {
          const attributes = toMdastJsxAttributes(props)

          if (kind === 'flow') {
            return $createLexicalJsxNode({
              type: 'mdxJsxFlowElement',
              name,
              children: children ?? [],
              attributes
            })
          } else {
            return $createLexicalJsxNode({
              type: 'mdxJsxTextElement',
              name,
              children: children ?? [],
              attributes
            })
          }
        }
      })
    ),
    insertDecoratorNode$
  )
})

/**
 * @group JSX
 */
export interface JsxPluginParams {
  /**
   * A set of descriptors that document the JSX elements used in the document.
   */
  jsxComponentDescriptors: JsxComponentDescriptor[]
  /**
   * Wether or not to allow default React fragments <></> processing in MDX.
   */
  allowFragment?: boolean
}

const fragmentDescriptor = {
  name: null,
  kind: 'flow',
  props: [],
  hasChildren: true,
  Editor: GenericJsxEditor
} satisfies JsxComponentDescriptor

const getDescriptors = (params?: JsxPluginParams) => {
  if (params) {
    if (params.allowFragment ?? true) {
      return [fragmentDescriptor, ...params.jsxComponentDescriptors]
    }

    return params.jsxComponentDescriptors
  }

  return [fragmentDescriptor]
}

/**
 * a plugin that adds support for JSX elements (MDX).
 * @group JSX
 */
export const jsxPlugin = realmPlugin<JsxPluginParams>({
  init: (realm, params) => {
    realm.pubIn({
      // import
      [jsxIsAvailable$]: true,
      [addMdastExtension$]: mdxFromMarkdown(),
      [addSyntaxExtension$]: mdxjs(),
      [addImportVisitor$]: [MdastMdxJsxElementVisitor, MdastMdxJsEsmVisitor, MdastMdxExpressionVisitor],

      // export
      [addLexicalNode$]: [LexicalJsxNode, LexicalMdxExpressionNode],
      [addExportVisitor$]: [LexicalJsxVisitor, LexicalMdxExpressionVisitor],
      [addToMarkdownExtension$]: mdxToMarkdown(),
      [jsxComponentDescriptors$]: getDescriptors(params)
    })
  },

  update(realm, params) {
    realm.pub(jsxComponentDescriptors$, getDescriptors(params))
  }
})
