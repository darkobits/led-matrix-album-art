import Jimp from 'jimp';
import Geocoder from 'node-geocoder';
import * as publicIpPkg from 'public-ip';

import log from 'lib/log';

import type { IpApiResponse } from 'etc/types';
import type { LedMatrixInstance } from 'rpi-led-matrix';


/**
 * This package doesn't work with ESM named imports; use destructuring instead.
 */
const { publicIpv4 } = publicIpPkg;


/**
 * Provided an `LedMatrix` instance, draws a test pattern on the display.
 * `.sync()` must be called to render the image.
 */
export function drawTestPattern(matrix: LedMatrixInstance) {
  matrix
    .clear() // clear the display
    .brightness(100) // set the panel brightness to 100%
    .fgColor({ r: 0, g: 0, b: 255 }) // set the active color to blue
    .fill() // color the entire diplay blue
    .fgColor({ r: 255, g: 255, b: 0 }) // set the active color to yellow
    // draw a yellow circle around the display
    .drawCircle(
      matrix.width() / 2,
      matrix.height() / 2,
      matrix.width() / 2 - 1
    )
    // draw a yellow rectangle
    .drawRect(
      matrix.width() / 4,
      matrix.height() / 4,
      matrix.width() / 2,
      matrix.height() / 2
    )
    // sets the active color to red
    .fgColor({ r: 255, g: 0, b: 0 })
    // draw two diagonal red lines connecting the corners
    .drawLine(0, 0, matrix.width(), matrix.height())
    .drawLine(matrix.width() - 1, 0, 0, matrix.height() - 1);
}


export interface ImageToBufferOptions {
  src: string | Buffer;
  width: number;
  height: number;
}


/**
 * Provided a path, URL, or base 64-encoded image and desired output dimensions,
 * returns a Buffer that can be passed to `LedMatrix#drawBuffer`.
 */
export async function imageToBuffer({ src, width, height }: ImageToBufferOptions) {
  if (!src) throw new Error('[imageToBuffer] No "src" provided.');
  if (typeof width !== 'number')
    throw new TypeError(`[imageToBuffer] Expected "width" to be of type "number", got "${typeof width}".`);
  if (typeof height !== 'number')
    throw new TypeError(`[imageToBuffer] Expected "height" to be of type "number", got "${typeof height}".`);

  const rgbArray: Array<number> = [];

  // Make TypeScript happy.
  const img = typeof src === 'string' ? await Jimp.read(src) : await Jimp.read(src);

  // If we get an image back that is 1px by 1px, that typically means nothing is
  // playing. In such cases, return a matrix of black pixels.
  if (img.getWidth() === 1 && img.getHeight() === 1) {
    // eslint-disable-next-line unicorn/no-new-array
    return Buffer.of(...new Array(width * height * 3).map(() => 0));
  }

  img.resize(width, height);

  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
    // x, y is the position of this pixel on the image. idx is the position
    // start position of this rgba tuple in the bitmap Buffer
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];

    rgbArray.push(red);
    rgbArray.push(green);
    rgbArray.push(blue);
  });

  return Buffer.of(...rgbArray);
}


/**
 * Accepts an integer representing a number of seconds in the future and returns
 * a UNIX timestamp representing that point in time.
 */
export function expiresInToUnixTimestamp(expiresIn: number) {
  return Date.now() + expiresIn * 1000;
}


/**
 * Returns a comma-delimited list of all artists for a given Spotify track.
 */
export function getArtistNames(item?: SpotifyApi.TrackObjectFull) {
  return item?.artists?.map(artist => artist.name).join(', ');
}


let brightnessAdjustmentInProgress = false;


/**
 * Gradually adjusts the brightness of the matrix over time.
 */
