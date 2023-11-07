import devcert from 'devcert';
import Fastify from 'fastify';

import {
  OAUTH_LOGIN_ROUTE,
  OAUTH_CALLBACK_ROUTE
} from 'etc/constants';
import log from 'lib/log';
import { configHandler } from 'server/routes/config';
import { loginHandler } from 'server/routes/login';
import { logoutHandler } from 'server/routes/logout';
import { rootHandler } from 'server/routes/root';


/**
 * @private
 *
 * Log prefix for this module.
 */
const prefix = log.prefix('server');


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


export async function startServer(opts: StartServerOptions) {
  const { hostname, port } = opts ?? {};

  if (typeof hostname !== 'string')
    throw new TypeError(`[startServer] Expected "hostname" to be of type "string", got "${typeof hostname}".`);

  if (typeof port !== 'number')
    throw new TypeError(`[startServer] Expected "port" to be of type "number", got "${typeof port}".`);

  // Create a server instance.
  const server = Fastify({
    // Generate self-signed certificates for the configured hostname.
    https: await devcert.certificateFor(hostname),
    ajv: {
      customOptions: {
        useDefaults: true,
        // With this option set to `false` and `additionalProperties` set to
        // `false` in schemas, Fastify will return a 400 if any unknown keys are
        // present.
        removeAdditional: false
      }
    }
  });

  // Register route handlers.
  server.get('/', rootHandler);
  server.get(OAUTH_LOGIN_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get(OAUTH_CALLBACK_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get('/logout', logoutHandler);
  server.post('/config', { schema: configHandler.schema }, configHandler);

  // Start the server.
  try {
    await server.listen({ port });
    log.info(prefix, `Listening on: ${log.chalk.blue(`https://${hostname}:${port}`)}`);
    return await server;
  } catch (err: any) {
    throw new Error(log.chalk.red.bold(`Error starting server: ${err.message}`), { cause: err });
  }
}
