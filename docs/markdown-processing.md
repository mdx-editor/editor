---
title: Markdown processing 
slug: markdown-processing
position: 4
---

# Markdown processing

When the editor state changes, MDXEditor converts the lexical node tree to a markdown tree. Then, the resulting markdown tree is converted to a markdown string using the [toMarkdown](https://github.com/syntax-tree/mdast-util-to-markdown) utility. This is a great point for you to change stylistic preferences like bullet markers or how whitespace is treated. 

To control the options of the `toMarkdown` invocation, pass your preferences through the `toMarkdownOptions` property. Those values get passed to [`options` argument of the `toMarkdown` call](https://github.com/syntax-tree/mdast-util-to-markdown#options).

By default, the MDXEditor uses the following options:

```tsx
const DEFAULT_MARKDOWN_OPTIONS: ToMarkdownOptions = {
  listItemIndent: 'one'
}
```
