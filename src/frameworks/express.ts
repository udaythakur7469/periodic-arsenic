/**
 * Express middleware for request context correlation
 */

import { Monitor, ExpressContextOptions, RequestContext } from '../core/types';
import { runWithContext } from '../core/context';
import { generateId } from '../core/utils';

/**
 * Create Express middleware for request correlation
 */
export function expressContext(
  _monitor: Monitor,
  options: ExpressContextOptions = {}
): (req: any, res: any, next: any) => void {
  return function arsenicMiddleware(req: any, _res: any, next: any) {
    // Generate request ID
    const requestId = generateId('req');

    // Build request context
    const context: RequestContext = {
      id: requestId,
      method: req.method,
      route: req.route?.path || req.path || req.url,
      userId: options.attachUser ? options.attachUser(req) : undefined,
    };

    // Run the rest of the request within this context
    runWithContext(context, () => {
      next();
    });
  };
}
