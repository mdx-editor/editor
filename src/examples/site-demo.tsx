import React from 'react'
import { MDXEditor } from '../'
import markdown from './assets/live-demo-contents.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

export function Basics() {
  return <MDXEditor markdown={markdown} onChange={(md) => console.log('change', { md })} plugins={ALL_PLUGINS} />
}
