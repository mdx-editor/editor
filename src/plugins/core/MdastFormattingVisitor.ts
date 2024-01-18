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

function isOpeningUnderlineNode(node: Mdast.Nodes): node is OpeningHTMLUnderlineNode {
  return node.type === 'html' && node.value === '<u>'
}

function isClosingUnderlineNode(node: Mdast.Nodes): node is ClosingHTMLUnderlineNode {
  return node.type === 'html' && node.value === '</u>'
}

function isJsxUnderlineNode(node: Mdast.Nodes): node is JsxUnderlineNode {
  return node.type === 'mdxJsxTextElement' && node.name === 'u'
}

export const MdastFormattingVisitor: MdastImportVisitor<Mdast.Emphasis | Mdast.Strong | MdxJsxTextElement> = {
  testNode(mdastNode) {
    return (
      mdastNode.type === 'emphasis' ||
      mdastNode.type === 'strong' ||
      isJsxUnderlineNode(mdastNode) ||
      isOpeningUnderlineNode(mdastNode) ||
      isClosingUnderlineNode(mdastNode)
    )
  },

  visitNode({ mdastNode, lexicalParent, actions, mdastParent }) {
    if (isOpeningUnderlineNode(mdastNode)) {
      actions.removeFormatting(IS_UNDERLINE, mdastParent as Mdast.Parent)
      return
    }
    if (isClosingUnderlineNode(mdastNode)) {
      actions.removeFormatting(IS_UNDERLINE, mdastParent as Mdast.Parent)
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
