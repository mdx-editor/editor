import { system } from '../gurx'

export interface JsxPropertyDescriptor {
  name: string
  type: 'string' | 'number'
  required?: boolean
}

export interface JsxComponentDescriptor {
  name: string
  kind: 'flow' | 'text'
  source: string
  defaultExport?: boolean
  props: Array<JsxPropertyDescriptor>
}

export type JsxComponentDescriptors = Array<JsxComponentDescriptor>

export const [JsxSystem, JsxSystemType] = system((r) => {
  const jsxComponentDescriptors = r.node<JsxComponentDescriptors>([])

  return {
    jsxComponentDescriptors,
  }
}, [])
