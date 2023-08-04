import { mergeRegister } from '@lexical/utils'
import { CAN_REDO_COMMAND, CAN_UNDO_COMMAND, COMMAND_PRIORITY_CRITICAL, REDO_COMMAND, UNDO_COMMAND } from 'lexical'
import React from 'react'
import RedoIcon from '../../../icons/redo.svg'
import UndoIcon from '../../../icons/undo.svg'
import { IS_APPLE } from '../../../utils/detectMac'
import { corePluginHooks } from '../../core'
import { MultipleChoiceToggleGroup } from '.././primitives/toolbar'

export const UndoRedo: React.FC = () => {
  const [activeEditor] = corePluginHooks.useEmitterValues('activeEditor')
  const [canUndo, setCanUndo] = React.useState(false)
  const [canRedo, setCanRedo] = React.useState(false)

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
          title: IS_APPLE ? 'Undo (⌘Z)' : 'Undo (Ctrl+Z)',
          disabled: !canUndo,
          contents: <UndoIcon />,
          active: false,
          onChange: () => activeEditor?.dispatchCommand(UNDO_COMMAND, undefined)
        },
        {
          title: IS_APPLE ? 'Redo (⌘Y)' : 'Redo (Ctrl+Y)',
          disabled: !canRedo,
          contents: <RedoIcon />,
          active: false,
          onChange: () => activeEditor?.dispatchCommand(REDO_COMMAND, undefined)
        }
      ]}
    />
  )
}
