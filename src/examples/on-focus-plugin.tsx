import React from 'react'
import { onFocusPlugin } from '@/plugins/on-focus'
import { MDXEditor } from '@/MDXEditor'
import { toolbarPlugin } from '@/plugins/toolbar'
import { BoldItalicUnderlineToggles } from '@/plugins/toolbar/components/BoldItalicUnderlineToggles'

export function Basic() {
  const [focused, setFocused] = React.useState(false)
  return (
    <div>
      Focused: {focused ? 'true' : 'false'}
      <MDXEditor
        onBlur={() => {
          setFocused(false)
        }}
        markdown="Click me!"
        plugins={[
          onFocusPlugin({
            action: () => {
              setFocused(true)
            }
          })
        ]}
      />
    </div>
  )
}

export function LoadPluginOnInitialFocus() {
  return (
    <div>
      <MDXEditor
        markdown="Click me!"
        plugins={[
          onFocusPlugin({
            once: true,
            action: (realm) => {
              toolbarPlugin({
                toolbarContents: () => <BoldItalicUnderlineToggles />
              }).init?.(realm)
            }
          })
        ]}
      />
    </div>
  )
}
