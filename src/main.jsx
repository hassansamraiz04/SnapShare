
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
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
