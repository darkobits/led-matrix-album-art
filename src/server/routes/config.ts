import { getMatrix } from 'lib/matrix';

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
  const matrix = getMatrix();

  // Handle updating matrix configuration if request is a POST.
  if (request.method === 'POST' && typeof request.body?.brightness === 'number') {
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
