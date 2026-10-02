import { getPeerDependencyFromEditor } from '@lexical/extension'
import { HistoryExtension } from '@lexical/history'
import { mergeRegister } from '@lexical/utils'
import { useCellValues } from '@mdxeditor/gurx'
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, REDO_COMMAND, UNDO_COMMAND } from 'lexical'
import React from 'react'
import { IS_APPLE } from '../../../utils/detectMac'
import { activeEditor$, iconComponentFor$, useTranslation } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'

/**
 * A toolbar component that lets the user undo and redo changes in the editor.
 * @group Toolbar Components
 */
export const UndoRedo: React.FC = () => {
  const [iconComponentFor, activeEditor] = useCellValues(iconComponentFor$, activeEditor$)
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)
  const t = useTranslation()

  React.useEffect(() => {
    const history = activeEditor
      ? getPeerDependencyFromEditor<typeof HistoryExtension>(activeEditor, HistoryExtension.name)?.output
      : undefined
    const historyState = history?.disabled.value ? undefined : history?.historyState.value
    // Availability commands only describe future changes. Conditional toolbar
    // contents can mount after those commands have already been dispatched.
    setCanUndo((historyState?.undoStack.length ?? 0) > 0)
    setCanRedo((historyState?.redoStack.length ?? 0) > 0)
    if (activeEditor) {
      return mergeRegister(
        activeEditor.registerCommand<boolean>(
          CAN_UNDO_COMMAND,
          (payload) => {
            setCanUndo(payload)
            return false
          },
          COMMAND_PRIORITY_CRITICAL
        ),
        activeEditor.registerCommand<boolean>(
          CAN_REDO_COMMAND,
          (payload) => {
            setCanRedo(payload)
            return false
          },
          COMMAND_PRIORITY_CRITICAL
        )
      )
    }
  }, [activeEditor])

  return (
    <MultipleChoiceToggleGroup
      items={[
        {
          title: t('toolbar.undo', 'Undo {{shortcut}}', { shortcut: IS_APPLE ? '⌘Z' : 'Ctrl+Z' }),
          disabled: !canUndo,
          contents: iconComponentFor('undo'),
          active: false,
          onChange: () => activeEditor?.dispatchCommand(UNDO_COMMAND, undefined)
        },
        {
          title: t('toolbar.redo', 'Redo {{shortcut}}', { shortcut: IS_APPLE ? '⌘Y' : 'Ctrl+Y' }),
          disabled: !canRedo,
          contents: iconComponentFor('redo'),
          active: false,
          onChange: () => activeEditor?.dispatchCommand(REDO_COMMAND, undefined)
        }
      ]}
    />
  )
}
