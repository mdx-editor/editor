import fs from 'node:fs'
import path from 'node:path'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

const newExports = {
    "./package.json": "./package.json",
    "./style.css": "./dist/style.css",
    ".": {
      import: {
        types: "./dist/index.d.ts",
        default: "./dist/index.js",
      } 
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
    import: {
      types: `./dist/${exp}/index.d.ts`,
      default: `./dist/${exp}.js`,
    }
  }
})

function addFileExports(dirName) {
  fs.readdirSync(`./src/${dirName}`).forEach(exp => {
    const name = path.parse(exp).name
    newExports[`./${dirName}/${name}`] = {
      import: {
        types: `./dist/${dirName}/${name}.d.ts`,
        default: `./dist/${dirName}/${name}.js`,
      }
    }
  })
}


fs.readdirSync('./src/plugins').forEach(dirName => {
  newExports[`./plugins/${dirName}`] = {
    import: {
      types: `./dist/plugins/${dirName}/index.d.ts`,
      default: `./dist/plugins/${dirName}/index.js`
    }
    // require: `./dist/plugins/${dirName}/index.cjs`,
  }
})

addFileExports('plugins/toolbar/components')
addFileExports('plugins/toolbar/primitives')

console.log('Updating package json...')
packageJson.exports = newExports
// write back to package.json
fs.writeFileSync('./package.json', JSON.stringify(packageJson, null, 2))
