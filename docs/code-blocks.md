---
title: Code blocks
slug: code-blocks
position: 0.6
---

# Code blocks

The code block plugin enables support for fenced code blocks, but does not include any code editing UI. The `codeMirrorPlugin` build on top of it to provide a code editing experience. The next example enables the plugin along with their respective toolbar components.

```tsx
const defaultSnippetContent = `
export default function App() {
  return (
    <div className="App">
      <h1>Hello</h1>
      <h2>Start editing to see some magic happen!</h2>
    </div>
  );
}
`.trim()

function App() {
  return (
    <MDXEditor
      markdown="hello world"
      plugins={[
        // the default code block language to insert when the user clicks the "insert code block" button
        codeBlockPlugin({ defaultCodeBlockLanguage: 'js' }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS' } }),
        toolbarPlugin({
          toolbarContents: () => (
            <ConditionalContents
              options={[
                { when: (editor) => editor?.editorType === 'codeblock', contents: () => <ChangeCodeMirrorLanguage /> },
                {
                  fallback: () => (
                    <>
                      <InsertCodeBlock />
                    </>
                  )
                }
              ]}
            />
          )
        })
      ]}
    />
  )
}
```

````md
Blocks of code

JavaScript:

```js
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
```

CSS:

```css
body {
  color: red;
}
```
````

## Configuring the CodeMirror editor

The code mirror editor plugin enables editing of fenced code blocks with basic code editing features like syntax highlighting, indentation and bracket matching. A set of toolbar component utilities support the display of a language selector when the block is in focus, while hiding the rich text editor controls. The plugin accepts supported languages as a parameter option.

## Build a custom code block editor

You can implement your own stack of custom code editors by passing a code block editor descriptor to the `codeBlockPlugin`. The next example uses a plain text textarea to edit the code block content. More details about each of the constructs in the example can be found in the API reference.

```tsx
const PlainTextCodeEditorDescriptor: CodeBlockEditorDescriptor = {
  // always use the editor, no matter the language or the meta of the code block
  match: (language, meta) => true,
  // You can have multiple editors with different priorities, so that there's a "catch-all" editor (with the lowest priority)
  priority: 0,
  // The Editor is a React component
  Editor: (props) => {
    const cb = useCodeBlockEditorContext()
    // stops the propagation so that the parent lexical editor does not handle certain events.
    return (
      <div onKeyDown={(e) => e.nativeEvent.stopImmediatePropagation()}>
        <textarea rows={3} cols={20} defaultValue={props.code} onChange={(e) => cb.setCode(e.target.value)} />
      </div>
    )
  }
}

/** use markdown with some code blocks */
const codeBlocksMarkdown = ''

export function CodeBlock() {
  return (
    <MDXEditor
      onChange={console.log}
      markdown={codeBlocksMarkdown}
      plugins={[codeBlockPlugin({ codeBlockEditorDescriptors: [PlainTextCodeEditorDescriptor] })]}
    />
  )
}
```

## Creating a fallback editor

If the users have access to direct editing of the markdown code, they can insert a code block that does not have a corresponding editor. To handle this, you can create a "fallback" descriptor with a low priority that acts as a "catchAll" case. The example below uses the `CodeMirrorEditor` component.

```tsx
export function FallbackCodeEditor() {
  return (
    <MDXEditor
      markdown={listWithCode}
      onChange={(md) => {
        console.log(md)
      }}
      plugins={[
        listsPlugin(),
        codeBlockPlugin({
          codeBlockEditorDescriptors: [{ priority: -10, match: (_) => true, Editor: CodeMirrorEditor }]
        }),
        codeMirrorPlugin({
          codeBlockLanguages: { jsx: 'JavaScript (react)', js: 'JavaScript', css: 'CSS', tsx: 'TypeScript (react)' }
        }),
        diffSourcePlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper>
              <UndoRedo />
            </DiffSourceToggleWrapper>
          )
        })
      ]}
    />
  )
}
```
