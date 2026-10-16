import React from 'react'
import { Cell, Signal, useCellValue, usePublisher } from '@mdxeditor/gurx'
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  HISTORY_PUSH_TAG,
  INSERT_PARAGRAPH_COMMAND,
  COMMAND_PRIORITY_LOW,
  $isParagraphNode
} from 'lexical'
import { $insertNodeToNearestRoot } from '@lexical/utils'
import { QuoteNode } from '@lexical/rich-text'
import { realmPlugin } from '../../RealmWithPlugins'
import {
  activeEditor$,
  addActivePlugin$,
  addExportVisitor$,
  addImportVisitor$,
  addLexicalNode$,
  addToMarkdownExtension$,
  addMdastExtension$,
  createActiveEditorSubscription$,
  readOnly$,
  useTranslation
} from '../core'
import { Select } from '../toolbar/primitives/select'
import { MdastBlockQuoteVisitor } from '../quote/MdastBlockQuoteVisitor'
import { LexicalQuoteVisitor } from '../quote/LexicalQuoteVisitor'
import { $createGitHubAlertNode, $isGitHubAlertNode, GITHUB_ALERT_TYPES, GitHubAlertNode, type GitHubAlertType } from './GitHubAlertNode'
import { githubAlertsToMarkdown, LexicalGitHubAlertVisitor, MdastGitHubAlertVisitor } from './visitors'
import { githubAlertsFromMarkdown } from './syntax'
export * from './GitHubAlertNode'

function $selectedAlert(): GitHubAlertNode | null {
  const selection = $getSelection()
  if (!$isRangeSelection(selection)) return null
  let node = selection.anchor.getNode()
  while (node.getParent()) {
    if ($isGitHubAlertNode(node)) return node
    node = node.getParent()!
  }
  return null
}

/** The alert type at the selection, or an empty string outside an alert. @group GitHub Alerts */
export const currentGitHubAlertType$ = Cell<GitHubAlertType | ''>('', (r) => {
  r.pub(createActiveEditorSubscription$, (editor) =>
    editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        r.pub(currentGitHubAlertType$, $selectedAlert()?.getAlertType() ?? '')
      })
    })
  )
})

/** Changes the selected alert's type, or inserts an empty alert at the selection. @group GitHub Alerts */
export const applyGitHubAlertType$ = Signal<GitHubAlertType>((r) => {
  r.sub(applyGitHubAlertType$, (type) => {
    const editor = r.getValue(activeEditor$)
    if (!editor || !editor.isEditable() || r.getValue(readOnly$) || !GITHUB_ALERT_TYPES.includes(type)) return
    editor.update(
      () => {
        const alert = $selectedAlert()
        if (alert) alert.setAlertType(type)
        else {
          const node = $createGitHubAlertNode(type).append($createParagraphNode())
          $insertNodeToNearestRoot(node)
          node.selectStart()
        }
      },
      { tag: HISTORY_PUSH_TAG }
    )
  })
})

/** A toolbar control for inserting GitHub alerts and changing their type. @group Toolbar Components */
export function GitHubAlertTypeSelect() {
  const type = useCellValue(currentGitHubAlertType$)
  const apply = usePublisher(applyGitHubAlertType$)
  const t = useTranslation()
  return (
    <Select
      value={type}
      onChange={(value) => {
        if (value) apply(value)
      }}
      triggerTitle={t('toolbar.githubAlertType', 'GitHub alert type')}
      placeholder={t('toolbar.githubAlert', 'GitHub alert')}
      items={GITHUB_ALERT_TYPES.map((value) => ({ value, label: t(`githubAlerts.${value.toLowerCase()}`, value) }))}
    />
  )
}

/**
 * Adds native GitHub alerts (`> [!NOTE]`) without enabling directive syntax.
 * Supports NOTE, TIP, IMPORTANT, WARNING and CAUTION. Ordinary block quotes are also supported.
 * Add {@link GitHubAlertTypeSelect} to a toolbar to insert alerts or change their type.
 * @group GitHub Alerts
 */
export const githubAlertsPlugin = realmPlugin({
  init(realm) {
    realm.pubIn({
      [addActivePlugin$]: 'github-alerts',
      [addLexicalNode$]: [GitHubAlertNode, QuoteNode],
      [addImportVisitor$]: [MdastGitHubAlertVisitor, MdastBlockQuoteVisitor],
      [addExportVisitor$]: [LexicalGitHubAlertVisitor, LexicalQuoteVisitor],
      [addToMarkdownExtension$]: githubAlertsToMarkdown,
      [addMdastExtension$]: githubAlertsFromMarkdown
    })
    realm.pub(createActiveEditorSubscription$, (editor) =>
      editor.registerCommand(
        INSERT_PARAGRAPH_COMMAND,
        () => {
          if (!editor.isEditable()) return false
          const selection = $getSelection()
          if (!$isRangeSelection(selection) || !selection.isCollapsed()) return false
          const paragraph = selection.anchor.getNode()
          if (!$isParagraphNode(paragraph) || !paragraph.isEmpty()) return false
          const alert = paragraph.getParent()
          if (!$isGitHubAlertNode(alert) || paragraph.getNextSibling() !== null) return false
          const after = $createParagraphNode()
          alert.insertAfter(after)
          paragraph.remove()
          if (alert.isEmpty()) alert.remove()
          after.selectStart()
          return true
        },
        COMMAND_PRIORITY_LOW
      )
    )
    realm.register(currentGitHubAlertType$)
    realm.register(applyGitHubAlertType$)
  }
})
