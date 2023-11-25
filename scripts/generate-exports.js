import fs from 'node:fs'
import path from 'node:path'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const newExports = {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.js",
    "default": "./dist/index.js"
  },
  "./package.json": "./package.json",
  "./style.css": "./dist/style.css",
  "./gurx": {
    types: `./dist/gurx/index.d.ts`,
    import: `./dist/gurx/index.js`,
    default: `./dist/gurx/index.js`
  }
}

const additionalExports = [
  'MDXEditor',
  'importMarkdownToLexical',
  'exportMarkdownFromLexical',
  'directive-editors/AdmonitionDirectiveDescriptor',
  'directive-editors/GenericDirectiveEditor',
  'jsx-editors/GenericJsxEditor',
  'plugins/core/PropertyPopover',
  'plugins/core/NestedLexicalEditor',
  'utils',
]

additionalExports.forEach(exp => { 
  newExports[`./${exp}`] = {
    types: `./dist/${exp}.d.ts`,
    import:  `./dist/${exp}.js`,
    default: `./dist/${exp}.js`,
  }
})

function addFileExports(dirName) {
  fs.readdirSync(`./src/${dirName}`).forEach(exp => {
    const name = path.parse(exp).name
    newExports[`./${dirName}/${name}`] = {
      types: `./dist/${dirName}/${name}.d.ts`,
      import: `./dist/${dirName}/${name}.js`,
      default: `./dist/${dirName}/${name}.js`,
    }
  })
}


fs.readdirSync('./src/plugins').forEach(dirName => {
  newExports[`./plugins/${dirName}`] = {
    types: `./dist/plugins/${dirName}/index.d.ts`,
    import: `./dist/plugins/${dirName}/index.js`,
    default: `./dist/plugins/${dirName}/index.js`
  }
})

addFileExports('plugins/toolbar/components')
addFileExports('plugins/toolbar/primitives')

console.log('Updating package json...')
packageJson.exports = newExports
// write back to package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))
