import React from 'react'
import { FrontmatterEditorProps } from '../types/NodeDecoratorsProps'
import { FrontmatterEditor } from '../ui/NodeDecorators/FrontmatterEditor'
import { LinkEditForm } from '../ui'
import { randGitCommitSha, randUrl } from '@ngneat/falso'

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

export const LinkEditFormExample = () => {
  return (
    <>
      <LinkEditForm
        initialUrl="https://google.com"
        linkAutocompleteSuggestions={randUrl({ length: 100 }).map((url) => `${url}?${randGitCommitSha()}`)}
        onSubmit={(e) => {
          console.log(e)
        }}
        onCancel={(e) => {
          console.log(e)
        }}
      />
      <div className="w-10 h-10 bg-red-300">some contnet</div>
    </>
  )
}
