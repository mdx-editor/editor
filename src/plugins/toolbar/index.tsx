import { realmPlugin } from '../../RealmWithPlugins'
import { Cell, useCellValues } from '@mdxeditor/gurx'
import React from 'react'
import { addTopAreaChild$, readOnly$ } from '../core'
import { Root } from './primitives/toolbar'

/**
 * The factory function that returns the contents of the toolbar.
 * @group Toolbar
 */
export const toolbarContents$ = Cell<() => React.ReactNode>(() => null)

const DEFAULT_TOOLBAR_CONTENTS = () => {
  return 'This is an empty toolbar. Pass `{toolbarContents: () => { return <>toolbar components</> }}` to the toolbarPlugin to customize it.'
}

/**
 * Max height to limit select element in toolbar.
 * If set, the select element will be scrollable if it's height over this limit.
 */
export const selectMaxHeight$ = Cell<string>('')

/**
 * A plugin that adds a toolbar to the editor.
 * @group Toolbar
 */
export const toolbarPlugin = realmPlugin<{ toolbarContents: () => React.ReactNode; selectMaxHeight?: string }>({
  init(realm, params) {
    realm.pubIn({
      [toolbarContents$]: params?.toolbarContents ?? DEFAULT_TOOLBAR_CONTENTS,
      [addTopAreaChild$]: () => {
        const [toolbarContents, readOnly] = useCellValues(toolbarContents$, readOnly$)
        return <Root readOnly={readOnly}>{toolbarContents()}</Root>
      },
      [selectMaxHeight$]: params?.selectMaxHeight
    })
  },
  update(realm, params) {
    realm.pub(toolbarContents$, params?.toolbarContents ?? DEFAULT_TOOLBAR_CONTENTS)
  }
})
