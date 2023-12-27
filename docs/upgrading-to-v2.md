---
title: Upgrading to v2
slug: upgrading-to-v2
position: 101
---

# Upgrading to V2

Version 2 of MDXEditor did not introduce any breaking changes to the built-in plugins or the public API. It upgraded its internal state management model, and bumped its dependencies (including Lexical and the Mdast family) to the latest versions. 

## Dropped individual exports

The editor still ships its source code as separate files, but it no longer defines the exports for each file. You should import everything from the package name, the tree-shaking should take care of the rest. 

## mdast-util-from-markdown v2

The markdown AST converter got upgraded [to v2](https://github.com/syntax-tree/mdast-util-from-markdown/releases). Few of its extensions moved to a new syntax for their extensions - for example, [the task list item now exports functions](https://github.com/syntax-tree/mdast-util-gfm-task-list-item/releases/tag/2.0.0). 


## Changes to the state management model

The main difference is that the internal state management is now extracted into a separate package called Gurx. As a result, plugin authoring is easier. In fact, you should be able to achieve most of the customizations and extensions without packaging them as a plugin.

V1 used the concept of systems (with dependencies between them) as means of encapsulating reactive nodes. In v2, the reactive nodes are module level exports, and no system/dependency definitions are necessary - if you need to access a reactive node, you can import it directly from the module. 

The easiest way to understand the necessary changes in your plugin is to check the [diff](https://github.com/mdx-editor/editor/commit/4b646a7240755be670543f604a3573618f74b15c#diff-b4e56d4d61a1410ccfc01148b5290d6e772a98b2bce1ea539184ab7381cdfa35) between the v1 and v2 versions of the built-in plugins. 

