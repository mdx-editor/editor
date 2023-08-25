import { $createTextNode } from 'lexical'
import * as Mdast from 'mdast'
import { IS_CODE } from '../../FormatConstants'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

interface OpeningHTMLCodeNode extends Mdast.HTML {
  type: 'html'
  value: '<code>'
}

interface ClosingHTMLCodeNode extends Mdast.HTML {
  type: 'html'
  value: '</code>'
}

function isOpeningCodeNode(node: Mdast.Content | Mdast.Root): node is OpeningHTMLCodeNode {
  return node.type === 'html' && node.value === '<code>'
}

function isClosingCodeNode(node: Mdast.Content | Mdast.Root): node is ClosingHTMLCodeNode {
  return node.type === 'html' && node.value === '</code>'
}

export const MdastInlineCodeVisitor: MdastImportVisitor<Mdast.InlineCode> = {
  testNode: (node) => {
    return node.type === 'inlineCode' || isOpeningCodeNode(node) || isClosingCodeNode(node)
  },
  visitNode({ mdastNode, actions, mdastParent }) {
    if (isOpeningCodeNode(mdastNode)) {
      actions.addFormatting(IS_CODE, mdastParent as Mdast.Content)
      return
    }
    if (isClosingCodeNode(mdastNode)) {
      actions.removeFormatting(IS_CODE, mdastParent as Mdast.Content)
      return
    }
    actions.addAndStepInto($createTextNode(mdastNode.value).setFormat(IS_CODE))
  }
}
