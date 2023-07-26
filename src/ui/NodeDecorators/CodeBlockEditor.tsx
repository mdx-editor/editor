export const CodeBlockEditor = () => {
  return null
  /*
  const [activeEditor] = useEmitterValues('activeEditor')
  const codeMirrorRef = useCodeMirrorRef(nodeKey, 'codeblock', language)
  const setActiveEditorType = usePublisher('activeEditorType')

  React.useEffect(() => {
    focusEmitter.subscribe(() => {
      codeMirrorRef?.current?.getCodemirror()?.focus()
      setActiveEditorType({ type: 'codeblock', nodeKey })
    })
  }, [focusEmitter, codeMirrorRef, setActiveEditorType, nodeKey])

  const wrappedOnChange = React.useCallback(
    (code: string) => {
      activeEditor?.update(() => {
        onChange(code)
      })
    },
    [onChange, activeEditor]
  )

  return (
    <div className={styles.sandpackWrapper}>
      <SandpackProvider>
        <TheEditorFromSandpack
          showLineNumbers
          initMode="immediate"
          key={language}
          filePath={`file.${language || 'txt'}`}
          code={code}
          onCodeUpdate={wrappedOnChange}
          ref={codeMirrorRef}
        />
      </SandpackProvider>
    </div>
  )
  */
}
