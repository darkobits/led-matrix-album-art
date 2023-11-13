import env from '@darkobits/env';
import {
  LedMatrix,
  GpioMapping,
  type LedMatrixInstance
} from 'rpi-led-matrix';

import log from 'lib/log';


/**
 * @private
 *
 * LED Matrix instance that may or may not get set depending on whether the
 * matrix is connected or not. If not, the proxy will log any attempts to
 * interact with the matrix.
 */
let matrix: LedMatrixInstance;


export function getMatrix() {
  try {
    if (!matrix) {
      matrix = new LedMatrix({
        ...LedMatrix.defaultMatrixOptions(),
        hardwareMapping: GpioMapping.AdafruitHatPwm,
        rows: env('MATRIX_WIDTH', true),
        cols: env('MATRIX_HEIGHT', true),
        limitRefreshRateHz: 60,
        brightness: 100
        // Re-enable this if we experience issues with the snd_bcm2835 module.
        // disableHardwarePulsing: true
      }, {
        ...LedMatrix.defaultRuntimeOptions(),
        gpioSlowdown: env('MATRIX_GPIO_SLOWDOWN', true),
        doGpioInit: true
      });
    }

    return matrix;
  } catch (err: any) {
    if (err.message?.includes('is not a function')) {
      // log.warn(log.prefix('matrix'), 'Using proxy for matrix.');
    } else {
      log.error(log.prefix('matrix'), 'Error initializing matrix:', err);
    }
  }

  let brightness = 100;
  let width = env<number>('MATRIX_WIDTH', true);
  let height = env<number>('MATRIX_HEIGHT', true);

  const proxy = {
    clear: () => {
      return proxy;
    },
    drawBuffer: () => {
      return proxy;
    },
    sync: () => {
      return proxy;
    },
    brightness: (newValue?: number) => {
      if (typeof newValue !== 'undefined') {
        brightness = newValue;
        return proxy;
      }

      return brightness;
    },
    width: (newValue?: number) => {
      if (typeof newValue !== 'undefined') {
        width = newValue;
        return proxy;
      }

      return width;
    },
    height: (newValue?: number) => {
      if (typeof newValue !== 'undefined') {
        height = newValue;
        return proxy;
      }

      return height;
    }
  } as unknown as LedMatrixInstance;


  return proxy;
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


export function pulserTest() {
  const matrix = getMatrix();
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
