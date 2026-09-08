import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const read = (path: string) => readFileSync(fileURLToPath(new URL(path, import.meta.url)), 'utf8')

describe('theme tokens', () => {
  it('imports every Radix scale together with its dark counterpart', () => {
    // Radix defines a scale's dark steps in a separate file, scoped to `.dark, .dark-theme`. Importing
    // one without the other leaves that scale light in both schemes, so the tokens deriving from it
    // cannot follow `dark-theme` — which is what left four of the five admonitions on light backgrounds.
    const imported = [...read('../styles/globals.css').matchAll(/@radix-ui\/colors\/([a-z]+(?:-dark)?)\.css/g)].map((match) => match[1])
    const missingDark = imported.filter((scale) => !scale.endsWith('-dark') && !imported.includes(`${scale}-dark`))

    expect(missingDark).toEqual([])
  })
})
