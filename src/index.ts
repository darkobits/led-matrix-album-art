import path from 'node:path';

import adeiu from '@darkobits/adeiu';
import Cron from '@darkobits/cron';
import env from '@darkobits/env';
import rootPath from 'app-root-path';
import dotenv from 'dotenv';
import * as R from 'ramda';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import events from 'lib/events';
import log from 'lib/log';
import { getMatrix } from 'lib/matrix';
import { getSpotifyClient } from 'lib/spotify-client';
import { getCurrentBrightness } from 'lib/suncalc';
import { imageToBuffer } from 'lib/utils';
import { startServer } from 'server';


dotenv.config({
  override: true,
  path: path.resolve(rootPath.toString(), '.env')
});


export async function main() {
  try {
    // ----- Preflight Checks --------------------------------------------------

    if (process.getuid) {
      const uid = process.getuid();
      if (uid !== 0) log.warn(`Process not run with ${log.chalk.bold('sudo')}; unexpected errors may occur.`);
    }

    // These will throw if the indicated environment variable is not set.
    const hostname = env('HOSTNAME', true);
    const port = env<number>('PORT', true);
    const matrixWidth = env<number>('MATRIX_WIDTH', true);
    const matrixHeight = env<number>('MATRIX_HEIGHT', true);
    const latitude = env<number>('LATITUDE', true);
    const longitude = env<number>('LONGITUDE', true);


    // ----- Server ------------------------------------------------------------

    const server = await startServer({ hostname, port });


    // ----- Matrix ------------------------------------------------------------

    const matrix = getMatrix();
    let delayedActionTimeout: NodeJS.Timeout;

    // Display test image here.


    /**
     * TODO: Investigate whether we need to call sync() when clearing the matrix
     * and if we should be calling sync() in a setImmediate() per the docs.
     */
    const artworkUpdateCron = Cron.interval('2 seconds', async () => {
      // ----- [1] Adjust Matrix Brightness ------------------------------------

      const targetBrightness = getCurrentBrightness(latitude, longitude);

      if (matrix.brightness() !== targetBrightness) {
        matrix.brightness(targetBrightness).sync();
      }


      // ----- [2] Get Current Spotify User ------------------------------------

      const currentUser = config.get(CONFIG_KEYS.SPOTIFY_USER);
      if (!currentUser) return;


      // ----- [3] Get Currently Playing Item ----------------------------------

      const spotifyClient = await getSpotifyClient(currentUser?.email);
      const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
      const item = nowPlaying.item;

      // There may be an item in an active player, but the player is paused.
      if (!nowPlaying.is_playing) {
        log.verbose('Player is paused.');

        delayedActionTimeout = setTimeout(() => {
          log.verbose('Clearing display due to inactivity.');
          matrix.clear().sync();
        }, 5000);

        return;
      }

      // Nothing has been playing for long enough that Spotify has cleared the
      // current item.
      if (!item) {
        log.verbose('Nothing is playing.');
        return matrix.clear().sync();
      }


      // ----- [4] Get Artwork For Current Item --------------------------------

      const images = item.type === 'track' ? item.album.images : item.images;
      const largestImage = R.last(R.sortBy(R.propOr(0, 'height'), images));

      if (!largestImage) {
        log.warn('No images for current item.');
        return matrix.clear().sync();
      }


      // ----- [5] Write Artwork to Matrix -------------------------------------

      // Clear any pending delayed actions.
      clearTimeout(delayedActionTimeout);

      // Use Jimp to resize the image to our desired dimensions and
      // convert it to a Buffer that we can write to the matrix.
      const imgBuffer = await imageToBuffer({
        src: largestImage.url,
        width: matrixWidth,
        height: matrixHeight
      });

      matrix.drawBuffer(imgBuffer);

      setTimeout(() => matrix.sync(), 0);
    });


    // ----- Event Handlers ----------------------------------------------------

    artworkUpdateCron.on('start', () => {
      log.info(log.prefix('matrix'), log.chalk.green('Updates started.'));
    });


    artworkUpdateCron.on('suspend', () => {
      log.info(log.prefix('matrix'), log.chalk.dim('Updates suspended.'));
    });


    artworkUpdateCron.on('error', err => {
      log.error(log.prefix('matrix'), 'Error updating matrix:', err);

      if (err instanceof AggregateError) {
        err.errors.forEach(err => log.error(err.message));
      }
    });

    // When a user authenticates, start the matrix cron.
    events.on('user-logged-in', user => {
      log.info(log.prefix('main'), `Logged in as: ${log.chalk.green(user.email)}`);
      void artworkUpdateCron.start();
    });


    // When a user logs out, suspend the matrix cron.
    events.on('user-logged-out', user => {
      if (user) {
        log.info(log.prefix('main'), log.chalk.gray(`User ${log.chalk.green.dim(user.email)} logged out.`));
      } else {
        log.info(log.prefix('main'), log.chalk.gray('User logged out.'));
      }

      matrix.clear().sync();
      void artworkUpdateCron.suspend();
    });


    // ----- Miscellany / Init -------------------------------------------------

    // If we're starting with no user, log a message but do not start the matrix
    // cron. The above event handlers will take care of starting it if/when a
    // user authenticates. Otherwise, start the cron immediately.
    if (!config.has(CONFIG_KEYS.SPOTIFY_USER)) {
      log.info(log.prefix('main'), log.chalk.gray('Waiting for user authentication.'));
    } else {
      await artworkUpdateCron.start();
    }


    // Register a shutdown handler.
    adeiu(async signal => {
      log.info(log.prefix('main'), `Got signal ${log.chalk.yellow(signal)}; shutting down.`);

      await Promise.all([
        artworkUpdateCron.suspend(),
        server.close()
      ]);
    });


    log.info(log.prefix('main'), log.chalk.green('Ready.'));
  } catch (err: any) {
    log.error(err);
    throw err;
  }
}


void main();
// void pulserTest();
