import { style, keyframes } from '@vanilla-extract/css'
import { themeVars } from '../theme.css'

const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})

const slideDownAndFade = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translate(3px, 4px)',
    boxShadow: `0px 0px 0px ${themeVars.colors.transitionStartGlow}`,
  },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})

export const Content = style({
  animationDuration: '300ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform, opacity, box-shadow',

  background: themeVars.colors.background,
  border: `2px solid ${themeVars.colors.border}`,
  boxShadow: `3px 4px 0px ${themeVars.colors.glow}`,
  selectors: {
    '&[data-state="open"][data-side="top"]': { animationName: slideDownAndFade },
    '&[data-state="open"][data-side="right"]': { animationName: slideLeftAndFade },
    '&[data-state="open"][data-side="bottom"]': { animationName: slideUpAndFade },
    '&[data-state="open"][data-side="left"]': { animationName: slideRightAndFade },
  },
})

export const Anchor = style({
  position: 'absolute',
  backgroundColor: 'Highlight',
  zIndex: '-1',
  borderRadius: '4px',
  padding: '1px',
  transform: 'translateX(-1px)',
})

// TODO: unused
export const Arrow = style({
  fill: 'white',
})

// TODO: link dialog
export const PopoverClose = style({
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'red',
  position: 'absolute',
  top: 5,
  right: 5,
  ':hover': { backgroundColor: 'red' },
  ':focus': { boxShadow: `0 0 0 2px red` },
})

export const Flex = style({ display: 'flex' })

export const IconButton = style({
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 35,
  width: 35,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: 'red',
  backgroundColor: 'white',
  boxShadow: `0 2px 10px red`,
  ':hover': { backgroundColor: 'blue' },
  ':focus': { boxShadow: `0 0 0 2px black` },
})
