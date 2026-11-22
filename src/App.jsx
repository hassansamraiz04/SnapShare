import { useEffect, useState } from "react";
import {
  signInWithRedirect,
  getCurrentUser,
  fetchUserAttributes,
  fetchAuthSession,
  signOut,
} from "aws-amplify/auth";

import Login from "./pages/Login/Login";
import PhotoDashboard from "./pages/PhotoDashboard/PhotoDashboard";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUser() {
      try {
        const currentUser = await getCurrentUser();

        let displayName = "";

        try {
          const [attributes, session] = await Promise.all([
            fetchUserAttributes(),
            fetchAuthSession(),
          ]);

          const claims = session.tokens?.idToken?.payload ?? {};

          displayName =
            claims.name ||
            attributes.name ||
            [claims.given_name, claims.family_name].filter(Boolean).join(" ") ||
            [attributes.given_name, attributes.family_name]
              .filter(Boolean)
              .join(" ") ||
            claims.email ||
            attributes.email ||
            "";

          if (displayName.includes("@")) {
            displayName = displayName
              .split("@")[0]
              .replace(/[._-]+/g, " ")
              .replace(/\b\w/g, (letter) => letter.toUpperCase());
          }
        } catch (attributeError) {
          console.warn(
            "Could not load Google profile attributes:",
            attributeError,
          );
        }

        if (!displayName || /^google[_-]/i.test(displayName)) {
          displayName = "SnapShare member";
        }

        if (active) {
          setUser({
            ...currentUser,
            username: displayName,
            displayName,
          });
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      active = false;
    };
  }, []);

  async function handleGoogleLogin() {
    await signInWithRedirect({ provider: "Google" });
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
