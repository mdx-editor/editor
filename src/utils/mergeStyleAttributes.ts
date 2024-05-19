export function mergeStyleAttributes(style1: string, style2: string): string {
  // Convert style strings to objects for easier manipulation
  const styleObject1 = styleToObject(style1)
  const styleObject2 = styleToObject(style2)

  // Merge the two style objects, giving priority to styleObject2
  const mergedStyleObject = { ...styleObject1, ...styleObject2 }

  // Convert the merged style object back to a string
  const mergedStyleString = objectToStyle(mergedStyleObject)

  return mergedStyleString
}

// Helper function to convert a style string to an object
function styleToObject(style: string): Record<string, string> {
  const styleObject: Record<string, string> = {}
  const stylePairs = style.split(';').filter((pair) => pair.trim() !== '')

  stylePairs.forEach((pair) => {
    const [key, value] = pair.split(':').map((part) => part.trim())
    styleObject[key] = value
  })

  return styleObject
}

// Helper function to convert a style object to a string
function objectToStyle(styleObject: Record<string, string>): string {
  return Object.entries(styleObject)
    .map(([key, value]) => `${key}: ${value}`)
    .join('; ')
}
