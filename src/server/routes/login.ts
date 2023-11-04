import {
  base64ToJson,
  jsonToBase64,
  httpError
} from '@darkobits/serverless-kit';

import {
  CONFIG_KEYS,
  OAUTH_LOGIN_ROUTE,
  OAUTH_CALLBACK_ROUTE,
  OAUTH_SCOPES
} from 'etc/constants';
import config from 'lib/config';
import { getSpotifyClient } from 'lib/spotify-client';
import { expiresInToUnixTimestamp } from 'lib/utils';

import type {
  FastifyRequest,
  FastifyReply,
  FastifySchema
} from 'fastify';


/**
 * TODO: Use a type provider like type-box to generate this type from the JSON
 * schema below.
 */
type LoginRequest = FastifyRequest<{
  Querystring: {
    redirectTo?: string;
    code?: string;
    error?: string;
    state?: string;
  };
}>;


/**
 * This handler is responsible for managing the OAuth flow for authenticating
 * Spotify users.
 *
 * TODO: Add type support for query params and remove expect-error.
 */
export async function loginHandler(request: LoginRequest, reply: FastifyReply) {
  const hostnameAndPort = request.hostname;
  const path = request.routeOptions.url;
  const redirectTo = request.query?.redirectTo;

  // Get an unauthenticated client to use for authorization.
  const spotifyClient = await getSpotifyClient();

  // We didn't set our redirect_uri when we created the Spotify client because
  // we won't know what domain we are on until a function is invoked and we have
  // an Event to introspect. However, this _must_ be set before we perform the
  // authorization flow.
  spotifyClient.setRedirectURI(`https://${hostnameAndPort}${OAUTH_CALLBACK_ROUTE}`);


  // ----- Handle Root Login Path ----------------------------------------------

  if (path === OAUTH_LOGIN_ROUTE) {
    // Redirect the user to the Spotify login flow, encoding any information we
    // may need later into a 'state' param.
    const encodedState = jsonToBase64({ redirectTo });
    const authorizationUrl = spotifyClient.createAuthorizeURL(OAUTH_SCOPES, encodedState, true);
    return reply.redirect(authorizationUrl);
  }


  // ----- Handle Authorization Callback ---------------------------------------

  if (path === OAUTH_CALLBACK_ROUTE) {
    // Spotify should have called this endpoint with either an authorization
    // code parameter or an error parameter describing what went wrong.
    const { code, error, state } = request.query ?? {};
    const parsedState = base64ToJson(state);

    if (!code) {
      throw error
        ? new httpError.BadRequest(error)
        : new httpError.InternalServerError();
    }

    // Perform the authorization code grant.
    try {
      const {
        body: {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_in: expiresIn,
          scope
        }
      } = await spotifyClient.authorizationCodeGrant(code);

      // Update our Spotify client with our tokens so we can make authenticated
      // requests.
      spotifyClient.setAccessToken(accessToken);
      spotifyClient.setRefreshToken(refreshToken);

      const { body: spotifyUser } = await spotifyClient.getMe();

      // Write user's tokens to DynamoDB.
      config.set(CONFIG_KEYS.SPOTIFY_USER, {
        id: spotifyUser.id,
        email: spotifyUser.email,
        accessToken: accessToken,
        expires: expiresInToUnixTimestamp(expiresIn),
        refreshToken: refreshToken,
        scopes: scope
      });

      // By default, redirect the user to the "/" endpoint upon completion of
      // the authorization flow.
      let redirectUrl = `https://${hostnameAndPort}/`;

      // Or, if the user initiated the authorization flow with a 'redirectTo'
      // parameter, redirect them to that URL and pass-on
      if (parsedState?.redirectTo) {
        const parsedRedirectUrl = new URL(parsedState.redirectTo);
        parsedRedirectUrl.searchParams.set('state', jsonToBase64({ uid: spotifyUser.email }));
        redirectUrl = parsedRedirectUrl.toString();
      }

      await reply.redirect(redirectUrl);
    } catch (err: any) {
      throw new httpError.InternalServerError(err.message);
    }
  }

  throw new httpError.InternalServerError(`Handler "auth" received unknown path: ${path}`);
}


/**
 * JSON schema for this handler.
 */
loginHandler.schema = {
  querystring: {
    type: 'object',
    properties: {
      redirectTo: { type: 'string' },
      code: { type: 'string' },
      error: { type: 'string' },
      state: { type: 'string' }
    },
    additionalProperties: false
  }
} as FastifySchema;
