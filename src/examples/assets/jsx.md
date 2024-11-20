import { MyLeaf, BlockNode } from './external';

A paragraph with inline jsx component <MyLeaf foo="fooValue">Meh more _Leaf_</MyLeaf> more <Marker type="warning" />.

<BlockNode foo="fooValue">
  Content *foo*

more Content
</BlockNode>

something more.

<UnknownJsxNode>What</UnknownJsxNode>

<MyLeaf foo="fooValue">Some content</MyLeaf>

<MyLeaf foo="fooValue" />
