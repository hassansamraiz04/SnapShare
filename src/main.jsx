
import './App.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Amplify } from 'aws-amplify';
import App from './App.jsx';
import './index.css';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: 'ap-south-1_okrb8HuLH',
      userPoolClientId: '64pcptoafurjt9i1duu9u64b8q',
      identityPoolId: 'ap-south-1:61bb5e3d-4c5c-45a4-8c76-aa1facb1d074',
      loginWith: {
        oauth: {
          domain: '8729302e99e3fada4b18.auth.ap-south-1.amazoncognito.com',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [
            'http://localhost:5173/',
            'https://main.dspyzzl5a2d7f.amplifyapp.com/',
          ],
          redirectSignOut: [
            'http://localhost:5173/',
            'https://main.dspyzzl5a2d7f.amplifyapp.com/',
          ],
          responseType: 'code',
        },
      },
    },
  },
  Storage: {
    S3: {
      bucket: 'amplify-dspyzzl5a2d7f-mai-snapsharephotosbucketf5a-46yqcqrp8scv',
      region: 'ap-south-1',
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
