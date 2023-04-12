import { system } from '../gurx'
import React from 'react'
import { FrontmatterEditorProps, JsxEditorProps, SandpackEditorProps } from '../types/NodeDecoratorsProps'

function ComponentStub(componentName: string) {
  return () => {
    throw new Error(`Component ${componentName} not registered`)
    return null
  }
}

export interface NodeDecorators {
  FrontmatterEditor: React.FC<FrontmatterEditorProps>
  JsxEditor: React.FC<JsxEditorProps>
  SandpackEditor: React.FC<SandpackEditorProps>
}

export const [NodeDecoratorsSystem, NodeDecoratorsSystemType] = system((r) => {
  const nodeDecorators = r.node<NodeDecorators>({
    FrontmatterEditor: ComponentStub('FrontmatterEditor'),
    JsxEditor: ComponentStub('JsxEditor'),
    SandpackEditor: ComponentStub('SandpackEditor'),
  })

  return {
    nodeDecorators,
  }
}, [])
