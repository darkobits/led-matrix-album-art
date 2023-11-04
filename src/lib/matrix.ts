import { LedMatrix, GpioMapping } from 'rpi-led-matrix';


if (typeof LedMatrix.defaultMatrixOptions !== 'function') {
  // eslint-disable-next-line unicorn/prefer-type-error
  throw new Error('Matrix may not be connected.', {
    cause: new TypeError('LedMatrix.defaultMatrixOptions is not a function.')
  });
}


if (typeof LedMatrix.defaultRuntimeOptions !== 'function') {
  // eslint-disable-next-line unicorn/prefer-type-error
  throw new Error('Matrix may not be connected.', {
    cause: new TypeError('LedMatrix.defaultRuntimeOptions is not a function.')
  });
}


/**
 * Note: Update these settings to suit your hardware.
 */
export default new LedMatrix({
  ...LedMatrix.defaultMatrixOptions(),
  rows: 64,
  cols: 64,
  hardwareMapping: GpioMapping.AdafruitHatPwm,
  limitRefreshRateHz: 60,
  brightness: 100,
  // Disable this once we figure out how to permanently disable the
  // snd_bcm2835 module on the Raspberry Pi.
  disableHardwarePulsing: true
}, {
  ...LedMatrix.defaultRuntimeOptions(),
  gpioSlowdown: 3,
  doGpioInit: true
});
