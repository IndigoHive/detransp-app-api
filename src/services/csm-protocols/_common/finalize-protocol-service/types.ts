export type FinalizeProtocolInput = Record<string, unknown>

export type FinalizeProtocolResponse =
  | { success: true }
  | { showSnackbar: { variant: 'error'; title: string; description: string } }
