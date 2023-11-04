/**
 * OAuth 2.0 authorization code flow login URL.
 */
export const OAUTH_LOGIN_ROUTE = '/login' as const;


/**
 * OAuth 2.0 authorization code flow callback URL.
 */
export const OAUTH_CALLBACK_ROUTE = '/login/callback' as const;


/**
 * OAuth 2.0 scopes we will request for this app.
 */
export const OAUTH_SCOPES = [
  'user-read-email',
  // Used by /me/player/currently-playing
  'user-read-currently-playing',
  // Used by /me/player and /me/player/queue
  'user-read-playback-state'
] as const;


/**
 * Various common keys in our configuration store.
 */
export const CONFIG_KEYS = {
  /**
   * Stores a SpotifyUserData object for the currently logged-in Spotify user.
   */
  SPOTIFY_USER: 'spotify-user'
} as const;
