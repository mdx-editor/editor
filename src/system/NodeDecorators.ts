import { system } from '../gurx'
import React from 'react'
import { FrontmatterEditorProps } from '../types/NodeDecoratorsProps'

function ComponentStub(componentName: string) {
  return () => {
    throw new Error(`Component ${componentName} not registered`)
    return null
  }
}

export interface NodeDecorators {
  FrontmatterEditor: React.FC<FrontmatterEditorProps>
}

export const [NodeDecoratorsSystem, NodeDecoratorsSystemType] = system((r) => {
  const nodeDecorators = r.node<NodeDecorators>({
    FrontmatterEditor: ComponentStub('FrontmatterEditor'),
  })

  return {
    nodeDecorators,
  }
}, [])
