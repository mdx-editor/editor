---
title: Overview
slug: overview
position: -1
---

# Overview

MDXEditor is an open-source React component that allows users to author markdown documents in a WYSIWYG manner. The component is tailored specifically to accommodate the markdown syntax constraints, which means that certain "rich" features are not supported. For example, the user cannot change the font size, the color or the font family of the text. Also, there is no intermediate HTML representation of the markdown document. The component accepts and emits markdown as a string.

Markdown content has multiple applications, so the editor component itself is designed with a minimal "core" set of features, with everything else being enabled through plugins, including relatively common features such as headings, quotes, and links. 

## Architecture at a glance

The rich text editor engine is built on top of the [Lexical](https://lexical.dev/) editor framework. Unlike other similar solutions, Lexical supports the implementation of complex interactive editors for a specific purpose, like tables, code blocks or even code with live preview. 

MDXEditor's markdown processing is built on top of the [MDAST family of packages](https://github.com/syntax-tree/mdast#list-of-utilities). The component implements a bi-directional conversion between the Markdown Abstract Syntax Tree (MDAST) and the Lexical AST by traversing each tree through a set of visitors that convert the constructs from one tree into the other. Depending on their purpose, some MDXEditor plugins extend the conversion by adding additional MDAST and/or Lexical AST visitors, and by adding additional Lexical AST nodes.

Note: MDXEditor uses the `@lexical/markdown` only for the provided markdown shortcuts. The built-in Lexical markdown processing, is fairly limited and does not handle advanced cases like nested lists for example. 

## Is MDXEditor the right choice for my case?

It should be, if you plan to use markdown as a persistent format. Which is a good choice in many cases. Markdown is a popular, clean, tool-independent human-readable format that can be rendered using a variety of tools. It is a great choice for documentation, and it is also a good choice for storing content that is meant to be rendered in multiple formats, like HTML, PDF, or even Word documents. The fact that it is clean of presentation-related information makes it easy to change the rendering of the document without affecting the content itself.

Since markdown rendering is so easy, MDXEditor does not need a "read-only" mode like other editors - you can simply render the markdown string in a markdown renderer of your choice ([next-mdx-remote](https://github.com/hashicorp/next-mdx-remote) being just one of the more convenient ones, if you're using React/Next.js). 

The default set of plugins available are geared towards technical documentation, but the editor is extensible enough to accommodate other use cases as well. Depending on your use case, you can also write your own plugins to handle certain markdown constructs.

## Help and support

The editor is developed in the open, in the [mdx-editor/editor](https://github.com/mdx-editor/editor) GitHub repository - give the project a star! I would be more than happy to discuss ideas and potential contributions - open an issue or start a discussion in it. You can also reach out to me via [email](mailto:petyo@virtuoso.dev) if you prefer.

## About the author

I've spent most of my professional career working on components for web developers. Another popular project of mine is [react-virtuoso](https://virtuoso.dev), a React component for efficiently rendering large lists and tabular data. You can find me on [Twitter](https://twitter.com/petyosi) and [LinkedIn](https://www.linkedin.com/in/petyosi/).
