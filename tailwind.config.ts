import { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'
import colors from 'tailwindcss/colors'
import plugin from 'tailwindcss/plugin'

const mdxTailwindPlugin = plugin.withOptions(
  (options = {}) => {
    return ({}) => {

    }
  }, 
  (options = {}) => {
    return {
      theme: {
        extend: {
          colors: {
            primary: colors.slate,
            blue: colors.blue,
            surface: colors.slate,
            transparent: colors.transparent,
            popoverBg: colors.white,
          },
          keyframes: {
            slideDownAndFade: {
              from: { opacity: '0', transform: 'translateY(-2px)' },
              to: { opacity: '1', transform: 'translateY(0)' },
            },
            slideLeftAndFade: {
              from: { opacity: '0', transform: 'translateX(2px)' },
              to: { opacity: '1', transform: 'translateX(0)' },
            },
            slideUpAndFade: {
              from: { opacity: '0', transform: 'translateY(2px)' },
              to: { opacity: '1', transform: 'translateY(0)' },
            },
            slideRightAndFade: {
              from: { opacity: '0', transform: 'translateX(2px)' },
              to: { opacity: '1', transform: 'translateX(0)' },
            },
          },
          animation: {
            slideDownAndFade: 'slideDownAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            slideLeftAndFade: 'slideLeftAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            slideUpAndFade: 'slideUpAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
            slideRightAndFade: 'slideRightAndFade 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          },
          data: {
            'toggle-on': 'state="on"',
            highlighted: 'highlighted="true"',
          },
        }
      }
    }
  }
)

const config: Config = {
  content: ['src/**/*.tsx', 'src/**/*.ts'],
  theme: {
    extend: {
      colors: {
        primary: colors.red,
        surface: colors.green
      },
    },
  },
  plugins: [typography, mdxTailwindPlugin({})],
}

export default config
