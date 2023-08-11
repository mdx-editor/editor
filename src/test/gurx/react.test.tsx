/**
 * @jest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest'

import * as React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useState } from 'react'
import { realmFactoryToComponent, system, getRealmFactory } from '../../gurx'

const simpleRealm = () => {
  const sys = system((r) => {
    const prop = r.node<number>()
    const depot = r.node(10)
    r.connect({ map: (done) => (value) => done(value), sink: depot, sources: [prop] })

    return { depot, prop }
  }, [])

  return getRealmFactory(sys)
}

describe('generated component', () => {
  it('loads and displays greeting', () => {
    const factory = simpleRealm()
    const { Component: Comp, useEmitterValues } = realmFactoryToComponent(factory, {
      optional: { prop: 'prop' }
    })

    const Child = () => {
      const [value] = useEmitterValues('depot')
      return <div data-testid="value">{value}</div>
    }

    render(
      <Comp>
        <Child />
      </Comp>
    )

    expect(screen.getByTestId('value')).toHaveTextContent('10')
  })

  it('supports updates of multiple nodes', () => {
    const sys = system((r) => {
      const prop1 = r.node<number>(1)
      const prop2 = r.node<number>(2)

      return { prop1, prop2 }
    }, [])

    const { Component: Comp, useEmitterValues } = realmFactoryToComponent(getRealmFactory(sys), {
      optional: { prop1: 'prop1', prop2: 'prop2' }
    })

    const Child = () => {
      const [prop1, prop2] = useEmitterValues('prop1', 'prop2')
      return (
        <div data-testid="prop1-prop2">
          {prop1} - {prop2}
        </div>
      )
    }

    const Test = () => {
      const [p, setP] = useState(1)
      return (
        <>
          <button data-testid="bump" onClick={() => setP((v) => v + 1)}>
            Bump
          </button>

          <Comp prop1={p}>
            <Child />
          </Comp>
        </>
      )
    }

    const { queryByTestId } = render(<Test />)
    expect(screen.getByTestId('prop1-prop2')).toHaveTextContent('1 - 2')
    fireEvent.click(queryByTestId('bump')!)
    expect(screen.getByTestId('prop1-prop2')).toHaveTextContent('2 - 2')
  })

  it('emits an event', () => {
    const factory = simpleRealm()
    const spy = vi.fn()
    const { Component: Comp, usePublisher } = realmFactoryToComponent(factory, {
      events: { propChanged: 'prop' }
    })

    const Child = () => {
      const publisher = usePublisher('prop')
      return (
        <div data-testid="value">
          <button
            onClick={() => {
              publisher(10)
            }}
            data-testid="button"
          >
            Click me
          </button>
        </div>
      )
    }

    const { queryByTestId } = render(
      <Comp propChanged={spy}>
        <Child />
      </Comp>
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.click(queryByTestId('button')!)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('unsubscribes previous emitter', () => {
    const factory = simpleRealm()
    const spy = vi.fn()
    const {
      Component: Comp,
      useEmitter,
      usePublisher
    } = realmFactoryToComponent(factory, {
      events: {}
    })

    const Child = () => {
      const [counter, setCounter] = React.useState(1)
      const publisher = usePublisher('prop')
      const callback = React.useCallback(
        (value: number) => {
          spy([value, counter])
        },
        [counter]
      )

      useEmitter('prop', callback)

      return (
        <div data-testid="value">
          <button
            onClick={() => {
              setCounter((counter) => counter + 1)
            }}
            data-testid="button-increase-counter"
          >
            Increase counter
          </button>

          <button
            onClick={() => {
              publisher(100)
            }}
            data-testid="button-publish-in-prop"
          >
            Pub in prop
          </button>
        </div>
      )
    }

    const { queryByTestId } = render(
      <Comp>
        <Child />
      </Comp>
    )

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    fireEvent.click(queryByTestId('button-publish-in-prop')!)
    expect(spy).toHaveBeenCalledWith([100, 1])
    fireEvent.click(queryByTestId('button-increase-counter')!)
    fireEvent.click(queryByTestId('button-publish-in-prop')!)
    expect(spy).toHaveBeenCalledWith([100, 2])
    fireEvent.click(queryByTestId('button-increase-counter')!)
    fireEvent.click(queryByTestId('button-publish-in-prop')!)
    expect(spy).toHaveBeenCalledWith([100, 3])
    expect(spy).toHaveBeenCalledTimes(3)
  })
})
