/**
 * Fastify plugin for request context correlation
 */

import { Monitor, FastifyContextOptions, RequestContext } from '../core/types';
import { runWithContext } from '../core/context';
import { generateId } from '../core/utils';

/**
 * Create Fastify plugin for request correlation
 */
export function fastifyContext(
  _monitor: Monitor,
  options: FastifyContextOptions = {}
) {
  return async function arsenicPlugin(fastify: any) {
    fastify.addHook('onRequest', async (request: any, _reply: any) => {
      // Generate request ID
      const requestId = generateId('req');

      // Build request context
      const context: RequestContext = {
        id: requestId,
        method: request.method,
        route: request.routerPath || request.url,
        userId: options.attachUser ? options.attachUser(request) : undefined,
      };

      // Store context for this request
      // Note: Fastify uses different async context, so we run the handler in our context
      request.arsenicContext = context;
    });

    fastify.addHook('preHandler', async (request: any, _reply: any) => {
      // Run handler within context
      if (request.arsenicContext) {
        return new Promise((resolve) => {
          runWithContext(request.arsenicContext, () => {
            resolve(undefined);
          });
        });
      }
      return;
    });
  };
}
