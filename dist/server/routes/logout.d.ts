import type { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Logs the current user out by clearing their stored access token and refresh
 * token.
 */
export declare function logoutHandler(request: FastifyRequest, reply: FastifyReply): Promise<void>;
