import React from 'react'
import { Popover } from '../Popover/Popover'
import { useLexicalSelection } from '../Popover/useLexicalSelection'
import { ToolbarPlugin } from '../ToolbarPlugin/ToolbarPlugin'

export function FloatingToolbarPlugin() {
  const { selectionRectangle } = useLexicalSelection()
  const isOpen = selectionRectangle !== null && selectionRectangle?.width > 0

  return (
    <Popover selection={selectionRectangle} open={isOpen}>
      <ToolbarPlugin />
    </Popover>
  )
}
