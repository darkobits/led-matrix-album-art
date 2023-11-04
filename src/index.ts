import env from '@darkobits/env';
import dotenv from 'dotenv';

import log from 'lib/log';
import { startServer } from 'server';


async function main() {
  console.clear();
  dotenv.config();

  // Start the HTTP server.
  await startServer({
    hostname: env('HOSTNAME', true),
    port: env('PORT', true)
  });

  // TODO: Start the matrix here, or when the server is ready.

  log.info('Application ready.');
}


void main();
