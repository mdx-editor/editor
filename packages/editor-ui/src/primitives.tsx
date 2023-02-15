import { styled, keyframes } from './stitches.config'
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'

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

export const LinkUIInput = styled('input', {
  marginRight: '50px',
  boxShadow: '0 0 0 1px var(--violet7)',
  borderRadius: '4px',
  padding: '2px 5px',
  '&:focus': {
    boxShadow: '0 0 0 2px var(--violet8)',
  },
})

export const LinkTextContainer = styled('span', {
  padding: '2px 5px',
  maxWidth: 'calc(100% - 30px)',
  display: 'inline-block',
  textOverflow: 'ellipsis',
  overflow: 'hidden',
})

export const TooltipContent = styled(Tooltip.Content, {
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
})

export const PopoverAnchor = styled(Popover.Anchor, {
  position: 'absolute',
  backgroundColor: 'Highlight',
  zIndex: '-1',
  borderRadius: '4px',
  padding: '1px',
  transform: 'translateX(-1px)',
})

export const PopoverContent = styled(Popover.Content, {
  borderRadius: '4px',
  padding: 20,
  width: 260,
  backgroundColor: 'white',
  boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px',
  animationDuration: '400ms',
  animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
  willChange: 'transform, opacity',

  '&:focus': {
    boxShadow: 'hsl(206 22% 7% / 35%) 0px 10px 38px -10px, hsl(206 22% 7% / 20%) 0px 10px 20px -15px, 0 0 0 2px var($violet7)',
  },
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
})

export const PopoverArrow = styled(Popover.Arrow, { fill: 'white' })
export const TooltipArrow = styled(Tooltip.Arrow, { fill: 'white' })

export const PopoverButtons = styled('div', {
  position: 'absolute',
  top: 5,
  right: 5,
  display: 'flex',
  columnGap: 3,
})

export const PopoverButton = styled('button', {
  all: 'unset',
  fontFamily: 'inherit',
  borderRadius: '100%',
  height: 25,
  width: 25,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '$violet11',
  '&:hover': {
    backgroundColor: '$violet4',
  },
  '&:focus': {
    boxShadow: '0 0 0 2px $violet7',
  },
})

export const WorkingLink = styled('a', {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
})
