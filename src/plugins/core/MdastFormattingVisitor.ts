import * as Mdast from 'mdast'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { IS_BOLD, IS_HIGHLIGHT, IS_ITALIC, IS_STRIKETHROUGH, IS_SUBSCRIPT, IS_SUPERSCRIPT, IS_UNDERLINE } from '../../FormatConstants'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

type JsxNodeName = 'u' | 's' | 'sub' | 'sup' | 'mark'

interface OpeningJsxNode extends Mdast.HTML {
  type: 'html'
  value: `<${JsxNodeName}>`
}

interface ClosingJsxNode extends Mdast.HTML {
  type: 'html'
  value: `</${JsxNodeName}>`
}

interface JsxNode extends MdxJsxTextElement {
  type: 'mdxJsxTextElement'
  name: JsxNodeName
}

function isOpeningJsxNode(node: Mdast.Content, jsxName: JsxNodeName): node is OpeningJsxNode {
  return node.type === 'html' && node.value === `<${jsxName}>`
}

function isClosingJsxNode(node: Mdast.Content, jsxName: JsxNodeName): node is ClosingJsxNode {
  return node.type === 'html' && node.value === `</${jsxName}>`
}

function isJsxNode(node: Mdast.Content, jsxName: JsxNodeName): node is JsxNode {
  return node.type === 'mdxJsxTextElement' && node.name === jsxName
}

// TODO - Figure out why opening / closing / basic is different and try to merge them

// TODO - Create a better name and return type
function isNode_JsxOrOpeningOrClosing(node: Mdast.Content, jsxName: JsxNodeName): node is JsxNode {
  return isJsxNode(node, jsxName) || isOpeningJsxNode(node, jsxName) || isClosingJsxNode(node, jsxName)
}

// TODO - Reduce the below code duplication

export const MdastFormattingVisitor: MdastImportVisitor<Mdast.Emphasis | Mdast.Strong | MdxJsxTextElement> = {
  testNode(mdastNode) {
    return (
      mdastNode.type === 'emphasis' ||
      mdastNode.type === 'strong' ||
      isNode_JsxOrOpeningOrClosing(mdastNode as Mdast.Content, 'u') ||
      isNode_JsxOrOpeningOrClosing(mdastNode as Mdast.Content, 's') ||
      isNode_JsxOrOpeningOrClosing(mdastNode as Mdast.Content, 'sub') ||
      isNode_JsxOrOpeningOrClosing(mdastNode as Mdast.Content, 'sup') ||
      isNode_JsxOrOpeningOrClosing(mdastNode as Mdast.Content, 'mark')
    )
  },

  visitNode({ mdastNode, lexicalParent, actions, mdastParent }) {
    if (isOpeningJsxNode(mdastNode, 'u')) {
      actions.addFormatting(IS_UNDERLINE, mdastParent as Mdast.Content)
      return
    }
    if (isClosingJsxNode(mdastNode, 'u')) {
      actions.removeFormatting(IS_UNDERLINE, mdastParent as Mdast.Content)
      return
    }
    if (isOpeningJsxNode(mdastNode, 's')) {
      actions.addFormatting(IS_STRIKETHROUGH, mdastParent as Mdast.Content)
      return
    }
    if (isClosingJsxNode(mdastNode, 's')) {
      actions.removeFormatting(IS_STRIKETHROUGH, mdastParent as Mdast.Content)
      return
    }
    if (isOpeningJsxNode(mdastNode, 'sub')) {
      actions.addFormatting(IS_SUBSCRIPT, mdastParent as Mdast.Content)
      return
    }
    if (isClosingJsxNode(mdastNode, 'sub')) {
      actions.removeFormatting(IS_SUBSCRIPT, mdastParent as Mdast.Content)
      return
    }
    if (isOpeningJsxNode(mdastNode, 'sup')) {
      actions.addFormatting(IS_SUPERSCRIPT, mdastParent as Mdast.Content)
      return
    }
    if (isClosingJsxNode(mdastNode, 'sup')) {
      actions.removeFormatting(IS_SUPERSCRIPT, mdastParent as Mdast.Content)
      return
    }
    if (isOpeningJsxNode(mdastNode, 'mark')) {
      actions.addFormatting(IS_HIGHLIGHT, mdastParent as Mdast.Content)
      return
    }
    if (isClosingJsxNode(mdastNode, 'mark')) {
      actions.removeFormatting(IS_HIGHLIGHT, mdastParent as Mdast.Content)
      return
    }

    if (mdastNode.type === 'emphasis') {
      actions.addFormatting(IS_ITALIC)
    } else if (mdastNode.type === 'strong') {
      actions.addFormatting(IS_BOLD)
    } else if (isJsxNode(mdastNode, 'u')) {
      actions.addFormatting(IS_UNDERLINE)
    } else if (isJsxNode(mdastNode, 's')) {
      actions.addFormatting(IS_STRIKETHROUGH)
    } else if (isJsxNode(mdastNode, 'sup')) {
      actions.addFormatting(IS_SUPERSCRIPT)
    } else if (isJsxNode(mdastNode, 'sub')) {
      actions.addFormatting(IS_SUBSCRIPT)
    } else if (isJsxNode(mdastNode, 'mark')) {
      actions.addFormatting(IS_HIGHLIGHT)
    }
    actions.visitChildren(mdastNode, lexicalParent)
  }
}
