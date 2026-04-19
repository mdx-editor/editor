import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { MDXEditor } from '../MDXEditor'
import { InsertImage } from '../plugins/toolbar/components/InsertImage'
import { DialogButton } from '../plugins/toolbar/primitives/DialogButton'
import { ButtonOrDropdownButton, ButtonWithTooltip } from '../plugins/toolbar/primitives/toolbar'
import { toolbarPlugin } from '../plugins/toolbar'

describe('toolbar accessibility', () => {
  it('exposes accessible names for icon-only toolbar controls', () => {
    render(
      <MDXEditor
        markdown=""
        plugins={[
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <ButtonWithTooltip title="Insert code block">code</ButtonWithTooltip>
                <ButtonOrDropdownButton
                  title="Insert admonition"
                  onChoose={() => undefined}
                  items={[
                    { value: 'note', label: 'Note' },
                    { value: 'tip', label: 'Tip' }
                  ]}
                >
                  admonition
                </ButtonOrDropdownButton>
                <DialogButton
                  tooltipTitle="Insert YouTube video"
                  dialogInputPlaceholder="Paste URL"
                  submitButtonTitle="Insert video"
                  onSubmit={() => undefined}
                  buttonContent="video"
                />
                <InsertImage />
              </>
            )
          })
        ]}
      />
    )

    expect(screen.getByRole('button', { name: 'Insert code block' })).toBeInTheDocument()
    expect(screen.getByLabelText('Insert admonition')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert YouTube video' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Insert image' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Insert YouTube video' }))

    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument()
  })
})
