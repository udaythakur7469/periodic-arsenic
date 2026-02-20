/**
 * Utility functions
 */

import { CallsiteInfo } from './types';

/**
 * Capture callsite information from stack trace
 * Returns the first non-arsenic, non-node_modules file
 */
export function captureCallsite(): CallsiteInfo | undefined {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  try {
    Error.prepareStackTrace = (_, stack) => stack;
    const stack = new Error().stack as unknown as NodeJS.CallSite[];

    if (!Array.isArray(stack)) {
      return undefined;
    }

    // Find first relevant callsite (skip internal and node_modules)
    for (const site of stack) {
      const fileName = site.getFileName();
      if (
        fileName &&
        !fileName.includes('node_modules') &&
        !fileName.includes('periodic-arsenic') &&
        !fileName.includes('@periodic/arsenic')
      ) {
        return {
          file: fileName.replace(process.cwd(), ''),
          line: site.getLineNumber() || 0,
        };
      }
    }

    return undefined;
  } catch (error) {
    return undefined;
  } finally {
    Error.prepareStackTrace = originalPrepareStackTrace;
  }
}

/**
 * Sanitize query parameters (remove sensitive data)
 */
export function sanitizeParams(params: any): any {
  if (typeof params !== 'object' || params === null) {
    return params;
  }

  const sanitized: any = Array.isArray(params) ? [] : {};

  for (const key in params) {
    if (
      key.toLowerCase().includes('password') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('token')
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof params[key] === 'object') {
      sanitized[key] = sanitizeParams(params[key]);
    } else {
      sanitized[key] = params[key];
    }
  }

  return sanitized;
}

/**
 * Generate a short unique ID
 */
export function generateId(prefix: string = 'req'): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}
