import {
  aws_apigateway,
  aws_dynamodb,
  aws_lambda,
  aws_lambda_nodejs,
  aws_logs,
  CfnOutput,
  RemovalPolicy,
  Stack,
  StackProps,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const productsTable = new aws_dynamodb.Table(this, 'Products', {
      tableName: 'Products',
      partitionKey: {
        name: 'id',
        type: aws_dynamodb.AttributeType.STRING,
      },
      billingMode: aws_dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const envVariables = {
      AWS_ACCOUNT_ID: Stack.of(this).account,
      POWERTOOLS_SERVICE_NAME: 'serverless-typescript-fastify',
      POWERTOOLS_LOGGER_LOG_LEVEL: 'WARN',
      POWERTOOLS_LOGGER_SAMPLE_RATE: '0.01',
      POWERTOOLS_LOGGER_LOG_EVENT: 'true',
      POWERTOOLS_METRICS_NAMESPACE: 'AwsFastifySamples',
    };

    const esBuildSettings = {
      minify: true,
      externalModules: [
        'fastify',
        '@fastify/aws-lambda',
        '@aws-lambda-powertools/logger',
        '@aws-lambda-powertools/metrics',
        '@aws-lambda-powertools/tracer',
      ],
    };

    const functionSettings = {
      handler: 'handler',
      runtime: aws_lambda.Runtime.NODEJS_16_X,
      memorySize: 256,
      environment: {
        TABLE_NAME: productsTable.tableName,
        ...envVariables,
      },
      logRetention: aws_logs.RetentionDays.ONE_WEEK,
      tracing: aws_lambda.Tracing.ACTIVE,
      bundling: esBuildSettings,
    };

    const productsFunction = new aws_lambda_nodejs.NodejsFunction(
      this,
      'productsFunction',
      {
        awsSdkConnectionReuse: true,
        entry: './src/index.ts',
        ...functionSettings,
      }
    );

    productsTable.grantReadData(productsFunction);
    productsTable.grantReadData(productsFunction);
    productsTable.grantWriteData(productsFunction);
    productsTable.grantWriteData(productsFunction);

    const api = new aws_apigateway.RestApi(this, 'ProductsApi', {
      restApiName: 'ProductsApi',
      deployOptions: {
        tracingEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: aws_apigateway.MethodLoggingLevel.INFO,
        metricsEnabled: true,
      },
    });

    const products = api.root.addResource('products');
    products.addMethod(
      'GET',
      new aws_apigateway.LambdaIntegration(productsFunction)
    );

    new CfnOutput(this, 'ApiURL', {
      value: `${api.url}products`,
    });
  }
}
