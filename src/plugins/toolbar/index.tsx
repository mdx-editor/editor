import { realmPlugin } from '../../RealmWithPlugins'
import { Cell, useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import { addTopAreaChild$, addBottomAreaChild$, readOnly$ } from '../core'
import { Root } from './primitives/toolbar'

/**
 * The factory function that returns the contents of the toolbar.
 * @group Toolbar
 */
export const toolbarContents$ = Cell<() => React.ReactNode>(() => null)
export const toolbarClassName$ = Cell<string>('')

const DEFAULT_TOOLBAR_CONTENTS = () => {
  return 'This is an empty toolbar. Pass `{toolbarContents: () => { return <>toolbar components</> }}` to the toolbarPlugin to customize it.'
}

/**
 * A plugin that adds a toolbar to the editor.
 * @group Toolbar
 */
export const toolbarPlugin = realmPlugin<{
  /**
   * Contents of the toolbar
   */
  toolbarContents: () => React.ReactNode
  /**
   * The class name to apply to the toolbar element
   */
  toolbarClassName?: string
  /**
   * Controls the position of the toolbar (top by default)
   */
  toolbarPosition?: 'top' | 'bottom'
}>({
  init(realm, params) {
    const toolbarPositionSymbol = params?.toolbarPosition === 'bottom' ? addBottomAreaChild$ : addTopAreaChild$
    realm.pubIn({
      [toolbarContents$]: params?.toolbarContents ?? DEFAULT_TOOLBAR_CONTENTS,
      [toolbarClassName$]: params?.toolbarClassName ?? '',
      [toolbarPositionSymbol]: () => {
        const [toolbarContents, readOnly, toolbarClassName] = useCellValues(toolbarContents$, readOnly$, toolbarClassName$)
        return (
          <Root className={toolbarClassName} readOnly={readOnly}>
            {toolbarContents()}
          </Root>
        )
      }
    })
  },
  update(realm, params) {
    realm.pub(toolbarContents$, params?.toolbarContents ?? DEFAULT_TOOLBAR_CONTENTS)
    realm.pub(toolbarClassName$, params?.toolbarClassName ?? '')
  }
})
