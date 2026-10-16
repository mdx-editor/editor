import { $applyNodeReplacement, ElementNode, type LexicalNode, type NodeKey, type SerializedElementNode, type Spread } from 'lexical'
import styles from './github-alerts.module.css'

/** The five alert types supported by GitHub. @group GitHub Alerts */
export const GITHUB_ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'] as const
/** @group GitHub Alerts */
export type GitHubAlertType = (typeof GITHUB_ALERT_TYPES)[number]
/** @group GitHub Alerts */
export type SerializedGitHubAlertNode = Spread<{ alertType: GitHubAlertType }, SerializedElementNode>

/** An editable block container for a GitHub alert. @group GitHub Alerts */
export class GitHubAlertNode extends ElementNode {
  /** @internal */
  __alertType: GitHubAlertType
  static getType(): string {
    return 'github-alert'
  }
  static clone(node: GitHubAlertNode): GitHubAlertNode {
    return new GitHubAlertNode(node.__alertType, node.__key)
  }
  constructor(alertType: GitHubAlertType = 'NOTE', key?: NodeKey) {
    super(key)
    this.__alertType = alertType
  }
  static importJSON(node: SerializedGitHubAlertNode): GitHubAlertNode {
    return $createGitHubAlertNode(node.alertType).updateFromJSON(node)
  }
  exportJSON(): SerializedGitHubAlertNode {
    return { ...super.exportJSON(), alertType: this.getAlertType() }
  }
  getAlertType(): GitHubAlertType {
    return this.getLatest().__alertType
  }
  setAlertType(alertType: GitHubAlertType): this {
    if (!GITHUB_ALERT_TYPES.includes(alertType)) throw new Error(`Unknown GitHub alert type: ${alertType}`)
    this.getWritable().__alertType = alertType
    return this
  }
  createDOM(): HTMLElement {
    const element = document.createElement('div')
    element.className = styles.alert
    element.dataset.githubAlert = this.__alertType
    element.setAttribute('aria-label', `${this.__alertType.toLowerCase()} alert`)
    return element
  }
  updateDOM(previous: GitHubAlertNode, element: HTMLElement): boolean {
    if (previous.__alertType !== this.__alertType) {
      element.dataset.githubAlert = this.__alertType
      element.setAttribute('aria-label', `${this.__alertType.toLowerCase()} alert`)
    }
    return false
  }
  canIndent(): boolean {
    return false
  }
  canBeEmpty(): boolean {
    return false
  }
}

/** Creates a GitHub alert container. @group GitHub Alerts */
export function $createGitHubAlertNode(alertType: GitHubAlertType = 'NOTE'): GitHubAlertNode {
  if (!GITHUB_ALERT_TYPES.includes(alertType)) throw new Error(`Unknown GitHub alert type: ${alertType}`)
  return $applyNodeReplacement(new GitHubAlertNode(alertType))
}
/** @group GitHub Alerts */
export function $isGitHubAlertNode(node: LexicalNode | null | undefined): node is GitHubAlertNode {
  return node instanceof GitHubAlertNode
}
