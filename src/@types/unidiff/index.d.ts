declare module 'unidiff' {
  export const diffLines: (a: string, b: string) => string
  export const formatLines: (diff: string, options: Record<string, string | number>) => string
}
