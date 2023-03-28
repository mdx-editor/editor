/* eslint-disable @typescript-eslint/restrict-plus-operands */
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { realm, Realm, RefCount } from '../../gurx'
describe('gurx realm', () => {
  let r: Realm
  beforeEach(() => {
    r = realm()
  })

  it('supports pub/sub', () => {
    const n = r.node<string>()
    const spy = vi.fn()
    r.sub(n, spy)
    r.pub(n, 'foo')
    expect(spy).toHaveBeenCalledWith('foo')
  })

  it('supports undefined initial value', () => {
    const n = r.node<string | undefined>(undefined, true)
    const q = r.node(1, true)
    const tc = r.node<number>(0, true)
    r.link(
      r.pipe(
        r.combine(n, q),
        r.o.filter(([data]) => data !== undefined),
        r.o.map(([data]) => data?.length)
      ),
      tc
    )

    const spy = vi.fn()
    r.sub(tc, spy)
    r.label({ n, q })
    r.pubKeys({ n: 'foo' })
    expect(spy).toHaveBeenCalledWith(3)
  })

  it('connects nodes', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    r.connect<[number]>({
      map: (done) => (value) => done(value * 2),
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 2)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('publishes once with diamond dependencies', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    const c = r.node<number>()
    const d = r.node<number>()
    // const e = r.node<number>()

    r.connect<[number]>({
      map: (done) => (value) => done(value * 2),
      sink: b,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value * 3),
      sink: c,
      sources: [a],
    })

    r.connect<[number, number]>({
      map: (done) => (b, c) => done(b + c),
      sink: d,
      sources: [b, c],
    })

    const spy = vi.fn()
    r.sub(d, spy)
    r.pub(a, 2)

    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(10)
  })

  it('handles multiple conditional execution paths', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    const c = r.node<number>()
    const d = r.node<number>()
    r.label({ a, b, c, d })

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        if (value % 2 === 0) {
          done(value)
        }
      },
      sink: c,
      sources: [b],
    })

    r.connect<[number]>({
      map: (done) => (value) => {
        done(value * 2)
      },
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    const spy2 = vi.fn()
    r.sub(d, spy2)

    r.pubIn({
      [a.key]: 2,
      [b.key]: 3,
    })
    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledWith(4)
    expect(spy2).toHaveBeenCalledTimes(1)

    r.pubIn({
      [a.key]: 3,
      [b.key]: 4,
    })
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
    expect(spy2).toHaveBeenCalledWith(8)
    expect(spy2).toHaveBeenCalledTimes(2)
  })

  it('handles pull dependencies', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    const c = r.node<number>()
    const d = r.node<number>()
    const e = r.node<number>()
    const f = r.node<number>()
    const g = r.node<number>()
    const h = r.node<number>()

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: b,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: c,
      sources: [b],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: d,
      sources: [c],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: e,
      sources: [d],
    })

    r.connect<[number, number]>({
      map: (done) => (a, e) => done(a + e + 1),
      pulls: [e],
      sink: f,
      sources: [a],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: g,
      sources: [f],
    })

    r.connect<[number]>({
      map: (done) => (value) => done(value + 1),
      sink: h,
      sources: [g],
    })

    const spy = vi.fn()
    r.sub(f, spy)
    r.pub(a, 1)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(7)
  })

  it('supports conditional connections', () => {
    const a = r.node<number>()
    const b = r.node<number>()

    r.connect<[number]>({
      map: (done) => (value) => value % 2 === 0 && done(value),
      sink: b,
      sources: [a],
    })

    const spy = vi.fn()
    r.sub(b, spy)
    r.pub(a, 1)
    r.pub(a, 2)
    r.pub(a, 3)
    r.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).not.toHaveBeenCalledWith(3)
    expect(spy).not.toHaveBeenCalledWith(1)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('canceled connection cancels further execution', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    const c = r.node<number>()
    const d = r.node<number>()

    r.connect<[number]>({
      map: (done) => (value) => value % 2 === 0 && done(value),
      sink: b,
      sources: [a],
    })

    r.connect({
      map: (done) => (value) => done(value),
      sink: c,
      sources: [b],
    })

    r.connect({
      map: (done) => (value) => done(value),
      sink: d,
      sources: [c],
    })

    const spy = vi.fn()
    r.sub(d, spy)
    r.pub(a, 1)
    r.pub(a, 2)
    r.pub(a, 3)
    r.pub(a, 4)

    expect(spy).toHaveBeenCalledWith(2)
    expect(spy).not.toHaveBeenCalledWith(3)
    expect(spy).not.toHaveBeenCalledWith(1)
    expect(spy).toHaveBeenCalledWith(4)
    expect(spy).toHaveBeenCalledTimes(2)
  })

  it('supports publishing in multiple nodes with a single call', () => {
    const a = r.node<number>()
    const b = r.node<number>()
    const c = r.node<number>()

    r.connect<[number, number]>({
      map: (done) => (a, b) => done(a + b),
      sink: c,
      sources: [a, b],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    r.pubIn({ [a.key]: 2, [b.key]: 3 })

    expect(spy).toHaveBeenCalledWith(5)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pulls from stateful nodes', () => {
    const a = r.node('foo')
    const b = r.node()
    const c = r.node()

    r.connect<[number, number]>({
      map: (done) => (b, a) => done(a + b),
      pulls: [a],
      sink: c,
      sources: [b],
    })

    const spy = vi.fn()
    r.sub(c, spy)
    r.pub(b, 'bar')
    expect(spy).toHaveBeenCalledWith('foobar')
  })

  it('does not recall subscriptions for distinct stateful nodes', () => {
    const a = r.node('foo', true)
    const spy = vi.fn()
    r.sub(a, spy)
    r.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('does not recall subscriptions for distinct stateful child nodes', () => {
    const a = r.node('bar')
    const b = r.node('foo', true)
    const spy = vi.fn()
    r.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })
    r.sub(b, spy)
    r.pub(a, 'foo')
    r.pub(a, 'foo')

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports custom comparator when distinct flag is set', () => {
    const a = r.node({ id: 'foo' }, (current, next) => current.id === next.id)
    const spy = vi.fn()
    r.sub(a, spy)
    r.pub(a, { id: 'foo' })

    expect(spy).toHaveBeenCalledTimes(0)
  })

  it('supports subscribing to multiple nodes', () => {
    const a = r.node('bar')
    const b = r.node('foo', true)
    const spy = vi.fn()
    r.connect({
      map: (value) => value,
      sink: b,
      sources: [a],
    })

    r.sub(a, b, spy)

    r.pubIn({
      [a.key]: 'qux',
      [b.key]: 'mu',
    })

    expect(spy).toHaveBeenCalledWith(['qux', 'mu'])
    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('pubs subscription for multiple keys when one is updated', () => {
    const a = r.node('1')
    const b = r.node('2')
    const spy = vi.fn()
    r.label({
      a,
      b,
    })
    r.subKeys(['a', 'b'], spy)
    r.pub(a, '2')
    expect(spy).toHaveBeenCalledWith(['2', '2'])
    expect(spy).toHaveBeenCalledTimes(1)
  })
})

describe('ref counter', () => {
  it('increments by one', () => {
    const counter = new RefCount()
    const key = 'foo'
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(1)
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(2)
  })

  it('decrements by one', () => {
    const cb = vi.fn()
    const counter = new RefCount()
    const key = 'foo'
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(1)
    counter.increment(key)
    expect(counter.map.get(key)).toEqual(2)
    counter.decrement(key, cb)
    expect(counter.map.get(key)).toEqual(1)
    counter.decrement(key, cb)
    expect(cb).toHaveBeenCalledTimes(1)
  })
})

describe('singleton subscription', () => {
  it('calls the subscription', () => {
    const r = realm()
    const a = r.node<number>()
    const spy1 = vi.fn()
    r.singletonSub(a, spy1)
    r.pub(a, 2)
    expect(spy1).toHaveBeenCalledWith(2)
  })

  it('replaces the subscription', () => {
    const r = realm()
    const a = r.node<number>()
    const spy1 = vi.fn()
    const spy2 = vi.fn()
    r.singletonSub(a, spy1)
    r.pub(a, 2)
    r.singletonSub(a, spy2)
    r.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
    expect(spy2).toHaveBeenCalledTimes(1)
  })

  it('returns an unsubscribe handler', () => {
    const r = realm()
    const a = r.node<number>()
    const spy1 = vi.fn()
    const unsub = r.singletonSub(a, spy1)
    r.pub(a, 2)
    unsub()
    r.pub(a, 3)
    expect(spy1).toHaveBeenCalledTimes(1)
  })
})

/*
describe.skip("performance", () => {
  it("reuses calculated paths", () => {
    const r = realm();
    const MAX_DEPTH = 10;
    let subCalledCount = 0;
    let nodeCount = 0;
    const recursivelyAddTwoChildren = (parent: NodeKey, depth = 0) => {
      const n1 = r.node();
      const n2 = r.node();
      nodeCount++;
      r.connect({ sources: [parent], sink: n1.key, map: (done) => (value) => done(value * 2) });
      r.connect({ sources: [parent], sink: n2.key, map: (done) => (value) => done(value * 3) });
      if (depth < MAX_DEPTH) {
        recursivelyAddTwoChildren(n1.key, depth + 1);
        recursivelyAddTwoChildren(n2.key, depth + 1);
      } else {
        r.sub(n1.key, () => subCalledCount++);
        r.sub(n2.key, () => subCalledCount++);
      }
    };

    const root = r.node("root");
    recursivelyAddTwoChildren(root.key);

    const t0 = performance.now();
    for (let index = 0; index < 100; index++) {
      r.pub({ root: 2 });
    }

    const t1 = performance.now();
    console.log("Took", (t1 - t0).toFixed(4), "milliseconds to publish");

    console.log({ subCalledCount, nodeCount });
  });
});
*/
