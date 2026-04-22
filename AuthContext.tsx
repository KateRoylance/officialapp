import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { Platform } from "react-native";
import { getApiUrl, apiRequest } from "@/lib/query-client";

type UserRole = "admin" | "client" | "support";

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  privacyAcceptedAt: string | null;
  clientId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  needsPrivacyConsent: boolean;
  rememberMe: boolean;
  hasBiometrics: boolean;
  biometricType: string | null;
  login: (email: string, password: string, remember: boolean) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  logout: () => Promise<void>;
  setRememberMe: (value: boolean) => void;
  acceptPrivacy: () => Promise<boolean>;
}

const ADMIN_EMAIL = "kate@blossomandbloommarketing.com";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: "blossom_user",
  REMEMBER_ME: "blossom_remember_me",
  BIOMETRIC_ENABLED: "blossom_biometric_enabled",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [rememberMe, setRememberMeState] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometrics();
    loadStoredUser();
  }, []);

  const checkBiometrics = async () => {
    if (Platform.OS === "web") {
      setHasBiometrics(false);
      return;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setHasBiometrics(hasHardware && isEnrolled);

      if (hasHardware && isEnrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType("Face ID");
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType("Touch ID");
        } else {
          setBiometricType("Biometrics");
        }
      }
    } catch (error) {
      console.log("Biometrics check failed:", error);
      setHasBiometrics(false);
    }
  };

  const loadStoredUser = async () => {
    try {
      if (Platform.OS === "web") {
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
        const storedRemember = localStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
        
        if (storedRemember === "true" && storedUser) {
          setUser(JSON.parse(storedUser));
          setRememberMeState(true);
        }
      } else {
        const storedRemember = await SecureStore.getItemAsync(STORAGE_KEYS.REMEMBER_ME);
        const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
        
        if (storedRemember === "true" && storedUser) {
          setUser(JSON.parse(storedUser));
          setRememberMeState(true);
        }
      }
    } catch (error) {
      console.log("Failed to load stored user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData: User, remember: boolean) => {
    try {
      if (Platform.OS === "web") {
        if (remember) {
          localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "true");
        } else {
          localStorage.removeItem(STORAGE_KEYS.USER);
          localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
        }
      } else {
        if (remember) {
          await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(userData));
          await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, "true");
          await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, "true");
        } else {
          await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
          await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, "false");
        }
      }
    } catch (error) {
      console.log("Failed to save user:", error);
    }
  };

  const login = async (email: string, password: string, remember: boolean): Promise<boolean> => {
    try {
      const isAdminUser = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      if (isAdminUser) {
        const adminUser: User = {
          id: "admin-1",
          email: email,
          name: "Kate",
          role: "admin",
          privacyAcceptedAt: new Date().toISOString(),
        };
        setUser(adminUser);
        setRememberMeState(remember);
        await saveUser(adminUser, remember);
        return true;
      }
      
      // Call API for client login
      const response = await fetch(new URL("/api/clients/login", getApiUrl()).toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      const isSupportUser = data.role === "support";
      const clientUser: User = {
        id: isSupportUser ? data.clientId : data.id,
        email: data.email,
        name: isSupportUser ? (data.name || email.split("@")[0]) : (data.businessName || email.split("@")[0]),
        role: isSupportUser ? "support" : "client",
        privacyAcceptedAt: isSupportUser ? new Date().toISOString() : data.privacyAcceptedAt,
        clientId: isSupportUser ? data.clientId : undefined,
      };
      
      setUser(clientUser);
      setRememberMeState(remember);
      await saveUser(clientUser, remember);
      return true;
    } catch (error) {
      console.log("Login failed:", error);
      return false;
    }
  };

  const loginWithBiometrics = async (): Promise<boolean> => {
    if (Platform.OS === "web") {
      return false;
    }
    
    try {
      const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);
      const biometricEnabled = await SecureStore.getItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED);
      
      if (!storedUser || biometricEnabled !== "true") {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Blossom & Bloom",
        fallbackLabel: "Use password",
        disableDeviceFallback: false,
      });

      if (result.success) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setRememberMeState(true);
        return true;
      }
      return false;
    } catch (error) {
      console.log("Biometric login failed:", error);
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    try {
      if (Platform.OS === "web") {
        localStorage.removeItem(STORAGE_KEYS.USER);
        localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, "false");
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);
        await SecureStore.setItemAsync(STORAGE_KEYS.REMEMBER_ME, "false");
        await SecureStore.setItemAsync(STORAGE_KEYS.BIOMETRIC_ENABLED, "false");
      }
    } catch (error) {
      console.log("Logout cleanup failed:", error);
    }
  };

  const setRememberMe = (value: boolean) => {
    setRememberMeState(value);
  };

  const acceptPrivacy = async (): Promise<boolean> => {
    if (!user) return false;
    
    try {
      const response = await fetch(
        new URL(`/api/clients/${user.id}/accept-privacy`, getApiUrl()).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }
      );
      
      if (!response.ok) {
        return false;
      }
      
      const data = await response.json();
      const updatedUser = { ...user, privacyAcceptedAt: data.privacyAcceptedAt };
      setUser(updatedUser);
      await saveUser(updatedUser, rememberMe);
      return true;
    } catch (error) {
      console.log("Accept privacy failed:", error);
      return false;
    }
  };

  const needsPrivacyConsent = !!user && user.role === "client" && !user.privacyAcceptedAt;
  const isSupport = user?.role === "support";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        isSupport: !!isSupport,
        needsPrivacyConsent,
        rememberMe,
        hasBiometrics,
        biometricType,
        login,
        loginWithBiometrics,
        logout,
        setRememberMe,
        acceptPrivacy,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
