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
