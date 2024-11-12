/**
 * Source code from Lexical:
 * https://github.com/facebook/lexical/blob/main/packages/lexical-playground/src/plugins/DraggableBlockPlugin/index.tsx
 *
 * We will use this plugin to implement the draggable block feature.
 */
import { Point } from '../../utils/point'
import { Rectangle } from '../../utils/rectangle'
import { eventFiles } from '@lexical/rich-text'
import { calculateZoomLevel, isHTMLElement, mergeRegister } from '@lexical/utils'
import { activeEditor$ } from '../core'
import { useCellValue } from '@mdxeditor/gurx'
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  COMMAND_PRIORITY_CRITICAL,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
  LexicalEditor
} from 'lexical'
import { DragEvent as ReactDragEvent, ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import React from 'react'

const SPACE = 4
const TARGET_LINE_HALF_HEIGHT = 2
const DRAG_DATA_FORMAT = 'application/x-lexical-drag-block'
const TEXT_BOX_HORIZONTAL_PADDING = 28

const Downward = 1
const Upward = -1
const Indeterminate = 0

let prevIndex = Infinity

const getCurrentIndex = (keysLength: number): number => {
  if (keysLength === 0) {
    return Infinity
  }
  if (prevIndex >= 0 && prevIndex < keysLength) {
    return prevIndex
  }

  return Math.floor(keysLength / 2)
}

const getTopLevelNodeKeys = (editor: LexicalEditor): string[] => {
  return editor.getEditorState().read(() => $getRoot().getChildrenKeys())
}

// Get the collapsed margins of an element
const getCollapsedMargins = (
  elem: HTMLElement
): {
  marginTop: number
  marginBottom: number
} => {
  const getMargin = (element: Element | null, margin: 'marginTop' | 'marginBottom'): number =>
    element ? parseFloat(window.getComputedStyle(element)[margin]) : 0

  const { marginTop, marginBottom } = window.getComputedStyle(elem)
  const prevElemSiblingMarginBottom = getMargin(elem.previousElementSibling, 'marginBottom')
  const nextElemSiblingMarginTop = getMargin(elem.nextElementSibling, 'marginTop')
  const collapsedTopMargin = Math.max(parseFloat(marginTop), prevElemSiblingMarginBottom)
  const collapsedBottomMargin = Math.max(parseFloat(marginBottom), nextElemSiblingMarginTop)

  return { marginBottom: collapsedBottomMargin, marginTop: collapsedTopMargin }
}

// Find the draggable block element based on the mouse position
const getBlockElement = (
  anchorElem: HTMLElement,
  editor: LexicalEditor,
  event: MouseEvent,
  useEdgeAsDefault = false
): HTMLElement | null => {
  const anchorElementRect = anchorElem.getBoundingClientRect()
  const topLevelNodeKeys = getTopLevelNodeKeys(editor)

  let blockElem: HTMLElement | null = null

  editor.getEditorState().read(() => {
    if (useEdgeAsDefault) {
      const [firstNode, lastNode] = [
        editor.getElementByKey(topLevelNodeKeys[0] ?? ''),
        editor.getElementByKey(topLevelNodeKeys[topLevelNodeKeys.length - 1] ?? '')
      ]

      const [firstNodeRect, lastNodeRect] = [
        firstNode != null ? firstNode.getBoundingClientRect() : undefined,
        lastNode != null ? lastNode.getBoundingClientRect() : undefined
      ]

      if (firstNodeRect && lastNodeRect) {
        const firstNodeZoom = calculateZoomLevel(firstNode)
        const lastNodeZoom = calculateZoomLevel(lastNode)
        if (event.y / firstNodeZoom < firstNodeRect.top) {
          blockElem = firstNode
        } else if (event.y / lastNodeZoom > lastNodeRect.bottom) {
          blockElem = lastNode
        }

        if (blockElem) {
          return
        }
      }
    }

    let index = getCurrentIndex(topLevelNodeKeys.length)
    let direction = Indeterminate

    while (index >= 0 && index < topLevelNodeKeys.length) {
      const key = topLevelNodeKeys[index] ?? ''
      const elem = editor.getElementByKey(key)
      if (elem === null) {
        break
      }
      const zoom = calculateZoomLevel(elem)
      const point = new Point(event.x / zoom, event.y / zoom)
      const domRect = Rectangle.fromDOM(elem)
      const { marginTop, marginBottom } = getCollapsedMargins(elem)
      const rect = domRect.generateNewRect({
        bottom: domRect.bottom + marginBottom,
        left: anchorElementRect.left,
        right: anchorElementRect.right,
        top: domRect.top - marginTop
      })

      const {
        result,
        reason: { isOnTopSide, isOnBottomSide }
      } = rect.contains(point)

      if (result) {
        blockElem = elem
        prevIndex = index
        break
      }

      if (direction === Indeterminate) {
        if (isOnTopSide) {
          direction = Upward
        } else if (isOnBottomSide) {
          direction = Downward
        } else {
          // stop search block element
          direction = Infinity
        }
      }

      index += direction
    }
  })

  return blockElem
}

// Set the menu (Grip Icon) position based on the draggable block element
const setMenuPosition = (targetElem: HTMLElement | null, floatingElem: HTMLElement, anchorElem: HTMLElement) => {
  if (!targetElem) {
    // floatingElem.stylacity = '0'
    // floatingElem.style.trae.opnsform = 'translate(-10000px, -10000px)'
    return
  }

  const targetRect = targetElem.getBoundingClientRect()
  const targetStyle = window.getComputedStyle(targetElem)
  const floatingElemRect = floatingElem.getBoundingClientRect()
  const anchorElementRect = anchorElem.getBoundingClientRect()

  const top = targetRect.top + (12 - floatingElemRect.height) / 2 - anchorElementRect.top
  const left = SPACE
  floatingElem.style.opacity = '1'
  floatingElem.style.transform = `translate(${left}px, ${top}px)`
}

// Create a drag image for the draggable block element
const setDragImage = (dataTransfer: DataTransfer, draggableBlockElem: HTMLElement) => {
  const { transform } = draggableBlockElem.style

  // Remove dragImage borders
  draggableBlockElem.style.transform = 'translateZ(0)'
  dataTransfer.setDragImage(draggableBlockElem, 0, 0)

  setTimeout(() => {
    draggableBlockElem.style.transform = transform
  })
}

// Set the target line position based on the mouse position
const setTargetLine = (targetLineElem: HTMLElement, targetBlockElem: HTMLElement, mouseY: number, anchorElem: HTMLElement) => {
  const { top: targetBlockElemTop, height: targetBlockElemHeight } = targetBlockElem.getBoundingClientRect()
  const { top: anchorTop, width: anchorWidth } = anchorElem.getBoundingClientRect()
  const { marginTop, marginBottom } = getCollapsedMargins(targetBlockElem)
  let lineTop = targetBlockElemTop
  if (mouseY >= targetBlockElemTop) {
    lineTop += targetBlockElemHeight + marginBottom / 2
  } else {
    lineTop -= marginTop / 2
  }

  const top = lineTop - anchorTop - TARGET_LINE_HALF_HEIGHT
  const left = TEXT_BOX_HORIZONTAL_PADDING - SPACE

  targetLineElem.style.transform = `translate(${left}px, ${top}px)`
  targetLineElem.style.width = `${anchorWidth - (TEXT_BOX_HORIZONTAL_PADDING - SPACE) * 2}px`
  targetLineElem.style.opacity = '.4'
}

const hideTargetLine = (targetLineElem: HTMLElement | null) => {
  if (targetLineElem) {
    targetLineElem.style.opacity = '0'
    targetLineElem.style.transform = 'translate(-10000px, -10000px)'
  }
}

const useDraggableBlockMenu = (
  editor: LexicalEditor | null,
  anchorElem: HTMLElement,
  menuRef: React.RefObject<HTMLElement>,
  targetLineRef: React.RefObject<HTMLElement>,
  isEditable: boolean | undefined,
  menuComponent: ReactNode,
  targetLineComponent: ReactNode,
  isOnMenu: (element: HTMLElement) => boolean
): JSX.Element => {
  const scrollerElem = anchorElem.parentElement

  const isDraggingBlockRef = useRef<boolean>(false)
  const [draggableBlockElem, setDraggableBlockElem] = useState<HTMLElement | null>(null)

  // Set the draggable block element based on the mouse position
  useEffect(() => {
    function onMouseMove(event: MouseEvent) {
      const target = event.target
      if (target != null && !isHTMLElement(target)) {
        setDraggableBlockElem(null)
        return
      }

      if (target != null && isOnMenu(target as HTMLElement)) {
        return
      }

      const _draggableBlockElem = editor ? getBlockElement(anchorElem, editor, event) : null
      setDraggableBlockElem(_draggableBlockElem)
    }

    function onMouseLeave() {
      setDraggableBlockElem(null)
    }

    if (scrollerElem != null) {
      scrollerElem.addEventListener('mousemove', onMouseMove)
      scrollerElem.addEventListener('mouseleave', onMouseLeave)
    }

    return () => {
      if (scrollerElem != null) {
        scrollerElem.removeEventListener('mousemove', onMouseMove)
        scrollerElem.removeEventListener('mouseleave', onMouseLeave)
      }
    }
  }, [scrollerElem, anchorElem, editor, isOnMenu])

  // Set the menu (Grip Icon) position based on the draggable block element
  useEffect(() => {
    if (menuRef.current) {
      setMenuPosition(draggableBlockElem, menuRef.current, anchorElem)
    }
  }, [anchorElem, draggableBlockElem, menuRef])

  // Handle the dragover and drop events
  useEffect(() => {
    const onDragover = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false
      }
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { pageY, target } = event
      if (target != null && !isHTMLElement(target)) {
        return false
      }
      const targetBlockElem = editor ? getBlockElement(anchorElem, editor, event, true) : null
      const targetLineElem = targetLineRef.current
      if (targetBlockElem === null || targetLineElem === null) {
        return false
      }
      setTargetLine(targetLineElem, targetBlockElem, pageY / calculateZoomLevel(target), anchorElem)
      // Prevent default event to be able to trigger onDrop events
      event.preventDefault()
      return true
    }

    const onDrop = (event: DragEvent): boolean => {
      if (!isDraggingBlockRef.current) {
        return false
      }
      const [isFileTransfer] = eventFiles(event)
      if (isFileTransfer) {
        return false
      }
      const { target, dataTransfer, pageY } = event
      const dragData = dataTransfer != null ? dataTransfer.getData(DRAG_DATA_FORMAT) : ''
      const draggedNode = $getNodeByKey(dragData)
      if (!draggedNode) {
        return false
      }
      if (target != null && !isHTMLElement(target)) {
        return false
      }
      const targetBlockElem = editor ? getBlockElement(anchorElem, editor, event, true) : null
      if (!targetBlockElem) {
        return false
      }
      const targetNode = $getNearestNodeFromDOMNode(targetBlockElem)
      if (!targetNode) {
        return false
      }
      if (targetNode === draggedNode) {
        return true
      }
      const targetBlockElemTop = targetBlockElem.getBoundingClientRect().top
      if (pageY / calculateZoomLevel(target) >= targetBlockElemTop) {
        targetNode.insertAfter(draggedNode)
      } else {
        targetNode.insertBefore(draggedNode)
      }
      setDraggableBlockElem(null)

      return true
    }

    if (!editor) return

    return mergeRegister(
      editor.registerCommand(
        DRAGOVER_COMMAND,
        (event) => {
          return onDragover(event)
        },
        COMMAND_PRIORITY_CRITICAL
      ),
      editor.registerCommand(
        DROP_COMMAND,
        (event) => {
          return onDrop(event)
        },
        COMMAND_PRIORITY_CRITICAL
      )
    )
  }, [anchorElem, editor, targetLineRef])

  function onDragStart(event: ReactDragEvent<HTMLDivElement>): void {
    const dataTransfer = event.dataTransfer
    if (!draggableBlockElem) {
      return
    }
    setDragImage(dataTransfer, draggableBlockElem)
    let nodeKey = ''
    editor?.update(() => {
      const node = $getNearestNodeFromDOMNode(draggableBlockElem)
      if (node) {
        nodeKey = node.getKey()
      }
    })
    isDraggingBlockRef.current = true
    dataTransfer.setData(DRAG_DATA_FORMAT, nodeKey)
  }

  function onDragEnd(): void {
    isDraggingBlockRef.current = false
    hideTargetLine(targetLineRef.current)
  }

  return createPortal(
    <>
      <div draggable={true} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {isEditable && menuComponent}
      </div>
      {targetLineComponent}
    </>,
    anchorElem
  )
}

export const DraggableBlockLexicalPlugin = ({
  anchorElem = document.body,
  menuRef,
  targetLineRef,
  menuComponent,
  targetLineComponent,
  isOnMenu
}: {
  anchorElem?: HTMLElement
  menuRef: React.RefObject<HTMLElement>
  targetLineRef: React.RefObject<HTMLElement>
  menuComponent: ReactNode
  targetLineComponent: ReactNode
  isOnMenu: (element: HTMLElement) => boolean
}): JSX.Element => {
  const editor = useCellValue(activeEditor$)
  return useDraggableBlockMenu(editor, anchorElem, menuRef, targetLineRef, editor?._editable, menuComponent, targetLineComponent, isOnMenu)
}
