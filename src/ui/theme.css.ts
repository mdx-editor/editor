import { createTokenizedTheme } from './utils/createTokenizedTheme'
import { sky, slate } from '@radix-ui/colors'
import { makeHslTransparent } from './utils/makeHslTransparent'

export const [themeClassName, themeVars] = createTokenizedTheme({
  colors: {
    background: slate.slate2,
    border: slate.slate12,
    foreground: slate.slate12,
    accent: sky.sky9,
    glow: makeHslTransparent(sky.sky9, 0.8),
    transitionStartGlow: makeHslTransparent(sky.sky9, 0.2),
    selectedBackground: '$colors.glow',
  },
  sizing: {
    borderRadius: '4px',
    padding: '6px',
    containerPadding: '10px',
  },
  toolbar: {
    buttonPadding: '4px 4px',
    buttonSpacing: '4px',
    buttonHoverBackground: makeHslTransparent(sky.sky9, 0.5),
    toggleButtonOnBackground: makeHslTransparent(sky.sky9, 0.5),
  },
  font: '-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif',
  monoFont: 'Menlo, Consolas, Monaco, Liberation Mono, Lucida Console, monospace',
  backgroundHover: `repeating-linear-gradient(-45deg,transparent 0 2px, ${sky.sky9} 2px 4px);`,
})
