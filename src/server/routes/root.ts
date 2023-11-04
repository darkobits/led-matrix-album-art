import * as R from 'ramda';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import { getSpotifyClient } from 'lib/spotify-client';
import { getArtistNames } from 'lib/utils';

import type { FastifyRequest, FastifyReply } from 'fastify';


/**
 * Handles requests to the root route.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function rootHandler(request: FastifyRequest, reply: FastifyReply) {
  const currentUser = config.get(CONFIG_KEYS.SPOTIFY_USER);

  if (currentUser) {
    const spotifyClient = await getSpotifyClient(currentUser?.email);
    const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
    const item = nowPlaying.item as SpotifyApi.TrackObjectFull;
    const largestImage = R.last(R.sortBy(R.propOr(0, 'height'), item?.album?.images ?? []));

    return {
      user: currentUser.email,
      nowPlaying: nowPlaying ? {
        artist: getArtistNames(item),
        title: item.name,
        image: largestImage?.url
      } : undefined
    };
  }

  return {
    email: undefined,
    nowPlaying: undefined
  };
}
