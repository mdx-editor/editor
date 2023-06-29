import { describe, it, expect, vi } from 'vitest'

import { realm } from '../../gurx'

describe('pipe', () => {
  it('maps node values', () => {
    const r = realm()
    const a = r.node<number>()

    const b = r.pipe(
      a,
      r.o.map((val: number) => val * 2)
    )
    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4)
  })

  it('filters node values', () => {
    const r = realm()
    const a = r.node<number>()

    const b = r.pipe(
      a,
      r.o.filter((val: number) => val % 2 === 0)
    )

    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 2)
    r.pub(a, 3)
    r.pub(a, 4)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).not.toHaveBeenCalledWith(3)
    expect(spy).toHaveBeenCalledWith(2)
  })

  it('pulls values in withLatestFrom', () => {
    const r = realm()
    const a = r.node('foo')
    const b = r.node('bar')

    const c = r.pipe(a, r.o.withLatestFrom(b))

    const spy = vi.fn()
    r.sub(c, spy)

    r.pub(a, 'baz')
    expect(spy).toHaveBeenCalledWith(['baz', 'bar'])
    r.pub(b, 'qux')
    expect(spy).toHaveBeenCalledTimes(1)
    r.pub(a, 'foo')
    expect(spy).toHaveBeenCalledWith(['foo', 'qux'])
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('maps to fixed value with mapTo', () => {
    const r = realm()
    const a = r.node<number>()

    const b = r.pipe(a, r.o.mapTo('bar'))

    const spy = vi.fn()
    r.sub(b, spy)

    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith('bar')
  })

  it('accumulates with scan', () => {
    const r = realm()
    const a = r.node<number>()

    const b = r.pipe(
      a,
      r.o.scan((acc, value) => acc + value, 1)
    )

    const spy = vi.fn()
    r.sub(b, spy)

    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(3)

    r.pub(a, 3)
    expect(spy).toHaveBeenCalledWith(6)
  })

  it('onNext publishes only once, when the trigger node emits', () => {
    const r = realm()
    const a = r.node<number>()
    const b = r.node<number>()

    const c = r.pipe(a, r.o.onNext(b))

    const spy = vi.fn()
    r.sub(c, spy)

    r.pub(a, 2)
    expect(spy).toHaveBeenCalledTimes(0)

    r.pub(b, 3)
    expect(spy).toHaveBeenCalledWith([2, 3])
    expect(spy).toHaveBeenCalledTimes(1)

    // next publish should not retrigger the sub
    r.pub(b, 4)
    expect(spy).toHaveBeenCalledTimes(1)

    // a new value should activate the triggering again
    r.pub(a, 2)
    r.pub(b, 4)
    expect(spy).toHaveBeenCalledWith([2, 4])
    expect(spy).toHaveBeenCalledTimes(2)

    // simultaneous publishing should not trigger
    r.pubIn({
      [a.key]: 3,
      [b.key]: 3
    })
    expect(spy).toHaveBeenCalledTimes(2)

    r.pub(b, 4)
    expect(spy).toHaveBeenCalledTimes(3)
  })

  it('once publishes only once', () => {
    const r = realm()
    const a = r.node<number>()
    const b = r.node<number>()

    r.link(r.pipe(a, r.o.once()), b)

    const spy = vi.fn()
    r.sub(b, spy)

    r.pub(a, 1)
    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(1)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('throttleTime delays the execution', () => {
    return new Promise((resolve) => {
      const r = realm()
      const a = r.node<number>()
      const b = r.pipe(a, r.o.throttleTime(50))
      const spy = vi.fn()
      r.sub(b, spy)

      r.pub(a, 1)
      setTimeout(() => r.pub(a, 2), 20)
      setTimeout(() => r.pub(a, 3), 30)

      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith(3)
        expect(spy).toHaveBeenCalledTimes(1)
        resolve(true)
      }, 60)
    })
  })

  it('debounceTime bounces the execution', () => {
    return new Promise((resolve) => {
      const r = realm()
      const a = r.node<number>()
      const b = r.pipe(a, r.o.debounceTime(50))
      const spy = vi.fn()
      r.sub(b, spy)

      r.pub(a, 1)
      setTimeout(() => r.pub(a, 2), 20)
      setTimeout(() => r.pub(a, 3), 30)

      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(0)
      }, 50)

      setTimeout(() => {
        expect(spy).toHaveBeenCalledWith(3)
        expect(spy).toHaveBeenCalledTimes(1)
        resolve(true)
      }, 100)
    })
  })

  it('passOnlyAfterNodeHasEmittedBefore emits only in the specified interval', () => {
    return new Promise((resolve) => {
      const r = realm()
      const a = r.node<string>()
      const b = r.node<boolean>()
      const limit = r.node(200)
      const spy = vi.fn()
      r.sub(r.pipe(a, r.o.passOnlyAfterNodeHasEmittedBefore(b, limit)), spy)

      r.pub(a, 'qux')
      expect(spy).toHaveBeenCalledTimes(0)
      r.pub(b, true)
      setTimeout(() => r.pub(a, 'foo'), 20)
      setTimeout(() => r.pub(a, 'bar'), 30)
      setTimeout(() => r.pub(a, 'baz'), 250)

      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(2)
        expect(spy).toHaveBeenCalledWith('foo')
        expect(spy).toHaveBeenCalledWith('bar')
        resolve(true)
      }, 300)
    })
  })

  it('combines node values', () => {
    const r = realm()
    const a = r.node<number>(0)
    const b = r.node<number>(0)
    const d = r.node<number>(6)

    const c = r.combine(a, b, d)

    const spy = vi.fn()
    r.sub(c, spy)
    r.pubIn({ [a.key]: 3, [b.key]: 4 })
    expect(spy).toHaveBeenCalledWith([3, 4, 6])
    expect(spy).toHaveBeenCalledTimes(1)
    r.pub(d, 7)
    expect(spy).toHaveBeenCalledWith([3, 4, 7])
  })
})
