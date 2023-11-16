import * as R from 'ramda';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import { getMatrix } from 'lib/matrix';
import { getSpotifyClient } from 'lib/spotify-client';
import { getArtistNames } from 'lib/utils';

import type {
  FastifyRequest,
  FastifyReply
} from 'fastify';


export interface RootResponse {
  user: string | false;
  nowPlaying: {
    state: 'playing' | 'paused';
    artist: string | undefined;
    title: string;
    image: string | undefined;
  } | false;
  config: {
    brightness: number;
    width: number;
    height: number;
  };
}


/**
 * Handles requests to the root route.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function rootHandler(request: FastifyRequest, reply: FastifyReply) {
  const response: Partial<RootResponse> = {};

  const matrix = getMatrix();
  const brightness = matrix.brightness();
  const height = matrix.height();
  const width = matrix.width();

  const currentUser = config.get(CONFIG_KEYS.SPOTIFY_USER);

  if (currentUser) {
    const spotifyClient = await getSpotifyClient(currentUser?.email);
    const nowPlaying = (await spotifyClient.getMyCurrentPlayingTrack()).body;
    const item = nowPlaying.item as SpotifyApi.TrackObjectFull | undefined;
    const largestImage = R.last(R.sortBy(R.propOr(0, 'height'), item?.album?.images ?? []));

    response.user = currentUser.email;

    response.nowPlaying = item ? {
      state: nowPlaying.is_playing ? 'playing' : 'paused',
      artist: getArtistNames(item),
      title: item.name,
      image: largestImage?.url
    } : false;
  }

  response.config = {
    brightness,
    width,
    height
  };

  return response as RootResponse;
}
