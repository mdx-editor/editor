import React from 'react'
import {
  DiffSourceToggleWrapper,
  InsertImage,
  MDXEditor,
  diffSourcePlugin,
  imagePlugin,
  insertImage$,
  jsxPlugin,
  toolbarPlugin,
  usePublisher
} from '../'
import { Story } from '@ladle/react'
import { expressImageUploadHandler } from './_boilerplate'

const markdownWithHtmlImages = `
Hello world

![alt text](https://picsum.photos/200/300)

some more

<img src="https://picsum.photos/200/300" width="200" height="300" />

<img src="https://picsum.photos/200/300" />

<img src="https://picsum.photos/200/300" width="200" height="300" /> some <img src="https://picsum.photos/200/300" /> flow

Image with a class attribute:

<img src="https://picsum.photos/200/300" class="custom" />
some
`

export const ImageWithNoBackend: Story<{ readOnly: boolean }> = () => {
  return (
    <>
      <MDXEditor
        markdown=""
        plugins={[
          imagePlugin(),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <InsertImage />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={console.log}
      />
    </>
  )
}

export const ImageWithBackend: Story<{ readOnly: boolean }> = () => {
  return (
    <>
      <MDXEditor
        markdown=""
        plugins={[
          imagePlugin({
            imageUploadHandler: expressImageUploadHandler
          }),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <InsertImage />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={console.log}
      />
    </>
  )
}

function InsertCustomImage() {
  const insertImage = usePublisher(insertImage$)
  return (
    <>
      <button
        onClick={() => {
          insertImage({
            src: 'https://picsum.photos/200/300',
            altText: 'placeholder'
          })
        }}
      >
        Insert Image
      </button>

      <button
        onClick={() => {
          void urlToObject('http://localhost:61000/uploads/image-1714546302250-916818288.png', 'image.png').then((file) => {
            insertImage({ file, altText: 'placeholder' })
          })
        }}
      >
        Insert Image as File
      </button>
    </>
  )
}

const urlToObject = async (url: string, name: string) => {
  const response = await fetch(url)
  const blob = await response.blob()
  const file = new File([blob], name, { type: blob.type })
  return file
}

export const InsertImageSignal: Story<{ readOnly: boolean }> = () => {
  return (
    <>
      <MDXEditor
        markdown=""
        plugins={[
          imagePlugin({
            imageUploadHandler: expressImageUploadHandler
          }),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <InsertCustomImage />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
        onChange={console.log}
      />
    </>
  )
}

export const HtmlImage: Story<{ readOnly: boolean }> = ({ readOnly }) => {
  return (
    <>
      <MDXEditor
        markdown={markdownWithHtmlImages}
        readOnly={readOnly}
        plugins={[
          imagePlugin({
            imageUploadHandler: async () => Promise.resolve('https://picsum.photos/200/300'),
            disableImageSettingsButton: true
          }),
          diffSourcePlugin(),
          toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>:)</DiffSourceToggleWrapper> })
        ]}
        onChange={console.log}
      />
    </>
  )
}

HtmlImage.args = {
  readOnly: false
}

HtmlImage.argTypes = {
  readOnly: {
    control: {
      type: 'boolean'
    }
  }
}

export function JsxImage() {
  return (
    <>
      <MDXEditor
        markdown={markdownWithHtmlImages}
        plugins={[
          imagePlugin({ disableImageResize: true }),
          diffSourcePlugin(),
          jsxPlugin(),
          toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>:)</DiffSourceToggleWrapper> })
        ]}
        onChange={console.log}
      />
    </>
  )
}

