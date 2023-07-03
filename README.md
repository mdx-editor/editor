# MDX Editor

![npm](https://img.shields.io/npm/v/@mdxeditor/editor)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@mdxeditor/editor)

> Because markdown editing can be even more delightful.

MDX Editor is an open-source React component that allows users to author markdown documents naturally. Just like in Google docs or Notion. [See the live demo](https://mdxeditor.dev/editor/demo) that has the default features turned on. It supports most (if not all) of the markdown syntax, including tables, images, code blocks, etc. It also allows users to edit JSX components with a dedicated property editor.

```jsx
import {MDXEditor} from '@mdxeditor/editor';

export default function App() {
  return <MDXEditor markdown={'# Hello World'} />;
}
```
## Get Started

The best place to get started using the component is the [documentation](https://mdxeditor.dev/editor/docs/getting-started).

## Help and support

Should you encounter any issues, please [create an issue](https://github.com/mdx-editor/editor/issues), but check if there's something similar already open first.

## License

MIT &copy; Petyo Ivanov.
