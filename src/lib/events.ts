import Emittery from 'emittery';

import { SpotifyUserData } from 'etc/types';


/**
 * Allows for type-safe event listeners.
 */
export interface EventMap {
  'user-logged-in': SpotifyUserData;
  'user-logged-out': SpotifyUserData | undefined;
}


export default new Emittery<EventMap>();
