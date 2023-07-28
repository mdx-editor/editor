declare module '*.svg' {
  import React from 'react'
  const ReactComponent: React.FC<React.ComponentProps<'svg'> & { title?: string }>
  export default ReactComponent
}
