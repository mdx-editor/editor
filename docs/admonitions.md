---
title: Admonitions
slug: Admonitions
position: 0.815
---

# Admonitions

Admonitions (also known as callouts or tips) are a common way to highlight some text in a markdown document. [Docusaurus uses them extensively](https://docusaurus.io/docs/markdown-features/admonitions) in its documentation and provides pre-made styling (icons, colors, etc).

The admonitions are, in fact, just [conventional container directives](./custom-directive-editors). The MDXEditor package ships a pre-made directive `AdmonitionDirectiveDescriptor` that enables the usage of admonitions in your markdown document.

```tsx
const admonitionMarkdown = `

:::note
foo
:::

:::tip
Some **content** with _Markdown_ syntax. Check [this component](https://virtuoso.dev/).
:::

:::info
Some **content** with _Markdown_ syntax. 
:::

:::caution
Some **content** with _Markdown_ syntax.
:::

:::danger
Some **content** with _Markdown_ syntax.
:::
`

export const Admonitions: React.FC = () => {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={admonitionMarkdown}
      plugins={[
        directivesPlugin({ directiveDescriptors: [AdmonitionDirectiveDescriptor] }),
        linkPlugin(),
        listsPlugin(),
        headingsPlugin(),
        codeBlockPlugin(),
        quotePlugin(),
        markdownShortcutPlugin()
      ]}
    />
  )
}
```
