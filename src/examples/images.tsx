import React from 'react'
import { DiffSourceToggleWrapper, MDXEditor, diffSourcePlugin, imagePlugin, jsxPlugin, toolbarPlugin } from '../'

const markdownWithHtmlImages = `
Hello world

![alt text](https://picsum.photos/200/300)

some more

<img src="https://picsum.photos/200/300" width="200" height="300" />

<img src="https://picsum.photos/200/300" />

<img src="https://picsum.photos/200/300" width="200" height="300" /> some <img src="https://picsum.photos/200/300" /> flow

some
`

export function HtmlImage() {
  return (
    <>
      <MDXEditor
        markdown={markdownWithHtmlImages}
        plugins={[
          imagePlugin(),
          diffSourcePlugin(),
          toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>:)</DiffSourceToggleWrapper> })
        ]}
        onChange={console.log}
      />
    </>
  )
}

export function JsxImage() {
  return (
    <>
      <MDXEditor
        markdown={markdownWithHtmlImages}
        plugins={[
          imagePlugin(),
          diffSourcePlugin(),
          jsxPlugin(),
          toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>:)</DiffSourceToggleWrapper> })
        ]}
        onChange={console.log}
      />
    </>
  )
}
