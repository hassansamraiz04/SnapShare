
import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { adminStats } from './functions/admin-stats/resource';

import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from 'aws-cdk-lib/aws-apigateway';

const backend = defineBackend({
  auth,
  data,
  storage,
  adminStats,
});

const apiStack = backend.createStack('snapshare-rest-api');

const adminStatsLambda = backend.adminStats.resources.lambda;

const authorizer = new CognitoUserPoolsAuthorizer(
  apiStack,
  'SnapShareCognitoAuthorizer',
  {
    cognitoUserPools: [backend.auth.resources.userPool],
  },
);

const restApi = new RestApi(apiStack, 'SnapShareRestApi', {
  restApiName: 'SnapShare REST API',
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['Authorization', 'Content-Type'],
  },
});

const adminResource = restApi.root.addResource('admin');
const statsResource = adminResource.addResource('stats');

statsResource.addMethod(
  'GET',
  new LambdaIntegration(adminStatsLambda),
  {
    authorizationType: AuthorizationType.COGNITO,
    authorizer,
  },
);
