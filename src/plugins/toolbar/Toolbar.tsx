import React from 'react'
import { Separator, MultipleChoiceToggleGroup, SingleChoiceToggleGroup, ButtonWithTooltip, Root } from './primitives/toolbar'

export const Toolbar: React.FC = () => {
  return (
    <Root>
      <ButtonWithTooltip title="A tooltip">IMG</ButtonWithTooltip>
      <Separator />
      <MultipleChoiceToggleGroup
        items={[
          { title: 'bold', contents: 'B', active: false, onChange: (b) => console.log({ b }) },
          { title: 'italic', contents: 'I', active: true, onChange: (i) => console.log({ i }) },
          { title: 'underline', contents: 'U', active: true, onChange: (u) => console.log({ u }) }
        ]}
      />
      <Separator />
      <SingleChoiceToggleGroup
        items={[
          { title: 'left', value: 'left', contents: 'L' },
          { title: 'center', value: 'center', contents: 'C' },
          { title: 'right', value: 'right', contents: 'R' }
        ]}
        value="center"
        onChange={(v) => console.log(v)}
      />
    </Root>
  )
}
