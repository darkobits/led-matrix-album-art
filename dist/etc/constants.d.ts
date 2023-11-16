/**
 * OAuth parameters for authenticating with Spotify.
 */
export declare const OAUTH: {
    /**
     * OAuth 2.0 authorization code flow login URL.
     */
    readonly LOGIN_ROUTE: "/login";
    /**
     * OAuth 2.0 authorization code flow callback URL.
     */
    readonly CALLBACK_ROUTE: "/login/callback";
    /**
     * OAuth 2.0 scopes we will request for this app.
     */
    readonly SCOPES: readonly ["user-read-email", "user-read-currently-playing", "user-read-playback-state"];
};
/**
 * Various common keys in our configuration store.
 */
export declare const CONFIG_KEYS: {
    /**
     * Stores a SpotifyUserData object for the currently logged-in Spotify user.
     */
    readonly SPOTIFY_USER: "spotify-user";
    /**
     * Persists self-signed certificates.
     */
    readonly CERTIFICATES: "certificates";
};
