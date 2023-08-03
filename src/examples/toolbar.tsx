import React from 'react'
import { MDXEditorCore, headingsPlugin, listsPlugin, quotePlugin, toolbarPlugin } from '..'
import { ALL_PLUGINS } from './_boilerplate'
import kitchenSinkMarkdown from './assets/kitchen-sink.md?raw'

export const Basics = () => {
  return <MDXEditorCore markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} />
}

export const ConditionalToolbar = () => {
  return (
    <MDXEditorCore
      markdown={'hello world'}
      plugins={[
        toolbarPlugin(),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin()
        // linkPlugin(),
        // linkDialogPlugin(),
        // imagePlugin(),
        // tablePlugin(),
        // thematicBreakPlugin(),
        // frontmatterPlugin(),
        // codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        // codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text' } }),
        // directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        // diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        // markdownShorcutPlugin()
      ]}
    />
  )
}
