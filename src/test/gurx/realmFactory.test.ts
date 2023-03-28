/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { describe, it, expect, vi } from 'vitest'
import { system, realmFactory } from '../../gurx'

describe('realm factory', () => {
  it('constructs a strongly typed labeled realm', () => {
    const [sysA, sysAType] = system((r) => {
      const a = r.node(2)
      const b = r.node(1)
      const k = r.node('foo')
      return { a, b, k }
    }, [])

    const [sysB] = system(
      (r, [{ a, b }]) => {
        const c = r.node<number>()
        r.connect({
          map: (done) => (a, b) => {
            done((a as number) + (b as number))
          },
          sink: c,
          sources: [a, b],
        })
        return { c }
      },
      [sysAType]
    )

    const r = realmFactory(sysA, sysB)
    const spy = vi.fn()
    const spy2 = vi.fn()
    r.subKeys(['c'], spy)
    r.subKeys(['c', 'a'], spy2)
    r.pubKeys({ b: 3 })
    // r.pub(r.labels.b, 3);

    expect(spy).toHaveBeenCalledWith(3 + 2)
    r.pubKeys({ a: 3, b: 5 })
    // r.pub(r.labels.b, 5, r.labels.a, 3);
    expect(spy).toHaveBeenCalledWith(5 + 3)
    expect(spy2).toHaveBeenCalledWith([5 + 3, 3])
  })

  it('supports swapping dependencies', () => {
    const [, sysAType] = system((r) => {
      const a = r.node('foo')
      return { a }
    }, [])

    const [sysACopy] = system(
      (r) => {
        const a = r.node('bar')
        return { a }
      },
      [],
      sysAType.id
    )

    const [sysB] = system(
      (r, [{ a }]) => {
        const b = r.node<string>()
        r.connect({
          map: (done) => (value) => done(value),
          sink: b,
          sources: [a],
        })

        return { b }
      },
      [sysAType]
    )

    const r = realmFactory(sysB, sysACopy)
    const spy = vi.fn()
    r.sub(r.labels.a, spy)
    r.pubKeys({ a: 'bar' })
    expect(spy).toHaveBeenCalledWith('bar')
  })
})
