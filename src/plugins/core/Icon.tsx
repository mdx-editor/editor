import React from 'react'

import add_column from '@/icons/add_column.svg?react'
import add_photo from '@/icons/add_photo.svg?react'
import add_row from '@/icons/add_row.svg?react'
import arrow_drop_down from '@/icons/arrow_drop_down.svg?react'
import check from '@/icons/check.svg?react'
import check_small from '@/icons/check_small.svg?react'
import close from '@/icons/close.svg?react'
import code from '@/icons/code.svg?react'
import content_copy from '@/icons/content_copy.svg?react'
import delete_big from '@/icons/delete_big.svg?react'
import delete_small from '@/icons/delete_small.svg?react'
import sandpack from '@/icons/sandpack.svg?react'
import difference from '@/icons/difference.svg?react'
import edit from '@/icons/edit.svg?react'
import admonition from '@/icons/admonition.svg?react'
import extension from '@/icons/extension.svg?react'
import format_align_center from '@/icons/format_align_center.svg?react'
import format_align_left from '@/icons/format_align_left.svg?react'
import format_align_right from '@/icons/format_align_right.svg?react'
import format_bold from '@/icons/format_bold.svg?react'
import format_italic from '@/icons/format_italic.svg?react'
import format_list_bulleted from '@/icons/format_list_bulleted.svg?react'
import format_list_checked from '@/icons/format_list_checked.svg?react'
import format_list_numbered from '@/icons/format_list_numbered.svg?react'
import format_underlined from '@/icons/format_underlined.svg?react'
import frame_source from '@/icons/frame_source.svg?react'
import frontmatter from '@/icons/frontmatter.svg?react'
import horizontal_rule from '@/icons/horizontal_rule.svg?react'
import insert_col_left from '@/icons/insert_col_left.svg?react'
import insert_col_right from '@/icons/insert_col_right.svg?react'
import insert_row_above from '@/icons/insert_row_above.svg?react'
import insert_row_below from '@/icons/insert_row_below.svg?react'
import link from '@/icons/link.svg?react'
import link_off from '@/icons/link_off.svg?react'
import markdown from '@/icons/markdown.svg?react'
import more_horiz from '@/icons/more_horiz.svg?react'
import more_vert from '@/icons/more_vert.svg?react'
import open_in_new from '@/icons/open_in_new.svg?react'
import redo from '@/icons/redo.svg?react'
import rich_text from '@/icons/rich_text.svg?react'
import settings from '@/icons/settings.svg?react'
import table from '@/icons/table.svg?react'
import undo from '@/icons/undo.svg?react'
import strikeThrough from '@/icons/strikethrough_s.svg?react'
import superscript from '@/icons/superscript.svg?react'
import subscript from '@/icons/subscript.svg?react'

/**
 * A type that represents the possible icon names that can be used with the {@link iconComponentFor$} cell.
 * @group Core
 */
export type IconKey =
  | 'add_column'
  | 'add_photo'
  | 'add_row'
  | 'arrow_drop_down'
  | 'check'
  | 'check_small'
  | 'close'
  | 'code'
  | 'content_copy'
  | 'delete_big'
  | 'delete_small'
  | 'sandpack'
  | 'difference'
  | 'edit'
  | 'admonition'
  | 'extension'
  | 'format_align_center'
  | 'format_align_left'
  | 'format_align_right'
  | 'format_bold'
  | 'format_italic'
  | 'format_list_bulleted'
  | 'format_list_checked'
  | 'format_list_numbered'
  | 'format_underlined'
  | 'frame_source'
  | 'frontmatter'
  | 'horizontal_rule'
  | 'insert_col_left'
  | 'insert_col_right'
  | 'insert_row_above'
  | 'insert_row_below'
  | 'link'
  | 'link_off'
  | 'markdown'
  | 'more_horiz'
  | 'more_vert'
  | 'open_in_new'
  | 'redo'
  | 'rich_text'
  | 'settings'
  | 'strikeThrough'
  | 'subscript'
  | 'superscript'
  | 'table'
  | 'undo'

const IconMap: Record<IconKey, React.FC> = {
  add_column,
  add_photo,
  add_row,
  arrow_drop_down,
  check,
  check_small,
  close,
  code,
  content_copy,
  delete_big,
  delete_small,
  sandpack,
  difference,
  edit,
  admonition,
  extension,
  format_align_center,
  format_align_left,
  format_align_right,
  format_bold,
  format_italic,
  format_list_bulleted,
  format_list_checked,
  format_list_numbered,
  format_underlined,
  frame_source,
  frontmatter,
  horizontal_rule,
  insert_col_left,
  insert_col_right,
  insert_row_above,
  insert_row_below,
  link,
  link_off,
  markdown,
  more_horiz,
  more_vert,
  open_in_new,
  redo,
  rich_text,
  settings,
  strikeThrough,
  subscript,
  superscript,
  table,
  undo
}

const Icon: React.FC<{ name: IconKey }> = ({ name }) => {
  const IconComponent = IconMap[name]
  return <IconComponent />
}

export default Icon
