import { system } from '../gurx'
import { JsxComponentDescriptors } from '../types/JsxComponentDescriptors'

export const [JsxSystem, JsxSystemType] = system((r) => {
  const jsxComponentDescriptors = r.node<JsxComponentDescriptors>([])

  return {
    jsxComponentDescriptors,
  }
}, [])
