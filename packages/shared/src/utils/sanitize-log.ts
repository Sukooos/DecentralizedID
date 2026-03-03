/**
 * Sanitize log data to prevent PII leakage
 * WHY: Per .github/instructions/backend.instructions.md — no PII in logs
 */

const PII_PATTERNS: RegExp[] = [
  // Email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone (Indonesia format)
  /\b(\+62|62|0)[\s-]?8[\d\s-]{8,12}\b/g,
  // NIK (16 digits)
  /\b\d{16}\b/g,
  // Credit card (simple pattern)
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
];

const SENSITIVE_KEYS = [
  'password',
  'secret',
  'token',
  'apiKey',
  'privateKey',
  'accessToken',
  'refreshToken',
  'authorization',
  'cookie',
  'session',
  'ssn',
  'nik',
  'ktp',
  'npwp',
];

/**
 * Sanitize string by replacing PII patterns
 */
export function sanitizeString(input: string): string {
  let sanitized = input;
  for (const pattern of PII_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  return sanitized;
}

/**
 * Sanitize object recursively (for logging)
 */
export function sanitizeObject<T = unknown>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj) as T;
  }

  if (typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as T;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    // Mask sensitive keys
    if (SENSITIVE_KEYS.some((sensitiveKey) => key.toLowerCase().includes(sensitiveKey))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Recursively sanitize nested objects
    sanitized[key] = sanitizeObject(value);
  }

  return sanitized as T;
}

/**
 * Create sanitized logger wrapper
 */
export function createSanitizedLogger(logger: Console = console): {
  log: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
} {
  return {
    log: (...args: unknown[]) => logger.log(...args.map(sanitizeObject)),
    error: (...args: unknown[]) => logger.error(...args.map(sanitizeObject)),
    warn: (...args: unknown[]) => logger.warn(...args.map(sanitizeObject)),
    debug: (...args: unknown[]) => logger.log(...args.map(sanitizeObject)), // console.debug not always available
  };
}
