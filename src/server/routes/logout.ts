import { CONFIG_KEYS } from 'etc/constants';
import config from 'lib/config';

import type { FastifyRequest, FastifyReply } from 'fastify';


/**
 * Logs the current user out by clearing their stored access token and refresh
 * token.
 */
export async function logoutHandler(request: FastifyRequest, reply: FastifyReply) {
  config.delete(CONFIG_KEYS.SPOTIFY_USER);
  await reply.redirect('/');
}
