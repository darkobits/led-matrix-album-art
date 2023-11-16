/// <reference types="node" />
/// <reference types="spotify-api" />
import type { LedMatrixInstance } from 'rpi-led-matrix';
/**
 * Provided an `LedMatrix` instance, draws a test pattern on the display.
 * `.sync()` must be called to render the image.
 */
export declare function drawTestPattern(matrix: LedMatrixInstance): void;
export interface ImageToBufferOptions {
    src: string;
    width: number;
    height: number;
}
/**
 * Provided a path or URL for an image and desired output dimensions, returns a
 * Buffer that can be passed to the `LedMatrix#drawBuffer`.
 */
export declare function imageToBuffer({ src, width, height }: ImageToBufferOptions): Promise<Buffer>;
/**
 * Accepts an integer representing a number of seconds in the future and returns
 * a UNIX timestamp representing that point in time.
 */
export declare function expiresInToUnixTimestamp(expiresIn: number): number;
/**
 * Returns a comma-delimited list of all artists for a given Spotify track.
 */
export declare function getArtistNames(item?: SpotifyApi.TrackObjectFull): string | undefined;
/**
 * Gradually adjusts the brightness of the matrix over time.
 */
export declare function adjustMatrixBrightness(matrix: LedMatrixInstance, targetBrightness: number): void;
