
import { useEffect, useState } from 'react';
import {
  signInWithRedirect,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';

import Login from './pages/Login/Login';
import PhotoDashboard from './pages/PhotoDashboard/PhotoDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  async function handleGoogleLogin() {
    await signInWithRedirect({ provider: 'Google' });
  }

  async function handleLogout() {
    await signOut();
    setUser(null);
  }

  if (loading) {
    return <div className="loading">Loading SnapShare...</div>;
  }

  return user ? (
    <PhotoDashboard user={user} onSignOut={handleLogout} />
  ) : (
    <Login onGoogleLogin={handleGoogleLogin} />
  );
}

export default App;
