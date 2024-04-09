---
title: Links
slug: links
position: 0.3
---

# Links

MDXEditor supports markdown links through the links plugin. An additional popover dialog component allows the user users insert/edit the link parameters.

## The link plugin

To enable the markdown link import, pass the `linkPlugin` to the plugins property of the MDXEditor component.

```tsx
import { linkPlugin } from '@mdxeditor/editor/plugins/link';
// ...

<MDXEditor markdown="Hello [world](https://virtuoso.dev/)" plugins={[linkPlugin()]} />
```

## The link dialog plugin

The link dialog plugin enables a floating popover that appears when the cursor is inside a link, similar to Google docs. The popover allows the user to edit the link and remove it. The popover also supports a keyboard shortcut to open it - `Ctrl+K` on Windows and `Cmd+K` on Mac.

```tsx
<MDXEditor markdown="Hello [world](https://virtuoso.dev/)" plugins={[linkPlugin(), linkDialogPlugin()]} />
```

### Link autocomplete suggestions

The link dialog can auto-suggest a pre-configured set of links to the user. This comes in handy if you're using an editor in a CMS and you can generate a list of links to the pages that are available in the CMS. The links are passed to the plugin as a property.

```tsx
<MDXEditor
  markdown="Hello [world](https://virtuoso.dev/)"
  plugins={[
    linkPlugin(),
    linkDialogPlugin({
      linkAutocompleteSuggestions: ['https://virtuoso.dev', 'https://mdxeditor.dev']
    })
  ]}
/>
```
