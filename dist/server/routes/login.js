import { jsonToBase64, base64ToJson, httpError } from "@darkobits/serverless-kit";
import { OAUTH, CONFIG_KEYS } from "../../etc/constants.js";
import conf from "../../lib/config.js";
import log from "../../lib/log.js";
import { getSpotifyClient } from "../../lib/spotify-client.js";
import { expiresInToUnixTimestamp } from "../../lib/utils.js";
async function loginHandler(request, reply) {
  var _a;
  const hostnameAndPort = request.hostname;
  const path = request.routeOptions.url;
  const redirectTo = (_a = request.query) == null ? void 0 : _a.redirectTo;
  const spotifyClient = await getSpotifyClient();
  spotifyClient.setRedirectURI(`https://${hostnameAndPort}${OAUTH.CALLBACK_ROUTE}`);
  if (path === OAUTH.LOGIN_ROUTE) {
    const encodedState = jsonToBase64({ redirectTo });
    const authorizationUrl = spotifyClient.createAuthorizeURL(OAUTH.SCOPES, encodedState, true);
    return reply.redirect(authorizationUrl);
  }
  if (path === OAUTH.CALLBACK_ROUTE) {
    const { code, error, state } = request.query ?? {};
    const parsedState = base64ToJson(state);
    if (!code) {
      throw error ? new httpError.BadRequest(error) : new httpError.InternalServerError();
    }
    try {
      const { body: { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn, scope } } = await spotifyClient.authorizationCodeGrant(code);
      spotifyClient.setAccessToken(accessToken);
      spotifyClient.setRefreshToken(refreshToken);
      const { body: spotifyUser } = await spotifyClient.getMe();
      conf.set(CONFIG_KEYS.SPOTIFY_USER, {
        id: spotifyUser.id,
        email: spotifyUser.email,
        accessToken,
        expires: expiresInToUnixTimestamp(expiresIn),
        refreshToken,
        scopes: scope
      });
      let redirectUrl = `https://${hostnameAndPort}/`;
      if (parsedState == null ? void 0 : parsedState.redirectTo) {
        const parsedRedirectUrl = new URL(parsedState.redirectTo);
        parsedRedirectUrl.searchParams.set("state", jsonToBase64({ uid: spotifyUser.email }));
        redirectUrl = parsedRedirectUrl.toString();
      }
      await reply.redirect(redirectUrl);
    } catch (err) {
      log.error(log.prefix("auth"), "Error:", err);
      throw new httpError.InternalServerError(err.message);
    }
  }
  throw new httpError.InternalServerError(`Handler "auth" received unknown path: ${path}`);
}
loginHandler.schema = {
  querystring: {
    type: "object",
    properties: {
      redirectTo: { type: "string" },
      code: { type: "string" },
      error: { type: "string" },
      state: { type: "string" }
    },
    additionalProperties: false
  }
};
export {
  loginHandler
};
//# sourceMappingURL=login.js.map
