import { directiveToMarkdown } from 'mdast-util-directive'
import { frontmatterToMarkdown } from 'mdast-util-frontmatter'
import { gfmTableToMarkdown } from 'mdast-util-gfm-table'
import { mdxToMarkdown } from 'mdast-util-mdx'
import { Options as ToMarkdownOptions } from 'mdast-util-to-markdown'

export * from './visitors'
export * from './exportMarkdownFromLexical'

export const defaultExtensions = {
  mdxToMarkdown: mdxToMarkdown(),
  frontmatterToMarkdown: frontmatterToMarkdown('yaml'),
  directiveToMarkdown,
  gfmTableToMarkdown: gfmTableToMarkdown({ tableCellPadding: true, tablePipeAlign: true })
}

export const defaultToMarkdownOptions: ToMarkdownOptions = {
  listItemIndent: 'one'
}
