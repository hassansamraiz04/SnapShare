import type { APIGatewayProxyHandler } from "aws-lambda";

export const handler: APIGatewayProxyHandler = async (event) => {
  const claims = event.requestContext.authorizer?.claims as
    Record<string, string> | undefined;

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "SnapShare REST API is working",
      authenticated: Boolean(claims?.sub),
      user: {
        id: claims?.sub || null,
        email: claims?.email || null,
      },
    }),
  };
};
