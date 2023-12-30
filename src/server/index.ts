import Fastify from 'fastify';
import * as R from 'ramda';
import selfsigned, { type GenerateResult } from 'selfsigned';

import { CONFIG_KEYS, OAUTH } from 'etc/constants';
import config from 'lib/config';
import log from 'lib/log';
import { expiresInToUnixTimestamp } from 'lib/utils';
import { configHandler } from 'server/routes/config';
import { loginHandler } from 'server/routes/login';
import { logoutHandler } from 'server/routes/logout';
import { rootHandler } from 'server/routes/root';

import type { CertificateData } from 'etc/types';

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


/**
 * @private
 *
 * Checks for an existing, unexpired self-signed certificate for the provided
 * common name. If one exists, returns it. Otherwise, generates a new
 * certificate, persists it, and returns it.
 */
async function generateCertificate(commonName: string) {
  const certificates: Array<CertificateData> = config.get(CONFIG_KEYS.CERTIFICATES) ?? [];
  let certificate = R.find(R.propEq(commonName, 'commonName'), certificates);

  if (!certificate || Date.now() > certificate.expires) {
    log.info(log.prefix('server'), `Generating certificate for: ${log.chalk.green(commonName)}`);

    const { cert, private: key } = await new Promise<GenerateResult>((resolve, reject) => {
      selfsigned.generate(
        [{ name: 'commonName', value: commonName }],
        { days: 365 },
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    certificate = {
      commonName,
      cert,
      key,
      expires: expiresInToUnixTimestamp(365 * 24 * 60 * 60)
    };

    config.set(CONFIG_KEYS.CERTIFICATES, [
      ...R.filter(R.propEq(commonName, 'commonName'), certificates),
      certificate
    ]);
  }

  return certificate;
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
    https: await generateCertificate(hostname),
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
  server.get(OAUTH.LOGIN_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get(OAUTH.CALLBACK_ROUTE, { schema: loginHandler.schema }, loginHandler);
  server.get('/logout', logoutHandler);
  server.get('/config', configHandler);
  server.post('/config', { schema: configHandler.schema }, configHandler);

  // Start the server.
  try {
    await server.listen({
      // Server should still be accessible via HTTPS on the configured hostname,
      // this merely instructs Fastify to listen on all available interfaces.
      host: '0.0.0.0',
      port
    });

    log.info(prefix, `Listening on: ${log.chalk.blue(`https://${hostname}:${port}`)}`);

    return await server;
  } catch (err: any) {
    throw new Error(log.chalk.red.bold(`Error starting server: ${err.message}`), { cause: err });
  }
}
