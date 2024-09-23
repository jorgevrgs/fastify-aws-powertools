import type { Context } from 'aws-lambda';
import type { RequestWithAwsLambda } from '../types';

export const isNotNullObject = (val: unknown) => {
  return typeof val !== 'undefined' && typeof val === 'object' && val !== null;
};

export const isAwsLambdaRequest = <TEvent = unknown, TContext = Context>(
  request: unknown,
): request is RequestWithAwsLambda<TEvent, TContext> => {
  return (
    isNotNullObject(request) &&
    'awsLambda' in request &&
    isNotNullObject(request.awsLambda) &&
    'event' in request.awsLambda &&
    isNotNullObject(request.awsLambda.event) &&
    'context' in request.awsLambda &&
    isNotNullObject(request.awsLambda.context)
  );
};
