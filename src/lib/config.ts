// import appRootPath from 'app-root-path';
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
 *
 * As root, this will be at: /root/.config/spotify-ish-nodejs/config.json
 */
export default new Conf<ConfigSchema>({
  // cwd: appRootPath.toString(),
  cwd: '/etc/spotify-ish',
  configFileMode: 0o777,
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
