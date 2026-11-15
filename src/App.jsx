
import { useEffect, useState } from 'react';
import {
  signInWithRedirect,
  getCurrentUser,
  signOut,
} from 'aws-amplify/auth';
import './App.css';

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

  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">S</span>
          SnapShare
        </a>
        {user && (
          <div className="nav-right">
            <span className="user-name">{user.username}</span>
            <button className="logout-button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        )}
      </nav>

      <main className="main-content">
        {!user ? (
          <section className="login-layout">
            <div className="login-info">
              <span className="eyebrow">YOUR MOMENTS, YOUR STORY</span>
              <h1>Every picture has a story worth sharing.</h1>
              <p>
                Keep your favorite memories together and share
                the moments that matter with SnapShare.
              </p>
              <div className="feature-points">
                <span>✓ Simple photo sharing</span>
                <span>✓ Your personal photo collection</span>
                <span>✓ Secure Google sign-in</span>
              </div>
            </div>

            <div className="login-card">
              <div className="card-logo">S</div>
              <h2>Welcome to SnapShare</h2>
              <p className="card-description">
                Sign in to start sharing your moments.
              </p>

              <button
                className="google-button"
                onClick={handleGoogleLogin}
              >
                <img
                  src="https://www.google.com/favicon.ico"
                  alt=""
                />
                Continue with Google
              </button>

              <div className="security-note">
                Secure authentication powered by AWS Cognito
              </div>
            </div>
          </section>
        ) : (
          <section className="welcome-layout">
            <div className="welcome-icon">S</div>
            <span className="eyebrow">YOU'RE SIGNED IN</span>
            <h1>Welcome to SnapShare!</h1>
            <p>
              Hello, {user.username}. Your space for sharing
              beautiful moments is ready.
            </p>
            <button className="primary-button" onClick={handleLogout}>
              Sign out
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        © 2026 SnapShare. Share your moments.
      </footer>
    </div>
  );
}

export default App;
