
import { defineAuth, secret } from '@aws-amplify/backend';

export const auth = defineAuth({
  loginWith: {
    email: true,
    externalProviders: {
      google: {
        clientId: secret('GOOGLE_CLIENT_ID'),
        clientSecret: secret('GOOGLE_CLIENT_SECRET'),
      },
      callbackUrls: [
        'http://localhost:5173/',
        'https://main.dspyzzl5a2d7f.amplifyapp.com/',
      ],
      logoutUrls: [
        'http://localhost:5173/',
        'https://main.dspyzzl5a2d7f.amplifyapp.com/',
      ],
    },
  },
});
