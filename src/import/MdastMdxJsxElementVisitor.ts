import { ElementNode } from 'lexical'
import { MdxJsxTextElement } from 'mdast-util-mdx'
import { $createJsxNode } from '../nodes'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastMdxJsxElementVisitor: MdastImportVisitor<MdxJsxTextElement> = {
  testNode: (node) => {
    return node.type === 'mdxJsxTextElement' || node.type === 'mdxJsxFlowElement'
  },
  visitNode({ lexicalParent, mdastNode, actions }) {
    ;(lexicalParent as ElementNode).append(
      $createJsxNode({
        name: mdastNode.name!,
        kind: mdastNode.type === 'mdxJsxTextElement' ? 'text' : 'flow',
        //TODO: expressions are not supported yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        attributes: mdastNode.attributes as any,
        updateFn: (lexicalParent) => {
          actions.visitChildren(mdastNode, lexicalParent)
        }
      })
    )
  }
}
