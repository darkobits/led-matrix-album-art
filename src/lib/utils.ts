import Jimp from 'jimp';

import type { LedMatrixInstance } from 'rpi-led-matrix';


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
  src: string;
  width: number;
  height: number;
}


/**
 * Provided a path or URL for an image and desired output dimensions, returns a
 * Buffer that can be passed to the `LedMatrix#drawBuffer`.
 */
export async function imageToBuffer({ src, width, height }: ImageToBufferOptions) {
  if (!src) throw new Error('[imageToBuffer] No "src" provided.');
  if (typeof width !== 'number')
    throw new TypeError(`[imageToBuffer] Expected "width" to be of type "number", got "${typeof width}".`);
  if (typeof height !== 'number')
    throw new TypeError(`[imageToBuffer] Expected "height" to be of type "number", got "${typeof height}".`);

  const rgbArray: Array<number> = [];

  const img = await Jimp.read(src);

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
