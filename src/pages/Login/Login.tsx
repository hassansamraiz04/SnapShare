type LoginProps = {
  onGoogleLogin: () => void;
};

function Login({ onGoogleLogin }: LoginProps) {
  return (
    <div className="app">
      <nav className="navbar">
        <a className="brand" href="/">
          <img className="brand-icon" src="/favicon.png" alt="" />
          SnapShare
        </a>
      </nav>

      <main className="main-content">
        <section className="login-layout">
          <div className="login-info">
            <span className="eyebrow">A home for your photographs</span>

            <h1>
              Keep the moments
              <br />
              that make you <em>smile.</em>
            </h1>

            <p>
              A little corner of the internet for your favorite photos. Save
              them somewhere lovely, and come back whenever you like.
            </p>

            <div className="feature-points">
              <span>Your own private gallery</span>
              <span>Simple, secure sign-in</span>
            </div>
          </div>

          <div className="login-card">
            <div className="card-logo">
              <img src="/favicon.png" alt="" />
            </div>

            <h2>Welcome to your gallery</h2>

            <p className="card-description">
              Sign in and pick up right where your memories are.
            </p>

            <button className="google-button" onClick={onGoogleLogin}>
              <img src="https://www.google.com/favicon.ico" alt="" />
              Continue with Google
            </button>

            <div className="security-note">Your photos, safe and sound</div>
          </div>
        </section>
      </main>

      <footer className="footer">© 2026 SnapShare. Share your moments.</footer>
    </div>
  );
}

export default Login;
