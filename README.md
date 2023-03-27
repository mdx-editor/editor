# Lexical MDX 

This project aims to develop a set of packages for editing of [MDX](https://mdxjs.com/) in [Lexical](https://lexical.dev/). 

If you're using markdown with Lexical and you need help or would like to collaborate, contact me over the [email in my profile](https://github.com/petyosi/) or [over Discord](https://discord.com/users/727775297667203073). 

## Markdown import/export

![npm](https://img.shields.io/npm/v/@virtuoso.dev/lexical-mdx-import-export)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@virtuoso.dev/lexical-mdx-import-export)

The markdown import/export utility supports **extensible** and **configurable** markdown interoperability with Lexical.

Unlike the built-in Lexical support, this implementation uses [Markdown Abstract Syntax Tree](https://github.com/syntax-tree/mdast) with the mdx extension turned on. 
This allows support for html tags (like `<u>underline</u>`) and the editing and configuration of React components. It also supports configuration of the markdown output format.

Out of the box, the following syntax is supported:

- Paragraphs
- Bold, italic, underline formatting
- Headings
- Ordered and unordered lists
- Nested lists
- Links
- Block quotes
- Inline code and code blocks
- Images
- Horizontal rules

### Usage

To add the package to your project, install it with 

```bash
npm install --save @virtuoso.dev/lexical-mdx-import-export
```

To import markdown, call the respective function in the initial config:

```jsx
const markdown = '# hello world'
  const initialConfig = {
    editorState: () => {
      importMarkdownToLexical($getRoot(), mardkown)
    },
    //...
  }

//....
<LexicalComposer initialConfig={initialConfig}>
```

To export markdown, read the editor state, and call the function with the root node:

```jsx
//...
state.read(() => {
  console.log(exportMarkdownFromLexical({root : $getRoot()}))
})
//
```

Check [the live example with the supported markdown syntax](https://codesandbox.io/s/lexical-markdown-import-export-0p1dn0?file=/src/App.tsx) supported first.


### Configure markdown export formatting

The `exportMarkdownFromLexical` method accepts an optional [`options`](https://github.com/syntax-tree/mdast-util-to-markdown#options) 
parameter that controls the markdown formatting. Check the link above for detialed documentation from mdast.

### Support additional nodes through visitors

Both the import and export are implemented with visitor objects. The functions accept an optional Array parameter of the visitors to be applied to the syntax tree. 

You can take the default array of visitors exported as `MdastVisitors` and, `LexicalVisitors` and append your own custom visitors or replace the default ones.

The easiest way to create your own visitor is to use the code of a one that's similar to what you need and use it as a starting point.

- [MdastVisitors source code](https://github.com/virtuoso-dev/lexical-mdx/blob/main/packages/import-export/src/importMarkdownToLexical.ts)
- [LexicalVisitors source code](https://github.com/virtuoso-dev/lexical-mdx/blob/main/packages/import-export/src/exportMarkdownFromLexical.ts)

## Support

Contact me over the [email in my profile](https://github.com/petyosi/) or [over Discord](https://discord.com/users/727775297667203073).

## License

MIT License.
