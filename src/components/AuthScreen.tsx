import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

type AuthMode = "login" | "register";

const AuthScreen: React.FC = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const getErrorMessage = (code: string): string => {
    switch (code) {
      case "auth/email-already-in-use":
        return "This email is already registered. Try logging in.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential":
        return "Invalid email or password.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      default:
        return "Something went wrong. Please try again.";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password, displayName || undefined);
      }
    } catch (err: unknown) {
      const firebaseError = err as { code?: string };
      setError(getErrorMessage(firebaseError.code || ""));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">
            Learning Dutch
          </h1>
          <p className="text-secondary">
            {mode === "login"
              ? "Welcome back! Sign in to continue learning."
              : "Create an account to start learning Dutch."}
          </p>
        </div>

        <div className="card-bg rounded-2xl p-8 card-glow">
          {/* Mode tabs */}
          <div className="flex mb-6 rounded-lg overflow-hidden border border-white/20">
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === "login"
                  ? "bg-white/20 text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register");
                setError(null);
              }}
              className={`flex-1 py-2.5 text-sm font-medium transition-all duration-200 ${
                mode === "register"
                  ? "bg-white/20 text-primary"
                  : "text-muted hover:text-secondary"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label
                  htmlFor="displayName"
                  className="block text-sm font-medium text-secondary mb-1"
                >
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="input-field input-glow w-full px-4 py-3 rounded-lg text-base"
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-secondary mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field input-glow w-full px-4 py-3 rounded-lg text-base"
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-secondary mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field input-glow w-full px-4 py-3 rounded-lg text-base"
                placeholder={
                  mode === "register" ? "At least 6 characters" : "Your password"
                }
                required
                minLength={6}
                autoComplete={
                  mode === "login" ? "current-password" : "new-password"
                }
              />
            </div>

            {error && (
              <div className="text-sm px-3 py-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary font-medium px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
            >
              {submitting
                ? "Please wait..."
                : mode === "login"
                  ? "Sign In"
                  : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted">
            {mode === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
            <button
              type="button"
              onClick={switchMode}
              className="text-primary hover:underline font-medium"
            >
              {mode === "login" ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
