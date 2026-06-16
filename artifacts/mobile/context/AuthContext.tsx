import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AuthContextValue {
  isAuthenticated: boolean;
  hasSeenOnboarding: boolean;
  isLoading: boolean;
  userEmail: string;
  userName: string;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [authStr, onboardingStr, email, name] = await Promise.all([
          AsyncStorage.getItem("pv_authenticated"),
          AsyncStorage.getItem("pv_onboarding_complete"),
          AsyncStorage.getItem("pv_user_email"),
          AsyncStorage.getItem("pv_user_name"),
        ]);
        setIsAuthenticated(authStr === "true");
        setHasSeenOnboarding(onboardingStr === "true");
        setUserEmail(email ?? "");
        setUserName(name ?? "");
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const signIn = async (email: string, _password: string) => {
    const name = email.split("@")[0] ?? email;
    await Promise.all([
      AsyncStorage.setItem("pv_authenticated", "true"),
      AsyncStorage.setItem("pv_user_email", email),
      AsyncStorage.setItem("pv_user_name", name),
    ]);
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserName(name);
  };

  const signUp = async (email: string, _password: string, name: string) => {
    const displayName = name || email.split("@")[0] || email;
    await Promise.all([
      AsyncStorage.setItem("pv_authenticated", "true"),
      AsyncStorage.setItem("pv_user_email", email),
      AsyncStorage.setItem("pv_user_name", displayName),
    ]);
    setIsAuthenticated(true);
    setUserEmail(email);
    setUserName(displayName);
  };

  const signOut = async () => {
    await AsyncStorage.removeItem("pv_authenticated");
    setIsAuthenticated(false);
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem("pv_onboarding_complete", "true");
    setHasSeenOnboarding(true);
  };

  const value = useMemo(
    () => ({
      isAuthenticated,
      hasSeenOnboarding,
      isLoading,
      userEmail,
      userName,
      signIn,
      signUp,
      signOut,
      completeOnboarding,
    }),
    [isAuthenticated, hasSeenOnboarding, isLoading, userEmail, userName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
