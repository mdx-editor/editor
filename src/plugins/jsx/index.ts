import { mdxFromMarkdown, mdxToMarkdown } from 'mdast-util-mdx'
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { mdxjs } from 'micromark-extension-mdxjs'
import React from 'react'
import { realmPlugin, system } from '../../gurx'
import { coreSystem } from '../core'
import { LexicalJsxNode } from './LexicalJsxNode'
import { LexicalJsxVisitor } from './LexicalJsxVisitor'
import { MdastMdxJsEsmVisitor } from './MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from './MdastMdxJsxElementVisitor'

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
   */
  source: string
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

export const jsxSystem = system((_) => ({}), [coreSystem])

export interface JsxPluginParams {
  jsxComponentDescriptors: JsxComponentDescriptor[]
}

export const [jsxPlugin, jsxPluginHooks] = realmPlugin({
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
