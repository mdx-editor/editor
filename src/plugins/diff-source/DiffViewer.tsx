/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { Diff, Hunk, parseDiff } from 'react-diff-view'
import { diffLines, formatLines } from 'unidiff'

import 'react-diff-view/style/index.css'
import { corePluginHooks } from '../core/realmPlugin'
import { diffSourcePluginHooks } from './realmPlugin'

export const DiffViewer: React.FC = () => {
  const [newText] = corePluginHooks.useEmitterValues('markdown')
  const [oldText] = diffSourcePluginHooks.useEmitterValues('diffMarkdown')

  const diffText = formatLines(diffLines(oldText, newText), { context: 3 })
  if (diffText.trim() === '') return <div>No changes</div>
  const [diff] = parseDiff(diffText, { nearbySequences: 'zip' })

  return (
    <Diff viewType="split" diffType="modify" hunks={diff.hunks || []}>
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  )
}
