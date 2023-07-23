import * as Mdast from 'mdast'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { IS_BOLD, IS_ITALIC, IS_UNDERLINE } from '../FormatConstants'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastFormattingVisitor: MdastImportVisitor<Mdast.Emphasis | Mdast.Strong | MdxJsxTextElement> = {
  testNode(mdastNode) {
    return (
      mdastNode.type === 'emphasis' || mdastNode.type === 'strong' || (mdastNode.type === 'mdxJsxTextElement' && mdastNode?.name === 'u')
    )
  },

  visitNode({ mdastNode, lexicalParent, actions }) {
    if (mdastNode.type === 'emphasis') {
      actions.addFormatting(IS_ITALIC)
    } else if (mdastNode.type === 'strong') {
      actions.addFormatting(IS_BOLD)
    } else if (mdastNode.type === 'mdxJsxTextElement' && mdastNode.name === 'u') {
      actions.addFormatting(IS_UNDERLINE)
    }
    actions.visitChildren(mdastNode, lexicalParent)
  }
}
