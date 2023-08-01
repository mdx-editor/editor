export function isPartOftheEditorUI(element: HTMLElement | null, editorRoot: HTMLElement): boolean {
  if (element === null || element === editorRoot) {
    return false
  }
  if (element.dataset['editorDialog'] !== undefined || element.dataset['toolbarItem'] !== undefined || element.dataset['editorDropdown']) {
    return true
  }
  return isPartOftheEditorUI(element.parentElement, editorRoot)
}
