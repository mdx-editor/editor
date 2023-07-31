import { noop } from './fp'

export type VoidEmitter = {
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
