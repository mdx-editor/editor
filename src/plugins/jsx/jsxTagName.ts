import { htmlTags } from '../core/MdastHTMLNode'

export function isHtmlTagName(name: string): boolean {
  return (htmlTags as readonly string[]).includes(name)
}
