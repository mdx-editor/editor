import React from 'react'
import { MDXEditor } from '../'
import markdown from './assets/live-demo-contents.md?raw'
import { ALL_PLUGINS } from './_boilerplate'

export function Basics() {
  return <MDXEditor onChange={console.log} markdown={markdown} plugins={ALL_PLUGINS} />
}
