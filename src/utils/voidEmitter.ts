import { noop } from './fp'

/**
 * An emitter object that has a single subscription that will be executed.
 * The construct is used so that the lexical nodes can focus their React component editors.
 */
export type VoidEmitter = {
  /**
   * Subscribes to the emitter event
   */
  subscribe: (cb: () => void) => void
}

export function voidEmitter() {
  let subscription = noop
  return {
    publish: () => {
      subscription()
    },
    subscribe: (cb: () => void) => {
      subscription = cb
    }
  }
}
