import env from '@darkobits/env';
import dotenv from 'dotenv';
import pWaitFor from 'p-wait-for';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import log from 'lib/log';
// import matrix from 'lib/matrix';
import { startServer } from 'server';


/**
 * TODO:
 * - Make the matrix update loop no-op (and clear the display) if there is no
 *   user.
 */
async function main() {
  console.log();
  dotenv.config();

  await startServer({
    hostname: env('HOSTNAME', true),
    port: env('PORT', true)
  });

  // If a user has not authenticated yet, wait to initialize the LED matrix.
  if (!config.has(CONFIG_KEYS.SPOTIFY_USER)) {
    log.info(log.prefix('main'), log.chalk.dim('Waiting for user authentication.'));
    await pWaitFor(() => config.has(CONFIG_KEYS.SPOTIFY_USER));
  }

  const email = config.get(CONFIG_KEYS.SPOTIFY_USER)?.email;
  log.info(log.prefix('main'), `Logged in as: ${log.chalk.green(email)}`);

  // Start the LED matrix, but only if there is a user logged in.
  // try {
  //   const matrix = getMatrix();
  //   matrix.clear();
  // } catch (err: any) {
  //   log.error(log.prefix('matrix'), 'Error initializing LED matrix', err);
  //   if (err.cause) log.error(log.prefix('matrix'), 'Cause:', err.cause);
  //   throw err;
  // }

  log.info(log.prefix('main'), 'Ready.');
}


void main();
