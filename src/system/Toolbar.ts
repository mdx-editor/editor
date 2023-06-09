import { system } from '../gurx'
import React from 'react'

export const [ToolbarSystem, ToolbarSystemType] = system((r) => {
  const toolbarComponents = r.node<React.ComponentType[]>([])
  return {
    toolbarComponents,
  }
}, [])