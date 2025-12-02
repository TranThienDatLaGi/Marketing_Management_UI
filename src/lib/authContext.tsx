import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import Cookies from "js-cookie";
import { LOGIN } from "../config/API";

interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ status: boolean; message: string }>;
  logout: () => void;
  updateProfile: (user: User) => void;
  getCurrentUser: () => User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // ⭐ thêm loading
  // console.log("AuthContext user:", user);

  // ⭐ Load user từ Cookie khi App load
  useEffect(() => {
    const userStr = Cookies.get("user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
      } catch {
        Cookies.remove("user");
      }
    }
    setLoading(false);
  }, []);

  const login = async (
    email: string,
    password: string
  ): Promise<{ status: boolean; message: string }> => {
    try {
      const response = await fetch(LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // ⭐ Lưu token vào cookie
        Cookies.set("accessToken", data.access_token, {
          expires: 1,
          secure: true,
          sameSite: "Strict",
        });

        // ⭐ Lưu user vào cookie
        Cookies.set("user", JSON.stringify(data.user), {
          expires: 1,
          secure: true,
          sameSite: "Strict",
        });

        // ⭐ Quan trọng: cập nhật state user của React
        setUser(data.user);

        return { status: true, message: "Đăng nhập thành công" };
      }

      return {
        status: false,
        message: data.message || "Đăng nhập thất bại",
      };
    } catch (err) {
      console.error("Login error:", err);
      return { status: false, message: "Lỗi kết nối đến máy chủ" };
    }
  };

  const logout = () => {
    setUser(null);
    Cookies.remove("accessToken");
    Cookies.remove("user");
  };

  const updateProfile = (updatedUser: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev; // không có user thì không update

      const merged = { ...prev, ...updatedUser };

      Cookies.set("user", JSON.stringify(merged), {
        expires: 1,
        secure: true,
        sameSite: "Strict",
      });

      return merged;
    });
  };


  const getCurrentUser = (): User | null => {
    const data = Cookies.get("user");
    if (!data) return null;

    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, updateProfile, getCurrentUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
