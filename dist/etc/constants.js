const OAUTH = {
  /**
   * OAuth 2.0 authorization code flow login URL.
   */
  LOGIN_ROUTE: "/login",
  /**
   * OAuth 2.0 authorization code flow callback URL.
   */
  CALLBACK_ROUTE: "/login/callback",
  /**
   * OAuth 2.0 scopes we will request for this app.
   */
  SCOPES: [
    "user-read-email",
    // Used by /me/player/currently-playing
    "user-read-currently-playing",
    // Used by /me/player and /me/player/queue
    "user-read-playback-state"
  ]
};
const CONFIG_KEYS = {
  /**
   * Stores a SpotifyUserData object for the currently logged-in Spotify user.
   */
  SPOTIFY_USER: "spotify-user",
  /**
   * Persists self-signed certificates.
   */
  CERTIFICATES: "certificates"
};
export {
  CONFIG_KEYS,
  OAUTH
};
//# sourceMappingURL=constants.js.map
