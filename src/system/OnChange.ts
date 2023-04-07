import { system } from '../gurx'
import { getStateAsMarkdown } from '../utils/lexicalHelpers'
import { EditorSystemType } from './Editor'
import { JsxSystemType } from './Jsx'

export const [OnChangeSystem, OnChangeSystemType] = system(
  (r, [{ createEditorSubscription }, { jsxComponentDescriptors }]) => {
    const onChange = r.node<string>()

    r.pub(createEditorSubscription, (activeEditor, rootEditor) => {
      return activeEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, prevEditorState, tags }) => {
        if ((dirtyElements.size === 0 && dirtyLeaves.size === 0) || tags.has('history-merge') || prevEditorState.isEmpty()) {
          return
        }

        const descriptors = r.getValue(jsxComponentDescriptors)
        r.pub(onChange, getStateAsMarkdown(rootEditor, descriptors))
      })
    })

    return {
      onChange,
    }
  },
  [EditorSystemType, JsxSystemType]
)
