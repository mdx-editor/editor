import { Directive, LeafDirective, TextDirective, ContainerDirective } from 'mdast-util-directive'

interface DirectiveDescriptor {
  name: string
  type: Directive['type']
  attributes: string[]
  hasChildren: boolean
  // TODO: editor RC field
}
