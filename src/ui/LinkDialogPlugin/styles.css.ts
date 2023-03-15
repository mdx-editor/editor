import { style, keyframes } from '@vanilla-extract/css'

export const SlideKeyframes = {
  slideUpAndFade: keyframes({
    from: {
      opacity: 0,
      transform: 'translateY(2px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  }),

  slideDownAndFade: keyframes({
    from: {
      opacity: 0,
      transform: 'translateY(-2px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  }),

  slideRightAndFade: keyframes({
    from: {
      opacity: 0,
      transform: 'translateX(-2px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  }),

  slideLeftAndFade: keyframes({
    from: {
      opacity: 0,
      transform: 'translateX(2px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  }),
}

export const LinkUIInput = style({
  boxShadow: '0 0 0 1px var(--violet7)',
  borderRadius: '4px',
  padding: '2px 5px',
  ':focus': {
    boxShadow: '0 0 0 2px var(--violet8)',
  },
})

export const LinkTextContainer = style({
  padding: '2px 5px',
  maxWidth: 'calc(100% - 30px)',
  display: 'inline-block',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

export const TooltipContent = style({
  borderRadius: '4px',
  padding: '10px 15px',
  fontSize: '15px',
  lineHeight: 1,
  color: 'var(--violet11)',
  backgroundColor: 'white',
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  userSelect: 'none',
  animationDuration: '400ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform, opacity',

  selectors: {
    "&[data-state='delayed-open'][data-side='top']": {
      animationName: SlideKeyframes.slideDownAndFade,
    },
    "&[data-state='delayed-open'][data-side='right']": {
      animationName: SlideKeyframes.slideLeftAndFade,
    },
    "&[data-state='delayed-open'][data-side='bottom']": {
      animationName: SlideKeyframes.slideUpAndFade,
    },
    "&[data-state='delayed-open'][data-side='left']": {
      animationName: SlideKeyframes.slideRightAndFade,
    },
  },
})

export const PopoverAnchor = style({
  position: 'absolute',
  backgroundColor: 'Highlight',
  zIndex: '-1',
  borderRadius: '4px',
  padding: '1px',
  transform: 'translateX(-1px)',
})

export const PopoverContent = style({
  borderRadius: '4px',
  padding: 20,
  width: 260,
  backgroundColor: 'white',
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  animationDuration: '400ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform, opacity',

  ':focus': {
    boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px, 0 0 0 2px var($violet7)',
  },
  selectors: {
    "&[data-state='open'][data-side='top']": {
      animationName: SlideKeyframes.slideDownAndFade,
    },
    "&[data-state='open'][data-side='right']": {
      animationName: SlideKeyframes.slideLeftAndFade,
    },
    "&[data-state='open'][data-side='bottom']": {
      animationName: SlideKeyframes.slideUpAndFade,
    },
    "&[data-state='open'][data-side='left']": {
      animationName: SlideKeyframes.slideRightAndFade,
    },
  },
})

export const PopoverArrow = style({ fill: 'white' })
export const TooltipArrow = style({ fill: 'white' })

export const PopoverButton = style({
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '$violet11',
  ':hover': {
    backgroundColor: '$violet4',
  },
  ':focus': {
    boxShadow: '0 0 0 2px $violet7',
  },
})

export const WorkingLink = style({
  display: 'inline-flex',
  alignItems: 'center',
})
