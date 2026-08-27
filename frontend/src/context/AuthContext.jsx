import React, { createContext, useState, useEffect, useContext } from "react";
import { login as loginApi, getMe as getMeApi } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  // Validate token and fetch user details on load/refresh
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          const data = await getMeApi();
          if (data.success && data.user) {
            setUser(data.user);
            localStorage.setItem("user", JSON.stringify(data.user));
          } else {
            // Token invalid or user not found
            logout();
          }
        } catch (error) {
          console.error("Failed to authenticate with token:", error);
          // If network is down, we might want to keep the cached user rather than logging out immediately,
          // but if it is a 401/403, axios interceptor will handle logging out.
          // For now, let's try loading the cached user from local storage as fallback
          const cachedUser = localStorage.getItem("user");
          if (cachedUser) {
            try {
              setUser(JSON.parse(cachedUser));
            } catch (e) {
              logout();
            }
          } else {
            logout();
          }
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    initializeAuth();
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginApi(email, password);
      if (data.success && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message || "Login failed" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Invalid email or password",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        login,
        logout,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
