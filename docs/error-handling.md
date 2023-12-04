---
title: Error handling
slug: error-handling
position: 100
---

# Handling Errors

The markdown format can be complex due to its loose nature and you may integrate the editor in on top of existing content that you have no full control over. In this article, we will go over the error types that the editor can produce, the actual reasons behind them, and how to handle them.

## Errors caused by an invalid markdown format

The editor component uses the [MDAST library](https://github.com/syntax-tree/mdast-util-from-markdown) to parse the markdown content. Although it's quite forgiving, certain content can cause the parsing to fail, in which case the editor will remain empty. To obtain more information about the error, you can pass a callback to the `onError` prop - the callback will receive a payload that includes the error message and the source markdown that triggered it. 

### Parse errors caused by HTML-like formatting (e.g. HTML comments, or links surrounded by angle brackets)

To handle common basic HTML formatting (e.g. `u` tags), the default parsing includes the [mdast-util-mdx-jsx extension](https://github.com/syntax-tree/mdast-util-mdx-jsx). In some cases, this can cause the parsing to fail. You can disable this extension by setting the `suppressHtmlProcessing` prop to `true`, but you will lose the ability to use HTML-like formatting in your markdown. 

## Errors due to missing plugins 

Another problem that can occur during markdown parsing is the lack of plugins to handle certain markdown features. For example, the markdown may include table syntax, but the editor may not have the table plugin enabled. Internally, this exception is going to happen at the phase where mdast nodes are converted into lexical nodes (the UI rendered in the rich text editing surface). Just like in the previous case, you can use the `onError` prop to handle these errors. You can also add a custom "catch-all" plugin that register a mdast visitor with low priority that will handle all unknown nodes. See `./extending-the-editor` for more information.

## Enable source mode to allow the user to recover from errors

The diff-source plugin can be used as an "escape hatch" for potentially invalid markdown. Out of the box, the plugin will attach listeners to the markdown conversion, and, if it fails, will display an error message suggesting the user to switch to source mode and fix the problem there. If the user fixes the problem, then switching to rich text mode will work and the content will be displayed correctly. 
