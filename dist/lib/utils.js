import Jimp from "jimp";
function drawTestPattern(matrix) {
  matrix.clear().brightness(100).fgColor({ r: 0, g: 0, b: 255 }).fill().fgColor({ r: 255, g: 255, b: 0 }).drawCircle(matrix.width() / 2, matrix.height() / 2, matrix.width() / 2 - 1).drawRect(matrix.width() / 4, matrix.height() / 4, matrix.width() / 2, matrix.height() / 2).fgColor({ r: 255, g: 0, b: 0 }).drawLine(0, 0, matrix.width(), matrix.height()).drawLine(matrix.width() - 1, 0, 0, matrix.height() - 1);
}
async function imageToBuffer({ src, width, height }) {
  if (!src)
    throw new Error('[imageToBuffer] No "src" provided.');
  if (typeof width !== "number")
    throw new TypeError(`[imageToBuffer] Expected "width" to be of type "number", got "${typeof width}".`);
  if (typeof height !== "number")
    throw new TypeError(`[imageToBuffer] Expected "height" to be of type "number", got "${typeof height}".`);
  const rgbArray = [];
  const img = await Jimp.read(src);
  if (img.getWidth() === 1 && img.getHeight() === 1) {
    return Buffer.of(...new Array(width * height * 3).map(() => 0));
  }
  img.resize(width, height);
  img.scan(0, 0, img.bitmap.width, img.bitmap.height, function(x, y, idx) {
    const red = this.bitmap.data[idx + 0];
    const green = this.bitmap.data[idx + 1];
    const blue = this.bitmap.data[idx + 2];
    rgbArray.push(red);
    rgbArray.push(green);
    rgbArray.push(blue);
  });
  return Buffer.of(...rgbArray);
}
function expiresInToUnixTimestamp(expiresIn) {
  return Date.now() + expiresIn * 1e3;
}
function getArtistNames(item) {
  var _a;
  return (_a = item == null ? void 0 : item.artists) == null ? void 0 : _a.map((artist) => artist.name).join(", ");
}
let brightnessAdjustmentInProgress = false;
function adjustMatrixBrightness(matrix, targetBrightness) {
  if (brightnessAdjustmentInProgress) {
    throw new Error("Brightness adjustment in progress. Please try again later.");
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
}
export {
  adjustMatrixBrightness,
  drawTestPattern,
  expiresInToUnixTimestamp,
  getArtistNames,
  imageToBuffer
};
//# sourceMappingURL=utils.js.map
