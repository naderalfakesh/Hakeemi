/**
 * Expo Router hands a repeated query parameter over as an array. Routes here
 * only ever expect one value, so they read the first and treat a missing
 * parameter as an empty string.
 */
export function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}
