import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "github";
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    chrome.storage.local.get(["user", "authToken"], (result) => {
      if (result.user && result.authToken) {
        setUser(result.user);
        setToken(result.authToken);
      }
      setIsLoading(false);
    });

    // Listen for messages from login window
    const handleMessage = (event: MessageEvent) => {
      console.log("Extension received message:", event);
      console.log("Message origin:", event.origin);
      console.log("Expected origin: https://zyven.online");

      if (event.origin !== "https://zyven.online") {
        console.log("Origin mismatch, ignoring message");
        return;
      }

      if (event.data.type === "AUTH_SUCCESS") {
        console.log("Received AUTH_SUCCESS message:", event.data);
        const { user: userData, token: authToken } = event.data;

        // Store user and token
        chrome.storage.local.set(
          {
            user: userData,
            authToken: authToken,
          },
          () => {
            setUser(userData);
            setToken(authToken);
          }
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  const login = async () => {
    setIsLoading(true);

    try {
      // Open login window
      const loginWindow = window.open(
        "https://zyven.online/login",
        "ZyvenLogin",
        "width=500,height=700,scrollbars=yes,resizable=yes"
      );

      if (!loginWindow) {
        throw new Error("Failed to open login window");
      }

      // Monitor the login window
      const checkClosed = setInterval(() => {
        if (loginWindow.closed) {
          clearInterval(checkClosed);
          setIsLoading(false);
        }
      }, 1000);
    } catch (error) {
      console.error("Login failed:", error);
      setIsLoading(false);
    }
  };

  const logout = () => {
    chrome.storage.local.remove(["user", "authToken"], () => {
      setUser(null);
      setToken(null);
    });
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
