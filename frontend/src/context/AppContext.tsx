import React, { createContext, useContext, useState, useEffect } from "react";
import axios, { AxiosInstance } from "axios";

// User structure
interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  is_suspended: boolean;
  created_at: string;
}

// Chat Session structure
export interface ChatSession {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

// Context interface
interface AppContextType {
  user: User | null;
  token: string | null;
  darkMode: boolean;
  activeChatId: number | null;
  chatSessions: ChatSession[];
  loading: boolean;
  api: AxiosInstance;
  toggleDarkMode: () => void;
  login: (token: string, username: string, role: string) => Promise<void>;
  logout: () => void;
  setActiveChatId: (id: number | null) => void;
  refreshSessions: () => Promise<void>;
  setChatSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Preconfigured Axios instance for backend communications
const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api/v1",
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("mm_token"));
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [activeChatId, setActiveChatIdState] = useState<number | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Set active chat and sync to localStorage
  const setActiveChatId = (id: number | null) => {
    setActiveChatIdState(id);
    if (id) {
      localStorage.setItem("mm_active_chat", id.toString());
    } else {
      localStorage.removeItem("mm_active_chat");
    }
  };

  // Configure Axios Request interceptor to append JWT
  useEffect(() => {
    const requestInterceptor = apiInstance.interceptors.request.use(
      (config) => {
        const storedToken = localStorage.getItem("mm_token");
        if (storedToken) {
          config.headers.Authorization = `Bearer ${storedToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      apiInstance.interceptors.request.eject(requestInterceptor);
    };
  }, []);

  // Configure Axios Response interceptor to handle token expiry (401s)
  useEffect(() => {
    const responseInterceptor = apiInstance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, auto logout
          logout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Fetch current user details on boot if token is present
  useEffect(() => {
    const bootstrap = async () => {
      if (token) {
        try {
          const res = await apiInstance.get("/auth/profile");
          setUser(res.data);
          
          // Get sessions
          const chatsRes = await apiInstance.get("/chat/sessions");
          setChatSessions(chatsRes.data);
          
          // Restore active chat if any
          const savedActiveChat = localStorage.getItem("mm_active_chat");
          if (savedActiveChat) {
            const activeId = parseInt(savedActiveChat, 10);
            if (chatsRes.data.some((c: ChatSession) => c.id === activeId)) {
              setActiveChatIdState(activeId);
            }
          }
        } catch (e) {
          console.error("Authentication bootstrap failed:", e);
          logout();
        }
      }
      setLoading(false);
    };

    bootstrap();
  }, [token]);

  // Manage dark mode classes on root html node
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const login = async (newToken: string, _username: string, _role: string) => {
    localStorage.setItem("mm_token", newToken);
    setToken(newToken);
    // Bootstrapped by useEffect above, which fetches user details and chats
  };

  const logout = () => {
    localStorage.removeItem("mm_token");
    localStorage.removeItem("mm_active_chat");
    setToken(null);
    setUser(null);
    setChatSessions([]);
    setActiveChatIdState(null);
  };

  const refreshSessions = async () => {
    if (!token) return;
    try {
      const res = await apiInstance.get("/chat/sessions");
      setChatSessions(res.data);
    } catch (e) {
      console.error("Failed to refresh chat sessions list:", e);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        token,
        darkMode,
        activeChatId,
        chatSessions,
        loading,
        api: apiInstance,
        toggleDarkMode,
        login,
        logout,
        setActiveChatId,
        refreshSessions,
        setChatSessions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
