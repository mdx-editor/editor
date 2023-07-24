import 'mdast-util-directive'
import { system } from '../gurx'
import { getStateAsMarkdown } from '../utils/lexicalHelpers'
import { EditorSystem } from './Editor'
import { JsxSystem } from './Jsx'

export const OnChangeSystem = system(
  (r, [{ createEditorSubscription, lexicalConvertOptions, markdownSource }, { jsxComponentDescriptors }]) => {
    const onChange = r.node<string>()

    r.pub(createEditorSubscription, (_, rootEditor) => {
      function updateMarkdown() {
        const descriptors = r.getValue(jsxComponentDescriptors)
        const options = r.getValue(lexicalConvertOptions)!
        const markdown = getStateAsMarkdown(rootEditor, { jsxComponentDescriptors: descriptors, ...options, jsxIsAvailable: true })
        r.pub(onChange, markdown)
        r.pub(markdownSource, markdown)
      }

      updateMarkdown()

      return rootEditor.registerUpdateListener(({ dirtyElements, dirtyLeaves, prevEditorState, tags }) => {
        if ((dirtyElements.size === 0 && dirtyLeaves.size === 0) || tags.has('history-merge') || prevEditorState.isEmpty()) {
          return
        }
        updateMarkdown()
      })
    })

    return {
      onChange
    }
  },
  [EditorSystem, JsxSystem]
)
