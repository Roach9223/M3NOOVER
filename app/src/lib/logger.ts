/**
 * Server-side logger utility
 *
 * Provides structured logging without exposing sensitive data.
 * In production, replace console calls with a logging service (e.g., Axiom, Logtail).
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

/**
 * Sanitize context to remove sensitive fields
 */
function sanitize(context: LogContext): LogContext {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'cookie',
    'credit_card',
    'ssn',
    'access_token',
    'refresh_token',
  ];

  const sanitized: LogContext = {};

  for (const [key, value] of Object.entries(context)) {
    const lowerKey = key.toLowerCase();

    // Redact sensitive fields
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize objects
      sanitized[key] = sanitize(value as LogContext);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Format log message with timestamp and level
 */
function formatMessage(level: LogLevel, message: string, context?: LogContext): string {
  const timestamp = new Date().toISOString();
  const sanitizedContext = context ? sanitize(context) : undefined;

  const logEntry = {
    timestamp,
    level,
    message,
    ...(sanitizedContext && Object.keys(sanitizedContext).length > 0
      ? { context: sanitizedContext }
      : {}),
  };

  return JSON.stringify(logEntry);
}

/**
 * Logger instance
 */
export const logger = {
  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, context));
    }
  },

  info(message: string, context?: LogContext): void {
    console.info(formatMessage('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    console.warn(formatMessage('warn', message, context));
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      ...(error instanceof Error
        ? {
            errorName: error.name,
            errorMessage: error.message,
            // Only include stack in development
            ...(process.env.NODE_ENV === 'development' ? { stack: error.stack } : {}),
          }
        : {}),
    };

    console.error(formatMessage('error', message, errorContext));
  },
};

export default logger;
