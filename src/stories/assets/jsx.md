---
title: Hello World
---

import { MyLeaf, BlockNode } from './external';

A paragraph with <MyLeaf foo="baz" /> inline jsx component <MyLeaf>Meh more *Leaf*</MyLeaf>.

<MyLeaf foo="bar" />

<BlockNode someAttribute="value">
    This should be passed as a paragraph.
</BlockNode>