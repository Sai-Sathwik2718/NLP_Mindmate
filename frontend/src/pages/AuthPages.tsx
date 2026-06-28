import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Brain, Lock, User as UserIcon, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";
import { GlassCard } from "../components/GlassCard";

// --- 1. Login Page ---
export const LoginPage: React.FC = () => {
  const { login, api } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // FastAPI OAuth2PasswordRequestForm expects URLSearchParams
      const params = new URLSearchParams();
      params.append("username", username);
      params.append("password", password);

      const response = await api.post("/auth/login", params, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });

      const { access_token, username: returnedUser, role } = response.data;
      await login(access_token, returnedUser, role);
      
      // Route depending on user role
      if (role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (err.response?.status) {
        setError(`Server returned error code ${err.response.status}. Please try again.`);
      } else {
        setError("Network connection failed. Please check your network or server URL and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid dark:bg-slate-950 bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
      
      <div className="w-full max-w-md z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
              MindMate AI
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">Campus Mental Health Support Companion</p>
        </div>

        <GlassCard className="w-full p-8">
          <h2 className="text-xl font-bold mb-6 text-center dark:text-slate-100 text-slate-900">Welcome Back</h2>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username or Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="student"
                  className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 focus:outline-none flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs dark:text-slate-400 text-slate-600">
            Don't have an account?{" "}
            <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
              Create an Account
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};


// --- 2. Register Page ---
export const RegisterPage: React.FC = () => {
  const { api } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post("/auth/register", {
        username: username.trim(),
        email: email.trim(),
        password: password,
      });

      setSuccess("Account created successfully! Redirecting to login page...");
      setUsername("");
      setEmail("");
      setPassword("");
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      console.error(err);
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(", "));
      } else if (typeof detail === "string") {
        setError(detail);
      } else if (err.response?.status) {
        setError(`Server returned error code ${err.response.status}. Please check details.`);
      } else {
        setError("Network connection failed. Please check your network or server URL and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid dark:bg-slate-950 bg-slate-50 flex items-center justify-center p-4">
      <div className="absolute top-1/4 left-1/3 w-72 h-72 rounded-full bg-fuchsia-500/5 blur-[80px] pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
              MindMate AI
            </span>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400">Campus Mental Health Support Companion</p>
        </div>

        <GlassCard className="w-full p-8">
          <h2 className="text-xl font-bold mb-6 text-center dark:text-slate-100 text-slate-900">Create Account</h2>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="student"
                  className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Campus Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (Min. 6 chars)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 focus:outline-none flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Register"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs dark:text-slate-400 text-slate-600">
            Already have an account?{" "}
            <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
              Log In
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};


// --- 3. Forgot Password Page ---
export const ForgotPasswordPage: React.FC = () => {
  const { api } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    try {
      await api.post("/auth/forgot-password", { email });
      setMsg({ type: "success", text: "A simulation password reset request has been logged! Check the backend console." });
      setEmail("");
    } catch (err: any) {
      console.error(err);
      setMsg({ type: "error", text: err.response?.data?.detail || "Email address not found." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen dot-grid dark:bg-slate-950 bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md z-10">
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Brain className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl bg-gradient-to-r from-brand-500 to-indigo-400 bg-clip-text text-transparent">
              MindMate AI
            </span>
          </Link>
        </div>

        <GlassCard className="w-full p-8">
          <h2 className="text-xl font-bold mb-4 text-center dark:text-slate-100 text-slate-900 font-sans">Reset Password</h2>
          <p className="text-xs dark:text-slate-400 text-slate-600 text-center mb-6 leading-relaxed">
            Enter your student email address and we'll simulate sending a reset authorization token.
          </p>

          {msg && (
            <div className={`mb-5 p-3 rounded-xl border text-xs flex items-center gap-2.5 ${
              msg.type === "success" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                : "bg-rose-500/10 border-rose-500/20 text-rose-400"
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Campus Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 rounded-xl dark:bg-slate-950/60 bg-slate-100/50 border border-slate-800/60 dark:border-slate-800 border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/40 dark:text-slate-100 text-slate-900 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-6 rounded-xl bg-gradient-to-r from-brand-500 to-indigo-600 hover:from-brand-600 hover:to-indigo-700 text-white font-semibold text-sm transition-all duration-300 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 focus:outline-none flex items-center justify-center"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                "Send Reset Email"
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs dark:text-slate-400 text-slate-600">
            Remembered your password?{" "}
            <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
              Go to Login
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
