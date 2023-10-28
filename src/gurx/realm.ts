import { tap } from '../utils/fp'
import { uuidv4 } from '../utils/uuid4'
import { LongTuple } from './realmFactory'

/** @internal */
export type NodeKey = string

/** @internal */
export interface RealmNode<_T = unknown> {
  key: NodeKey
  toString(): string
}

/** @internal */
type RN<T = unknown> = RealmNode<T>

/** @internal **/
export type Subscription<T = any> = (value: T) => unknown

/** @internal */
export type UnsubscribeHandle = () => void

type ProjectionFunc<T extends unknown[] = unknown[]> = (done: (...values: unknown[]) => void) => (...args: T) => void

/** @internal */
export interface RealmProjection<T extends unknown[] = unknown[]> {
  sources: Set<NodeKey>
  pulls: Set<NodeKey>
  sink: NodeKey
  map: ProjectionFunc<T>
}

/** @internal */
export interface RealmProjectionSpec<T extends unknown[] = unknown[]> {
  sources: RealmNode[]
  pulls?: RealmNode[]
  sink: RealmNode
  map: ProjectionFunc<T>
}

/**
 * A function which determines if two values are equal.
 * Implement custom comparators when the distinctUntilChanged operator needs to work on non-primitive objects.
 * @returns true if values should be considered equal.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface Comparator<T = any> {
  (current: T, next: T): boolean
}

type NodesFromValuesRec<T extends unknown[], Acc extends unknown[]> = T extends [infer Head, ...infer Tail]
  ? NodesFromValuesRec<Tail, [...Acc, Head extends unknown ? RealmNode<Head> : never]>
  : Acc

/** @internal */
export type NodesFromValues<T extends unknown[]> = T extends unknown[] ? NodesFromValuesRec<T, []> : never

/**
 * A comparator function to determine if two values are equal. Used by distinctUntilChanged  operator.
 */
export function defaultComparator<T>(current: T, next: T) {
  return current === next
}

class SetMap<T> {
  map = new Map<NodeKey, Set<T>>()

  getOrCreate(key: NodeKey) {
    let record = this.map.get(key)
    if (!record) {
      record = new Set<T>()
      this.map.set(key, record)
    }
    return record
  }

  get(key: NodeKey) {
    return this.map.get(key)
  }

  use(key: NodeKey, cb: (value: Set<T>) => unknown) {
    const set = this.get(key)
    if (set !== undefined) {
      cb(set)
    }
  }

  delete(key: NodeKey) {
    return this.map.delete(key)
  }
}

/**
 * @internal
 */
export class RefCount {
  map: Map<NodeKey, number>

  constructor(map = new Map<NodeKey, number>()) {
    this.map = map
  }

  clone() {
    return new RefCount(new Map(this.map))
  }

  increment(key: NodeKey) {
    const counter = this.map.get(key) ?? 0
    this.map.set(key, counter + 1)
  }

  decrement(key: NodeKey, ifZero: () => void) {
    let counter = this.map.get(key)
    if (counter !== undefined) {
      counter -= 1
      this.map.set(key, counter)
      if (counter === 0) {
        ifZero()
      }
    }
  }
}

/** @internal */
export type RealmGraph = SetMap<RealmProjection>
const NO_VALUE = Symbol('NO_VALUE')

