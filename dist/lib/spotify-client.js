import env from "@darkobits/env";
import SpotifyWebApi from "spotify-web-api-node";
import { CONFIG_KEYS } from "../etc/constants.js";
import conf from "./config.js";
import { expiresInToUnixTimestamp } from "./utils.js";
async function getSpotifyClient(userEmail) {
  const client = new SpotifyWebApi({
    clientId: env("SPOTIFY_CLIENT_ID", true),
    clientSecret: env("SPOTIFY_CLIENT_SECRET", true)
  });
  if (!userEmail)
    return client;
  const userData = conf.get(CONFIG_KEYS.SPOTIFY_USER);
  if (!userData)
    throw new Error("No user data available");
  const {
    /* id, */
    accessToken,
    refreshToken,
    expires
  } = userData;
  client.setAccessToken(accessToken);
  client.setRefreshToken(refreshToken);
  if (Date.now() > expires) {
    const response = await client.refreshAccessToken();
    client.setAccessToken(response.body.access_token);
    conf.set(CONFIG_KEYS.SPOTIFY_USER, {
      ...userData,
      accessToken: response.body.access_token,
      expires: expiresInToUnixTimestamp(response.body.expires_in)
    });
  }
  return client;
}
export {
  getSpotifyClient
};
//# sourceMappingURL=spotify-client.js.map
