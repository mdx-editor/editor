/**
 * Performs left to right composition of two functions.
 * @group Utils
 */
export function compose<I, A, R>(a: (arg: A) => R, b: (arg: I) => A): (arg: I) => R {
  return (arg: I) => a(b(arg))
}

/**
 * Takes a value and applies a function to it.
 * @group Utils
 */
export function thrush<I, K>(arg: I, proc: (arg: I) => K) {
  return proc(arg)
}

/**
 * Takes a 2 argument function and partially applies the first argument.
 * @group Utils
 */
export function curry2to1<T, K, R>(proc: (arg1: T, arg2: K) => R, arg1: T): (arg2: K) => R {
  return (arg2) => proc(arg1, arg2)
}

/**
 * Takes a 1 argument function and returns a function which when called, executes it with the provided argument.
 * @group Utils
 */
export function curry1to0<T, R>(proc: (arg: T) => R, arg: T): () => R {
  return () => proc(arg)
}

/**
 * Returns a function which extracts the property from from the passed object.
 * @group Utils
 */
export function prop<T extends Record<string, unknown>>(property: keyof T) {
  return (object: T) => object[property]
}

/**
 * Calls callback with the first argument, and returns it.
 * @group Utils
 */
export function tap<T>(arg: T, proc: (arg: T) => unknown): T {
  proc(arg)
  return arg
}

/**
 * Calls the passed function.
 * @group Utils
 */
export function call(proc: () => unknown) {
  proc()
}

/**
 * returns a function which when called always returns the passed value
 * @group Utils
 */
export function always<T>(value: T) {
  return () => value
}

/**
 * returns a function which calls all passed functions in the passed order.
 * joinProc does not pass arguments or collect return values.
 * @group Utils
 */
export function joinProc(...procs: Array<() => unknown>) {
  return () => {
    procs.map(call)
  }
}

/**
 * an empty function
 * @group Utils
 */
export function noop() {}
