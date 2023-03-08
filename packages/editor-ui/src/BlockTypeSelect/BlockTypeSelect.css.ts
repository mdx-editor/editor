import { style } from '@vanilla-extract/css'
import { themeVars } from '../theme.css'

export const SelectTrigger = style({
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  padding: '8px',
  gap: 5,
  minWidth: 130,
  ':hover': { backgroundImage: themeVars.backgroundHover },
  ':focus': {
    outline: `2px solid ${themeVars.colors.border}`,
  },
  selectors: {
    '&[data-placeholder]': { color: 'red' },
  },
  fontFamily: themeVars.font,
})

export const SelectIcon = style({
  color: 'black',
  marginInlineStart: 'auto',
})

export const SelectContent = style({
  overflow: 'hidden',
  fontFamily: themeVars.font,
  backgroundColor: themeVars.colors.background,
  border: `2px solid ${themeVars.colors.border}`,
})

export const SelectViewport = style({
  padding: 0,
  backgroundColor: themeVars.colors.background,
})

export const SelectItem = style({
  fontSize: 13,
  lineHeight: 1,
  color: 'black',
  borderRadius: 3,
  display: 'flex',
  alignItems: 'center',
  height: 25,
  padding: '0 35px 0 25px',
  position: 'relative',
  userSelect: 'none',

  selectors: {
    '&[data-disabled]': {
      color: 'gray',
      pointerEvents: 'none',
    },
    '&[data-highlighted]': {
      outline: 'none',
      backgroundColor: 'gray',
      color: 'white',
    },
  },
})

export const SelectSeparator = style({
  height: 1,
  backgroundColor: 'gray',
  margin: 5,
})

export const ItemIndicator = style({
  position: 'absolute',
  left: 0,
  width: 25,
  display: 'inline-flex',
})

const scrollButtonStyles = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 25,
  backgroundColor: 'white',
  color: 'black',
  cursor: 'default',
}

export const SelectScrollUpButton = style(scrollButtonStyles)
export const SelectScrollDownButton = style(scrollButtonStyles)
