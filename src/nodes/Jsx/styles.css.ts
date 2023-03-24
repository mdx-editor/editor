import { style } from '@vanilla-extract/css'
import { themeVars } from '../../ui/theme.css'

export const inlineComponent = style({
  display: 'inline-flex',
  backgroundColor: themeVars.colors.pill,
  gap: 5,
  alignItems: 'center',
  padding: '5px',
  borderRadius: 5,
})

export const blockComponent = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  backgroundColor: themeVars.colors.pill,
  gap: 5,
  padding: '5px',
  borderRadius: 5,
})
