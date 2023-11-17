import {
  LedMatrix,
  GpioMapping,
  type LedMatrixInstance,
  type MatrixOptions,
  type RuntimeOptions
} from 'rpi-led-matrix';

import log from 'lib/log';


export interface GetMatrixOptions {
  rows: MatrixOptions['rows'];
  cols: MatrixOptions['cols'];
  gpioSlowdown: RuntimeOptions['gpioSlowdown'];
}


/**
 * @private
 *
 * LED Matrix instance that may or may not get set depending on whether the
 * matrix is connected or not. If not, the proxy will log any attempts to
 * interact with the matrix.
 */
let matrix: LedMatrixInstance;


/**
 * Used as a proxy for an LedMatrixInstance in cases where a matrix is not
 * connected.
 */
class LedMatrixProxy {
  #brightness = 100;
  #width;
  #height;

  constructor(options: GetMatrixOptions) {
    this.#width = options.cols;
    this.#height = options.rows;
  }

  clear() {
    return this;
  }

  drawBuffer() {
    return this;
  }

  sync() {
    return this;
  }

  brightness(newValue?: number) {
    if (typeof newValue !== 'undefined') {
      this.#brightness = newValue;
      return this;
    }

    return this.#brightness;
  }

  width(newValue?: MatrixOptions['cols']) {
    if (typeof newValue !== 'undefined') {
      this.#width = newValue;
      return this;
    }

    return this.#width;
  }

  height(newValue?: MatrixOptions['rows']) {
    if (typeof newValue !== 'undefined') {
      this.#height = newValue;
      return this;
    }

    return this.#height;
  }
}


/**
 * Returns a singleton `LedMatrixInstance` or `LedMatrixProxy`.
 */
export function initMatrix(options: GetMatrixOptions) {
  if (matrix) return matrix;

  try {
    matrix = new LedMatrix({
      ...LedMatrix.defaultMatrixOptions(),
      hardwareMapping: GpioMapping.AdafruitHatPwm,
      rows: options.rows,
      cols: options.cols,
      limitRefreshRateHz: 60,
      brightness: 100
      // Re-enable this if we experience issues with the snd_bcm2835 module.
      // disableHardwarePulsing: true
    }, {
      ...LedMatrix.defaultRuntimeOptions(),
      gpioSlowdown: options.gpioSlowdown,
      doGpioInit: true
    });
  } catch (err: any) {
    if (err.message?.includes('is not a function')) {
      matrix = new LedMatrixProxy(options) as unknown as LedMatrixInstance;
    } else {
      log.error(log.prefix('matrix'), 'Error initializing matrix:', err);
      throw err;
    }
  }

  return matrix;
}


export function getMatrix() {
  if (!matrix) throw new Error('Matrix is not initialized.');
  return matrix;
}


// ----- Miscellany ------------------------------------------------------------

class Pulser {
  constructor(readonly x: number, readonly y: number, readonly f: number) {}

  nextColor(t: number): number {
    /** You could easily work position-dependent logic into this expression */
    const brightness = 0xFF & Math.max(0, 255 * Math.sin(this.f * t / 1000));

    return brightness << 16 | brightness << 8 | brightness;
  }
}


export function pulserTest(options: GetMatrixOptions) {
  const matrix = initMatrix(options);
  const pulsers: Array<Pulser> = [];

  for (let x = 0; x < matrix.width(); x += 1) {
    for (let y = 0; y < matrix.height(); y += 1) {
      pulsers.push(new Pulser(x, y, 5 * Math.random()));
    }
  }

  let mode: 'up' | 'down' = 'down';

  matrix.afterSync((mat, dt, t) => {
    pulsers.forEach(pulser => {
      matrix.fgColor(pulser.nextColor(t)).setPixel(pulser.x, pulser.y);
    });

    if (matrix.brightness() === 100) {
      mode = 'down';
    } else if (matrix.brightness() === 0) {
      mode = 'up';
    }

    if (mode === 'down') {
      matrix.brightness(matrix.brightness() - 1);
    } else {
      matrix.brightness(matrix.brightness() + 1);
    }

    // Why?
    setTimeout(() => matrix.sync(), 0);
  });

  matrix.sync();
}
