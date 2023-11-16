import SpotifyWebApi from 'spotify-web-api-node';
/**
 * Creates and returns a new Spotify client with our application's credentials.
 * If a user email is provided, the function will first check for persisted
 * user data to see if the user's credentials are available. If so, it will
 * attach the user's credentials to the client. If no email is provided, an
 * unauthenticated client will be returned.
 */
export declare function getSpotifyClient(userEmail?: string): Promise<SpotifyWebApi>;
export { type default as SpotifyWebApi } from 'spotify-web-api-node';
