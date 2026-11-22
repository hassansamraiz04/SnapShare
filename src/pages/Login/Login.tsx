type LoginProps = {
  onGoogleLogin: () => void;
};

function Login({ onGoogleLogin }: LoginProps) {
  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="/">
          <span className="brand-icon">S</span>
          SnapShare
        </a>
      </nav>

      <main className="main-content">
        <section className="login-layout">
          <div className="login-info">
            <span className="eyebrow">YOUR MOMENTS, YOUR STORY</span>

            <h1>Every picture has a story worth sharing.</h1>

            <p>
              Keep your favorite memories together and share the moments that
              matter with SnapShare.
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

            <button className="google-button" onClick={onGoogleLogin}>
              <img src="https://www.google.com/favicon.ico" alt="" />
              Continue with Google
            </button>

            <div className="security-note">
              Secure authentication powered by AWS Cognito
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">© 2026 SnapShare. Share your moments.</footer>
    </div>
  );
}

export default Login;
