import Conf from 'conf';
import { CONFIG_KEYS } from '../etc/constants';
import type { SpotifyUserData, CertificateData } from '../etc/types';
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
declare const conf: Conf<ConfigSchema>;
export default conf;
