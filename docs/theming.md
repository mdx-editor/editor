---
title: Theming
slug: theming
position: 0.999
---

# Theming

The editor UI (toolbar, dialogs, etc) colors and fonts are defined as CSS variables attached to the editor root element.
The color variables follow the [Radix semantic aliasing](https://www.radix-ui.com/colors/docs/overview/aliasing#semantic-aliases) convention.

The example below swaps the editor gray/blue colors with tomato/mauve. In addition, assigning the `dark-theme` class to the editor also flips it to dark mode (this is a feature of the Radix colors). 

```css
@import url('@radix-ui/colors/tomatoDark.css');
@import url('@radix-ui/colors/mauveDark.css');

.dark-editor {
  --accentBase: var(--tomato1);
  --accentBgSubtle: var(--tomato2);
  --accentBg: var(--tomato3);
  --accentBgHover: var(--tomato4);
  --accentBgActive: var(--tomato5);
  --accentLine: var(--tomato6);
  --accentBorder: var(--tomato7);
  --accentBorderHover: var(--tomato8);
  --accentSolid: var(--tomato9);
  --accentSolidHover: var(--tomato10);
  --accentText: var(--tomato11);
  --accentTextContrast: var(--tomato12);

  --baseBase: var(--mauve1);
  --baseBgSubtle: var(--mauve2);
  --baseBg: var(--mauve3);
  --baseBgHover: var(--mauve4);
  --baseBgActive: var(--mauve5);
  --baseLine: var(--mauve6);
  --baseBorder: var(--mauve7);
  --baseBorderHover: var(--mauve8);
  --baseSolid: var(--mauve9);
  --baseSolidHover: var(--mauve10);
  --baseText: var(--mauve11);
  --baseTextContrast: var(--mauve12);

  color: var(--baseText);
  background: var(--baseBg);
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
        sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text', tsx: 'TypeScript' } }),
        directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        markdownShortcutPlugin()
      ]} 
    />
  )
}
```
