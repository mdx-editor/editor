import * as Mdast from 'mdast'
import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'

/**
 * Determines wether the given node is a JSX node.
 * @group JSX
 */
export function isMdastJsxNode(node: Mdast.Nodes): node is MdastJsx {
  return node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement'
}

/**
 * An MDX JSX MDAST node.
 * @group JSX
 */
export type MdastJsx = MdxJsxTextElement | MdxJsxFlowElement

export interface JsxComponentDescriptor {
  /**
   * The tag name. For example: 'div', 'span', 'MyComponent'.
   * Note: For fragments, use null.
   */
  name: string | null
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

export interface JsxPropertyDescriptor {
  /**
   * The name of the property
   */
  name: string
  /**
   * The type of the property
   */
  type: 'string' | 'number' | 'expression'
  /**
   * Wether the property is required
   */
  required?: boolean
}

export interface JsxEditorProps {
  /** The MDAST node to edit */
  mdastNode: MdxJsxTextElement | MdxJsxFlowElement
  /** The descriptor that activated the editor */
  descriptor: JsxComponentDescriptor
}
