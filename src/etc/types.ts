import type { MatrixOptions, RuntimeOptions } from 'rpi-led-matrix';


/**
 * Shape of persisted user data.
 */
export interface SpotifyUserData {
  id: string;
  email: string;
  accessToken: string;
  expires: number;
  refreshToken: string;
  scopes: string;
}


/**
 * Shape of persisted certificate data.
 */
export interface CertificateData {
  commonName: string;
  cert: string;
  key: string;
  expires: number;
}


/**
 * Shape of the object provided by Saffron representing a parsed configuration
 * file and/or CLI arguments.
 */
export interface CLIArguments {
  /**
   * Default: localhost
   */
  hostname: string;

  /**
   * Default: 443
   */
  port: number;

  clientId: string;

  clientSecret: string;

  width: MatrixOptions['cols'];

  height: MatrixOptions['rows'];

  /**
   * Default: 3
   */
  gpioSlowdown: RuntimeOptions['gpioSlowdown'];

  /**
   * String describing the device's location. Used to automatically dim the
   * matrix based on the sun's position.
   */
  location?: string | undefined;
}
