import adeiu from '@darkobits/adeiu';
import Cron from '@darkobits/cron';
import * as R from 'ramda';

import { ARTWORK_POLLING_INTERVAL, CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import events from 'lib/events';
import log from 'lib/log';
import { initMatrix } from 'lib/matrix';
import { initSpotifyClient, getSpotifyClient } from 'lib/spotify-client';
import { getCurrentBrightness } from 'lib/suncalc';
import { geocodeLocation, imageToBuffer } from 'lib/utils';
import { startServer } from 'server';

import type { CLIArguments } from 'etc/types';


export default async function main(context: CLIArguments) {
  try {
    // ----- Preflight Checks --------------------------------------------------

    if (process.getuid) {
      const uid = process.getuid();
      if (uid !== 0) log.warn(`Process not run with ${log.chalk.bold('sudo')}; unexpected errors may occur.`);
    }

    log.info(log.prefix('main'), 'pwd', log.chalk.green(process.cwd()));
    log.info(log.prefix('main'), 'Using config store:', log.chalk.green(config.path));


    // ----- Location ----------------------------------------------------------

    const { location } = context;
    const { latitude, longitude, formattedAddress } = await geocodeLocation(location);

    if (formattedAddress) {
      log.info(log.prefix('main'), 'Using location:',  log.chalk.green(formattedAddress));
    } else {
      log.info(log.prefix('main'), log.chalk.gray('Location services disabled.'));
    }


    // ----- Server ------------------------------------------------------------

    const { hostname, port } = context;
    const server = await startServer({ hostname, port });


    // ----- Matrix ------------------------------------------------------------

    const { width, height, gpioSlowdown } = context;
    const matrix = initMatrix({
      rows: height,
      cols: width,
      gpioSlowdown
    });

    let delayedActionTimeout: NodeJS.Timeout;

    // Display test image here?


    // ----- Spotify Client ----------------------------------------------------

    const { clientId, clientSecret } = context;
    initSpotifyClient({ clientId, clientSecret });


    // ----- Artwork Update Cron -----------------------------------------------

    let currentDevice: SpotifyApi.CurrentlyPlayingObject['device'];


    /**
     * TODO: Investigate whether we need to call sync() when clearing the matrix
     * and if we should be calling sync() in a setImmediate() per the docs.
     */
    const artworkUpdateCron = Cron.interval(ARTWORK_POLLING_INTERVAL, async () => {
      // ----- [1] Adjust Matrix Brightness ------------------------------------

      if (typeof latitude === 'number' && typeof longitude === 'number') {
        const targetBrightness = getCurrentBrightness(latitude, longitude);

        if (matrix.brightness() !== targetBrightness) {
          matrix.brightness(targetBrightness).sync();
        }
      }


      // ----- [2] Get Current Spotify User ------------------------------------

      const currentUser = config.get(CONFIG_KEYS.SPOTIFY_USER);
      if (!currentUser) return;


      // ----- [3] Get Currently Playing Item ----------------------------------

      const spotifyClient = await getSpotifyClient(currentUser?.email);
      const playbackState = (await spotifyClient.getMyCurrentPlaybackState()).body;

      // Device ish.
      if (!currentDevice || currentDevice.id !== playbackState.device.id) {
        currentDevice = playbackState.device;
        log.info(log.prefix('device'), 'Playing on:', log.chalk.yellow(currentDevice.name));
      }

      const item = playbackState.item;

      // There may be an item in an active player, but the player is paused.
      if (!playbackState.is_playing) {
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
        log.verbose(log.prefix('main'), 'Nothing is playing.');
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
      const src = largestImage.url;
      const imgBuffer = await imageToBuffer({ src, width, height });

      matrix.drawBuffer(imgBuffer);

      setTimeout(() => matrix.sync(), 0);
    });


    // ----- Event Handlers ----------------------------------------------------

    artworkUpdateCron.on('start', () => {
      log.info(log.prefix('artwork'), log.chalk.green('Updates started.'));
    });


    artworkUpdateCron.on('suspend', () => {
      log.info(log.prefix('artwork'), log.chalk.dim('Updates suspended.'));
    });


    artworkUpdateCron.on('error', err => {
      log.error(log.prefix('artwork'), 'Error updating artwork:', err);

      if (err instanceof AggregateError) {
        err.errors.forEach(err => log.error(err.message));
      }
    });

    // When a user authenticates, start the matrix cron.
    events.on('user-logged-in', user => {
      log.info(log.prefix('main'), 'User:', log.chalk.green(user.email));
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
    const user = config.get(CONFIG_KEYS.SPOTIFY_USER);

    if (!user) {
      log.info(log.prefix('main'), log.chalk.gray('Waiting for user authentication.'));
    } else {
      log.info(log.prefix('main'), 'User:', log.chalk.green(user.email));
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
