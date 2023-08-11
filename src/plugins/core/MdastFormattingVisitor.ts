import * as Mdast from 'mdast'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { IS_BOLD, IS_ITALIC, IS_UNDERLINE } from '../../FormatConstants'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

interface OpeningHTMLUnderlineNode extends Mdast.HTML {
  type: 'html'
  value: '<u>'
}

interface ClosingHTMLUnderlineNode extends Mdast.HTML {
  type: 'html'
  value: '</u>'
}

interface JsxUnderlineNode extends MdxJsxTextElement {
  type: 'mdxJsxTextElement'
  name: 'u'
}

function isOpeningUnderlineNode(node: Mdast.Content): node is OpeningHTMLUnderlineNode {
  return node.type === 'html' && node.value === '<u>'
}

function isClosingUnderlineNode(node: Mdast.Content): node is ClosingHTMLUnderlineNode {
  return node.type === 'html' && node.value === '</u>'
}

function isJsxUnderlineNode(node: Mdast.Content): node is JsxUnderlineNode {
  return node.type === 'mdxJsxTextElement' && node.name === 'u'
}

export const MdastFormattingVisitor: MdastImportVisitor<Mdast.Emphasis | Mdast.Strong | MdxJsxTextElement> = {
  testNode(mdastNode) {
    return (
      mdastNode.type === 'emphasis' ||
      mdastNode.type === 'strong' ||
      isJsxUnderlineNode(mdastNode as Mdast.Content) ||
      isOpeningUnderlineNode(mdastNode as Mdast.Content) ||
      isClosingUnderlineNode(mdastNode as Mdast.Content)
    )
  },

  visitNode({ mdastNode, lexicalParent, actions, mdastParent }) {
    if (isOpeningUnderlineNode(mdastNode)) {
      actions.addFormatting(IS_UNDERLINE, mdastParent as Mdast.Content)
      return
    }
    if (isClosingUnderlineNode(mdastNode)) {
      actions.removeFormatting(IS_UNDERLINE, mdastParent as Mdast.Content)
      return
    }
    if (mdastNode.type === 'emphasis') {
      actions.addFormatting(IS_ITALIC)
    } else if (mdastNode.type === 'strong') {
      actions.addFormatting(IS_BOLD)
    } else if (isJsxUnderlineNode(mdastNode)) {
      actions.addFormatting(IS_UNDERLINE)
    }
    actions.visitChildren(mdastNode, lexicalParent)
  }
}
