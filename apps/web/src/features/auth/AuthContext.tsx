import React, { useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import type { IdTokenResult, User } from "firebase/auth";
import { getAuthSession, registerBusiness } from "../../lib/api";
import type { AuthResponse } from "../../lib/api";
import { firebaseAuth } from "../../lib/firebase";
import { AuthContext } from "./auth-context";

type Role = "OWNER" | "MEMBER" | "ADMIN";
type OrganizationType = "MERCHANT" | "SUPPLIER";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string>("");
  const [role, setRole] = useState<Role>("OWNER");
  const [orgType, setOrgType] = useState<OrganizationType>("MERCHANT");
  const [loading, setLoading] = useState<boolean>(true);

  const applyAuthResponse = (response: AuthResponse, token: string) => {
    setIdToken(token);
    setOrganizationId(response.user.organization_id);
    setRole(response.user.role.toUpperCase() as Role);
    setOrgType(response.organization?.type ?? "MERCHANT");
  };

  const applyTokenClaims = (tokenResult: IdTokenResult) => {
    const claimOrganizationId = tokenResult.claims.organization_id;
    const claimRole = tokenResult.claims.role;

    setIdToken(tokenResult.token);
    setOrganizationId(
      typeof claimOrganizationId === "string" ? claimOrganizationId : "",
    );
    setRole(
      typeof claimRole === "string"
        ? (claimRole.toUpperCase() as Role)
        : "OWNER",
    );
    setOrgType(
      typeof claimOrganizationId === "string" &&
        claimOrganizationId.startsWith("supplier-")
        ? "SUPPLIER"
        : "MERCHANT",
    );
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      firebaseAuth,
      async (currentUser) => {
        setUser(currentUser);
        if (currentUser) {
          try {
            const tokenResult = await currentUser.getIdTokenResult(true);
            try {
              const session = await getAuthSession(tokenResult.token);
              applyAuthResponse(session, tokenResult.token);
            } catch {
              // A newly created Firebase user has no business record until /signup succeeds.
              applyTokenClaims(tokenResult);
            }
          } catch (err) {
            console.warn("Failed to fetch ID token result:", err);
            setIdToken(null);
            setOrganizationId("");
          }
        } else {
          setIdToken(null);
          setOrganizationId("");
          setRole("OWNER");
          setOrgType("MERCHANT");
        }
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    displayName: string,
    organizationName: string,
    organizationType: OrganizationType,
  ) => {
    setLoading(true);
    try {
      const userCred = await createUserWithEmailAndPassword(
        firebaseAuth,
        email,
        password,
      );
      const newUser = userCred.user;

      await updateProfile(newUser, { displayName });

      const registrationToken = await newUser.getIdToken();
      const registration = await registerBusiness(
        {
          email: newUser.email ?? email,
          display_name: displayName,
          organization_name: organizationName,
          organization_type: organizationType,
        },
        registrationToken,
      );

      let authenticatedToken = registrationToken;
      try {
        authenticatedToken = await newUser.getIdToken(true);
      } catch (err) {
        console.warn("Business registered, but token refresh failed:", err);
      }

      setUser(newUser);
      applyAuthResponse(registration, authenticatedToken);
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
