import ms from 'ms';


/**
 * How often to poll the Spotify API for the currently playing item.
 */
export const ARTWORK_POLLING_INTERVAL = '1 second' as const;


/**
 * How long to wait after playback is paused before clearing the matrix.
 */
export const INACTIVITY_TIMEOUT = ms('5 seconds');


/**
 * Default values for configuration values / CLI arguments.
 */
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
 * Common keys in the application's persisted configuration store.
 */
export const CONFIG_KEYS = {
  /**
   * Stores a `SpotifyUserData` object for the currently logged-in Spotify user.
   */
  SPOTIFY_USER: 'spotify-user',

  /**
   * Persists self-signed certificates.
   */
  CERTIFICATES: 'certificates'
} as const;
