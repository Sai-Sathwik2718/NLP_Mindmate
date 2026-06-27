import React from "react";
import { Routes, Route, Navigate, Link, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "./context/AppContext";
import { Brain, LayoutDashboard, MessageSquare, Shield, LogOut, Sun, Moon, User as UserIcon } from "lucide-react";

// Lazy-loaded or direct imported pages (directly importing keeps the code execution straightforward)
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import ChatPage from "./pages/ChatPage";
import AdminPanel from "./pages/AdminPanel";
import { LoginPage, RegisterPage, ForgotPasswordPage } from "./pages/AuthPages";

// Private Route wrapper
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, loading } = useApp();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 bg-slate-50">
        <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

// Admin Route wrapper
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, token, loading } = useApp();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 bg-slate-50">
        <span className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!token) return <Navigate to="/login" replace />;
  return user?.role === "admin" ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  const { user, token, logout, darkMode, toggleDarkMode } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // Hide nav bar on Landing Page, Login, Register, Forgot Password
  const isAuthOrLandingPage = ["/", "/login", "/register", "/forgot-password"].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col dark:bg-slate-950 bg-slate-50 dark:text-slate-100 text-slate-800 transition-colors duration-300">
      
      {/* Navigation Header */}
      {!isAuthOrLandingPage && token && (
        <header className="sticky top-0 z-40 w-full glass-card border-b dark:border-slate-800/80 border-slate-200/50 shadow-md dark:bg-slate-900/60 bg-white/70 backdrop-blur-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-2.5">
              <div className="w-9.5 h-9.5 rounded-xl bg-gradient-to-tr from-brand-500 via-indigo-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
                <Brain className="w-5.5 h-5.5 animate-bounce-subtle" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base leading-tight bg-gradient-to-r from-brand-500 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
                  MindMate AI
                </span>
                <span className="text-[9px] font-bold tracking-wider text-slate-400 dark:text-slate-400 uppercase">
                  BVRIT Narsapur
                </span>
              </div>
            </Link>

            {/* Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === "/dashboard" ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
              <Link 
                to="/chat" 
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  location.pathname === "/chat" ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                AI Support Chat
              </Link>
              {user?.role === "admin" && (
                <Link 
                  to="/admin" 
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    location.pathname === "/admin" ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                  }`}
                >
                  <Shield className="w-4 h-4" />
                  Admin Panel
                </Link>
              )}
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              {/* Dark/Light Switch */}
              <button 
                onClick={toggleDarkMode}
                className="p-2 rounded-xl dark:bg-slate-800/40 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800/80 text-slate-400 dark:text-slate-300 border dark:border-slate-800 border-slate-200 transition-colors"
                title="Toggle Dark Mode"
              >
                {darkMode ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-indigo-500" />}
              </button>

              {/* Profile Card */}
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3">
                <div className="hidden lg:block text-right">
                  <div className="text-xs font-semibold dark:text-slate-200 text-slate-700 capitalize">{user?.username}</div>
                  <div className="text-[10px] text-slate-500 capitalize">{user?.role} Portal</div>
                </div>
                <div className="w-8 h-8 rounded-full dark:bg-slate-800 bg-slate-200 flex items-center justify-center dark:text-indigo-400 text-indigo-600 font-semibold border dark:border-slate-700 border-slate-300 uppercase">
                  {user?.username ? user.username.charAt(0) : <UserIcon className="w-4 h-4" />}
                </div>
              </div>

              {/* Logout Button */}
              <button 
                onClick={handleLogout}
                className="p-2 rounded-xl dark:bg-slate-800/40 bg-slate-100 hover:bg-rose-500/10 hover:text-rose-500 dark:text-slate-400 text-slate-500 border dark:border-slate-800 border-slate-200 transition-all duration-300"
                title="Logout"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>

          </div>
        </header>
      )}

      {/* Pages Container */}
      <main className="flex-1 flex flex-col">
        <Routes>
          {/* Public Views */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Protected Views */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/chat" element={
            <PrivateRoute>
              <ChatPage />
            </PrivateRoute>
          } />
          <Route path="/admin" element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          } />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

    </div>
  );
}

export default App;
