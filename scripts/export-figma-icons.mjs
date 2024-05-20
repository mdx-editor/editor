import 'dotenv/config'
import { writeFileSync } from 'node:fs'
import { format } from 'prettier'
import { optimize } from 'svgo'

const FigmaFetchOptions = {
  headers: {
    'X-Figma-Token': process.env.FIGMA_TOKEN
  }
}
const frameContentsResponse = await fetch(
  `https://api.figma.com/v1/files/${process.env.FIGMA_PROJECT_ID}/nodes?ids=${process.env.FIGMA_NODE_ID}`,
  FigmaFetchOptions
)

const icons = (await frameContentsResponse.json()).nodes[process.env.FIGMA_NODE_ID].document.children.filter(
  (icon) => icon.type === 'COMPONENT'
)
const ids = icons.map((icon) => icon.id).join(',')

const exportedImagesResponse = await fetch(
  `https://api.figma.com/v1/images/${process.env.FIGMA_PROJECT_ID}?ids=${ids}&format=svg`,
  FigmaFetchOptions
)

const result = await exportedImagesResponse.json()

let iconsFileContent = `
import React from 'react'

export const defaultSvgIcons = {`

const iconContents = await Promise.all(
  Object.entries(result.images).map(async ([id, url], index) => {
    await new Promise((resolve) => setTimeout(resolve, index * 10))
    const svgResponse = await fetch(url)
    const svgContent = await svgResponse.text()
    const { data: optimizedData } = optimize(svgContent, {
      plugins: [
        {
          name: 'removeMasks',
          description: 'Remove masks from the SVG',
          fn: () => {
            return {
              element: {
                enter: (node, parentNode) => {
                  if (node.name === 'mask') {
                    parentNode.children = parentNode.children.filter((child) => child !== node)
                  }
                  if (node.name === 'g') {
                    const index = parentNode.children.indexOf(node)
                    parentNode.children.splice(index, 1, ...node.children)
                  }
                }
              }
            }
          }
        }
      ]
    })
    const iconName = icons.find((icon) => icon.id === id).name
    console.log(`Exported ${iconName}`)
    return `  ${iconName}: (${optimizedData}),`
  })
)

iconsFileContent += iconContents.join('')

iconsFileContent += `}\n`
iconsFileContent += `export type IconKey = ${icons.map((icon) => JSON.stringify(icon.name)).join(' | ')}\n`

iconsFileContent = iconsFileContent
  .replace(/fill="black"/g, 'fill="currentColor"')
  .replace(/fill-rule/g, 'fillRule')
  .replace(/clip-rule/g, 'clipRule')

const formatted = await format(iconsFileContent, {
  parser: 'typescript',
  printWidth: 140,
  semi: false,
  singleQuote: true,
  trailingComma: 'none'
})

writeFileSync('./src/defaultSvgIcons.tsx', formatted)
