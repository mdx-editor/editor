---
title: Search and Replace
slug: search-replace
position: 0.85
---

# Search and Replace

The search plugin provides a comprehensive find-and-replace functionality for the editor. It's built for performance, using the native `CSS.highlights` API to mark search results without interfering with the editor's rendering logic.

The plugin itself works in the background to index text and find matches. To add a user interface for search, you can use the `useEditorSearch` hook. This hook provides all the necessary state and actions to build a search bar, like the one included in the official `MdxSearchToolbar` component.

To get started, add the `searchPlugin` to your editor's plugins array. Then, you can render a search UI component (like the provided `MdxSearchToolbar`) which uses the `useEditorSearch` hook to interact with the editor.

```tsx
import {
  MDXEditor,
  searchPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
// The MdxSearchToolbar is a component that provides the search UI.
// It uses the `useEditorSearch` hook internally.
import { MdxSearchToolbar } from "./path-to-your-components/MdxSearchToolbar";

function App() {
  return (
    <MDXEditor
      markdown={
        '# Hello World\n\nThis is a sample document. You can search for "sample" or any other word.'
      }
      plugins={[
        // 1. Enable the search plugin
        searchPlugin(),
        toolbarPlugin({
          // 2. In a real app, you would have a button here
          // that toggles the visibility of the search bar.
          toolbarContents: () => <MyToolbarContents />,
        }),
      ]}
    >
      {/* 3. Render the search UI component. It will appear when toggled. */}
      <MdxSearchToolbar />
    </MDXEditor>
  );
}
```

## `useEditorSearch` Hook

The `searchPlugin` exposes its functionality through the `useEditorSearch` hook. You can use this hook in your own components to create a custom search interface or to programmatically control search.

The hook returns an object with the following properties and methods:

-   `setSearch(term: string | null)`: Sets the search term. The plugin will start searching for matches. Pass `null` or an empty string to clear the search.
-   `next()`: Navigates to the next search result.
-   `prev()`: Navigates to the previous search result.
-   `replace(newText: string, onUpdate?: () => void)`: Replaces the currently highlighted search result with `newText`.
-   `replaceAll(newText: string, onUpdate?: () => void)`: Replaces all occurrences of the search term with `newText`.
-   `search: string`: The current search term.
-   `total: number`: The total number of matches found.
-   `cursor: number`: The 1-based index of the currently active match.
-   `currentRange: Range | null`: The DOM `Range` object for the current match.

### Example: Building a simple search UI

Here's a basic example of how you could build a simple search component using the hook. This demonstrates how to read the search state and trigger actions.

```tsx
import React from "react";
import { useEditorSearch } from "@mdxeditor/editor";

export const SimpleSearchUI = () => {
  const { search, setSearch, next, prev, total, cursor } = useEditorSearch();

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <input
        type="text"
        value={search ?? ""}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search document..."
      />
      <button onClick={prev} disabled={total === 0}>
        &lt; Prev
      </button>
      <span>{total > 0 ? `${cursor} / ${total}` : "0 / 0"}</span>
      <button onClick={next} disabled={total === 0}>
        Next &gt;
      </button>
    </div>
  );
};
```