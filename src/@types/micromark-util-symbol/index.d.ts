import { codes as Codes, types as Types } from 'micromark-util-symbol/lib/default'

declare module 'micromark-util-symbol' {
  export const codes: { [k in keyof typeof Codes]: (typeof Codes)[k] }
  export const types: { [k in keyof typeof Types]: (typeof Types)[k] }
}
