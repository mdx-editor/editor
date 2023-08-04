import fs from 'node:fs'
import path from 'node:path'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const newExports = {
    "./package.json": "./package.json",
    "./style.css": "./dist/style.css",
    ".": {
      "import": "./dist/index.js",
      // "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    },
}

const additionalExports = [
  'MDXEditor',
  'directive-editors/AdmonitionDirectiveDescriptor',
  'directive-editors/GenericDirectiveEditor',
  'jsx-editors/GenericJsxEditor',
]

additionalExports.forEach(exp => { 
  newExports[`./${exp}`] = {
    import: `./dist/${exp}.js`,
    // require: `./dist/${exp}.cjs`,
    types: `./dist/${exp}/index.d.ts`,
  }
})

function addFileExports(dirName) {
  fs.readdirSync(`./src/${dirName}`).forEach(exp => {
    const name = path.parse(exp).name
    newExports[`./${dirName}/${name}`] = {
      import: `./dist/${dirName}/${name}.js`,
      // require: `./dist/${dirName}/${exp}.cjs`,
      types: `./dist/${dirName}/${name}.d.ts`,
    }
  })
}


fs.readdirSync('./src/plugins').forEach(dirName => {
  newExports[`./plugins/${dirName}`] = {
    import: `./dist/plugins/${dirName}/index.js`,
    // require: `./dist/plugins/${dirName}/index.cjs`,
    types: `./dist/plugins/${dirName}/index.d.ts`,
  }
})

addFileExports('plugins/toolbar/components')
addFileExports('plugins/toolbar/primitives')

console.log('Updating package json...')
packageJson.exports = newExports
// write back to package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))
