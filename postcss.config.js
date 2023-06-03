import autoprefixer from 'autoprefixer'
import nesting from 'postcss-nesting'
import extend from 'postcss-extend'

export default {
  plugins: [ autoprefixer, extend, nesting ]
}
