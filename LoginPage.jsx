import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS, Btn, Input } from "../components/ui";

export default function LoginPage() {
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => {
    setMode(next);
    setError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    const res = mode === "signin" ? await login(email, password) : await signup(name, email, password);
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    navigate("/");
  };

  const canSubmit = mode === "signin" ? email && password : name && email && password && confirmPassword;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: COLORS.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: 20,
      }}
    >
      <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: COLORS.primary,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
              boxShadow: "0 8px 20px rgba(59,111,224,0.25)",
            }}
          >
            <span style={{ color: "#fff", fontSize: 22, fontWeight: 700 }}>S</span>
          </div>
          <h1 style={{ margin: "0 0 6px", fontSize: 28, color: COLORS.text, fontWeight: 700 }}>Sign Manager</h1>
          <p style={{ margin: 0, color: COLORS.textMuted, fontSize: 15 }}>Document Signing Platform</p>
        </div>

        <div
          style={{
            background: COLORS.surface,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 12px 40px rgba(20,22,28,0.06)",
          }}
        >
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: COLORS.bg, borderRadius: 9, padding: 4 }}>
            {[["signin", "Sign In"], ["signup", "Create Account"]].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => switchMode(id)}
                style={{
                  flex: 1,
                  padding: "9px 0",
                  borderRadius: 7,
                  border: "none",
                  background: mode === id ? COLORS.primary : "transparent",
                  color: mode === id ? "#fff" : COLORS.textMuted,
                  cursor: "pointer",
                  fontSize: 13.5,
                  fontWeight: 600,
                  fontFamily: "inherit",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          <h2 style={{ margin: "0 0 20px", fontSize: 20, color: COLORS.text, fontWeight: 600 }}>
            {mode === "signin" ? "Sign in to your account" : "Create your account"}
          </h2>

          {mode === "signup" && <Input label="Full name" value={name} onChange={setName} placeholder="Jane Doe" />}
          <Input label="Email address" type="email" value={email} onChange={setEmail} placeholder="you@company.com" />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            placeholder={mode === "signup" ? "At least 6 characters" : "Password"}
            error={mode === "signin" ? error : ""}
          />
          {mode === "signup" && (
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              error={error}
            />
          )}

          <Btn
            type="submit"
            variant="primary"
            disabled={loading || !canSubmit}
            style={{ width: "100%", justifyContent: "center", padding: "12px 0", fontSize: 15, marginTop: 4 }}
          >
            {loading ? (mode === "signin" ? "Signing in…" : "Creating account…") : mode === "signin" ? "Sign in" : "Create account"}
          </Btn>

          <p style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: COLORS.textMuted }}>
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
              style={{ background: "none", border: "none", color: COLORS.primary, fontWeight: 600, cursor: "pointer", fontSize: 13, padding: 0 }}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
