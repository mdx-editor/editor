---
title: Markdown shortcuts
slug: markdown-shortcuts
position: 0.8
---

# Markdown keyboard shortcuts

The markdown shortcuts plugin enables typing shortcuts (similar to Notion, recently ported to Google Docs) that initiate the corresponding markdown blocks.

Notice that you will need the corresponding plugins for the markdown blocks to be rendered correctly.

```tsx
<MDXEditor markdown="hello world" plugins={[headingsPlugin(), listsPlugin(), linkPlugin(), quotePlugin(), markdownShortcutPlugin()]} />
```

## Supported shortcuts

- Use one to six `#` characters to create a heading. The number of `#` characters determines the heading level.
- Use `*` or `-` to create a list item.
- Use `>` to create a block quote.
- Select a text and press `Ctrl+B` to make it bold, `Ctrl+I` to make it italic, or `Ctrl+U` to underline it. Use `Cmd` on macOS.
- With text selected, use `Cmd+K` to open the link dialog.
- Use `` ` `` to create inline code.
- Type ` ```$lang ` (with `$lang` being any supported language, followed by space) to insert a code block.
