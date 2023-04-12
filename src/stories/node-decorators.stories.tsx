import React from 'react'
import { FrontmatterEditorProps } from '../types/NodeDecoratorsProps'
import { FrontmatterEditor } from '../ui/NodeDecorators/FrontmatterEditor'

export const Frontmatter = () => {
  const props: FrontmatterEditorProps = {
    yaml: 'title: Hello World',
    onChange: (yaml) => {
      console.log(yaml)
    },
  }

  return (
    <div>
      <h1>Frontmatter editor</h1>
      <FrontmatterEditor {...props} />
    </div>
  )
}
