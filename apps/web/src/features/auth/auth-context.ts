import { createContext, useContext } from "react";
import type { User } from "firebase/auth";

export interface UserAuthContext {
  user: User | null;
  idToken: string | null;
  organizationId: string;
  role: "OWNER" | "MEMBER" | "ADMIN";
  orgType: "MERCHANT" | "SUPPLIER";
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    organizationName: string,
    organizationType: "MERCHANT" | "SUPPLIER",
  ) => Promise<void>;
  signOut: () => Promise<void>;
  demoSignIn: (role: "merchant" | "supplier") => Promise<void>;
}

export const AuthContext = createContext<UserAuthContext | undefined>(undefined);

export const useAuth = (): UserAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
