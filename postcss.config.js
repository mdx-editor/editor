import autoprefixer from 'autoprefixer'
import nesting from 'postcss-nesting'
import extend from 'postcss-extend'
import mixins from 'postcss-mixins'

export default {
  plugins: [ autoprefixer, mixins, extend, nesting ]
}
