import React from 'react'
import * as Select from '@radix-ui/react-select'
import { ReactComponent as DropDownIcon } from './icons/arrow_drop_down.svg'
import { ChevronDownIcon, ChevronUpIcon } from '@radix-ui/react-icons'
import classnames from 'classnames'

export const SelectItem = React.forwardRef<HTMLDivElement | null, { className?: string; children: React.ReactNode; value: string }>(
  ({ children, className, ...props }, forwardedRef) => {
    return (
      <Select.Item
        {...props}
        ref={forwardedRef}
        className={classnames(
          className,
          `cursor-default px-4 py-2 data-[highlighted]:bg-primary-200 data-[state=checked]:bg-primary-300 data-[highlighted]:outline-0 flex`
        )}
      >
        <Select.ItemText>{children}</Select.ItemText>
      </Select.Item>
    )
  }
)
export function SelectTrigger({ placeholder }: { placeholder: string }) {
  return (
    <Select.Trigger
      aria-label={placeholder}
      className="group flex w-36 flex-row items-center rounded-md border-0 bg-transparent p-2 pl-4 pr-2 font-sans text-base hover:bg-primary-100 data-[state=open]:rounded-b-none data-[state=open]:bg-primary-100"
    >
      <Select.Value placeholder={placeholder} />
      <Select.Icon className="ml-auto group-data-[state=open]:text-primary-900 [&_svg]:block">
        <DropDownIcon />
      </Select.Icon>
    </Select.Trigger>
  )
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return (
    <Select.Portal className="font-sans">
      <Select.Content className="w-36 rounded-b-md bg-primary-100" onCloseAutoFocus={(e) => e.preventDefault()} position="popper">
        <Select.ScrollUpButton className="">
          <ChevronUpIcon />
        </Select.ScrollUpButton>
        <Select.Viewport className="">{children}</Select.Viewport>
        <Select.ScrollDownButton className="">
          <ChevronDownIcon />
        </Select.ScrollDownButton>
      </Select.Content>
    </Select.Portal>
  )
}
