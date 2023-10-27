import { LedMatrix, GpioMapping } from 'rpi-led-matrix';


export default new LedMatrix({
  ...LedMatrix.defaultMatrixOptions(),
  rows: 64,
  cols: 64,
  hardwareMapping: GpioMapping.AdafruitHatPwm,
  limitRefreshRateHz: 60,
  brightness: 100,
  // Disable this once we figure out how to permanently disable the snd_bcm2835
  // module on the system.
  disableHardwarePulsing: true
}, {
  ...LedMatrix.defaultRuntimeOptions(),
  gpioSlowdown: 3,
  doGpioInit: true
});
