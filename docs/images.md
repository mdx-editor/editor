---
title: Images
slug: images
position: 0.4
---

# Images

The image plugin lets users include images from the web or from their local device. The images are inserted as markdown images. Users can also paste and drop multiple images at once. Optionally, the plugin accepts image URL auto-complete suggestions, and an upload handler that should handle the upload of the pasted and dropped images to a server.

## Inserting images with links

The `InsertImage` toolbar button lets users insert an image from an URL. When the button is clicked, a dialog is shown, where the user can enter the URL of the image. If the plugin is configured with image URL auto-complete suggestions, they will be shown as the user types.

```tsx
<MDXEditor 
  markdown='Hello world' 
  plugins={[
    imagePlugin({
      imageUploadHandler: () => {
        return Promise.resolve('https://picsum.photos/200/300')
      },
      imageAutocompleteSuggestions: [
        'https://picsum.photos/200/300',
        'https://picsum.photos/200',
      ]
    }),
    toolbarPlugin({toolbarContents: () => <InsertImage />})
  ]
  } 
/>
```

## Pasting and dropping images

The editor handles dropping and pasting images and clipboard contents that contain images. To handle that, you need to upload the image to a location of your choice and return the URL of the uploaded image. This is done through the `imageUploadHandler` parameter of the `imagePlugin`. The parameter accepts a function that receives a `File` object and returns a `Promise` that resolves to the URL of the uploaded image. 

```tsx
async function imageUploadHandler(image: File) {
  const formData = new FormData()
  formData.append('image', image)
  // send the file to your server and return 
  // the URL of the uploaded image in the response
  const response = await fetch('/uploads/new', { 
      method: 'POST', 
      body: formData 
  })
  const json = (await response.json()) as { url: string }
  return json.url
}

<MDXEditor 
  markdown='Hello world' 
  plugins={[
    imagePlugin({ imageUploadHandler })
  ]} 
/>
```

## Image resizing

The built-in markdown image syntax does not support explicit image dimensions. To work around that, the image plugin resorts to serializing images as `img` tags with `width` and `height` attributes if the user resizes an image or if the markdown input includes an `img` tag with those attributes set.  

```tsx
const markdown = `

Image without dimensions:

![](https://picsum.photos/200/300)

Image with dimensions:

<img src="https://picsum.photos/200/300" width="100" height="150" />
`

<MDXEditor 
  markdown={markdown} 
  plugins={[
    imagePlugin({ imageUploadHandler })
  ]} 
/>
```
