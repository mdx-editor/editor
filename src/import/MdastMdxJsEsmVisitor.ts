import { MdxjsEsm } from 'mdast-util-mdx'
import { MdastImportVisitor } from './importMarkdownToLexical'

export const MdastMdxJsEsmVisitor: MdastImportVisitor<MdxjsEsm> = {
  testNode: 'mdxjsEsm',
  visitNode() {
    // nothing - we will reconstruct the necessary import statements in the export based on the used elements.
    void 0
  }
}
