import { Extension } from '@codemirror/state'
import { Cell } from '@mdxeditor/gurx'

/** @internal */
export const diffMarkdown$ = Cell('')

/** @internal */
export const cmExtensions$ = Cell<Extension[]>([])

/** @internal */
export const readOnlyDiff$ = Cell(false)
