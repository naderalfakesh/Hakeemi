import { useEffect, useState } from 'react';

/** Returns `value` once it has stopped changing for `delayMs`. */
export function useDebouncedValue<Value>(value: Value, delayMs: number) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timeout);
  }, [delayMs, value]);

  return debounced;
}
