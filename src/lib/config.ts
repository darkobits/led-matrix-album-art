import Conf from 'conf';

import { CONFIG_KEYS } from 'etc/constants';

import type { SpotifyUserData } from 'etc/types';


/**
 * Schema for our config instance. Ensures type-safe reads and writes.
 */
export interface ConfigSchema {
  [CONFIG_KEYS.SPOTIFY_USER]?: SpotifyUserData;
}


/**
 * Config instance. Used to store information for the logged-in Spotify user.
 */
export default new Conf<ConfigSchema>({
  projectName: 'spotify-ish',
  schema: {
    [CONFIG_KEYS.SPOTIFY_USER]: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        email: { type: 'string' },
        accessToken: { type: 'string' },
        expires: { type: 'number' },
        refreshToken: { type: 'string' },
        scopes: { type: 'string' }
      }
    }
  }
});
