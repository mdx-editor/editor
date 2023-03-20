import { style, keyframes } from '@vanilla-extract/css'

export const paragraph = style({
  margin: '0',
  position: 'relative',
})

export const quote = style({
  margin: '0',
  marginLeft: '20px',
  marginBottom: '10px',
  color: 'rgb(101, 103, 107)',
  borderLeftColor: 'rgb(206, 208, 212)',
  borderLeftWidth: '4px',
  borderLeftStyle: 'solid',
  paddingLeft: '16px',
})

export const italic = style({
  fontStyle: 'italic',
})

export const bold = style({
  fontWeight: 'bold',
})

export const underline = style({
  textDecoration: 'underline',
})

export const strikethrough = style({
  textDecoration: 'line-through',
})

export const underlineStrikethrough = style({
  textDecoration: 'underline line-through',
})

export const subscript = style({
  fontSize: '0.8em',
  verticalAlign: 'sub !important',
})

export const superscript = style({
  fontSize: '0.8em',
  verticalAlign: 'super',
})

export const code = style({
  backgroundColor: 'rgb(240, 242, 245)',
  padding: '1px 0.25rem',
  fontFamily: 'Menlo, Consolas, Monaco, monospace',
  fontSize: '94%',
})

export const link = style({
  color: 'blue',
  ':hover': {
    color: 'azure',
  },
})

export const codeBlock = style({
  backgroundColor: 'rgb(240, 242, 245)',
  fontFamily: 'Menlo, Consolas, Monaco, monospace',
  display: 'block',
  padding: '8px 8px 8px 52px',
  lineHeight: 1.53,
  fontSize: '13px',
  margin: '0',
  marginTop: '8px',
  marginBottom: '8px',
  tabSize: 2,
  overflowX: 'auto',
  position: 'relative',
  '::before': {
    content: 'attr(data-gutter)',
    position: 'absolute',
    backgroundColor: '#eee',
    left: '0',
    top: '0',
    borderRight: '1px solid #ccc',
    padding: '8px',
    color: '#777',
    whiteSpace: 'pre-wrap',
    textAlign: 'right',
    minWidth: '25px',
  },
})

export const nestedListItem = style({
  listStyleType: 'none',
  ':before': {
    display: 'none',
  },
  ':after': { display: 'none' },
})

export const tokenComment = style({ color: 'slategray' })
export const tokenPunctuation = style({ color: '#999' })
export const tokenProperty = style({ color: '#905' })
export const tokenSelector = style({ color: '#690' })
export const tokenOperator = style({ color: '#9a6e3a' })
export const tokenAttr = style({ color: '#07a' })
export const tokenVariable = style({ color: '#e90' })
export const tokenFunction = style({ color: '#dd4a68' })

export const danger = style({ border: '1px solid red' })
export const info = style({ border: '1px solid blue' })
export const note = style({ border: '1px solid green' })
export const tip = style({ border: '1px solid yellow' })
export const caution = style({ border: '1px solid orange' })
