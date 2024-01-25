// typed version of https://github.com/slorber/remark-comment/blob/slorber/multiline-comment-bug/index.js
import type { Config } from 'mdast-util-from-markdown/lib'
import { factorySpace } from 'micromark-factory-space'
import { markdownLineEnding } from 'micromark-util-character'
import { types, codes } from 'micromark-util-symbol'

import type { Code, Extension, Tokenizer } from 'micromark-util-types'

declare module 'micromark-util-types' {
  interface TokenTypeMap {
    comment: 'comment'
    commentEnd: 'commentEnd'
    data: 'data'
  }
}

export function commentFromMarkdown(_options: { ast?: boolean }): Partial<Config> {
  return {
    canContainEols: ['comment'],
    enter: {
      comment(_) {
        this.buffer()
      }
    },
    exit: {
      comment(token) {
        const text = this.resume()
        if (_options?.ast) {
          this.enter(
            {
              // @ts-expect-error: hush.
              type: 'comment',
              value: '',
              commentValue: text.slice(0, -2)
            },
            token
          )
          this.exit(token)
        }
      }
    }
  }
}

const tokenize: Tokenizer = (effects, ok, nok) => {
  return start

  function start(code: Code) {
    effects.enter('comment')
    effects.consume(code)
    return open
  }

  function open(code: Code) {
    if (code === codes.exclamationMark) {
      effects.consume(code)
      return declarationOpen
    }

    return nok(code)
  }

  function declarationOpen(code: Code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentOpen
    }

    return nok(code)
  }

  function commentOpen(code: Code) {
    if (code === codes.dash) {
      effects.consume(code)
      return commentStart
    }

    return nok(code)
  }

  function commentStart(code: Code) {
    if (code === codes.greaterThan) {
      return nok(code)
    }

    if (markdownLineEnding(code)) {
      return atLineEnding(code)
    }

    effects.enter(types.data)

    if (code === codes.dash) {
      effects.consume(code)
      return commentStartDash
    }

    return comment(code)
  }

  function commentStartDash(code: Code) {
    if (code === codes.greaterThan) {
      return nok(code)
    }

    return comment(code)
  }

  function comment(code: Code): any {
    if (code === codes.eof) {
      return nok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return commentClose
    }

    if (markdownLineEnding(code)) {
      effects.exit(types.data)
      return atLineEnding(code)
    }

    effects.consume(code)
    return comment
  }

  function atLineEnding(code: Code): any {
    effects.enter(types.lineEnding)
    effects.consume(code)
    effects.exit(types.lineEnding)
    return factorySpace(effects, afterPrefix, types.linePrefix)
  }

  function afterPrefix(code: Code) {
    if (markdownLineEnding(code)) {
      return atLineEnding(code)
    }

    effects.enter(types.data)
    return comment(code)
  }

  function commentClose(code: Code) {
    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }

  function end(code: Code) {
    if (code === codes.greaterThan) {
      effects.exit(types.data)
      effects.enter('commentEnd') // See https://github.com/leebyron/remark-comment/pull/3#discussion_r1239494357
      effects.consume(code)
      effects.exit('commentEnd')
      effects.exit('comment')
      return ok(code)
    }

    if (code === codes.dash) {
      effects.consume(code)
      return end
    }

    return comment(code)
  }
}

export const comment: Extension = {
  flow: { [60]: { tokenize, concrete: true } },
  text: { [60]: { tokenize } }
}
