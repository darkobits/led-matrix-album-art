import env from '@darkobits/env';
import SpotifyWebApi from 'spotify-web-api-node';

import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';
import { expiresInToUnixTimestamp } from 'lib/utils';

import type { SpotifyUserData } from 'etc/types';


/**
 * Creates and returns a new Spotify client with our application's credentials.
 * If a user ID hash is provided, the function will first check the in-memory
 * user data cache to see if the user's credentials are available. If not, it
 * will then check DynamoDB, attach them to the client, cache the credentials,
 * and return it.
 */
export async function getSpotifyClient(userEmail?: string) {
  const client = new SpotifyWebApi({
    clientId: env('SPOTIFY_CLIENT_ID', true),
    clientSecret: env('SPOTIFY_CLIENT_SECRET', true)
  });

  // Return an unauthorized client if no userIdHash was provided.
  if (!userEmail) return client;

  const userData = config.get(CONFIG_KEYS.SPOTIFY_USER) as SpotifyUserData | undefined;

  // User is not authenticated; bail.
  if (!userData) throw new Error('No user data available');

  const { /* id, */ accessToken, refreshToken, expires } = userData;

  // Attach user's credentials to the client.
  client.setAccessToken(accessToken);
  client.setRefreshToken(refreshToken);

  // User's access token is expired.
  if (Date.now() > expires) {
    // Get a new access token and update the client.
    const response = await client.refreshAccessToken();
    client.setAccessToken(response.body.access_token);

    // Update the user's data in the in-memory cache and DynamoDB. We do not
    // need to wait for this call to complete before returning the client.
    config.set(CONFIG_KEYS.SPOTIFY_USER, {
      ...userData,
      accessToken: response.body.access_token,
      expires: expiresInToUnixTimestamp(response.body.expires_in)
    });

    // logger.info(`Refreshed access token for user "${id}".`);
  }

  return client;
}


export { type default as SpotifyWebApi } from 'spotify-web-api-node';
