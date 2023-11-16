var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _brightness, _width, _height;
import env from "@darkobits/env";
import { LedMatrix, GpioMapping } from "rpi-led-matrix";
import log from "./log.js";
let matrix;
class LedMatrixProxy {
  constructor() {
    __privateAdd(this, _brightness, 100);
    __privateAdd(this, _width, env("MATRIX_WIDTH", true));
    __privateAdd(this, _height, env("MATRIX_HEIGHT", true));
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
  brightness(newValue) {
    if (typeof newValue !== "undefined") {
      __privateSet(this, _brightness, newValue);
      return this;
    }
    return __privateGet(this, _brightness);
  }
  width(newValue) {
    if (typeof newValue !== "undefined") {
      __privateSet(this, _width, newValue);
      return this;
    }
    return __privateGet(this, _width);
  }
  height(newValue) {
    if (typeof newValue !== "undefined") {
      __privateSet(this, _height, newValue);
      return this;
    }
    return __privateGet(this, _height);
  }
}
_brightness = new WeakMap();
_width = new WeakMap();
_height = new WeakMap();
function getMatrix() {
  var _a;
  if (matrix)
    return matrix;
  try {
    matrix = new LedMatrix({
      ...LedMatrix.defaultMatrixOptions(),
      hardwareMapping: GpioMapping.AdafruitHatPwm,
      rows: env("MATRIX_WIDTH", true),
      cols: env("MATRIX_HEIGHT", true),
      limitRefreshRateHz: 60,
      brightness: 100
      // Re-enable this if we experience issues with the snd_bcm2835 module.
      // disableHardwarePulsing: true
    }, {
      ...LedMatrix.defaultRuntimeOptions(),
      gpioSlowdown: env("MATRIX_GPIO_SLOWDOWN", true),
      doGpioInit: true
    });
  } catch (err) {
    if ((_a = err.message) == null ? void 0 : _a.includes("is not a function")) {
      matrix = new LedMatrixProxy();
    } else {
      log.error(log.prefix("matrix"), "Error initializing matrix:", err);
      throw err;
    }
  }
  return matrix;
}
class Pulser {
  constructor(x, y, f) {
    __publicField(this, "x");
    __publicField(this, "y");
    __publicField(this, "f");
    this.x = x;
    this.y = y;
    this.f = f;
  }
  nextColor(t) {
    const brightness = 255 & Math.max(0, 255 * Math.sin(this.f * t / 1e3));
    return brightness << 16 | brightness << 8 | brightness;
  }
}
function pulserTest() {
  const matrix2 = getMatrix();
  const pulsers = [];
  for (let x = 0; x < matrix2.width(); x += 1) {
    for (let y = 0; y < matrix2.height(); y += 1) {
      pulsers.push(new Pulser(x, y, 5 * Math.random()));
    }
  }
  let mode = "down";
  matrix2.afterSync((mat, dt, t) => {
    pulsers.forEach((pulser) => {
      matrix2.fgColor(pulser.nextColor(t)).setPixel(pulser.x, pulser.y);
    });
    if (matrix2.brightness() === 100) {
      mode = "down";
    } else if (matrix2.brightness() === 0) {
      mode = "up";
    }
    if (mode === "down") {
      matrix2.brightness(matrix2.brightness() - 1);
    } else {
      matrix2.brightness(matrix2.brightness() + 1);
    }
    setTimeout(() => matrix2.sync(), 0);
  });
  matrix2.sync();
}
export {
  getMatrix,
  pulserTest
};
//# sourceMappingURL=matrix.js.map
