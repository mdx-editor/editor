import { system } from '../gurx'

export const [LinkDialogSystem, LinkDialogSystemType] = system((r) => {
  const dialogState = r.node(false)
  return {
    dialogState,
  }
}, [])
