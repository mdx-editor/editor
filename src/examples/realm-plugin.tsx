import React from 'react'
import { RealmWithPlugins, realmPlugin } from '../RealmWithPlugins'
import { Cell, useCellValue } from '@mdxeditor/gurx'

const cell$ = Cell('foo', (r) => {
  r.sub(cell$, (v) => {
    console.log(v)
  })
})

const dumbPlugin = realmPlugin<string>({
  init: (realm, cellValue) => {
    realm.pubIn({
      [cell$]: cellValue
    })
  },
  update: (realm, cellValue) => {
    realm.pubIn({
      [cell$]: cellValue
    })
  }
})

function Child() {
  const cellValue = useCellValue(cell$)
  return <div>{cellValue}</div>
}

export function Example() {
  const [prop, setProp] = React.useState('foo')
  return (
    <div>
      <button
        onClick={() => {
          setProp('bar')
        }}
      >
        Change prop
      </button>
      <RealmWithPlugins plugins={[dumbPlugin(prop)]}>
        <Child />
      </RealmWithPlugins>
    </div>
  )
}
