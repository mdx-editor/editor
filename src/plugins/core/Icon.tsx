import React from 'react'

import add_column from '@/icons/add_column.svg'
import add_photo from '@/icons/add_photo.svg'
import add_row from '@/icons/add_row.svg'
import arrow_drop_down from '@/icons/arrow_drop_down.svg'
import check from '@/icons/check.svg'
import check_small from '@/icons/check_small.svg'
import close from '@/icons/close.svg'
import code from '@/icons/code.svg'
import content_copy from '@/icons/content_copy.svg'
import delete_big from '@/icons/delete_big.svg'
import delete_small from '@/icons/delete_small.svg'
import sandpack from '@/icons/sandpack.svg'
import difference from '@/icons/difference.svg'
import edit from '@/icons/edit.svg'
import admonition from '@/icons/admonition.svg'
import extension from '@/icons/extension.svg'
import format_align_center from '@/icons/format_align_center.svg'
import format_align_left from '@/icons/format_align_left.svg'
import format_align_right from '@/icons/format_align_right.svg'
import format_bold from '@/icons/format_bold.svg'
import format_italic from '@/icons/format_italic.svg'
import format_list_bulleted from '@/icons/format_list_bulleted.svg'
import format_list_checked from '@/icons/format_list_checked.svg'
import format_list_numbered from '@/icons/format_list_numbered.svg'
import format_underlined from '@/icons/format_underlined.svg'
import frame_source from '@/icons/frame_source.svg'
import frontmatter from '@/icons/frontmatter.svg'
import horizontal_rule from '@/icons/horizontal_rule.svg'
import insert_col_left from '@/icons/insert_col_left.svg'
import insert_col_right from '@/icons/insert_col_right.svg'
import insert_row_above from '@/icons/insert_row_above.svg'
import insert_row_below from '@/icons/insert_row_below.svg'
import link from '@/icons/link.svg'
import link_off from '@/icons/link_off.svg'
import markdown from '@/icons/markdown.svg'
import more_horiz from '@/icons/more_horiz.svg'
import more_vert from '@/icons/more_vert.svg'
import open_in_new from '@/icons/open_in_new.svg'
import redo from '@/icons/redo.svg'
import rich_text from '@/icons/rich_text.svg'
import settings from '@/icons/settings.svg'
import table from '@/icons/table.svg'
import undo from '@/icons/undo.svg'

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
  table,
  undo
}

const Icon: React.FC<{ name: IconKey }> = ({ name }) => {
  const IconComponent = IconMap[name]
  return <IconComponent />
}

export default Icon
