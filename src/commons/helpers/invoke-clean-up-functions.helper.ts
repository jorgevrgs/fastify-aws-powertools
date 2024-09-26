import type { FastifyRequest } from 'fastify';
import {
  LOGGER_KEY,
  METRICS_KEY,
  POWERTOOLS_REQUEST_KEY,
  TRACER_KEY,
} from '../symbols';
import { isNotNullObject } from './is-not-null-object.helper';

export const invokeCleanUpFunctions = async (request: FastifyRequest) => {
  const cleanupFunctionNames = [LOGGER_KEY, METRICS_KEY, TRACER_KEY];

  for (const functionName of cleanupFunctionNames) {
    if (
      !isNotNullObject(request[POWERTOOLS_REQUEST_KEY]) &&
      !isNotNullObject(request[POWERTOOLS_REQUEST_KEY][functionName])
    ) {
      const functionReference = request[POWERTOOLS_REQUEST_KEY][
        functionName
      ] as unknown;

      if (typeof functionReference === 'function') {
        await functionReference(request);
      }
    }
  }
};
