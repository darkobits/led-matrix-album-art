import adeiu from '@darkobits/adeiu';
import env from '@darkobits/env';
import sleep from '@darkobits/sleep';
import dotenv from 'dotenv';
import pWaitFor from 'p-wait-for';
import pWhilst from 'p-whilst';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import log from 'lib/log';
// import matrix from 'lib/matrix';
import { startServer } from 'server';

import type { SpotifyUserData } from 'etc/types';


async function main() {
  try {
    console.log();
    dotenv.config();

    const server = await startServer({
      hostname: env('HOSTNAME', true),
      port: env('PORT', true)
    });


    // ----- Matrix ------------------------------------------------------------

    let matrixActive = true;

    void pWhilst(() => matrixActive, async () => {
      log.info(log.prefix('matrix'), 'Updating matrix.');
      // [1] Display test image here.

      // [2] Wait for user authentication.
      if (!config.has(CONFIG_KEYS.SPOTIFY_USER)) {
        // matrix.clear();
        log.info(log.prefix('matrix'), log.chalk.dim('Waiting for user authentication.'));
      }

      const currentUser = await pWaitFor(() => config.has(CONFIG_KEYS.SPOTIFY_USER))
        .then(() => config.get(CONFIG_KEYS.SPOTIFY_USER) as SpotifyUserData);

      void currentUser;

      await sleep('5 seconds');
    });


    // ----- Miscellany --------------------------------------------------------

    // Register a shutdown handler.
    adeiu(async signal => {
      log.info(log.prefix('main'), `Got signal ${log.chalk.yellow(signal)}; shutting down.`);
      matrixActive = false;
      await server.close();
    });

    // Once a user has authenticated, logs their e-mail address.
    void pWaitFor(() => config.has(CONFIG_KEYS.SPOTIFY_USER)).then(() => {
      const email = config.get(CONFIG_KEYS.SPOTIFY_USER)?.email;
      log.info(log.prefix('main'), `Logged in as: ${log.chalk.green(email)}`);
    });

    setImmediate(() => log.info(log.prefix('main'), 'Ready.'));
  } catch (err: any) {
    log.error(err);
    throw err;
  }
}


void main();
