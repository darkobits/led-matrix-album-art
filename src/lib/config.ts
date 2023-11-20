import Conf from 'conf';

import { CONFIG_KEYS } from 'etc/constants';
import events from 'lib/events';

import type {
  CertificateData,
  SpotifyUserData
} from 'etc/types';


/**
 * Schema for our config instance. Ensures type-safe reads and writes.
 */
export interface ConfigSchema {
  [CONFIG_KEYS.SPOTIFY_USER]?: SpotifyUserData;
  [CONFIG_KEYS.CERTIFICATES]?: Array<CertificateData>;
}


/**
 * Config instance. Used to store information for the logged-in Spotify user.
 */
const conf = new Conf<ConfigSchema>({
  // Set this to a sane-ish location. Otherwise, when run as root, config will
  // be saved to /root/.config, which cannot be reliably written to / read from
  // even when the process is started with sudo.
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
    },
    [CONFIG_KEYS.CERTIFICATES]: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          commonName: { type: 'string' },
          cert: { type: 'string' },
          key: { type: 'string' },
          expires: { type: 'number' }
        }
      }
    }
  }
});


/**
 * Emit logged-in / logged-out events when user data changes.
 */
conf.onDidChange('spotify-user', (newValue, oldValue) => {
  // When a key is first set, oldValue will be undefined.
  // When a key is deleted, newValue will be undefined.

  if (newValue) {
    void events.emit('user-logged-in', newValue);
  } else {
    void events.emit('user-logged-out', oldValue);
  }
});


export default conf;
