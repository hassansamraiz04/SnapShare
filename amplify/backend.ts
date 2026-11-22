import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { storage } from "./storage/resource";
import { adminStats } from "./functions/admin-stats/resource";

import {
  AuthorizationType,
  CognitoUserPoolsAuthorizer,
  Cors,
  LambdaIntegration,
  RestApi,
} from "aws-cdk-lib/aws-apigateway";
import { CfnBucket } from "aws-cdk-lib/aws-s3";

const backend = defineBackend({
  auth,
  data,
  storage,
  adminStats,
});

const storageBucketResource =
  backend.storage.resources.bucket.node.defaultChild;

if (!(storageBucketResource instanceof CfnBucket)) {
  throw new Error("Could not configure CORS for the SnapShare storage bucket.");
}

storageBucketResource.addPropertyOverride("CorsConfiguration.CorsRules", [
  {
    AllowedOrigins: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://main.dspyzzl5a2d7f.amplifyapp.com",
    ],
    AllowedMethods: ["GET"],
    AllowedHeaders: ["*"],
    ExposedHeaders: ["Content-Disposition", "ETag"],
    MaxAgeSeconds: 3000,
  },
]);

const apiStack = backend.createStack("snapshare-rest-api");

const adminStatsLambda = backend.adminStats.resources.lambda;

const authorizer = new CognitoUserPoolsAuthorizer(
  apiStack,
  "SnapShareCognitoAuthorizer",
  {
    cognitoUserPools: [backend.auth.resources.userPool],
  },
);

const restApi = new RestApi(apiStack, "SnapShareRestApi", {
  restApiName: "SnapShare REST API",
  defaultCorsPreflightOptions: {
    allowOrigins: Cors.ALL_ORIGINS,
    allowMethods: ["GET", "OPTIONS"],
    allowHeaders: ["Authorization", "Content-Type"],
  },
});

const adminResource = restApi.root.addResource("admin");
const statsResource = adminResource.addResource("stats");

statsResource.addMethod("GET", new LambdaIntegration(adminStatsLambda), {
  authorizationType: AuthorizationType.COGNITO,
  authorizer,
});
