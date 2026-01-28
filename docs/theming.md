---
title: Theming
slug: theming
position: 0.999
---

# Theming

## Styling the editor elements

The structural styling of the component is done through CSS module class names, which have auto-generated suffixes that can change between versions. The key DOM elements of the component have "public" CSS classes that you can safely target with your own CSS.

- `mdxeditor` - Set at the root element of the editor and the container for the pop-ups/tooltips.
- `mdxeditor-popup-container` assigned to the popup container. Use this if you're using MDXEditor with a framework like MUI and you need to override the z-index of the popups.
- `mdxeditor-toolbar` - The toolbar container.
- `mdxeditor-root-contenteditable` - The root `contentEditable` element, managed by Lexical.
- `mdxeditor-diff-source-wrapper` - If you're using the `diffSourcePlugin`, it injects an element around the editor so that you can toggle between the rich text and source / diff mode. This CSS class is assigned to that wrapper.
- `mdxeditor-rich-text-editor`, `mdxeditor-source-editor`, `mdxeditor-diff-editor` - If you're using the `diffSourcePlugin`, these classes are assigned to the rich text, source and diff editor root elements, respectively.
- `mdxeditor-select-content` - assigned to the Radix UI `Select.Content` component - useful if you want to style the select dropdowns, for example to limit their size on smaller viewports.

## Customizing the editor colors

The editor UI (toolbar, dialogs, etc) colors and fonts are defined as CSS variables attached to the editor root element.
The color variables follow the [Radix semantic aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing#semantic-aliases) convention.

The example below swaps the editor gray/blue colors with tomato/mauve. In addition, assigning the `dark-theme` class to the editor also flips it to dark mode (this is a feature of the Radix colors).

```css
@import url('@radix-ui/colors/tomato-dark.css');
@import url('@radix-ui/colors/mauve-dark.css');

.dark-editor {
  --accentBase: var(--tomato-1);
  --accentBgSubtle: var(--tomato-2);
  --accentBg: var(--tomato-3);
  --accentBgHover: var(--tomato-4);
  --accentBgActive: var(--tomato-5);
  --accentLine: var(--tomato-6);
  --accentBorder: var(--tomato-7);
  --accentBorderHover: var(--tomato-8);
  --accentSolid: var(--tomato-9);
  --accentSolidHover: var(--tomato-10);
  --accentText: var(--tomato-11);
  --accentTextContrast: var(--tomato-12);

  --baseBase: var(--mauve-1);
  --baseBgSubtle: var(--mauve-2);
  --baseBg: var(--mauve-3);
  --baseBgHover: var(--mauve-4);
  --baseBgActive: var(--mauve-5);
  --baseLine: var(--mauve-6);
  --baseBorder: var(--mauve-7);
  --baseBorderHover: var(--mauve-8);
  --baseSolid: var(--mauve-9);
  --baseSolidHover: var(--mauve-10);
  --baseText: var(--mauve-11);
  --baseTextContrast: var(--mauve-12);

  --admonitionTipBg: var(--cyan4);
  --admonitionTipBorder: var(--cyan8);

  --admonitionInfoBg: var(--grass4);
  --admonitionInfoBorder: var(--grass8);

  --admonitionCautionBg: var(--amber4);
  --admonitionCautionBorder: var(--amber8);

  --admonitionDangerBg: var(--red4);
  --admonitionDangerBorder: var(--red8);

  --admonitionNoteBg: var(--mauve-4);
  --admonitionNoteBorder: var(--mauve-8);

  font-family:
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    'Open Sans',
    'Helvetica Neue',
    sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;

  color: var(--baseText);
  --basePageBg: black;
  background: var(--basePageBg);
}
```

```tsx
export function CustomTheming() {
  return (
    <MDXEditor
      className="dark-theme dark-editor"
      markdown={kitchenSinkMarkdown}
      plugins={[
        toolbarPlugin({ toolbarContents: () => <KitchenSinkToolbar /> }),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
        directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        markdownShortcutPlugin()
      ]}
    />
  )
}
```