export function adjustMatrixBrightness(matrix: LedMatrixInstance, targetBrightness: number) {
  if (brightnessAdjustmentInProgress) {
    throw new Error('Brightness adjustment in progress. Please try again later.');
  }

  brightnessAdjustmentInProgress = true;

  matrix.afterSync(() => {
    if (brightnessAdjustmentInProgress && matrix.brightness() > targetBrightness) {
      matrix.brightness(matrix.brightness() - 5);
      setTimeout(() => matrix.sync(), 0);
    } else {
      brightnessAdjustmentInProgress = false;
    }
  });

  matrix.sync();

  // const initialBrightness = matrix.brightness();

  // if (initialBrightness === targetBrightness) {
  //   log.info(log.prefix('brightness'), `Brightness already at ${log.chalk.yellow(initialBrightness)}; no-op.`);
  //   return;
  // }

  // log.info(log.prefix('brightness'), `Adjusting brightness from ${log.chalk.yellow(initialBrightness)} to ${log.chalk.yellow(targetBrightness)}`);

  // brightnessAdjustmentInProgress = true;

  // if (initialBrightness < targetBrightness) {
  //   // Brighten.
  //   while (matrix.brightness() < targetBrightness) {
  //     log.info(`So just to let you know, this while loop is still running because ${matrix.brightness()} is less than ${targetBrightness}...`);
  //     log.info(log.prefix('brightness'), matrix.brightness());
  //     matrix.brightness(matrix.brightness() + 10).sync();
  //     await sleep('1s');
  //   }
  // } else {
  //   // Dim.
  //   while (matrix.brightness() > targetBrightness) {
  //     log.info(`So just to let you know, this while loop is still running because ${matrix.brightness()} is greater than ${targetBrightness}...`);
  //     matrix.brightness(matrix.brightness() - 10).sync();
  //     await sleep('1s');
  //   }
  // }

  // // Correct for any remaining difference in brightness.
  // matrix.brightness(targetBrightness).sync();

  // brightnessAdjustmentInProgress = false;

  // log.info(log.prefix('brightness'), 'Done adjusting brightness.');
}


export interface GeocodeResult {
  formattedLocation: string | undefined;
  latitude: number | undefined;
  longitude: number | undefined;
}


const nullResult: GeocodeResult = Object.freeze({
  formattedLocation: undefined,
  latitude: undefined,
  longitude: undefined
});


/**
 * Provided a query, returns a `GeocodeResult` using Open Street Maps.
 */
export async function geocodeLocation(query: string | undefined): Promise<GeocodeResult> {
  log.verbose(log.prefix('geocodeLocation'), 'Query:', query);

  if (!query) return nullResult;

  const coder = Geocoder({ provider: 'openstreetmap' });
  const results = await coder.geocode(query);
  const location = results[0];

  log.verbose(log.prefix('geocodeLocation'), 'Result:', location);

  const { formattedAddress: formattedLocation, latitude, longitude } = location;

  if (!longitude || !latitude) return nullResult;

  return { formattedLocation, latitude, longitude } as GeocodeResult;
}


/**
 * Returns the public IP address of the machine. This function will wait no more
 * than 2 seconds before resolving with `undefined`.
 */
export async function getPublicIpAddress() {
  return Promise.race([
    publicIpv4(),
    // eslint-disable-next-line unicorn/no-useless-undefined
    new Promise<undefined>(resolve => setTimeout(() => resolve(undefined), 2000))
  ]);
}


/**
 * Provided an IPV4/IPV6 address, returns a `GeocodeResult` using IP-API.
 */
export async function geocodeIp(ipAddress: string | undefined): Promise<GeocodeResult> {
  log.verbose(log.prefix('geocodeIp'), 'IP:', log.chalk.green(ipAddress));

  if (!ipAddress) return nullResult;

  const fields = [
    'status',
    'city',
    'regionName',
    'country',
    'lat',
    'lon'
  ];

  const response = await fetch(`http://ip-api.com/json/${ipAddress}?fields=${fields.join(',')}`);
  const location = await response.json() as IpApiResponse;

  log.verbose(log.prefix('geocodeIp'), 'Result:', location);

  const { status, lat: latitude, lon: longitude } = location;

  if (status !== 'success' || !latitude || !longitude) return nullResult;

  const { city, regionName, country } = location;
  const formattedLocation =  [city, regionName, country].join(', ');

  return { formattedLocation, latitude, longitude } as GeocodeResult;
}
