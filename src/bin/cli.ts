#!/usr/bin/env node

import * as cli from '@darkobits/saffron';

import { DEFAULTS } from 'etc/constants';
import log from 'lib/log';
import main from 'lib/main';

import type { CLIArguments } from 'etc/types';


cli.command<CLIArguments>({
  // command: '*',
  config: {
    auto: true,
    fileName: 'spotify',
    // Allows the user to pass --config to specify an absolute path to a config
    // file.
    explicitConfigFileParam: 'config'
  },
  builder: ({ command }) => {
    command.option('hostname', {
      group:  log.chalk.bold('Server:'),
      type: 'string',
      description: `Used for self-signed certificates and OAuth redirect URL. Default: ${DEFAULTS.HOSTNAME}`
    });

    command.option('port', {
      group:  log.chalk.bold('Server:'),
      type: 'number',
      description: `Port to listen on. Default: ${DEFAULTS.PORT}`
    });

    command.option('clientId', {
      group:  log.chalk.bold('Spotify:'),
      type: 'string',
      description: 'Spotify application client ID.',
      required: true
    });

    command.option('clientSecret', {
      group:  log.chalk.bold('Spotify:'),
      type: 'string',
      description: 'Spotify application client secret.',
      required: true
    });

    command.option('width', {
      group:  log.chalk.bold('Matrix:'),
      type: 'number',
      description: 'Width of the LED matrix.',
      required: true
    });

    command.option('height', {
      group:  log.chalk.bold('Matrix:'),
      type: 'number',
      description: 'Height of the LED matrix.',
      required: true
    });

    command.option('gpioSlowdown', {
      group:  log.chalk.bold('Matrix:'),
      type: 'number',
      description: `How much to slow down I/O to the matrix. Default: ${DEFAULTS.GPIO_SLOWDOWN}`,
      required: false
    });

    command.option('latitude', {
      group:  log.chalk.bold('Matrix:'),
      type: 'number',
      description: 'Used for auto-dimming of the matrix based on sun position.',
      required: false
    });

    command.option('longitude', {
      group: log.chalk.bold('Matrix:'),
      type: 'number',
      description: 'Used for auto-dimming of the matrix based on sun position.',
      required: false
    });

    command.option('config', {
      description: 'Provide an explicit path to a configuration file.',
      required: false
    });
  },
  handler: async ({ argv /* , config , configIsEmpty, configPath */ }) => {
    try {
      // Apply defaults here rather than using the `default` option in the
      // command builder. If that approach is used, a default value will
      // override a value provided via a configuration file.
      const {
        hostname = DEFAULTS.HOSTNAME,
        port = DEFAULTS.PORT,
        clientId,
        clientSecret,
        width,
        height,
        gpioSlowdown = DEFAULTS.GPIO_SLOWDOWN,
        latitude,
        longitude
      } = argv;

      await main({
        hostname,
        port,
        clientId,
        clientSecret,
        width,
        height,
        gpioSlowdown,
        latitude,
        longitude
      });
    } catch (err: any) {
      log.error();
      process.exit(err?.exitCode ?? err?.code ?? 1);
    }
  }
});


cli.init();
