/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-use-before-define, @typescript-eslint/no-explicit-any */
import { uuidv4 } from '../utils/uuid4'
import { Realm, realm, RealmNode, Subscription, UnsubscribeHandle } from './realm'

/**
 * The system interface is the runtime representation of a state management module, a record of nodes.
 */
export interface System {
  [key: string]: RealmNode<any>
}

/**
 * a SystemSpec is the result from a [[system]] call. To obtain the [[system]], pass the spec to [[init]].
 * @typeParam Dependencies - The dependencies of the system.
 * @typeParam Constructor - The system constructor.
 */
export interface SystemSpec<Dependencies extends AnySystemSpecs, /** @internal */ Constructor extends SystemConstructor<Dependencies>> {
  id: string
  constructor: Constructor
  dependencies: Dependencies
}

/** @internal **/
export interface AnySystemSpec extends SystemSpec<AnySystemSpecs, any> {
  id: string
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
/** @internal **/
export type AnySystemSpecs = Array<AnySystemSpec>

/** @internal **/
export type SystemOfSpec<Spec extends AnySystemSpec> = ReturnType<Spec['constructor']>

/** @internal **/
export type SSR<Spec extends AnySystemSpec> = SystemOfSpec<Spec>

/** @internal **/
export type SystemsFromSpecs<ST extends AnySystemSpecs> = ST extends unknown[] ? SystemsFromSpecsRec<ST, []> : never
type SystemsFromSpecsRec<ST extends unknown[], Acc extends unknown[]> = ST extends [infer Head, ...infer Tail]
  ? SystemsFromSpecsRec<Tail, [...Acc, Head extends AnySystemSpec ? SystemOfSpec<Head> : never]>
  : Acc

/**
 * The system constructor is a function which initializes and connects nodes and returns them as a [[system]].
 * If the [[system]] call specifies system dependencies, the constructor receives the dependencies as an array argument.
 */
export interface SystemConstructor<D extends AnySystemSpecs> {
  (r: Realm, dependencies: SystemsFromSpecs<D>): System
}

/**
 * Declare a new state management module (system). The constructor receives the realm and the dependencies as arguments.
 * @param constructor - The system constructor.
 * @param dependencies - The dependencies of the system - other systems.
 */
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

/** @internal */
export type ValuesForKeys<S extends System, K extends SystemKey<S>[]> = K extends unknown[] ? ValuesForKeysRec<S, K, []> : never

type ValuesForKeysRec<S extends Record<any, RealmNode>, K extends unknown[], Acc extends unknown[]> = K extends [infer Head, ...infer Tail]
  ? ValuesForKeysRec<S, Tail, [...Acc, S[Head] extends RealmNode<infer R> ? R : never]>
  : Acc

/** @internal **/
// eslint-disable-next-line @typescript-eslint/ban-types
export type SystemOfSpecs<Specs extends AnySystemSpec[]> = Specs extends unknown[] ? SystemOfSpecsRec<Specs, {}> : Specs
// eslint-disable-next-line @typescript-eslint/ban-types
type SystemOfSpecsRec<Specs extends unknown[], Acc extends {}> = Specs extends [infer Head, ...infer Tail]
  ? SystemOfSpecsRec<Tail, Head extends AnySystemSpec ? Acc & SystemOfSpec<Head> : never>
  : Acc

/** @internal */
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

/** @internal */
export type SystemKeys<S extends System, K extends Extract<keyof S, string> = Extract<keyof S, string>> = LongTuple<K>

/** @internal */
export type ValueForKey<S extends System, K extends keyof S> = S[K] extends RealmNode<infer V> ? V : never

/** @internal */
export type SystemDict<S extends System> = { [K in keyof S]?: ValueForKey<S, K> }
/** @internal */
export type SystemKeysArray<S extends System> = Array<keyof S>

/** @internal */
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

/** @internal */
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

/** @internal */
export type RealmFactory<Sys extends System> = () => TypedRealm<Sys>

/** @internal */
export function getRealmFactory<Specs extends LongTuple<AnySystemSpec>>(...specs: Specs) {
  return () => realmFactory(...specs)
}
