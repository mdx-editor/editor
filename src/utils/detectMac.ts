/** @internal */
// eslint-disable-next-line @typescript-eslint/no-deprecated
export const CAN_USE_DOM: boolean = typeof window !== 'undefined' && typeof window.document.createElement !== 'undefined'

/**
 * Used to detect if the current platform is Apple based, mostly for keyboard shortcuts.
 * @group Utils
 */
export const IS_APPLE: boolean =
  CAN_USE_DOM &&
  (() => {
    const platform = navigator.userAgentData?.platform
    return platform ? /mac/i.test(platform) : /Mac|iPod|iPhone|iPad/.test(navigator.userAgent)
  })()

/**
 * Returns true if the user is pressing the control key on Windows or the meta key on Mac.
 * @group Utils
 */
export function controlOrMeta(metaKey: boolean, ctrlKey: boolean): boolean {
  if (IS_APPLE) {
    return metaKey
  }
  return ctrlKey
}
