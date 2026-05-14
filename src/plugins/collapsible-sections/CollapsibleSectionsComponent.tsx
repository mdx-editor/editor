import React from 'react'
import { useCellValue, usePublisher } from '@mdxeditor/gurx'
import { rootEditor$ } from '../core'
import { toggleHeadingCollapse$ } from './index'

const INJECTED_STYLE_ID = 'mdxeditor-collapsible-sections-style'

const COLLAPSIBLE_CSS = `
[data-collapsed-by] {
  display: none;
}
[data-collapsible-heading] {
  position: relative;
  padding-left: 24px;
  cursor: default;
}
[data-collapsible-heading]::before {
  content: '';
  position: absolute;
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 4px 0 4px 6px;
  border-color: transparent transparent transparent currentColor;
  opacity: 0;
  transition: opacity 0.15s ease;
  pointer-events: none;
}
[data-collapsible-heading]:hover::before {
  opacity: 0.5;
}
[data-heading-collapsed]::before {
  opacity: 1 !important;
}
[data-heading-collapsed] {
  opacity: 0.7;
}
`

function injectStyles() {
  if (typeof document === 'undefined') {
    return
  }
  if (document.getElementById(INJECTED_STYLE_ID)) {
    return
  }
  const styleEl = document.createElement('style')
  styleEl.id = INJECTED_STYLE_ID
  styleEl.textContent = COLLAPSIBLE_CSS
  document.head.appendChild(styleEl)
}

export function CollapsibleSectionsComponent() {
  const rootEditor = useCellValue(rootEditor$)
  const toggleHeadingCollapse = usePublisher(toggleHeadingCollapse$)

  React.useEffect(() => {
    injectStyles()
    return () => {
      document.getElementById(INJECTED_STYLE_ID)?.remove()
    }
  }, [])

  React.useEffect(() => {
    if (!rootEditor) {
      return
    }

    const rootElement = rootEditor.getRootElement()
    if (!rootElement) {
      return
    }

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      const heading = target.closest('[data-heading-key]') as HTMLElement | null
      if (!heading) {
        return
      }

      // Only respond to clicks in the left 24px toggle zone
      const headingRect = heading.getBoundingClientRect()
      const clickX = event.clientX - headingRect.left
      if (clickX >= 24) {
        return
      }

      // Intercept the click so Lexical doesn't process it as a text selection
      event.stopPropagation()

      const nodeKey = heading.getAttribute('data-heading-key')
      if (nodeKey) {
        toggleHeadingCollapse(nodeKey)
      }
    }

    // Use capture phase to intercept before Lexical handles it
    rootElement.addEventListener('click', handleClick, true)

    return () => {
      rootElement.removeEventListener('click', handleClick, true)
    }
  }, [rootEditor, toggleHeadingCollapse])

  return null
}
