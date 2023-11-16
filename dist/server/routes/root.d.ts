import type { FastifyRequest, FastifyReply } from 'fastify';
/**
 * Handles requests to the root route.
 */
export declare function rootHandler(request: FastifyRequest, reply: FastifyReply): Promise<{
    user: string;
    nowPlaying: boolean | {
        state: string;
        artist: string | undefined;
        title: string;
        image: string | undefined;
    };
    email?: never;
} | {
    email: boolean;
    nowPlaying: boolean;
    user?: never;
}>;
