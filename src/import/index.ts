import { CodeNode } from '@lexical/code'
import { LinkNode } from '@lexical/link'
import { ListItemNode, ListNode } from '@lexical/list'
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { Klass, LexicalNode, ParagraphNode } from 'lexical'
import * as Mdast from 'mdast'
import { directiveFromMarkdown } from 'mdast-util-directive'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmTableFromMarkdown } from 'mdast-util-gfm-table'
import { mdxFromMarkdown } from 'mdast-util-mdx'
import { directive } from 'micromark-extension-directive'
import { frontmatter } from 'micromark-extension-frontmatter'
import { gfmTable } from 'micromark-extension-gfm-table'
import { mdxjs } from 'micromark-extension-mdxjs'
import { AdmonitionNode, CodeBlockNode, FrontmatterNode, ImageNode, JsxNode, LeafDirectiveNode, SandpackNode, TableNode } from '../nodes'
import { MdastAdmonitionVisitor } from './MdastAdmonitionVisitor'
import { MdastBlockQuoteVisitor } from './MdastBlockQuoteVisitor'
import { MdastCodeVisitor } from './MdastCodeVisitor'
import { MdastFormattingVisitor } from '../plugins/core/MdastFormattingVisitor'
import { MdastFrontmatterVisitor } from './MdastFrontmatterVisitor'
import { MdastImageVisitor } from './MdastImageVisitor'
import { MdastLeafDirectiveVisitor } from './MdastLeafDirectiveVisitor'
import { MdastLinkVisitor } from './MdastLinkVisitor'
import { MdastListItemVisitor } from './MdastListItemVisitor'
import { MdastListVisitor } from './MdastListVisitor'
import { MdastParagraphVisitor } from '../plugins/core/MdastParagraphVisitor'
import { MdastRootVisitor } from '../plugins/core/MdastRootVisitor'
import { MdastTableVisitor } from './MdastTableVisitor'
import { MdastTextVisitor } from '../plugins/core/MdastTextVisitor'
import { MdastExtension, MdastImportVisitor, SyntaxExtension } from './importMarkdownToLexical'
import { MdastMdxJsEsmVisitor } from '../plugins/jsx/MdastMdxJsEsmVisitor'
import { MdastMdxJsxElementVisitor } from '../plugins/jsx/MdastMdxJsxElementVisitor'
import { MdastInlineCodeVisitor } from '../plugins/core/MdastInlineCodeVisitor'
import { MdastHeadingVisitor } from '../plugins/headings/MdastHeadingVisitor'
import { MdastThematicBreakVisitor } from '../plugins/thematic-break/MdastThematicBreakVisitor'

export type {
  MarkdownParseOptions,
  MdastExtension,
  MdastImportVisitor,
  MdastTreeImportOptions,
  MdastVisitActions,
  MdastVisitParams,
  SyntaxExtension
} from './importMarkdownToLexical'

export { importMarkdownToLexical, importMdastTreeToLexical } from './importMarkdownToLexical'

export const defaultMdastVisitors: Record<string, MdastImportVisitor<Mdast.Content>> = {
  MdastRootVisitor,
  MdastParagraphVisitor,
  MdastTextVisitor,
  MdastFormattingVisitor,
  MdastInlineCodeVisitor,
  MdastLinkVisitor,
  MdastHeadingVisitor,
  MdastListVisitor,
  MdastListItemVisitor,
  MdastBlockQuoteVisitor,
  MdastCodeVisitor,
  MdastThematicBreakVisitor,
  MdastImageVisitor,
  MdastFrontmatterVisitor,
  MdastAdmonitionVisitor,
  MdastMdxJsEsmVisitor,
  MdastMdxJsxElementVisitor,
  MdastTableVisitor,
  MdastLeafDirectiveVisitor
}

export const defaultMdastExtensions: Record<string, MdastExtension> = {
  mdxFromMarkdown: mdxFromMarkdown(),
  frontmatterFromMarkdown: frontmatterFromMarkdown('yaml'),
  directiveFromMarkdown: directiveFromMarkdown,
  gfmTableFromMarkdown: gfmTableFromMarkdown
}

export const defaultSyntaxExtensions: Record<string, SyntaxExtension> = {
  mdxjs: mdxjs(),
  frontmatter: frontmatter(),
  directive: directive(),
  gfmTable: gfmTable
}

/**
 * The default set of lexical nodes used in the editor.
 */
export const defaultLexicalNodes: Record<string, Klass<LexicalNode>> = {
  ParagraphNode,
  LinkNode,
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  HorizontalRuleNode,
  ImageNode,
  SandpackNode,
  CodeBlockNode,
  FrontmatterNode,
  AdmonitionNode,
  JsxNode,
  CodeNode, // this one should not be used, but markdown shortcuts complain about it
  TableNode,
  LeafDirectiveNode
}
