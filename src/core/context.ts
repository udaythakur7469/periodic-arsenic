/**
 * Request context store using AsyncLocalStorage
 */

import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from './types';

/**
 * AsyncLocalStorage instance for request context
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Store request context for the duration of a function call
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return asyncLocalStorage.run(context, fn);
}

/**
 * Get current request context if available
 */
export function getContext(): RequestContext | undefined {
  return asyncLocalStorage.getStore();
}

/**
 * Check if running within a request context
 */
export function hasContext(): boolean {
  return asyncLocalStorage.getStore() !== undefined;
}
