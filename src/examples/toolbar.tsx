import React from 'react'
import {
  MDXEditorCore,
  codeBlockPlugin,
  codeMirrorPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  quotePlugin,
  sandpackPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  directivesPlugin,
  AdmonitionDirectiveDescriptor
} from '..'
import { virtuosoSampleSandpackConfig, YoutubeDirectiveDescriptor } from './_boilerplate'
import { diffSourcePlugin } from '../plugins/diff-source'
import kitchenSinkMarkdown from './assets/kitchen-sink.md?raw'
import { markdownShorcutPlugin } from '../plugins/markdown-shortcut'

export const Basics = () => {
  return (
    <MDXEditorCore
      markdown={kitchenSinkMarkdown}
      plugins={[
        toolbarPlugin(),
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
        codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text' } }),
        directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        markdownShorcutPlugin()
      ]}
    />
  )
}
