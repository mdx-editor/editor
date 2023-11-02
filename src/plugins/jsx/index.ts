import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { mdxjs } from 'micromark-extension-mdxjs'
import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { $createLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'

/**
 * @internal
 */
export type MdastJsx = MdxJsxTextElement | MdxJsxFlowElement

/**
 * Defines the structure of a JSX component property.
 */
export interface JsxPropertyDescriptor {
  /**
   * The name of the property
   */
  name: string
  /**
   * The type of the property
   */
  type: 'string' | 'number'
  /**
   * Wether the property is required
   */
  required?: boolean
}

/**
 * Defines the structure of a JSX component that can be used within the markdown document.
 */
export interface JsxComponentDescriptor {
  /**
   * The tag name
   */
  name: string
  /**
   * Wether the component is a flow or text component (inline or block)
   */
  kind: 'flow' | 'text'
  /**
   * The module path from which the component can be imported
   * Omit to skip injecting an import statement
   */
  source?: string
  /**
   * Wether the component is the default export of the module
   */
  defaultExport?: boolean
  /**
   * The properties that can be applied to the component
   */
  props: JsxPropertyDescriptor[]
  /**
   * Wether or not the component has children
   */
  hasChildren?: boolean

  /**
   * The editor to use for editing the component
   */
  Editor: React.ComponentType<JsxEditorProps>
}

/**
 * The properties passed to a JSX Editor component.
 */
export interface JsxEditorProps {
  /** The MDAST node to edit */
  mdastNode: MdastJsx
  descriptor: JsxComponentDescriptor
}

type JsxTextPayload = {
  kind: 'text'
  name: string
  props: Record<string, string>
  children?: MdxJsxTextElement['children']
}

type JsxFlowPayload = {
  kind: 'flow'
  name: string
  props: Record<string, string>
  children?: MdxJsxFlowElement['children']
}

type InsertJsxPayload = JsxTextPayload | JsxFlowPayload

function toMdastJsxAttributes(attributes: Record<string, string>): MdastJsx['attributes'] {
  return Object.entries(attributes).map(([name, value]) => ({
    type: 'mdxJsxAttribute',
    name,
    value
  }))
}

/** @internal */
export const jsxSystem = system(
  (r, [{ insertDecoratorNode }]) => {
    const insertJsx = r.node<InsertJsxPayload>()

    r.link(
      r.pipe(
        insertJsx,
        r.o.map(({ kind, name, children, props }) => {
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
      insertDecoratorNode
    )

    return {
      insertJsx
    }
  },
  [coreSystem]
)

/**
 * The parameters of the `jsxPlugin`.
 */
export interface JsxPluginParams {
  /**
   * A set of descriptors that document the JSX elements used in the document.
   */
  jsxComponentDescriptors: JsxComponentDescriptor[]
}

export const [
  /** @internal */
  jsxPlugin,
  /** @internal */
  jsxPluginHooks
] = realmPlugin({
  id: 'jsx',
  systemSpec: jsxSystem,
  applyParamsToSystem: (realm, params: JsxPluginParams) => {
    realm.pubKey('jsxComponentDescriptors', params?.jsxComponentDescriptors || [])
  },

  init: (realm, _: JsxPluginParams) => {
    realm.pubKey('jsxIsAvailable', true)

    // import
    realm.pubKey('addMdastExtension', mdxFromMarkdown())
    realm.pubKey('addSyntaxExtension', mdxjs())
    realm.pubKey('addImportVisitor', MdastMdxJsxElementVisitor)
    realm.pubKey('addImportVisitor', MdastMdxJsEsmVisitor)

    // export
    realm.pubKey('addLexicalNode', LexicalJsxNode)
    realm.pubKey('addExportVisitor', LexicalJsxVisitor)
    realm.pubKey('addToMarkdownExtension', mdxToMarkdown())
  }
})