/** @internal */
export function realm() {
  const subscriptions = new SetMap<Subscription>()
  const singletonSubscriptions = new Map<NodeKey, Subscription>()
  const graph: RealmGraph = new SetMap()
  const state = new Map<NodeKey, unknown>()
  const distinctNodes = new Map<NodeKey, Comparator>()
  const labels = {} as Record<string, RealmNode<unknown>>

  function node<T>(value: T | symbol = NO_VALUE, distinct: boolean | Comparator<T> = false): RealmNode<T> {
    const key: NodeKey = uuidv4()
    if (value !== NO_VALUE) {
      state.set(key, value)
    }
    if (distinct !== false) {
      distinctNodes.set(key, distinct === true ? defaultComparator : distinct)
    }
    return { key, toString: () => key } as RealmNode<T>
  }

  function subSingle<T>({ key }: RealmNode<T>, subscription: Subscription<T>): UnsubscribeHandle {
    const nodeSubscriptions = subscriptions.getOrCreate(key)
    nodeSubscriptions.add(subscription)
    return () => nodeSubscriptions.delete(subscription)
  }

  function singletonSub<T>({ key }: RealmNode<T>, subscription: Subscription<T> | undefined): UnsubscribeHandle {
    if (!subscription) {
      singletonSubscriptions.delete(key)
    } else {
      singletonSubscriptions.set(key, subscription)
    }
    return () => singletonSubscriptions.delete(key)
  }

  function singletonSubKey<T>(key: string, subscription: Subscription<T> | undefined): UnsubscribeHandle {
    return singletonSub(labels[key], subscription)
  }

  function resetSingletonSubs() {
    singletonSubscriptions.clear()
  }

  function subMultiple(sources: RealmNode[], cb: Subscription) {
    const sink = node()
    connect({
      map:
        (done) =>
        (...args) => {
          done(args)
        },
      sink,
      sources
    })
    return subSingle(sink, cb)
  }

  function sub<T1>(...args: [RN<T1>, Subscription<T1>]): UnsubscribeHandle
  function sub<T1, T2>(...args: [RN<T1>, RN<T2>, Subscription<[T1, T2]>]): UnsubscribeHandle
  function sub<T1, T2, T3>(...args: [RN<T1>, RN<T2>, RN<T3>, Subscription<[T1, T2, T3]>]): UnsubscribeHandle
  function sub(...args: unknown[]): UnsubscribeHandle {
    const [subscription] = args.slice(-1) as Subscription[]
    const nodes = args.slice(0, -1) as RN[]
    if (nodes.length === 1) {
      return subSingle(nodes[0], subscription)
    } else {
      return subMultiple(nodes, subscription)
    }
  }

  // function findLabel(key: NodeKey) {
  //   return Object.entries(labels).find(([, node]) => node.key === key)?.[0] || key
  // }

  function calculateExecutionMap(keys: NodeKey[]) {
    const participatingNodeKeys: NodeKey[] = []
    const visitedNodes = new Set()
    const pendingPulls = new SetMap<NodeKey>()
    const refCount = new RefCount()
    const projections = new SetMap<RealmProjection>()

    function visit(key: NodeKey, insertIndex = 0) {
      refCount.increment(key)

      if (visitedNodes.has(key)) {
        // console.log('cycle detected', findLabel(key))
        return
      }

      pendingPulls.use(key, (pulls) => {
        insertIndex = Math.max(...Array.from(pulls).map((key) => participatingNodeKeys.indexOf(key))) + 1
      })

      graph.use(key, (sinkProjections) => {
        sinkProjections.forEach((projection) => {
          if (projection.sources.has(key)) {
            projections.getOrCreate(projection.sink).add(projection)
            visit(projection.sink, insertIndex)
          } else {
            pendingPulls.getOrCreate(projection.sink).add(key)
          }
        })
      })

      visitedNodes.add(key)
      participatingNodeKeys.splice(insertIndex, 0, key)
    }

    keys.forEach((key) => visit(key))

    // console.log(participatingNodeKeys.map(findLabel).join(' -> '))

    return { participatingNodeKeys, pendingPulls, projections, refCount }
  }

  const executionMaps = new Map<string, ReturnType<typeof calculateExecutionMap>>()

  function pubIn(values: Record<NodeKey, unknown>) {
    const keys = Object.keys(values)
    const executionMapKey = keys.join(',')
    if (!executionMaps.has(executionMapKey)) {
      executionMaps.set(executionMapKey, calculateExecutionMap(keys))
    }

    const map = executionMaps.get(executionMapKey)!
    const refCount = map.refCount.clone()
    const participatingNodeKeys = map.participatingNodeKeys.slice()
    const transientState = new Map<NodeKey, unknown>(state)

    function nodeWillNotEmit(key: NodeKey) {
      graph.use(key, (projections) => {
        projections.forEach(({ sources, sink }) => {
          if (sources.has(key)) {
            refCount.decrement(sink, () => {
              participatingNodeKeys.splice(participatingNodeKeys.indexOf(sink), 1)
              nodeWillNotEmit(sink)
            })
          }
        })
      })
    }

    let nodeKey: NodeKey | undefined
    while ((nodeKey = participatingNodeKeys.shift())) {
      let resolved = false
      const done = (value: unknown) => {
        if (distinctNodes.has(nodeKey!) && distinctNodes.get(nodeKey!)!(state.get(nodeKey!), value)) {
          resolved = false
          return
        }
        resolved = true
        transientState.set(nodeKey!, value)
        if (state.has(nodeKey!)) {
          state.set(nodeKey!, value)
        }
      }
      if (Object.prototype.hasOwnProperty.call(values, nodeKey)) {
        done(values[nodeKey])
      } else {
        map.projections.use(nodeKey, (nodeProjections) => {
          nodeProjections.forEach((projection) => {
            const args = [...Array.from(projection.sources), ...Array.from(projection.pulls)].map((id) => transientState.get(id))
            projection.map(done)(...args)
          })
        })
      }

      if (resolved) {
        const value = transientState.get(nodeKey)
        subscriptions.use(nodeKey, (nodeSubscriptions) => {
          nodeSubscriptions.forEach((subscription) => subscription(value))
        })
        singletonSubscriptions.get(nodeKey)?.(value)
      } else {
        nodeWillNotEmit(nodeKey)
      }
    }
  }

  function nodesToKeySet(nodes: RealmNode[]) {
    return new Set(nodes.map((s) => s.key))
  }

  /**
   * A low-level utility that connects multiple nodes to a sink node with a map function.
   * The nodes can be active (sources) or passive (pulls).
   */
  function connect<T extends unknown[] = unknown[]>({ sources, pulls = [], map, sink: { key: sink } }: RealmProjectionSpec<T>) {
    const dependency: RealmProjection<T> = {
      map,
      pulls: nodesToKeySet(pulls),
      sink,
      sources: nodesToKeySet(sources)
    }

    ;[...sources, ...pulls].forEach(({ key: sourceKey }) => {
      graph.getOrCreate(sourceKey).add(dependency as RealmProjection<unknown[]>)
    })
    executionMaps.clear()
  }

  function pub<T1>(...args: [RN<T1>, T1]): void
  function pub<T1, T2>(...args: [RN<T1>, T1, RN<T2>, T2]): void
  function pub<T1, T2, T3>(...args: [RN<T1>, T1, RN<T2>, T2, RN<T3>, T3]): void
  function pub<T1, T2, T3, T4>(...args: [RN<T1>, T1, RN<T2>, T2, RN<T3>, T3, T4]): void
  function pub(...args: unknown[]): void {
    const map = {} as Record<string, unknown>
    for (let index = 0; index < args.length; index += 2) {
      const node = args[index] as RN<unknown>
      map[node.key] = args[index + 1]
    }
    pubIn(map)
  }

  function label(newLabels: Record<string, RealmNode<unknown>>) {
    Object.assign(labels, newLabels)
  }

  type Operator<I, OP> = (source: RealmNode<I>) => RealmNode<OP>

  /** @internal */
  type O<I, OP> = Operator<I, OP>

  function pipe<T>(s: RealmNode<T>): RealmNode<T> // prettier-ignore
  function pipe<T, O1>(s: RealmNode<T>, o1: O<T, O1>): RealmNode<O1> // prettier-ignore
  function pipe<T, O1, O2>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>]): RealmNode<O2> // prettier-ignore
  function pipe<T, O1, O2, O3>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>]): RealmNode<O3> // prettier-ignore
  function pipe<T, O1, O2, O3, O4>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>]): RealmNode<O4> // prettier-ignore
  function pipe<T, O1, O2, O3, O4, O5>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>]): RealmNode<O5> // prettier-ignore
  function pipe<T, O1, O2, O3, O4, O5, O6>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>]): RealmNode<O6> // prettier-ignore
  function pipe<T, O1, O2, O3, O4, O5, O6, O7>(s: RealmNode<T>, ...o: [O<T, O1>, O<O1, O2>, O<O2, O3>, O<O3, O4>, O<O4, O5>, O<O5, O6>, O<O6, O7>]): RealmNode<O7> // prettier-ignore
  function pipe<T>(source: RealmNode<T>, ...operators: O<unknown, unknown>[]): RealmNode<unknown> {
    for (const operator of operators) {
      source = operator(source)
    }
    return source
  }

  function spread<T extends LongTuple<unknown>>(source: RealmNode<T>, initialValues: T): NodesFromValues<T> {
    return initialValues.map((initialValue, index) => {
      // the distinct argument is hardcoded,
      // figure out better API
      return tap(node(initialValue, true), (sink) => {
        connect({
          map: (done) => (sourceValue) => {
            done((sourceValue as T)[index])
          },
          sink,
          sources: [source]
        })
      })
    }) as unknown as NodesFromValues<T>
  }

  /**
   * Links the output of a node to another node.
   */
  function link<T>(source: RealmNode<T>, sink: RealmNode<T>) {
    connect({ map: (done) => (value) => done(value), sink, sources: [source] })
  }

  /**
   * Constructs a new stateful node from an existing source.
   * The source can be node(s) that get transformed from a set of operators.
   * @example
   * ```tsx
   * const a = r.node(1)
   * const b = r.derive(r.pipe(a, r.o.map((v) => v * 2)), 2)
   * ```
   */
  function derive<T>(source: RealmNode<T>, initial: T) {
    return tap(node(initial, true), (sink) => {
      connect({ map: (done) => (value) => done(value), sink, sources: [source] })
    })
  }

  /**
   * Operator that maps a the value of a node to a new node with a projection function.
   */
  function map<I, O>(mapFunction: (value: I) => O) {
    return ((source: RealmNode<I>) => {
      const sink = node<O>()
      connect({
        map: (done) => (value) => {
          done(mapFunction(value as I))
        },
        sink,
        sources: [source]
      })
      return sink
    }) as Operator<I, O>
  }

  /**
   * Operator that maps the output of a node to a fixed value.
   */
  function mapTo<I, O>(value: O) {
    return ((source: RealmNode<I>) => {
      const sink = node<O>()
      connect({ map: (done) => () => done(value), sink, sources: [source] })
      return sink
    }) as Operator<I, O>
  }

  /**
   * Operator that filters the output of a node.
   * If the predicate returns false, the emission is canceled.
   */
  function filter<I, O = I>(predicate: (value: I) => boolean) {
    return ((source: RealmNode<I>) => {
      const sink = node<O>()
      connect({ map: (done) => (value) => predicate(value as I) && done(value), sink, sources: [source] })
      return sink
    }) as Operator<I, O>
  }

  /**
   * Operator that captures the first emitted value of a node.
   * Useful if you want to execute a side effect only once.
   */
  function once<I>() {
    return ((source: RealmNode<I>) => {
      const sink = node<I>()

      let passed = false
      connect({
        map: (done) => (value) => {
          if (!passed) {
            passed = true
            done(value)
          }
        },
        sink,
        sources: [source]
      })
      return sink
    }) as Operator<I, I>
  }

  /**
   * Operator that runs with the latest and the current value of a node.
   * Works like the {@link https://rxjs.dev/api/operators/scan | RxJS scan operator}.
   */
  function scan<I, O>(accumulator: (current: O, value: I) => O, seed: O) {
    return ((source: RealmNode<I>) => {
      const sink = node<O>()
      connect({ map: (done) => (value) => done((seed = accumulator(seed, value as I))), sink, sources: [source] })
      return sink
    }) as Operator<I, O>
  }

  /**
   * Throttles the output of a node with the specified delay.
   */
  function throttleTime<I>(delay: number) {
    return ((source: RealmNode<I>) => {
      const sink = node<I>()
      let currentValue: I | undefined
      let timeout: ReturnType<typeof setTimeout> | undefined

      sub(source, (value) => {
        currentValue = value

        if (timeout) {
          return
        }

        timeout = setTimeout(() => {
          timeout = undefined
          pub(sink, currentValue!)
        }, delay)
      })

      return sink
    }) as Operator<I, I>
  }

  /**
   * Delays the output of a node with `queueMicrotask`.
   */
  function delayWithMicrotask<I>() {
    return ((source: RealmNode<I>) => {
      const sink = node<I>()
      sub(source, (value) => queueMicrotask(() => pub(sink, value)))
      return sink
    }) as Operator<I, I>
  }

  /**
   * Debounces the output of a node with the specified delay.
   */
  function debounceTime<I>(delay: number) {
    return ((source: RealmNode<I>) => {
      const sink = node<I>()
      let currentValue: I | undefined
      let timeout: ReturnType<typeof setTimeout> | undefined

      sub(source, (value) => {
        currentValue = value

        if (timeout) {
          clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
          pub(sink, currentValue!)
        }, delay)
      })

      return sink
    }) as Operator<I, I>
  }

  /**
   * Buffers the stream of a node until the passed note emits.
   */
  function onNext<I, O>(bufNode: RN<O>) {
    return ((source: RealmNode<I>) => {
      const sink = node<O>()
      let pendingValue: I | typeof NO_VALUE = NO_VALUE
      sub(source, (value) => (pendingValue = value))
      connect({
        map: (done) => (value) => {
          if (pendingValue !== NO_VALUE) {
            done([pendingValue, value])
            pendingValue = NO_VALUE
          }
        },
        sink,
        sources: [bufNode]
      })
      return sink
    }) as Operator<I, [I, O]>
  }

  /**
   * Conditionally passes the stream of a node only if the passed note
   * has emitted before a certain duration (in seconds).
   */
  function passOnlyAfterNodeHasEmittedBefore<I>(starterNode: RN<unknown>, durationNode: RN<number>) {
    return (source: RealmNode<I>) => {
      const sink = node<I>()
      let startTime = 0
      sub(starterNode, () => (startTime = Date.now()))
      connect({
        map: (done) => (value) => {
          if (Date.now() < startTime + (state.get(durationNode.key) as number)) {
            done(value)
          }
        },
        sink,
        sources: [source]
      })
      return sink
    }
  }

  /**
   * Pulls the latest values from the passed nodes.
   * Note: The operator does not emit when the nodes emit. If you want to get that, use the `combine` function.
   */
  function withLatestFrom<I, T1>(...nodes: [RN<T1>]): (source: RN<I>) => RN<[I, T1]> // prettier-ignore
  function withLatestFrom<I, T1, T2>(...nodes: [RN<T1>, RN<T2>]): (source: RN<I>) => RN<[I, T1, T2]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3>(...nodes: [RN<T1>, RN<T2>, RN<T3>]): (source: RN<I>) => RN<[I, T1, T2, T3]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3, T4>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>]): (source: RN<I>) => RN<[I, T1, T2, T3, T4]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3, T4, T5>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>]): (source: RN<I>) => RN<[I, T1, T2, T3, T4, T5]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3, T4, T5, T6>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>]): (source: RN<I>) => RN<[I, T1, T2, T3, T4, T5, T6]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>]): (source: RN<I>) => RN<[I, T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  function withLatestFrom<I, T1, T2, T3, T4, T5, T6, T7, T8>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>]): (source: RN<I>) => RN<[I, T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  function withLatestFrom<I>(...nodes: RN[]) {
    return (source: RN<I>) => {
      const sink = node()
      connect({
        map:
          (done) =>
          (...args) =>
            done(args),
        pulls: nodes,
        sink,
        sources: [source]
      })
      return sink
    }
  }

  /**
   * Combines the values from multiple nodes into a single node
   * that emits an array of the latest values the nodes.
   * When one of the source nodes emits a value, the combined node
   * emits an array of the latest values from each node.
   * @example
   * ```tsx
   * const a = r.node(1)
   * const b = r.node(2)
   * const ab = r.combine(a, b)
   * r.sub(ab, ([a, b]) => console.log(a, b))
   * r.pub(a, 2)
   * r.pub(b, 3)
   * ```
   */
  function combine<T1>(...nodes: [RN<T1>]): RN<T1> // prettier-ignore
  function combine<T1, T2>(...nodes: [RN<T1>, RN<T2>]): RN<[T1, T2]> // prettier-ignore
  function combine<T1, T2, T3>(...nodes: [RN<T1>, RN<T2>, RN<T3>]): RN<[T1, T2, T3]> // prettier-ignore
  function combine<T1, T2, T3, T4>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>]): RN<[T1, T2, T3, T4]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>]): RN<[T1, T2, T3, T4, T5]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>]): RN<[T1, T2, T3, T4, T5, T6]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>]): RN<[T1, T2, T3, T4, T5, T6, T7]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>, RN<T11>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>, RN<T11>, RN<T12>, RN<T13>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>, RN<T11>, RN<T12>, RN<T13>, RN<T14>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>, RN<T11>, RN<T12>, RN<T13>, RN<T14>, RN<T15>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15]> // prettier-ignore
  function combine<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>(...nodes: [RN<T1>, RN<T2>, RN<T3>, RN<T4>, RN<T5>, RN<T6>, RN<T7>, RN<T8>, RN<T9>, RN<T10>, RN<T11>, RN<T12>, RN<T13>, RN<T14>, RN<T15>, RN<T16>]): RN<[T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16]> // prettier-ignore
  function combine(...nodes: RN[]): RN {
    const sink = node()
    connect({
      map:
        (done) =>
        (...args) =>
          done(args),
      sink,
      sources: nodes
    })
    return sink
  }

  /**
   * Subscribes the passed callback to the output of a node.
   * @param key - the key of the node.
   */
  function subKey(key: string, subscription: Subscription<unknown>): UnsubscribeHandle {
    return sub(labels[key], subscription)
  }

  /**
   * Subscribes the passed callback to the output of multiple nodes.
   * @param keys - the keys of the nodes.
   */
  function subKeys(keys: string[], subscription: Subscription<unknown>): UnsubscribeHandle {
    const nodes = keys.map((key) => labels[key])
    // @ts-expect-error why?
    return sub(...nodes.concat(subscription))
  }

  /**
   * Publishes the passed value to the output of a node.
   * @param key - the key of the node.
   */
  function pubKey(key: string, value: unknown) {
    pubKeys({ [key]: value })
  }

  /**
   * Publishes a set of values to the output of multiple nodes.
   */
  function pubKeys(values: Record<string, unknown>) {
    const valuesWithInternalKeys = Object.entries(values).reduce(
      (acc, [key, value]) =>
        tap(acc, (acc) => {
          const label = labels[key]
          if (!label) {
            throw new Error(`No label for key ${key}. Do you miss a plugin?`)
          }
          acc[label.key] = value
          return value
        }),
      {} as Record<string, unknown>
    )
    pubIn(valuesWithInternalKeys)
  }

  /**
   * Gets the current value of a node. The node must be stateful.
   * @param key - the key of the node.
   */
  function getKeyValue(key: string) {
    return state.get(labels[key].key)
  }

  /**
   * Gets the current value of a node. The node must be stateful.
   * @param node - the node instance.
   */
  function getValue<T>(node: RN<T>): T {
    return state.get(node.key) as T
  }

  /**
   * Gets the current values of multiple nodes. The nodes must be stateful.
   */
  function getKeyValues(keys: string[]) {
    return keys.map((key) => {
      const label = labels[key]
      if (!label) {
        throw new Error(`No label for key ${key}. Do you miss a plugin?`)
      }
      return state.get(label.key)
    })
  }

  return {
    combine,
    connect,
    derive,
    getKeyValue,
    getValue,
    getKeyValues,
    label,
    labels,
    link,
    node,
    o: {
      delayWithMicrotask,
      debounceTime,
      filter,
      map,
      mapTo,
      onNext,
      scan,
      throttleTime,
      withLatestFrom,
      once,
      passOnlyAfterNodeHasEmittedBefore
    },
    pipe,
    pub,
    pubIn,
    pubKey,
    pubKeys,
    resetSingletonSubs,
    singletonSub,
    singletonSubKey,
    spread,
    sub,
    subKey,
    subKeys
  }
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Realm extends ReturnType<typeof realm> {}
