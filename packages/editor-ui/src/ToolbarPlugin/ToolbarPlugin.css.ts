import { style } from '@vanilla-extract/css'

const systemFont =
  '-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif'

export const Root = style({
  boxSizing: 'border-box',
  display: 'flex',
  padding: 10,
  width: '100%',
  minWidth: 'max-content',
  borderRadius: 6,
  // backgroundColor: 'white',
  // boxShadow: `0 2px 10px black`,
  alignItems: 'center',
})

const itemStyles = {
  all: 'unset',
  flex: '0 0 auto',
  color: 'black',
  height: 25,
  padding: '0 5px',
  borderRadius: 4,
  display: 'inline-flex',
  fontSize: 13,
  lineHeight: 1,
  alignItems: 'center',
  justifyContent: 'center',
  ':hover': { backgroundColor: 'black', color: 'white' },
  ':focus': { position: 'relative', boxShadow: `0 0 0 2px red` },
  selectors: {
    '&:active:hover': { backgroundColor: 'red', transform: 'translateY(1px)' },
  },
} as const

export const ToggleItem = style({
  ...itemStyles,
  backgroundColor: 'white',
  marginLeft: 2,
  ':first-child': { marginLeft: 0 },
  selectors: {
    '&[data-state=on]': { backgroundColor: 'red', color: 'blue' },
  },
})

export const Separator = style({
  width: 1,
  backgroundColor: 'red',
  margin: '0 10px',
  alignSelf: 'stretch',
})

export const Button = style({
  ...itemStyles,
  color: 'red',
  backgroundColor: 'white',
})
