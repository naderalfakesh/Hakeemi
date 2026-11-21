/**
 * Whose data a query reads: the signed-in account's, or the local demo's.
 * Query keys carry the scope so the two never share a cache entry.
 */
export type AppDataScope = 'account' | 'demo';
