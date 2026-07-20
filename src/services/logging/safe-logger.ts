type SafeLogMetadata = Record<string, boolean | number | string | null | undefined>;

const SENSITIVE_KEY_PATTERN = /(email|name|patient|provider|token|password|phone|address)/iu;

function redactMetadata(metadata: SafeLogMetadata | undefined) {
  if (!metadata) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(metadata).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[redacted]' : value,
    ]),
  );
}

export function logSafeError(scope: string, error: unknown, metadata?: SafeLogMetadata) {
  if (!__DEV__) {
    return;
  }

  const errorName = error instanceof Error ? error.name : 'UnknownError';
  const errorCode =
    typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : undefined;

  console.error('[Hakeemi error]', {
    code: errorCode,
    metadata: redactMetadata(metadata),
    name: errorName,
    scope,
  });
}
