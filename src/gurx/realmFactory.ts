/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-use-before-define, @typescript-eslint/no-explicit-any */
import { uuidv4 } from '../utils/uuid4'
import { Realm, realm, RealmNode, Subscription, UnsubscribeHandle } from './realm'

// eslint-disable-next-line
export type System = Record<string, RealmNode<any>>

/**
 * a SystemSpec is the result from a [[system]] call. To obtain the [[system]], pass the spec to [[init]].
 */
export interface SystemSpec<Dependencies extends AnySystemSpec[], Constructor extends SystemConstructor<Dependencies>> {
  id: string
  constructor: Constructor
  dependencies: Dependencies
}

export type AnySystemSpec = SystemSpec<AnySystemSpec[], any>

export type SystemOfSpec<Spec extends AnySystemSpec> = ReturnType<Spec['constructor']>

/** @internal **/
export type SSR<Spec extends AnySystemSpec> = SystemOfSpec<Spec>

/** @internal **/
export type SystemsFromSpecs<ST extends AnySystemSpec[]> = ST extends unknown[] ? SystemsFromSpecsRec<ST, []> : never
type SystemsFromSpecsRec<ST extends unknown[], Acc extends unknown[]> = ST extends [infer Head, ...infer Tail]
  ? SystemsFromSpecsRec<Tail, [...Acc, Head extends AnySystemSpec ? SystemOfSpec<Head> : never]>
  : Acc

/**
 * The system constructor is a function which initializes and connects nodes and returns them as a [[system]].
 * If the [[system]] call specifies system dependencies, the constructor receives the dependencies as an array argument.
 */
export type SystemConstructor<D extends AnySystemSpec[]> = (r: Realm, dependencies: SystemsFromSpecs<D>) => System

export function system<Dependencies extends LongTuple<AnySystemSpec>, Constructor extends SystemConstructor<Dependencies>>(
  constructor: Constructor,
  dependencies: Dependencies = [] as unknown as Dependencies
): SystemSpec<Dependencies, Constructor> {
  return {
    constructor,
    dependencies,
    id: uuidv4()
  }
}

type SystemKey<S extends System> = Extract<keyof S, string>

export type ValuesForKeys<S extends System, K extends SystemKey<S>[]> = K extends unknown[] ? ValuesForKeysRec<S, K, []> : never

type ValuesForKeysRec<S extends Record<any, RealmNode>, K extends unknown[], Acc extends unknown[]> = K extends [infer Head, ...infer Tail]
  ? ValuesForKeysRec<S, Tail, [...Acc, S[Head] extends RealmNode<infer R> ? R : never]>
  : Acc

// eslint-disable-next-line @typescript-eslint/ban-types
export type SystemOfSpecs<Specs extends AnySystemSpec[]> = Specs extends unknown[] ? SystemOfSpecsRec<Specs, {}> : Specs
// eslint-disable-next-line @typescript-eslint/ban-types
type SystemOfSpecsRec<Specs extends unknown[], Acc extends {}> = Specs extends [infer Head, ...infer Tail]
  ? SystemOfSpecsRec<Tail, Head extends AnySystemSpec ? Acc & SystemOfSpec<Head> : never>
  : Acc

export type LongTuple<K> =
  | []
  | [K]
  | [K, K]
  | [K, K, K]
  | [K, K, K, K]
  | [K, K, K, K, K]
  | [K, K, K, K, K, K]
  | [K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]
  | [K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K, K]

export type SystemKeys<S extends System, K extends Extract<keyof S, string> = Extract<keyof S, string>> = LongTuple<K>

export type ValueForKey<S extends System, K extends keyof S> = S[K] extends RealmNode<infer V> ? V : never

export type SystemDict<S extends System> = { [K in keyof S]?: ValueForKey<S, K> }
export type SystemKeysArray<S extends System> = Array<keyof S>

export interface TypedRealm<S extends System>
  extends Pick<Realm, 'sub' | 'pub' | 'spread' | 'derive' | 'singletonSubKey' | 'resetSingletonSubs'> {
  getKeyValues<K extends SystemKeys<S>>(keys: K): ValuesForKeys<S, K>
  getKeyValue<K extends keyof S>(key: K): ValueForKey<S, K>
  labels: S
  pubKey<K extends keyof S>(key: K, value: ValueForKey<S, K>): void
  pubKeys: (values: SystemDict<S>) => void
  subKey<K extends keyof S>(key: K, subscription: Subscription<ValueForKey<S, K>>): UnsubscribeHandle
  subKeys<K extends SystemKeys<S>>(keys: K, subscription: Subscription<ValuesForKeys<S, K>>): UnsubscribeHandle
}

export function realmFactory<Specs extends LongTuple<AnySystemSpec>>(...specs: Specs): TypedRealm<SystemOfSpecs<Specs>> {
  const singletons = new Map<string, System>()
  const r = realm()
  type SpecType = (typeof specs)[number]
  const _init = ({ id, constructor, dependencies }: SpecType) => {
    if (singletons.has(id)) {
      return singletons.get(id)! as SystemOfSpec<SpecType>
    }
    const system: any = constructor(r, dependencies.map((t: AnySystemSpec) => _init(specs.find((spec) => spec.id === t.id)!)) as any)

    r.label(system)
    singletons.set(id, system)
    return system
  }
  specs.forEach(_init)
  return r as unknown as TypedRealm<SystemOfSpecs<Specs>>
}

export type RealmFactory<Sys extends System> = () => TypedRealm<Sys>

export function getRealmFactory<Specs extends LongTuple<AnySystemSpec>>(...specs: Specs) {
  return () => realmFactory(...specs)
}
