import { createStitches } from '@stitches/react'
import { violet } from '@radix-ui/colors'

export const { styled, css, globalCss, keyframes, getCssText, theme, createTheme, config } = createStitches({
  theme: {
    colors: {
      ...violet,
    },
  },
})
