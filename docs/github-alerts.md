# GitHub alerts

Enable `githubAlertsPlugin()` to edit GitHub's five native alert types: `NOTE`, `TIP`, `IMPORTANT`, `WARNING`, and `CAUTION`.

```tsx
import { MDXEditor, githubAlertsPlugin, GitHubAlertTypeSelect, listsPlugin, toolbarPlugin } from '@mdxeditor/editor'

;<MDXEditor
  markdown={'> [!NOTE]\n> Keep your changes small.'}
  plugins={[githubAlertsPlugin(), listsPlugin(), toolbarPlugin({ toolbarContents: () => <GitHubAlertTypeSelect /> })]}
/>
```

The marker must occupy the first line of a block quote. Recognized alerts export as `> [!TYPE]` followed by their content. Ordinary block quotes, unknown markers, escaped markers, and inline marker-like text keep their ordinary Markdown meaning. Enabling this plugin also enables ordinary block quote import/export; it can coexist with `quotePlugin()`.

Use the toolbar selector while the caret is inside an alert to change its type. Outside an alert, choosing a type inserts an empty alert at the current selection. Alert content is edited in the main editor, sharing normal formatting, selection and undo history. Press Enter in an empty final paragraph to leave the alert. The toolbar and its signal honor `readOnly`.

Enable the usual plugins for content inside alerts (for example, `listsPlugin()` for lists or `linkPlugin()` for links). Source editing uses the same alert parser on returning to rich text. This plugin has no dependency on `directivesPlugin()` and does not rewrite alerts into directive syntax.

GitHub does not support nesting alerts inside other elements. The editor preserves nested Markdown content, but GitHub's renderer determines how such content appears when published. Typing the marker directly in rich text does not automatically turn a block quote into an alert; use the selector, or import/edit Markdown source.
