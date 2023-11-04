import adeiu from '@darkobits/adeiu';
import devcert from 'devcert';
import Fastify from 'fastify';

import {
  OAUTH_LOGIN_ROUTE,
  OAUTH_CALLBACK_ROUTE
} from 'etc/constants';
import log from 'lib/log';
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
   * considered authoritative, but it will be used to construct redirect URLs
   * for the authorization flow, and must match the URLs registered with the
   * OAuth application in the Spotify Developer Dashboard.
   */
  hostname: string;

  /**
   * The port that the server will listen on. This will be used to construct
   * redirect URLs for the authorization flow, and must match the URLs
   * registered with the OAuth application in the Spotify Developer Dashboard.
   */
  port: number;
}


export async function startServer(opts: StartServerOptions) {
  const { hostname, port } = opts ?? {};

  if (typeof hostname !== 'string')
    throw new TypeError(`[startServer] Expected "hostname" to be of type "string", got "${typeof hostname}".`);

  if (typeof port !== 'number')
    throw new TypeError(`[startServer] Expected "port" to be of type "number", got "${typeof hostname}".`);

  // Generate self-signed certificates for the configured hostname.
  const https = await devcert.certificateFor(hostname);

  // Create our server instance.
  const server = Fastify({ https });

  // Register route handlers.
  server.get('/', rootHandler);
  server.get(OAUTH_LOGIN_ROUTE, loginHandler);
  server.get(OAUTH_CALLBACK_ROUTE, loginHandler);
  server.get('/logout', logoutHandler);

  // Register a shutdown handler.
  adeiu(async signal => {
    log.info(prefix, `Got signal ${signal}; stopping server.`);
    await server.close();
    log.info(prefix, 'Done.');
  });


  try {
    await server.listen({ port });
    log.info(prefix, `Listening on ${log.chalk.blue(`https://${hostname}:${port}`)}.`);
  } catch (err) {
    server.log.error(err);
    throw err;
  }
}
