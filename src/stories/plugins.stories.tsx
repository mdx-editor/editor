import React from 'react'
import { RealmPluginInitializer, realmPlugin, system } from '../gurx'

const coreSys = system((r) => {
  const b = r.node<string>('hello')
  return { b }
}, [])

const sys = system(
  (r) => {
    const a = r.node<number>(2)
    return { a }
  },
  [coreSys]
)

const [corePlugin] = realmPlugin({
  systemSpec: coreSys
})

const [myPlugin, hooks] = realmPlugin({
  systemSpec: sys,

  applyParamsToSystem: (r, params: { a: number }) => {
    r.pubKey('b', 'foo')
    r.pubKey('a', params.a)
  }
})

const Child = () => {
  const [a, b] = hooks.useEmitterValues('a', 'b')
  return (
    <div data-testid="value">
      {a}, {b}
    </div>
  )
}

export function Example() {
  const [a, setA] = React.useState(10)
  return (
    <>
      <button onClick={() => setA((a) => a + 1)}>Increment</button>

      <RealmPluginInitializer plugins={[corePlugin(), myPlugin({ a })]}>
        Hello world
        <Child />
      </RealmPluginInitializer>
    </>
  )
}
