/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React from 'react'
import { diffLines, formatLines } from 'unidiff'
import { parseDiff, Diff, Hunk } from 'react-diff-view'

import 'react-diff-view/style/index.css'
import styles from '../styles.module.css'

export function DiffViewer({ oldText, newText }: { oldText: string; newText: string }) {
  const diffText = formatLines(diffLines(oldText, newText), { context: 3 })
  if (diffText.trim() === '') return <div className={styles.editorRoot}>No changes</div>
  const [diff] = parseDiff(diffText, { nearbySequences: 'zip' })

  return (
    <Diff viewType="split" diffType="modify" hunks={diff.hunks || []}>
      {(hunks) => hunks.map((hunk) => <Hunk key={hunk.content} hunk={hunk} />)}
    </Diff>
  )
}
