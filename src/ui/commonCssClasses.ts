import classnames from 'classnames'

export const childSvgClasses =
  '[&_svg]:transform [&_svg]:block [&_svg]:rotate-0 [&_svg]:skew-x-0 [&_svg]:skew-y-0 [&_svg]:scale-100  active:[&_svg]:translate-x-[1px] active:[&_svg]:translate-y-[1px]'

export const buttonClasses = classnames(
  childSvgClasses,
  'rounded-md border-0 bg-transparent p-2 transition-colors text-primary-900 hover:bg-primary-100 active:bg-primary-200 active:text-primary-800'
)
