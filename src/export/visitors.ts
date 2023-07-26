import { CodeBlockVisitor } from '../plugins/codeblock/CodeBlockVisitor'
import { LexicalLinebreakVisitor } from '../plugins/core/LexicalLinebreakVisitor'
import { LexicalParagraphVisitor } from '../plugins/core/LexicalParagraphVisitor'
import { LexicalRootVisitor } from '../plugins/core/LexicalRootVisitor'
import { LexicalTextVisitor } from '../plugins/core/LexicalTextVisitor'
import { LexicalFrontmatterVisitor } from '../plugins/frontmatter/LexicalFrontmatterVisitor'
import { LexicalHeadingVisitor } from '../plugins/headings/LexicalHeadingVisitor'
import { LexicalImageVisitor } from '../plugins/image/LexicalImageVisitor'
import { LexicalJsxVisitor } from '../plugins/jsx/LexicalJsxVisitor'
import { LexicalLinkVisitor } from '../plugins/link/LexicalLinkVisitor'
import { LexicalListItemVisitor } from '../plugins/lists/LexicalListItemVisitor'
import { LexicalListVisitor } from '../plugins/lists/LexicalListVisitor'
import { LexicalQuoteVisitor } from '../plugins/quote/LexicalQuoteVisitor'
import { LexicalTableVisitor } from '../plugins/table/LexicalTableVisitor'
import { LexicalThematicBreakVisitor } from '../plugins/thematic-break/LexicalThematicBreakVisitor'
import { AdmonitionVisitor } from './AdmonitionVisitor'
import { LexicalLeafDirectiveVisitor } from './LexicalLeafDirectiveVisitor'

export type { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

export const defaultLexicalVisitors = {
  LexicalRootVisitor,
  LexicalParagraphVisitor,
  LexicalFrontmatterVisitor,
  LexicalTextVisitor,
  LexicalLinebreakVisitor,
  LexicalLinkVisitor,
  LexicalHeadingVisitor,
  LexicalListVisitor,
  LexicalListItemVisitor,
  LexicalQuoteVisitor,
  CodeBlockVisitor,
  LexicalThematicBreakVisitor,
  AdmonitionVisitor,
  LexicalImageVisitor,
  LexicalJsxVisitor,
  LexicalTableVisitor,
  LexicalLeafDirectiveVisitor
}
