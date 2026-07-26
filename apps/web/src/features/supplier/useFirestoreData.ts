import { useEffect, useState } from "react";
import {
  collection,
  collectionGroup,
  query,
  where,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { firestore } from "@/lib/firebase";
import type { CatalogItem, Opportunity, ActiveOffer } from "./mocks/fixtures";

function useCollection<T>(collectionPath: string | null): {
  data: T[];
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!collectionPath) {
      setLoading(false);
      return;
    }

    const q = query(collection(firestore, collectionPath));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionPath]);

  return { data, loading, error };
}

function useCollectionGroup<T>(
  collectionName: string,
  whereField: string,
  whereValue: string | null,
): { data: T[]; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!whereValue) {
      setLoading(false);
      return;
    }

    const q = query(
      collectionGroup(firestore, collectionName),
      where(whereField, "==", whereValue),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as T[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [collectionName, whereField, whereValue]);

  return { data, loading, error };
}

export function useCatalogItems(organizationId: string | null): {
  items: CatalogItem[];
  loading: boolean;
  error: Error | null;
} {
  const path = organizationId
    ? `organizations/${organizationId}/supplier_catalog_items`
    : null;
  const result = useCollection<CatalogItem>(path);
  return { items: result.data, loading: result.loading, error: result.error };
}

export function useCatalog(organizationId: string | null): {
  items: CatalogItem[];
  loading: boolean;
  error: Error | null;
} {
  const path = organizationId
    ? `organizations/${organizationId}/supplier_catalog_items`
    : null;
  const result = useCollection<CatalogItem>(path);
  return { items: result.data, loading: result.loading, error: result.error };
}

export function useOpportunities(): {
  opportunities: Opportunity[];
  loading: boolean;
  error: Error | null;
} {
  const result = useCollection<Opportunity>("supplier_opportunities");
  return {
    opportunities: result.data,
    loading: result.loading,
    error: result.error,
  };
}

export function useActiveOffers(organizationId: string | null): {
  offers: ActiveOffer[];
  loading: boolean;
  error: Error | null;
} {
  const result = useCollectionGroup<ActiveOffer>(
    "offers",
    "supplier_organization_id",
    organizationId,
  );

  return {
    offers: result.data,
    loading: result.loading,
    error: result.error,
  };
}

export interface Product {
  product_id: string;
  canonical_name: string;
  category: string;
  base_unit: string;
  aliases: string[];
  active: boolean;
}

export function useProducts(): {
  products: Product[];
  loading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(firestore, "products"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map((doc) => ({
          ...doc.data(),
        })) as Product[];
        setData(items);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  return { products: data, loading, error };
}
