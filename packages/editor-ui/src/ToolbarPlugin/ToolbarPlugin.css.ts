import { style } from '@vanilla-extract/css'
import { themeVars } from '../theme.css'

export const Root = style({
  boxSizing: 'border-box',
  display: 'flex',
  padding: themeVars.sizing.containerPadding,
  width: '100%',
  minWidth: 'max-content',
  alignItems: 'center',
})

const repeatingStripe = `
  repeating-linear-gradient(
    -45deg,
    transparent 0 2px,
    ${themeVars.toolbar.buttonHoverBackground} 2px 4px
  );
`.trim()

const itemStyles = {
  all: 'unset',
  flex: '0 0 auto',
  color: themeVars.colors.foreground,
  padding: themeVars.toolbar.buttonPadding,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  ':hover': { backgroundImage: repeatingStripe },
  ':focus': { transform: 'translate(2px, 2px)' },
  selectors: {
    '&:active:hover': { backgroundColor: 'red', transform: 'translateY(1px)' },
  },
} as const

export const ToggleItem = style({
  ...itemStyles,
  marginLeft: themeVars.toolbar.buttonSpacing,
  ':first-child': { marginLeft: 0 },
  selectors: {
    '&[data-state=on]': {
      backgroundColor: themeVars.toolbar.toggleButtonOnBackground,
      backgroundImage: 'none',
      transform: 'translate(1px, 1px)',
    },
  },
})

export const Separator = style({
  width: 1,
  backgroundColor: 'transparent',
  margin: '0 10px',
  alignSelf: 'stretch',
})

export const Button = style({
  ...itemStyles,
  color: 'red',
  backgroundColor: 'white',
})
