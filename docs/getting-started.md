---
title: Getting started
slug: getting-started
position: 0
---

# Getting started

You've decided to give MDXEditor a try? That's great, because it does not take a lot of effort. While powerful, the component needs little to boot. In this article, we will go through the necessary steps to reach the "Hello world" state.

## Installation

To use MDXEditor in your project, install the `@mdxeditor/editor` NPM package in your React project:

```sh
npm install --save @mdxeditor/editor
```

Afterwards, you can import the React component and use it in your project. You need to include the CSS file as well, either as an import in React or in your project stylesheet. Follow the instructions below for your framework of choice.

```tsx
import { MDXEditor } from '@mdxeditor/editor'
import '@mdxeditor/editor/style.css'
```

### Next.js (App router)

MDXEditor does not support server rendering, so we need to ensure that the editor component is rendered only on client-side. To do so, we can use the [`dynamic` utility](https://nextjs.org/docs/pages/building-your-application/optimizing/lazy-loading) with `{ssr: false}`. 

**NOTE:** Make sure that the editor plugins are initialized client-side only, too. Using some plugins will cause hydration errors if imported during SSR.

```tsx
'use client'
// InitializedMDXEditor.tsx
import type { ForwardedRef } from 'react'
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps
} from '@mdxeditor/editor'

// Only import this to the next file
export default function InitializedMDXEditor({
  editorRef,
  ...props
}: { editorRef: ForwardedRef<MDXEditorMethods> | null } & MDXEditorProps) {
  return (
    <MDXEditor
      plugins={[
        // Example Plugin Usage
        headingsPlugin(),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        markdownShortcutPlugin()
      ]}
      {...props}
      ref={editorRef}
    />
  )
}
```

```tsx
'use client'
// ForwardRefEditor.tsx

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import('./InitializedMDXEditor'), {
  // Make sure we turn SSR off
  ssr: false
})

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>((props, ref) => <Editor {...props} editorRef={ref} />)

// TS complains without the following line
ForwardRefEditor.displayName = 'ForwardRefEditor'
```

If you get stuck, check the [MDX editor in Next.js GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-next).

### Next.js (Pages router)

Next.js in pages mode seems to choke on the ESM format of the editor and one of its dependencies. To work around that, include the following packages in your transpilation list in next.config.js:

```ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mdxeditor/editor'],
  reactStrictMode: true,
  webpack: (config) => {
    // this will override the experiments
    config.experiments = { ...config.experiments, topLevelAwait: true }
    // this will just update topLevelAwait property of config.experiments
    // config.experiments.topLevelAwait = true
    return config
  }
}

module.exports = nextConfig
```

Check the [MDX editor in Next.js (pages) GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-next-pages) for a working example.

### Vite

MDXEditor "just works" in Vite, assuming that you use a recent version of it. 

Here's a minimal example for App.tsx:

```tsx
import { MDXEditor } from '@mdxeditor/editor'
import { headingsPlugin } from '@mdxeditor/editor'

import '@mdxeditor/editor/style.css'

function App() {
  return <MDXEditor markdown="# Hello world" plugins={[headingsPlugin()]} />
}

export default App
```

If you get stuck, check the [MDX editor in Vite GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-vite).

### Remix

The component works well with the [ClientOnly remix utility](https://github.com/sergiodxa/remix-utils/tree/main?tab=readme-ov-file#clientonly). Check the working example in the [MDX editor in the Remix GitHub sample repository](https://github.com/mdx-editor/mdx-editor-in-remix).

### Create React App

Here's a minimal example for App.tsx:

```tsx
import '@mdxeditor/editor/style.css'
import { MDXEditor, headingsPlugin } from '@mdxeditor/editor'

function App() {
  return <MDXEditor markdown={'# Hello World'} plugins={[headingsPlugin()]} />
}

export default App
```

See the [MDX editor in CRA GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-cra).

## Basic usage

The MDXEditor component accepts its initial value through the `markdown` property. Notice that the property works like the [textarea `defaultValue`](https://react.dev/reference/react-dom/components/textarea#providing-an-initial-value-for-a-text-area). To change the value dynamically, you should use the `setMarkdown` ref method.

To listen for changes of the value of the editor, use the `onChange` callback property. The event is triggered continuously as the user types, so you can use it to update your state.

Alternatively, to obtain the value of the editor, use the `getMarkdown` ref method.

```tsx
// create a ref to the editor component
const ref = React.useRef<MDXEditorMethods>(null)
return (
  <>
    <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
    <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>
    <MDXEditor ref={ref} markdown="hello world" onChange={console.log} />
  </>
)
```

If you want to insert markdown content after the editor is initialized, you can use `insertMarkdown` ref method to insert markdown content to the current cursor position of the active editor.

```tsx
// create a ref to the editor component
const ref = React.useRef<MDXEditorMethods>(null)
return (
  <>
    <button onClick={() => ref.current?.insertMarkdown('new markdown to insert')}>Insert new markdown</button>
    <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>
    <MDXEditor ref={ref} markdown="hello world" onChange={console.log} />
  </>
)
```

## Next steps

Hopefully, at this point, the editor component is installed and working in your setup, but it's not very useful. Depending on your use case, you will need some additional features. To ensure that the bundle size stays small, MDXEditor uses a plugin system. Below is an example of a few basic plugins being enabled for the editor.

```tsx
import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, thematicBreakPlugin } from '@mdxeditor/editor'

function App() {
  return <MDXEditor markdown="# Hello world" plugins={[headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin()]} />
}
```

Follow the links in the sidebar to learn more about each respective capability and the way to enable it.
