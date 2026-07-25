import React, { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, firestore } from "../../lib/firebase";

export interface UserAuthContext {
  user: User | null;
  idToken: str | null;
  organizationId: str;
  role: "OWNER" | "MEMBER" | "ADMIN";
  orgType: "MERCHANT" | "SUPPLIER";
  loading: boolean;
  signIn: (email: str, password: str) => Promise<void>;
  signUp: (
    email: str,
    password: str,
    displayName: str,
    organizationName: str,
    organizationType: "MERCHANT" | "SUPPLIER"
  ) => Promise<void>;
  signOut: () => Promise<void>;
  demoSignIn: (role: "merchant" | "supplier") => Promise<void>;
}

const AuthContext = createContext<UserAuthContext | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<str | null>(null);
  const [organizationId, setOrganizationId] = useState<str>("merchant-berrechid");
  const [role, setRole] = useState<"OWNER" | "MEMBER" | "ADMIN">("OWNER");
  const [orgType, setOrgType] = useState<"MERCHANT" | "SUPPLIER">("MERCHANT");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const tokenResult = await currentUser.getIdTokenResult(true);
          setIdToken(tokenResult.token);

          // Extract organizationId and role from custom claims or Firestore profile
          const claimOrg = tokenResult.claims.organization_id as str | undefined;
          const claimRole = (tokenResult.claims.role as str | undefined)?.toUpperCase() as
            | "OWNER"
            | "MEMBER"
            | "ADMIN"
            | undefined;

          if (claimOrg) {
            setOrganizationId(claimOrg);
          } else {
            // Read Firestore profile
            const profileSnap = await getDoc(doc(firestore, "profiles", currentUser.uid));
            if (profileSnap.exists()) {
              const data = profileSnap.data();
              if (data.primary_organization_id) {
                setOrganizationId(data.primary_organization_id);
              }
            } else {
              setOrganizationId("merchant-berrechid");
            }
          }

          if (claimRole) {
            setRole(claimRole);
          }

          // Check if supplier org
          if (claimOrg?.startsWith("supplier-") || currentUser.email?.includes("supplier")) {
            setOrgType("SUPPLIER");
          } else {
            setOrgType("MERCHANT");
          }
        } catch (err) {
          console.warn("Failed to fetch ID token result:", err);
          setIdToken(null);
        }
      } else {
        setIdToken(null);
        setOrganizationId("merchant-berrechid");
        setRole("OWNER");
        setOrgType("MERCHANT");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: str, password: str) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: str,
    password: str,
    displayName: str,
    organizationName: str,
    organizationType: "MERCHANT" | "SUPPLIER"
  ) => {
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const newUser = userCred.user;

      await updateProfile(newUser, { displayName });

      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const newOrgId = `${organizationType.toLowerCase()}-${slug || "org"}`;

      // Store Profile
      await setDoc(doc(firestore, "profiles", newUser.uid), {
        display_name: displayName,
        email: email,
        primary_organization_id: newOrgId,
        locale: "en-MA",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Store Organization
      await setDoc(doc(firestore, "organizations", newOrgId), {
        name: organizationName,
        type: organizationType,
        status: "ACTIVE",
        city: "Berrechid",
        coarse_area: "Berrechid Center",
        currency: "MAD",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      // Store Membership
      await setDoc(doc(firestore, "organizations", newOrgId, "memberships", newUser.uid), {
        user_id: newUser.uid,
        organization_id: newOrgId,
        role: "OWNER",
        status: "ACTIVE",
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      });

      setOrganizationId(newOrgId);
      setOrgType(organizationType);
      setRole("OWNER");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await firebaseSignOut(firebaseAuth);
    } finally {
      setLoading(false);
    }
  };

  const demoSignIn = async (targetRole: "merchant" | "supplier") => {
    if (targetRole === "merchant") {
      await signIn("merchant.demo@example.com", "DemoMerchant123!");
    } else {
      await signIn("supplier.demo@example.com", "DemoSupplier123!");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        idToken,
        organizationId,
        role,
        orgType,
        loading,
        signIn,
        signUp,
        signOut,
        demoSignIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): UserAuthContext => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
