/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AutoLinkPlugin, createLinkMatcherWithRegExp } from '@lexical/react/LexicalAutoLinkPlugin'
import React, { FC } from 'react'

const URL_REGEX =
  /(?:(?:https?|ftp):\/\/)?(?:[\w-]+(?::[\w-]+)?@)?(?:(?:[\w-]+(?:\.[\w-]+)*(?:\.[a-zA-Z]{2,}))|(?:(?:[0-9]{1,3}\.){3}[0-9]{1,3}))(?::[0-9]{1,5})?(?:\/[^\s]*)?/

const EMAIL_REGEX =
  /(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/

const MATCHERS = [
  createLinkMatcherWithRegExp(URL_REGEX, (text) => {
    return text.startsWith('http') ? text : `https://${text}`
  }),
  createLinkMatcherWithRegExp(EMAIL_REGEX, (text) => {
    return `mailto:${text}`
  })
]

export const LexicalAutoLinkPlugin: FC = () => {
  return <AutoLinkPlugin matchers={MATCHERS} />
}
