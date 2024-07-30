import React from 'react'
import {MDXEditor, Separator, toolbarPlugin, UndoRedo} from '../'

export function AssociateLabelForTextBox() {
  return (
      <form>
          <label id="mdxEditor-label">Form label associated to the textbox</label>
          <MDXEditor
              markdown={'MDXEditor has a default `aria-label` (in locale files) so we must use the `aria-labelledBy` prop to link the textbox to the label (cannot use the default `htmlFor` behaviour)'}
              contentEditableProps={{
                  ariaLabelledBy: "mdxEditor-label"
              }}
              plugins={[
                  toolbarPlugin({
                      toolbarContents: () => (
                          <>
                              <UndoRedo />
                              <Separator />
                          </>
                      )
                  }),
              ]}
          />
      </form>
  )
}

export function CustomizeAriaLabel() {
  return (
      <MDXEditor
          markdown={'Set an `aria-label` in the props'}
          contentEditableProps={{
              ariaLabel: "My custom label"
          }}
          plugins={[
              toolbarPlugin({
                  toolbarContents: () => (
                      <>
                          <UndoRedo />
                          <Separator />
                      </>
                  )
              }),
          ]}
      />
  )
}

export function MarkTextboxToRequired() {
  return (
      <MDXEditor
          markdown={'Set the `required` and the `aria-required` props for the field to be identified as "required" '}
          contentEditableProps={{
              required: true,
              ariaRequired: true
          }}
          plugins={[
              toolbarPlugin({
                  toolbarContents: () => (
                      <>
                          <UndoRedo />
                          <Separator />
                      </>
                  )
              }),
          ]}
      />
  )
}

