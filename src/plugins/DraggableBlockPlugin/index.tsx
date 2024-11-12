import { addComposerChild$ } from '../core'
import { realmPlugin } from '../../RealmWithPlugins'

import { DraggableBlockNode } from './DraggableBlockNode'
import React from 'react'

export const draggableBlockPlugin = realmPlugin({
  init: (realm) => {
    realm.pubIn({
      [addComposerChild$]: () => <DraggableBlockNode />
    })
  }
})
