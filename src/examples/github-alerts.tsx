import React from 'react'
import { MDXEditor, MDXEditorMethods } from '../MDXEditor'
import { githubAlertsPlugin, GitHubAlertTypeSelect } from '../plugins/github-alerts'
import { listsPlugin } from '../plugins/lists'
import { toolbarPlugin } from '../plugins/toolbar'
import { UndoRedo } from '../plugins/toolbar/components/UndoRedo'
import { diffSourcePlugin } from '../plugins/diff-source'
import { DiffSourceToggleWrapper } from '../plugins/toolbar/components/DiffSourceToggleWrapper'

export function GitHubAlerts() {
  const ref = React.useRef<MDXEditorMethods>(null)
  const [markdown, setMarkdown] = React.useState('')
  const [readOnly, setReadOnly] = React.useState(false)
  return (
    <>
      <label>
        <input
          type="checkbox"
          checked={readOnly}
          onChange={(event) => {
            setReadOnly(event.target.checked)
          }}
        />
        Read only
      </label>
      <MDXEditor
        ref={ref}
        readOnly={readOnly}
        markdown={'> [!NOTE]\n> **Useful** information.\n>\n> * First item\n> * Second item\n\nAfter the alert.'}
        plugins={[
          githubAlertsPlugin(),
          listsPlugin(),
          diffSourcePlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <DiffSourceToggleWrapper>
                <UndoRedo />
                <GitHubAlertTypeSelect />
              </DiffSourceToggleWrapper>
            )
          })
        ]}
      />
      <button
        onClick={() => {
          setMarkdown(ref.current!.getMarkdown())
        }}
      >
        Get Markdown
      </button>
      <pre aria-label="Current Markdown">{markdown}</pre>
    </>
  )
}
