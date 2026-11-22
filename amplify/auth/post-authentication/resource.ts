import { defineFunction } from "@aws-amplify/backend";

export const postAuthentication = defineFunction({
  name: "post-authentication",
  environment: {
    GROUP_NAME: "Users",
  },
  resourceGroupName: "auth",
});
