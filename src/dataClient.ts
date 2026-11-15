
import { generateClient } from 'aws-amplify/api';

const client = generateClient({
  authMode: 'userPool',
});

export default client;
