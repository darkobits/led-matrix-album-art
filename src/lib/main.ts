import adeiu from '@darkobits/adeiu';
import Cron from '@darkobits/cron';
import pWaitFor from 'p-wait-for';
import * as R from 'ramda';

import spotifyLogo from 'assets/spotify-logo.png';
import {
  ARTWORK_POLLING_INTERVAL,
  INACTIVITY_TIMEOUT,
  CONFIG_KEYS
} from 'etc/constants';
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

    const startTime = Date.now();

    if (process.getuid) {
      const uid = process.getuid();
      if (uid !== 0) log.warn(`Process not run with ${log.chalk.bold('sudo')}; unexpected errors may occur.`);
    }

    log.info(log.prefix('main'), 'pwd', log.chalk.green(process.cwd()));
    log.info(log.prefix('main'), 'Using config store:', log.chalk.green(config.path));


    // ----- Matrix ------------------------------------------------------------

    const { width, height, gpioSlowdown } = context;

    const matrix = initMatrix({
      rows: height,
      cols: width,
      gpioSlowdown
    });

    // Draw startup image.
    matrix.drawBuffer(await imageToBuffer({
      src: Buffer.from(spotifyLogo.split(',')[1], 'base64'),
      width,
      height
    })).sync();


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


    // ----- Spotify Client ----------------------------------------------------

    const { clientId, clientSecret } = context;
    initSpotifyClient({ clientId, clientSecret });


    // ----- Artwork Update Cron -----------------------------------------------

    let inactivityTimeout: NodeJS.Timeout;
    let currentItemId: string | undefined;
    let currentDevice: SpotifyApi.CurrentlyPlayingObject['device'] | undefined;


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


      // ----- [2] Get Authenticated Client ------------------------------------

      const currentUser = config.get(CONFIG_KEYS.SPOTIFY_USER);
      if (!currentUser) return;

      const spotifyClient = await getSpotifyClient(currentUser?.email);


      // ----- [3] Get Playback State ------------------------------------------

      const playbackState = (await spotifyClient.getMyCurrentPlaybackState()).body;
      const item = playbackState.item;

      // Device ish.
      if (!playbackState.device) {
        currentDevice = undefined;
      } else if (!currentDevice || currentDevice.id !== playbackState.device.id) {
        currentDevice = playbackState.device;
        log.info(log.prefix('device'), 'ID:', log.chalk.yellow(currentDevice.id));
        log.info(log.prefix('device'), 'Name:', log.chalk.yellow(currentDevice.name));
      }

      // There may be an item in an active player, but the player is paused.
      if (!playbackState.is_playing) {
        log.verbose('Player is paused.');

        currentItemId = undefined;

        inactivityTimeout = setTimeout(() => {
          log.verbose(log.prefix('main'), 'Clearing matrix due to inactivity.');
          matrix.clear().sync();
        }, INACTIVITY_TIMEOUT);

        return;
      }

      // Nothing has been playing for long enough that Spotify has cleared the
      // current item.
      if (!item) {
        log.verbose(log.prefix('main'), 'Nothing is playing; clearing matrix.');
        currentItemId = undefined;
        matrix.clear().sync();
        return;
      }

      // Item has not changed since last update; bail.
      if (item.id === currentItemId) return;

      const images = item.type === 'track' ? item.album.images : item.images;
      const largestImage = R.last(R.sortBy(R.propOr(0, 'height'), images));

      // Currently playing item has no artwork. This is likely a very rare event
      // but we should handle it anyway.
      if (!largestImage) {
        log.warn(log.prefix('main'), 'No images for current item.');
        matrix.clear().sync();
        return;
      }


      // ----- [4] Write Artwork to Matrix -------------------------------------

      // Cancel the inactivity timeout, if needed.
      clearTimeout(inactivityTimeout);

      // Use Jimp to resize the image to our desired dimensions and
      // convert it to a Buffer that we can write to the matrix.
      const src = largestImage.url;
      const imgBuffer = await imageToBuffer({ src, width, height });

      matrix.drawBuffer(imgBuffer).sync();
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

    // Register a shutdown handler.
    adeiu(async signal => {
      log.info(log.prefix('main'), `Got signal ${log.chalk.yellow(signal)}; shutting down.`);

      await Promise.all([
        artworkUpdateCron.suspend(),
        server.close()
      ]);
    });


    // If we're starting with no user, log a message but do not start the matrix
    // cron. The above event handlers will take care of starting it if/when a
    // user authenticates. Otherwise, start the cron immediately.
    await pWaitFor(() => Date.now() - startTime >= 5000).then(() => {
      matrix.clear().sync();
      const user = config.get(CONFIG_KEYS.SPOTIFY_USER);

      if (user) {
        log.info(log.prefix('main'), 'User:', log.chalk.green(user.email));
        return artworkUpdateCron.start();
      }

      log.info(log.prefix('main'), log.chalk.gray('Waiting for user authentication.'));
    });

    log.info(log.prefix('main'), log.chalk.green('Ready.'));
  } catch (err: any) {
    log.error(err);
    throw err;
  }
}
