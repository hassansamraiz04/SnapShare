import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "snapSharePhotos",

  access: (allow) => ({
    "photos/*": [allow.authenticated.to(["read", "write"])],
  }),
});
