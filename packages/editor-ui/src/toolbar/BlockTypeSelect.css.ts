import { style } from '@vanilla-extract/css'

export const SelectTrigger = style({
  all: 'unset',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  borderRadius: 4,
  padding: '0 15px',
  fontSize: 13,
  lineHeight: 1,
  height: 35,
  gap: 5,
  backgroundColor: 'white',
  color: 'black',
  minWidth: 130,
  ':hover': { backgroundColor: 'gray' },
  ':focus': {},
  selectors: {
    '&[data-placeholder]': { color: 'red' },
  },
})

export const SelectIcon = style({
  color: 'black',
  marginInlineStart: 'auto',
})

export const SelectContent = style({
  overflow: 'hidden',
  backgroundColor: 'white',
  borderRadius: 6,
  boxShadow: '0px 10px 38px -10px rgba(22, 23, 24, 0.35), 0px 10px 20px -15px rgba(22, 23, 24, 0.2)',
})

export const SelectViewport = style({
  padding: 0,
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
