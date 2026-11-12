import type { AuthError } from '../../types/user';

// The API's `errors` array as one message, or the fallback when there is none.
export const errorMessage = (err: unknown, fallback: string) =>
    (err as { data?: AuthError })?.data?.errors?.join(' ') || fallback;
