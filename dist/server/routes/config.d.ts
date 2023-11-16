import type { FastifyRequest, FastifyReply, FastifySchema } from 'fastify';
/**
 * TODO: Use a type provider like type-box to generate this type from the JSON
 * schema below.
 */
type ConfigRequest = FastifyRequest<{
    Body: {
        brightness?: number;
        height?: number;
        width?: number;
        luminanceCorrect?: boolean;
    };
}>;
/**
 * Handles POST requests to the /config route.
 */
export declare function configHandler(request: ConfigRequest, reply: FastifyReply): {
    brightness: number;
    height: number;
    width: number;
};
export declare namespace configHandler {
    var schema: FastifySchema;
}
export {};
