export const DEFAULTS = {
  HOSTNAME: 'localhost',
  PORT: 443,
  GPIO_SLOWDOWN: 3
} as const;


/**
 * OAuth parameters for authenticating with Spotify.
 */
export const OAUTH = {
  /**
   * OAuth 2.0 authorization code flow login URL.
   */
  LOGIN_ROUTE: '/login',

  /**
   * OAuth 2.0 authorization code flow callback URL.
   */
  CALLBACK_ROUTE: '/login/callback',

  /**
   * OAuth 2.0 scopes we will request for this app.
   */
  SCOPES: [
    'user-read-email',
    // Used by /me/player/currently-playing
    'user-read-currently-playing',
    // Used by /me/player and /me/player/queue
    'user-read-playback-state'
  ]
} as const;


/**
 * Various common keys in our configuration store.
 */
export const CONFIG_KEYS = {
  /**
   * Stores a SpotifyUserData object for the currently logged-in Spotify user.
   */
  SPOTIFY_USER: 'spotify-user',

  /**
   * Persists self-signed certificates.
   */
  CERTIFICATES: 'certificates'
} as const;
