import type { Context } from 'aws-lambda';
import type { RequestWithAwsLambda } from '../../types';
import { isNotNullObject } from './is-not-null-object.helper';

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
