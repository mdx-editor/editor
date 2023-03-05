import { style, keyframes } from '@vanilla-extract/css'

const slideUpAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideRightAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(-2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})

const slideDownAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateY(-2px)' },
  '100%': { opacity: 1, transform: 'translateY(0)' },
})

const slideLeftAndFade = keyframes({
  '0%': { opacity: 0, transform: 'translateX(2px)' },
  '100%': { opacity: 1, transform: 'translateX(0)' },
})

export const PopoverContent = style({
  // borderRadius: 4,
  // padding: 20,
  // width: 260,
  // backgroundColor: 'white',
  // boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  animationDuration: '400ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform, opacity',

  ':focus': {
    boxShadow: `hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px, 0 0 0 2px red`,
  },
  selectors: {
    '&[data-state="open"][data-side="top"]': { animationName: slideDownAndFade },
    '&[data-state="open"][data-side="right"]': { animationName: slideLeftAndFade },
    '&[data-state="open"][data-side="bottom"]': { animationName: slideUpAndFade },
    '&[data-state="open"][data-side="left"]': { animationName: slideRightAndFade },
  },
})

export const PopoverArrow = style({
  fill: 'white',
})

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
