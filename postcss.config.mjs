import autoprefixer from 'autoprefixer'
import nesting from 'postcss-nesting'
import mixins from 'postcss-mixins'

export default {
  plugins: [ autoprefixer, mixins, nesting ]
}
