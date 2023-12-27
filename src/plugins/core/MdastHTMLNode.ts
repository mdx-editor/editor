import * as Mdast from 'mdast'
import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'

/**
 * A block-level HTML node.
 * @group HTML
 */
export interface MdastBlockHTMLNode extends MdxJsxFlowElement {
  /**
   * the tag name of the node
   */
  name: (typeof htmlTags)[number]
}

/**
 * An inline HTML node.
 * @group HTML
 */
export interface MdastInlineHTMLNode extends MdxJsxTextElement {
  /**
   * the tag name of the node
   */
  name: (typeof htmlTags)[number]
}

/**
 * A HTML MDAST node.
 * @group HTML
 */
export type MdastHTMLNode = MdastBlockHTMLNode | MdastInlineHTMLNode

const MDX_NODE_TYPES = ['mdxJsxTextElement', 'mdxJsxFlowElement'] as const

/**
 * The MDAST jsx distinction value used to differentiate inline and block level elements.
 * @group HTML
 */
export type MdxNodeType = MdastHTMLNode['type']

/**
 * Determines if the given node is a HTML MDAST node.
 * @group HTML
 */
export function isMdastHTMLNode(node: Mdast.Parent | Mdast.Content | Mdast.Root): node is MdastHTMLNode {
  return (
    MDX_NODE_TYPES.includes(node.type as unknown as MdxNodeType) &&
    (htmlTags as readonly string[]).includes((node as MdastHTMLNode).name?.toLowerCase() ?? '')
  )
}

/**
 * All the HTML tags supported by the generic html node.
 * @group HTML
 */
export const htmlTags = [
  'a',
  'abbr',
  'address',
  'area',
  'article',
  'aside',
  'audio',
  'b',
  'base',
  'bdi',
  'bdo',
  'blockquote',
  'body',
  'br',
  'button',
  'canvas',
  'caption',
  'cite',
  'code',
  'col',
  'colgroup',
  'data',
  'datalist',
  'dd',
  'del',
  'details',
  'dfn',
  'dialog',
  'div',
  'dl',
  'dt',
  'em',
  'embed',
  'fieldset',
  'figcaption',
  'figure',
  'footer',
  'form',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'head',
  'header',
  'hgroup',
  'hr',
  'html',
  'i',
  'iframe',
  // 'img',
  'input',
  'ins',
  'kbd',
  'label',
  'legend',
  'li',
  'link',
  'main',
  'map',
  'mark',
  'meta',
  'meter',
  'nav',
  'noscript',
  'object',
  'ol',
  'optgroup',
  'option',
  'output',
  'p',
  'param',
  'picture',
  'pre',
  'progress',
  'q',
  'rp',
  'rt',
  'ruby',
  's',
  'samp',
  'script',
  'section',
  'select',
  'small',
  'source',
  'span',
  'strong',
  'style',
  'sub',
  'summary',
  'sup',
  'table',
  'tbody',
  'td',
  'template',
  'textarea',
  'tfoot',
  'th',
  'thead',
  'time',
  'title',
  'tr',
  'track',
  'u',
  'ul',
  'var',
  'video',
  'wbr'
] as const
