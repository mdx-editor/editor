import React from 'react'
import {
  AdmonitionDirectiveDescriptor,
  KitchenSinkToolbar,
  MDXEditor,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  directivesPlugin,
  frontmatterPlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  sandpackPlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  Separator,
  BlockTypeSelect,
  InlineTextFormattingToggles,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertImage,
  ListsToggle
} from '..'
import { ALL_PLUGINS, YoutubeDirectiveDescriptor, virtuosoSampleSandpackConfig } from './_boilerplate'
import kitchenSinkMarkdown from './assets/kitchen-sink.md?raw'
import './dark-editor.css'

export const Basics = () => {
  return <MDXEditor markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} />
}

export const CustomTheming = () => {
  return <MDXEditor className="dark-theme dark-editor" markdown={kitchenSinkMarkdown} plugins={ALL_PLUGINS} />
}

export const ConditionalToolbar = () => {
  return (
    <MDXEditor
      markdown={'hello world'}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <InlineTextFormattingToggles />
                <ListsToggle />
                <Separator />
                <BlockTypeSelect />
                <CreateLink />
                <InsertImage />
                <Separator />
              </DiffSourceToggleWrapper>
            </>
          )
        }),
        listsPlugin(),
        quotePlugin(),
        headingsPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        imagePlugin(),
        tablePlugin(),
        thematicBreakPlugin(),
        frontmatterPlugin(),
        // codeBlockPlugin({ defaultCodeBlockLanguage: 'txt' }),
        // sandpackPlugin({ sandpackConfig: virtuosoSampleSandpackConfig }),
        // codeMirrorPlugin({ codeBlockLanguages: { js: 'JavaScript', css: 'CSS', txt: 'text' } }),
        directivesPlugin({ directiveDescriptors: [YoutubeDirectiveDescriptor, AdmonitionDirectiveDescriptor] }),
        diffSourcePlugin({ viewMode: 'rich-text', diffMarkdown: 'boo' }),
        markdownShortcutPlugin()
      ]}
    />
  )
}

export const SimpleToolbar = () => {
  return (
    <MDXEditor
      markdown={'hello world'}
      plugins={[
        toolbarPlugin({
          toolbarContents: () => (
            <>
              <UndoRedo />
              <Separator />
            </>
          )
        }),
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
        markdownShortcutPlugin()
      ]}
    />
  )
}
