---
title: Getting started
slug: getting-started
position: 0
---

# Getting started

You've decided to give MDXEditor a try? That's great, because it does not take a lot of effort. While powerful, the component needs little to boot. In this article, we will go through the necessary steps to reach "Hello world" state.

## Installation

To use MDXEditor to your project, install the `@mdxeditor/editor` NPM package in your React project:

```sh
npm install --save @mdxeditor/editor
```

## Importing the component

The MDXEditor package definition uses the [exports field](https://nodejs.org/api/packages.html#exports) to define multiple entry points. This ensures that your bundle won't include features you're not using. Notice that for the exports to work correctly, you need to use **TypeScript 5** with `--moduleResolution bundler`. [See the TypeScript documentation for more details](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#--moduleresolution-bundler). 

Following are the specifics below for the most popular React frameworks.

### Next.js (App router)

By default, Next.js uses `--moduleResolution node` setting in `tsconfig.json`. This means that TypeScript does not take the `exports` package.json field into account. Depending on your project, you may try to change it to `node16` or `bundler` so that you can use the named exports, which will optimize your bundle. If this is not possible, you can still use the catch all export point `@mdxeditor/editor`.


In addition, we need to ensure that the editor component is used only on the client. Given its purpose, it makes little to no sense to do server processing. To do so, we can use the `dynamic` function from Next.js. This will ensure that the component is only loaded on the client.

> **_NOTE:_**  Make sure all plugins are initialized on client side only. Using some plugins will cause hydration errors if imported during SSR.

```tsx
"use client"
// InitializedMDXEditor.tsx
import type { ForwardedRef } from "react";
import {
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  type MDXEditorProps,
} from "@mdxeditor/editor";

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
        markdownShortcutPlugin(),
      ]}
      {...props}
      ref={editorRef}
    />
  );
}
```

```tsx
"use client"
// ForwardRefEditor.tsx

// This is the only place InitializedMDXEditor is imported directly.
const Editor = dynamic(() => import("./InitializedMDXEditor"), {
  // Make sure we turn SSR off
  ssr: false,
});

// This is what is imported by other components. Pre-initialized with plugins, and ready
// to accept other props, including a ref.
export const ForwardRefEditor = forwardRef<MDXEditorMethods, MDXEditorProps>(
  (props, ref) => <Editor {...props} editorRef={ref} />,
);

// TS complains without the following line
ForwardRefEditor.displayName = "ForwardRefEditor";
```

If you get stuck, check the [MDX editor in Next.js GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-next).

### Next.js (Pages router)

Next.js in pages mode seems to choke on the ESM format of the editor and one of its dependencies. To work around that, include the following packages in your transpilation list in next.config.js:

```ts
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mdxeditor/editor', 'react-diff-view'],
  reactStrictMode: true,
  webpack: (config) => {
    // this will override the experiments
    config.experiments = { ...config.experiments, topLevelAwait: true };
    // this will just update topLevelAwait property of config.experiments
    // config.experiments.topLevelAwait = true 
    return config;
  },
}

module.exports = nextConfig
```

Check the [MDX editor in Next.js (pages) GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-next-pages) for a working example.

### Vite

MDXEditor "just works" in Vite, assuming that you use a recent version of it. The only thing you need to watch out for is for the imports to come from the specific path rather than the catch-all one, since TypeScript autocompletes both. 

Here's a minimal example for App.tsx:

```tsx
import '@mdxeditor/editor/style.css'

// importing the editor and the plugin from their full paths
import { MDXEditor } from '@mdxeditor/editor/MDXEditor'
import { headingsPlugin } from '@mdxeditor/editor/plugins/headings'

function App() {
  return (
    <MDXEditor markdown='# Hello world' plugins={[headingsPlugin()]} />
  )
}

export default App
```

If you get stuck, check the [MDX editor in Vite GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-vite).


### Remix

Remix seems [to struggle with ESM-only packages](https://github.com/remix-run/remix/issues/109), like MDXEditor itself and several of its dependencies. To work around that, ensure that you list all problematic modules in the `serverDependenciesToBundle` field.
Check the working example that uses dynamic imports in the [MDX editor in Remix GitHub sample repository](https://github.com/mdx-editor/mdx-editor-in-remix).

### Create React App

Here's a minimal example for App.tsx:

```tsx
import '@mdxeditor/editor/style.css'
import {MDXEditor, headingsPlugin} from '@mdxeditor/editor';

 function App() {
  return <MDXEditor markdown={'# Hello World'} plugins={[headingsPlugin()]} />;
}

export default App
```

See the [MDX editor in CRA GitHub sample repository for a working example](https://github.com/mdx-editor/mdx-editor-in-cra).

## Basic usage

The MDXEditor component accepts its initial value through the `markdown` property. Notice that the property works like the [textarea `defaultValue`](https://react.dev/reference/react-dom/components/textarea#providing-an-initial-value-for-a-text-area). 
To change the value dynamically, you should use the `setMarkdown` ref method.

To listen for changes of the value of the editor, use the `onChange` callback property. The event is triggered continuously as the user types, so you can use it to update your state.

Alternatively, to obtain the value of the editor, use the `getMarkdown` ref method.

```tsx
  // construct a ref to the editor
  const ref = React.useRef<MDXEditorMethods>(null)
  return (
    <>
      <button onClick={() => ref.current?.setMarkdown('new markdown')}>Set new markdown</button>
      <button onClick={() => console.log(ref.current?.getMarkdown())}>Get markdown</button>
      <MDXEditor ref={ref} markdown='hello world' onChange={console.log} />
    </>
  )
```

## Next steps

The editor is now working, but it's not very useful. Depending on your use case, you are will most likely need to enable a set of additional features. To ensure that the bundle size stays small, MDXEditor uses a plugin system. As a convention, each plugin is a separate export, so you can import only the ones you need. Below is an example of a few basic plugins being enabled for the editor.

```tsx
import { MDXEditor } from '@mdxeditor/editor/MDXEditor'
import { headingsPlugin } from '@mdxeditor/editor/plugins/headings'
import { listsPlugin } from '@mdxeditor/editor/plugins/lists'
import { quotePlugin } from '@mdxeditor/editor/plugins/quote'
import { thematicBreakPlugin } from '@mdxeditor/editor/plugins/thematic-break'

function App() {
  return (
    <MDXEditor markdown='# Hello world' plugins={[headingsPlugin(), listsPlugin(), quotePlugin(), thematicBreakPlugin()]} />
  )
}
```

Follow the links in the sidebar to learn more about each respective capability and the way to enable it.
