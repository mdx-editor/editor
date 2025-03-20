import { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx-jsx'
import { $isLexicalJsxNode, LexicalJsxNode } from './LexicalJsxNode'
import { LexicalExportVisitor } from '../../exportMarkdownFromLexical'
import * as Mdast from 'mdast'
import { isMdastJsxNode } from '.'
import { htmlTags } from '../core'

export const LexicalJsxVisitor: LexicalExportVisitor<LexicalJsxNode, MdxJsxFlowElement | MdxJsxTextElement> = {
  testLexicalNode: $isLexicalJsxNode,
  visitLexicalNode({ actions, mdastParent, lexicalNode }) {
    function traverseNestedJsxNodes(node: Mdast.Nodes) {
      if ('children' in node && node.children instanceof Array) {
        node.children.forEach((child: Mdast.Nodes) => {
          if (isMdastJsxNode(child) && !htmlTags.includes(child.name!.toLowerCase())) {
            actions.registerReferredComponent(child.name!)
          }
          traverseNestedJsxNodes(child)
        })
      }
    }

    const mdastNode = lexicalNode.getMdastNode()
    const importStatement = lexicalNode.getImportStatement()
    actions.registerReferredComponent(mdastNode.name!, importStatement)
    traverseNestedJsxNodes(mdastNode)
    actions.appendToParent(mdastParent, mdastNode)
  },
  priority: -200
}
