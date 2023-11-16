/// <reference types="node" />
/// <reference types="node" />
export interface StartServerOptions {
    /**
     * The hostname that the server is expected to run on. This value is not
     * considered authoritative, but it will be used to (1) generate a self-signed
     * certificate and (2) construct redirect URLs for the authorization flow, and
     * must match the URLs registered with the OAuth application in the Spotify
     * Developer Dashboard.
     */
    hostname: string;
    /**
     * The port that the server will listen on. Additionally, this will be used to
     * construct redirect URLs for the authorization flow, and must match the URLs
     * registered with the OAuth application in the Spotify Developer Dashboard.
     */
    port: number;
}
export declare function startServer(opts: StartServerOptions): Promise<import("fastify").FastifyInstance<import("https").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>, import("http").IncomingMessage, import("http").ServerResponse<import("http").IncomingMessage>, import("fastify").FastifyBaseLogger, import("fastify").FastifyTypeProviderDefault>>;
