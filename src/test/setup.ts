// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
expect.extend(matchers)
