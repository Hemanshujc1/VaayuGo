/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // We declare logout early so useEffect can use it if the token is completely expired on load
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // Basic check if token is expired
        if (decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setUser({ ...decoded, token });
        }
      } catch (error) {
        console.error("Invalid token", error);
        logout();
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem("token", token);
      setUser({ ...userData, token });
      toast.success("Login Successful!");

      // Navigate based on role
      if (userData.role === "admin") navigate("/admin/dashboard");
      else if (userData.role === "shopkeeper") navigate("/shop/dashboard");
      else navigate("/");

      return { success: true };
    } catch (error) {
      toast.error(error.response?.data?.message || "Login Failed");
      return {
        success: false,
        message: error.response?.data?.message || "Login Failed",
      };
    }
  };

  const register = async (userData) => {
    try {
      await api.post("/auth/register", userData);
      toast.success("Registration Successful! Please Login.");
      navigate("/login");
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration Failed");
      return false;
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
