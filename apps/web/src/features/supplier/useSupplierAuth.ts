import { useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";

const DEMO_SUPPLIER_EMAIL = "supplier.demo@example.com";
const DEMO_SUPPLIER_PASSWORD = "DemoSupplier123!";

interface AuthResult {
  user: User | null;
  organizationId: string | null;
  loading: boolean;
  error: Error | null;
}

export function useSupplierAuth(): AuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const signInDemoSupplier = async () => {
      try {
        const userCredential = await signInWithEmailAndPassword(
          firebaseAuth,
          DEMO_SUPPLIER_EMAIL,
          DEMO_SUPPLIER_PASSWORD
        );
        
        const tokenResult = await userCredential.user.getIdTokenResult();
        const orgId = tokenResult.claims.organization_id as string | undefined;
        
        setUser(userCredential.user);
        setOrganizationId(orgId ?? null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to sign in"));
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) {
        signInDemoSupplier();
      } else {
        firebaseUser.getIdTokenResult().then((tokenResult) => {
          const orgId = tokenResult.claims.organization_id as string | undefined;
          setUser(firebaseUser);
          setOrganizationId(orgId ?? null);
          setLoading(false);
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return { user, organizationId, loading, error };
}