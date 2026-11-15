
import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

const schema = a.schema({
  Photo: a
    .model({
      title: a.string().required(),
      description: a.string(),
      imageKey: a.string().required(),
      fileName: a.string().required(),
      contentType: a.string(),
    })
    .authorization((allow) => [
      allow.authenticated().to(['read']),
      allow.owner(),
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'userPool',
  },
});
