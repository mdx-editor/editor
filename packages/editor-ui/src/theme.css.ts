import { createTheme, createVar } from '@vanilla-extract/css'

const defaultText = createVar()

export const [themeClass, vars] = createTheme({
  //   [defaultText]: 'pink',
  color: {
    [defaultText]: 'pink',
    brand: 'blue',
  },
  font: {
    body: '-apple-system, BlinkMacSystemFont, avenir next, avenir, segoe ui, helvetica neue, helvetica, Cantarell, Ubuntu, roboto, noto, arial, sans-serif',
  },
  components: {
    select: {
      seamless: {
        color: defaultText,
      },
    },
  },
})
