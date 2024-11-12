import { useRef } from 'react'

import { contentEditableRef$ } from '../core'
import { DraggableBlockLexicalPlugin } from './DraggableBlockLexicalPlugin'
import React from 'react'
import { useCellValue } from '@mdxeditor/gurx'

const DRAGGABLE_BLOCK_MENU_CLASSNAME = 'draggable-block-menu'

const isOnMenu = (element: HTMLElement): boolean => {
  return !!element.closest(`.${DRAGGABLE_BLOCK_MENU_CLASSNAME}`)
}

export const DraggableBlockNode = () => {
  const contentEditableRef = useCellValue(contentEditableRef$)

  const menuRef = useRef<HTMLDivElement>(null)
  const targetLineRef = useRef<HTMLDivElement>(null)

  return contentEditableRef?.current ? (
    <DraggableBlockLexicalPlugin
      anchorElem={contentEditableRef.current}
      menuRef={menuRef}
      targetLineRef={targetLineRef}
      menuComponent={
        <div
          ref={menuRef}
          style={{
            padding: '4px',
            backgroundColor: 'gray',
            cursor: 'grab',
            position: 'absolute',
            left: '0',
            top: '0',
            willChange: 'transform'
          }}
        >
          <div
            // className="bg-zinc-600 dark:bg-zinc-400 w-4 h-4 opacity-50"
            style={{
              backgroundColor: 'orange',
              width: '16px',
              height: '16px',
              opacity: '0.5'
            }}
          />
        </div>
      }
      targetLineComponent={
        <div
          ref={targetLineRef}
          style={{
            pointerEvents: 'none',
            position: 'absolute',
            left: '0',
            top: '0',
            willChange: 'transform',
            opacity: '0.5',
            height: '4px',
            width: '100%',
            borderRadius: '0.25rem',
            backgroundColor: 'blue'
          }}
          // className="pointer-events-none h-1 left-0 top-0 absolute opacity-0 will-change-transform"
        />
      }
      isOnMenu={isOnMenu}
    />
  ) : null
}
