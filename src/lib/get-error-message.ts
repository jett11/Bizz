/**
 * Supabase query/RPC errors come back as plain objects shaped like
 * { message, details, hint, code } — not real Error instances in this
 * version — so `err instanceof Error` silently fails for them. Always use
 * this instead of inlining that check.
 */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (err instanceof Error) return err.message
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message
  }
  return fallback
}
