import type { CodeBlockEditorDescriptor } from '.'

export function findCodeBlockDescriptor(
  descriptors: CodeBlockEditorDescriptor[],
  language: string | null | undefined,
  meta: string | null | undefined,
  defaultLanguage: string | null | undefined
): CodeBlockEditorDescriptor | undefined {
  const sortedDescriptors = [...descriptors].sort((a, b) => b.priority - a.priority)
  const resolvedMeta = meta ?? ''

  return (
    sortedDescriptors.find((descriptor) => descriptor.match(language ?? '', resolvedMeta)) ??
    sortedDescriptors.find((descriptor) => descriptor.match(defaultLanguage ?? '', resolvedMeta))
  )
}
