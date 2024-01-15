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

  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;

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
