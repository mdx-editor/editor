import React from 'react'
import { MDXEditorCore, linkPlugin, linkDialogPlugin, AdmonitionDirectiveDescriptor, directivesPlugin } from '../'
import markdown from './assets/live-demo-contents.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

export function Basics() {
  return <MDXEditorCore onChange={console.log} markdown={markdown} plugins={ALL_PLUGINS} />
}