export function ImageWithPreviewHook() {
  return (
    <>
      <MDXEditor
        markdown="Preview hook that returns static base64: ![alt text](/attachments/my_image.png)"
        plugins={[
          imagePlugin({
            imagePreviewHandler: async () =>
              Promise.resolve(
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC0AAAAYCAYAAABurXSEAAAAAXNSR0IArs4c6QAAAGJlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAABJKGAAcAAAASAAAAUKABAAMAAAABAAEAAKACAAQAAAABAAAALaADAAQAAAABAAAAGAAAAABBU0NJSQAAAFNjcmVlbnNob3QGyMkKAAAB1GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNi4wLjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyI+CiAgICAgICAgIDxleGlmOlBpeGVsWURpbWVuc2lvbj4yNDwvZXhpZjpQaXhlbFlEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj40NTwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOlVzZXJDb21tZW50PlNjcmVlbnNob3Q8L2V4aWY6VXNlckNvbW1lbnQ+CiAgICAgIDwvcmRmOkRlc2NyaXB0aW9uPgogICA8L3JkZjpSREY+CjwveDp4bXBtZXRhPgq7qfQQAAADGUlEQVRYCWP8DwQMQwwwDTH3gp076mh6xdpoSA+7kH795g3DspWrGV68eAn229Vr18H8P3/+kO5XUJGHDeQWlfxX0zHAJvX/y5cv/wUlZP5390/EKo9N8PSZs2A9Bw4eAktPnDINzP/27Rs25XjFcKbpf3//Mnz/8QNrKABNBIv/+/cPqzytBXE6mtYWU2I+1Rz9+fMXhsbWdgZTa3sGOVVNBmDyYrhz9y5Jbtuzbz9DXFIqg5CkLIOtsxtDc3snw/fv3zHMoIqj/wKTUnpOHgMwnTLYWFkyJCfEMezavZchIDSS4e27dxiWYhM4dOQoQ1h0HMNtoEfLiwsZtDU1GfonTWFIz85jAJmPDFiQOehsYIYDWhyBLszw+/dvFLEdu/cw7Ni1m2HGlIkMYcFBYLmQwABwaM1dsIihrKgART02TnF5FYOCvBzDzs0bGfj4eMFKdLS1GOqaWhgOHDrM4OzoANdGMKQ5ODgY0DEnJyfcABDj/IWLYL6CnBzDhUuXwfg3tCg7ceoUilpsHFDg3L13jyEqIhzuYJC62OhIsPJLl6+gaMMb0jw8PAwrFi9A0QDigCwBpVsYOHfhApjp4RcIE4LTV69eh7NxMe49eACWUpSXR1HCz8fHAHLDrdt3UMTxOhpFJR6OproGw4GDhxluX73IwMSEGnnofGzGyEhLg4WfPX+OIg3KhKAAAiUbZIBqA7IMCWx9PR2w6mvXbzAICgjA8aHDRxjOnD1H0CQhQUEGKUlJhg2btwDzC6KG3L5zN1ivjo42ihlUcbSHqyuDupoqQ3RCMsO0mbMZtmzfwZBTUMSQmJbJ8ODhIxQLcXGqykvBeSMxLZ1h3YZNDBMmT2VIycxmMDTQZ3Cyt0PRhjN5MKJFM7IuRkZGMBdGg3L7qqWLGEoraxhqGprAcqC02FBTxZAUH4uslYEBTS/MjKjwUIavX78yzJo7H+xYkCYvDzeGvs4OBvSMzwiq5FFNpYz3C1gcfvzwkUFYWAgjfRNr8vsPHxh4gZ5mYcEeplR3NLEOo0QdVdI0JQ4gR++oo8kJNXL0AADsUIxP1kwKcwAAAABJRU5ErkJggg=='
              )
          }),
          diffSourcePlugin(),
          jsxPlugin(),
          toolbarPlugin({ toolbarContents: () => <DiffSourceToggleWrapper>:)</DiffSourceToggleWrapper> })
        ]}
        onChange={console.log}
      />
    </>
  )
}

export function ImageDialogButtonExample() {
  return (
    <>
      <MDXEditor
        markdown=""
        plugins={[
          imagePlugin({
            disableImageResize: true,
            imageUploadHandler: async () => Promise.resolve('https://picsum.photos/200/300?grayscale'),
            imageAutocompleteSuggestions: ['https://via.placeholder.com/150', 'https://via.placeholder.com/250']
          }),
          diffSourcePlugin(),
          jsxPlugin(),
          toolbarPlugin({ toolbarContents: () => <InsertImage /> })
        ]}
        onChange={console.log}
      />
    </>
  )
}
