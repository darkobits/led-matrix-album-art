import { getMatrix } from "../../lib/matrix.js";
function configHandler(request, reply) {
  var _a;
  const matrix = getMatrix();
  if (request.method === "POST" && typeof ((_a = request.body) == null ? void 0 : _a.brightness) === "number") {
    matrix.brightness(request.body.brightness);
  }
  const brightness = matrix.brightness();
  const height = matrix.height();
  const width = matrix.width();
  return {
    brightness,
    height,
    width
  };
}
configHandler.schema = {
  body: {
    type: "object",
    properties: {
      brightness: {
        type: "integer",
        minimum: 0,
        maximum: 100
      }
    },
    additionalProperties: false
  }
};
export {
  configHandler
};
//# sourceMappingURL=config.js.map
