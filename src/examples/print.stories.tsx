/* eslint-disable @typescript-eslint/no-deprecated */
import React from 'react'
import { MDXEditor, MDXEditorMethods, directivesPlugin } from '../'

interface AsyncDirectiveContextType {
  registerDirective: (id: string) => void
  markReady: (id: string) => void
  waitForAllReady: () => Promise<void>
}

const AsyncDirectiveContext = React.createContext<AsyncDirectiveContextType | null>(null)

export function AsyncDirectiveProvider({ children }: { children: React.ReactNode }) {
  const directivesRef = React.useRef<Map<string, boolean>>(new Map())
  const resolverRef = React.useRef<(() => void) | null>(null)
  const promiseRef = React.useRef<Promise<void> | null>(null)

  const registerDirective = React.useCallback((id: string) => {
    directivesRef.current.set(id, false)
  }, [])

  const markReady = React.useCallback((id: string) => {
    directivesRef.current.set(id, true)
    const allReady = directivesRef.current.size === 0 || Array.from(directivesRef.current.values()).every((ready) => ready)

    if (allReady && resolverRef.current) {
      resolverRef.current()
      resolverRef.current = null
      promiseRef.current = null
      directivesRef.current.clear()
    }
  }, [])

  const waitForAllReady = React.useCallback(() => {
    const allReady = directivesRef.current.size === 0 || Array.from(directivesRef.current.values()).every((ready) => ready)

    if (allReady) {
      return Promise.resolve()
    }

    promiseRef.current ??= new Promise<void>((resolve) => {
      resolverRef.current = resolve
    })

    return promiseRef.current
  }, [])

  const value = React.useMemo(
    () => ({
      registerDirective,
      markReady,
      waitForAllReady
    }),
    [registerDirective, markReady, waitForAllReady]
  )

  return <AsyncDirectiveContext.Provider value={value}>{children}</AsyncDirectiveContext.Provider>
}

export function useAsyncDirectiveContext() {
  const context = React.useContext(AsyncDirectiveContext)
  if (!context) {
    throw new Error('useAsyncDirectiveContext must be used within AsyncDirectiveProvider')
  }
  return context
}

function printHTML(html: string) {
  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) {
    console.error('Failed to open print window')
    return
  }
  printWindow.document.write('<html><head><title>Print</title>')
  printWindow.document.write('</head><body>')
  printWindow.document.write(html)
  printWindow.document.write('</body></html>')
  printWindow.document.close()
  printWindow.print()
  printWindow.close()
}

const markdownWithAsyncDirective = `
Hello world!

::asyncDirective
`

function BasicsContent() {
  const mdxEditorRef = React.useRef<MDXEditorMethods>(null)
  const { waitForAllReady } = useAsyncDirectiveContext()

  return (
    <div>
      <button
        onClick={async () => {
          mdxEditorRef.current?.setMarkdown(markdownWithAsyncDirective)
          // skip one tick to allow the editor to update
          await Promise.resolve()
          // wait for all async directives to be ready
          await waitForAllReady()
          printHTML(mdxEditorRef.current?.getContentEditableHTML() ?? '')
        }}
      >
        Print the contents of the editor
      </button>
      <MDXEditor
        ref={mdxEditorRef}
        markdown={''}
        plugins={[
          directivesPlugin({
            directiveDescriptors: [
              {
                name: 'asyncDirective',
                testNode: (node) => node.name === 'asyncDirective',
                attributes: [],
                hasChildren: false,
                Editor: () => {
                  const [isReady, setIsReady] = React.useState(false)
                  const { registerDirective, markReady } = useAsyncDirectiveContext()
                  const directiveIdRef = React.useRef(`async-directive-${Math.random()}`)

                  React.useLayoutEffect(() => {
                    const id = directiveIdRef.current
                    registerDirective(id)

                    const timeout = setTimeout(() => {
                      setIsReady(true)
                      // wait for the set state to re-render
                      setTimeout(() => {
                        markReady(id)
                      }, 50)
                    }, 500)

                    return () => {
                      clearTimeout(timeout)
                    }
                  }, [registerDirective, markReady])

                  if (!isReady) {
                    return <div>Loading async directive...</div>
                  }

                  return <div>Async Directive Content</div>
                }
              }
            ]
          })
        ]}
      />
    </div>
  )
}

export function Basics() {
  return (
    <AsyncDirectiveProvider>
      <BasicsContent />
    </AsyncDirectiveProvider>
  )
}
