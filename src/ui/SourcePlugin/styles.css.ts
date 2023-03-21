import { style } from '@vanilla-extract/css'
import { themeVars } from '../theme.css'

const autoGrowCommonProps = {
  width: 'auto',
  minWidth: '1em',
  gridArea: '1 / 1',
  font: 'inherit',
  resize: 'none',
  whiteSpace: 'pre-wrap',
} as const

export const AutoGrowTextareaWrapper = style({
  display: 'grid',
  position: 'relative',
  fontFamily: themeVars.monoFont,

  selectors: {
    '&:after': {
      ...autoGrowCommonProps,
      content: "attr(data-value) ' '",
      visibility: 'hidden',
      whiteSpace: 'pre-wrap',
    },
  },
})

export const AutogrowTextarea = style({ ...autoGrowCommonProps, overflow: 'hidden' })
