import React from 'react'
import { WrappedLexicalEditor } from './boilerplate'

import imageMarkdown from './assets/image-markdown.md?raw'
export function Hello() {
  // eslint-disable-next-line @typescript-eslint/require-await
  return <WrappedLexicalEditor markdown={imageMarkdown} imageUploadHandler={async () => 'https://picsum.photos/200/300'} />
}
