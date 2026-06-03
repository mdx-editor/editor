import { $createParagraphNode, $createLineBreakNode, type ElementNode } from 'lexical'
import * as Mdast from 'mdast'
import { MdastImportVisitor } from '../../importMarkdownToLexical'

const lexicalTypesThatShouldSkipParagraphs = ['listitem', 'admonition']

export const MdastParagraphVisitor: MdastImportVisitor<Mdast.Paragraph> = {
  testNode: 'paragraph',
  visitNode: function ({ mdastNode, lexicalParent, actions }): void {
    // markdown inserts paragraphs in lists. lexical does not.
    const parentType = lexicalParent.getType()

    if (lexicalTypesThatShouldSkipParagraphs.includes(parentType)) {
      if (parentType === 'listitem' && (lexicalParent as ElementNode).getChildrenSize() > 0) {
        ;(lexicalParent as ElementNode).append($createLineBreakNode(), $createLineBreakNode())
      }
      actions.visitChildren(mdastNode, lexicalParent)
    } else {
      actions.addAndStepInto($createParagraphNode())
    }
  }
}
