/* eslint-disable import/order */

import path from 'node:path';

import rootPath from 'app-root-path';
import dotenv from 'dotenv';
import adeiu from '@darkobits/adeiu';
import env from '@darkobits/env';
import sleep from '@darkobits/sleep';
import pWaitFor from 'p-wait-for';
import pWhilst from 'p-whilst';
import * as R from 'ramda';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import log from 'lib/log';
import { getMatrix } from 'lib/matrix';
import { getSpotifyClient } from 'lib/spotify-client';
import { imageToBuffer } from 'lib/utils';
import { startServer } from 'server';

import type { SpotifyUserData } from 'etc/types';


async function main() {
  try {
    dotenv.config({
      override: true,
      path: path.resolve(rootPath.toString(), '.env')
    });

    const server = await startServer({
      hostname: env('HOSTNAME', true),
      port: env('PORT', true)
    });


    // ----- Matrix ------------------------------------------------------------

    const matrix = getMatrix();

    let matrixActive = true;

    // Display test image here.

    void pWhilst(() => matrixActive, async () => {
      try {
        if (!config.has(CONFIG_KEYS.SPOTIFY_USER)) matrix.clear();

        // Wait for user authentication.
        const currentUser = await pWaitFor(() => config.has(CONFIG_KEYS.SPOTIFY_USER))
          .then(() => config.get(CONFIG_KEYS.SPOTIFY_USER) as SpotifyUserData);

        const spotifyClient = await getSpotifyClient(currentUser?.email);
        const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
        const item = nowPlaying.item;

        if (item) {
          const images = item.type === 'track' ? item.album.images : item.images;
          const largestImage = R.last(R.sortBy(R.propOr(0, 'height'), images));

          if (largestImage) {
            // Use Jimp to resize the image to our desired dimensions and
            // convert it to a Buffer that we can write to the matrix.
            const imgBuffer = await imageToBuffer({
              src: largestImage.url,
              width: env('MATRIX_WIDTH', true),
              height: env('MATRIX_HEIGHT', true)
            });

            matrix.drawBuffer(imgBuffer);
          } else {
            // We don't have any album art for some reason.
            log.info(log.prefix('matrix'), 'No album art for current item.');
            matrix.clear();
          }
        } else {
          // Nothing is playing.
          // log.info(log.prefix('matrix'), 'Nothing playing.');
          matrix.clear();
        }

        matrix.sync();
      } catch (err: any) {
        log.error(log.prefix('matrix'), 'Error updating matrix:', err.message);

        if (err instanceof AggregateError) {
          err.errors.forEach(err => log.error(err.message));
        }
      } finally {
        await sleep('2 seconds');
      }
    });


    // ----- Miscellany --------------------------------------------------------

    // Register a shutdown handler.
    adeiu(async signal => {
      log.info(log.prefix('main'), `Got signal ${log.chalk.yellow(signal)}; shutting down.`);
      matrixActive = false;
      await server.close();
    });

    // Once a user has authenticated, logs their e-mail address.
    if (!config.has(CONFIG_KEYS.SPOTIFY_USER)) {
      log.info(log.prefix('matrix'), log.chalk.dim('Waiting for user authentication.'));
    }

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
