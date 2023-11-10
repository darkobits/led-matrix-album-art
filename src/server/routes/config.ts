// import { getMatrix } from 'lib/matrix';

import type {
  FastifyRequest,
  FastifyReply,
  FastifySchema
} from 'fastify';


/**
 * TODO: Use a type provider like type-box to generate this type from the JSON
 * schema below.
 */
type ConfigRequest = FastifyRequest<{
  Body: {
    brightness?: number;
    height?: number;
    width?: number;
    luminanceCorrect?: boolean;
  };
}>;


/**
 * Handles POST requests to the /config route.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function configHandler(request: ConfigRequest, reply: FastifyReply) {
  // if (request.body?.brightness) {
  //   matrix.brightness(request.body.brightness);
  // }

  // if (request.body?.luminanceCorrect) {
  //   matrix.luminanceCorrect(request.body.luminanceCorrect);
  // }

  // const brightness = matrix.brightness();
  // const height = matrix.height();
  // const width = matrix.width();
  // const luminanceCorrect = matrix.luminanceCorrect();

  return {
    ok: true,
    config: request.body
    // matrix: {
    //   brightness,
    //   height,
    //   width,
    //   luminanceCorrect
    // }
  };
}


/**
 * JSON schema for this handler.
 */
configHandler.schema = {
  body: {
    type: 'object',
    properties: {
      brightness: {
        type: 'integer',
        minimum: 0,
        maximum: 100
      }
    },
    additionalProperties: false
  }
} as FastifySchema;
