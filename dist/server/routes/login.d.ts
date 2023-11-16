import type { FastifyRequest, FastifyReply, FastifySchema } from 'fastify';
/**
 * TODO: Use a type provider like type-box to generate this type from the JSON
 * schema below.
 */
type LoginRequest = FastifyRequest<{
    Querystring: {
        redirectTo?: string;
        code?: string;
        error?: string;
        state?: string;
    };
}>;
/**
 * This handler is responsible for managing the OAuth flow for authenticating
 * Spotify users.
 *
 * TODO: Add type support for query params and remove expect-error.
 */
export declare function loginHandler(request: LoginRequest, reply: FastifyReply): Promise<never>;
export declare namespace loginHandler {
    var schema: FastifySchema;
}
export {};
