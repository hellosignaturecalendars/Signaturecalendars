"use client";
import { useState } from "react";
import Link from "next/link";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  inMemoryPersistence,
} from "firebase/auth";
import { Eye, EyeOff, LockKeyhole } from "lucide-react";
function clientAuth() {
  return getAuth(
    getApps()[0] ||
      initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      }),
  );
}
export function Login({
  preview,
  businessName,
}: {
  preview: boolean;
  businessName: string;
}) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [visible, setVisible] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  async function session(idToken = "") {
    const r = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    window.location.assign("/admin");
  }
  async function reset() {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter your account email first.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await sendPasswordResetEmail(clientAuth(), email);
      setMessage(
        "If this email has a password account, you’ll receive a reset link. Check your inbox and spam folder.",
      );
    } catch (e) {
      const code = (e as { code?: string }).code;
      if (code === "auth/operation-not-allowed")
        setError(
          "Password reset is unavailable for this sign-in method. Contact your account administrator.",
        );
      else if (code === "auth/user-not-found")
        setMessage(
          "If this email has a password account, you’ll receive a reset link.",
        );
      else
        setError("We could not request a reset link. Please try again later.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <div className="admin-login">
        <Link href="/" className="login-brand">
          {businessName}
        </Link>
        <span className="login-lock">
          <LockKeyhole size={25} />
        </span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your calendars and customer inquiries.</p>
        {preview && (
          <div className="notice">
            Development preview. Firebase sign-in is not connected yet. Use the
            local preview below to explore the dashboard.
          </div>
        )}
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (preview) return;
            setBusy(true);
            setError("");
            setMessage("");
            try {
              const auth = clientAuth();
              await setPersistence(auth, inMemoryPersistence);
              const cred = await signInWithEmailAndPassword(
                auth,
                email,
                password,
              );
              // Force refresh to get latest custom claims (including admin:true)
              const token = await cred.user.getIdToken(true);
              await signOut(auth);
              await session(token);
            } catch (e) {
              const code = (e as { code?: string }).code;
              setError(
                code === "auth/network-request-failed"
                  ? "Cannot connect. Check your internet connection and try again."
                  : code === "auth/too-many-requests"
                    ? "Too many attempts. Please wait and try again."
                    : code
                      ? "Sign-in failed. Check your email and password."
                      : (e as Error).message,
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Email address
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              disabled={preview || busy}
            />
          </label>
          <label>
            Password
            <div className="password-control">
              <input
                required
                type={visible ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={preview || busy}
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Hide password" : "Show password"}
              >
                {visible ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </label>
          <button className="button" disabled={busy || preview}>
            {busy ? "Signing in…" : "Login"}
          </button>
          <button
            type="button"
            className="text-button"
            disabled={busy || preview}
            onClick={reset}
          >
            Forgot password?
          </button>
        </form>
        {preview && (
          <button
            className="button outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await session();
              } catch (e) {
                setError((e as Error).message);
                setBusy(false);
              }
            }}
          >
            Enter local preview studio →
          </button>
        )}
        <p role="alert" className="error">
          {error}
        </p>
        <p role="status" className="success">
          {message}
        </p>
        <Link href="/">← Back to website</Link>
      </div>
    </main>
  );
}
