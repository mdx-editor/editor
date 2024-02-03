import React from 'react'
import { maxLengthPlugin, MDXEditor } from '..'

export function Bare() {
  return <MDXEditor plugins={[maxLengthPlugin(100)]} autoFocus={true} markdown={'hello world'} onChange={console.log} />
}
