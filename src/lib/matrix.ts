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


/**
 * Attempt to instantiate a new LedMatrix. If this operation fails, log an error
 * explaining why.
 */
// try {
//   matrix = new LedMatrix({
//     ...LedMatrix.defaultMatrixOptions(),
//     hardwareMapping: GpioMapping.AdafruitHatPwm,
//     rows: env('MATRIX_WIDTH', true),
//     cols: env('MATRIX_HEIGHT', true),
//     limitRefreshRateHz: 60,
//     brightness: 100
//     // Re-enable this if we experience issues with the snd_bcm2835 module.
//     // disableHardwarePulsing: true
//   }, {
//     ...LedMatrix.defaultRuntimeOptions(),
//     gpioSlowdown: 3,
//     doGpioInit: true
//   });
// } catch (err: any) {
//   log.error(log.prefix('matrix'), 'Error initializing matrix:', err.message);
// }


// export default new Proxy<LedMatrixInstance>({}, {
//   get: (target, prop, receiver) => {
//     log.info('GET', prop);

//     const targetValue = matrix
//       ? Reflect.get(matrix, prop, matrix)
//       : Reflect.get(target, prop, receiver);

//     if (typeof targetValue === 'function') {
//       return function(this: LedMatrixInstance, ...args: Array<any>) {
//         return targetValue.apply(this === receiver ? target : this, args);
//       };
//     }

//     return targetValue;
//   }
// });


// export default proxy;


/**
 * Note: Update these settings to suit your hardware.
 */
// export default new LedMatrix({
//   ...LedMatrix.defaultMatrixOptions(),
//   hardwareMapping: GpioMapping.AdafruitHatPwm,
//   rows: env('MATRIX_WIDTH', true),
//   cols: env('MATRIX_HEIGHT', true),
//   limitRefreshRateHz: 60,
//   brightness: 100
//   // Re-enable this only if we experience issues with the snd_bcm2835 module.
//   // disableHardwarePulsing: true
// }, {
//   ...LedMatrix.defaultRuntimeOptions(),
//   gpioSlowdown: 3,
//   doGpioInit: true
// });


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
        gpioSlowdown: 3,
        doGpioInit: true
      });
    }

    return matrix;
  } catch (err: any) {
    if (err.message?.includes('is not a function')) {
      log.warn(log.prefix('matrix'), 'Using proxy for matrix.');
    } else {
      log.error(log.prefix('matrix'), 'Error initializing matrix:', err);
    }
  }

  return new Proxy<LedMatrixInstance>({
    clear: () => {
      // Empty.
    },
    drawBuffer: () => {
      // Empty.
    },
    width: () => {
      // Empty.
    },
    height: () => {
      // Empty.
    },
    sync: () => {
      // Empty
    }
  } as any, {
    get: (target, prop, receiver) => {
      // log.info('GET', prop);

      const targetValue = matrix
        ? Reflect.get(matrix, prop, matrix)
        : Reflect.get(target, prop, receiver);

      if (typeof targetValue === 'function') {
        return function(this: LedMatrixInstance, ...args: Array<any>) {
          return targetValue.apply(this === receiver ? target : this, args);
        };
      }

      return targetValue;
    }
  });
}
