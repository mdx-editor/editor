# Block of code:

## JS
```js
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
```

## CSS

```css
body {
    color: red;
}
```

## React sandpack:

```tsx live 
export default function App() {
  return <h1>Hello world from a markdown</h1>
}
```

## Virtuoso Sandpack:

```tsx live preset=virtuoso
import { Virtuoso } from 'react-virtuoso'
import { generateUsers } from './data'

export default function App() {
  return (
    <Virtuoso
      style={{ height: 400 }}
      data={generateUsers(100000)}
      itemContent={(index, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: '1rem 0.5rem',
          }}
        >
          <h4>{user.name}</h4>
          <div style={{ marginTop: '1rem' }}>{user.description}</div>
        </div>
      )}
    />
  )
}
```

