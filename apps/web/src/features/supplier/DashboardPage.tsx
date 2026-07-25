import * as React from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { CatalogStockSection } from "./CatalogStockSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
// import { ActiveOffersSection } from "./ActiveOffersSection";
import { useSupplierAuth } from "./useSupplierAuth";
import {
  useCatalogItems,
  useOpportunities,
  //  useActiveOffers,
} from "./useFirestoreData";

export function SupplierDashboard() {
  const {
    organizationId,
    loading: authLoading,
    error: authError,
  } = useSupplierAuth();

  const {
    items: catalogItems,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalogItems(organizationId);

  const {
    opportunities,
    loading: opportunitiesLoading,
    error: opportunitiesError,
  } = useOpportunities();

  // Disabled the offers section due to incompatibility with the intent of the page.
  //   const {
  //     offers: activeOffers,
  //     loading: offersLoading,
  //     error: offersError,
  //   } = useActiveOffers(organizationId);

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-foreground-muted">Signing in...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-danger">Failed to initialize: {authError.message}</p>
      </div>
    );
  }

  if (!organizationId) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-danger">No organization found</p>
      </div>
    );
  }

  return (
    <AppLayout
      title="Supplier Dashboard"
      description="View catalog, incoming opportunities, and active offers"
      portalAccent="supplier"
    >
      <div className="space-y-6">
        <OpportunitiesSection
          opportunities={opportunities}
          isLoading={opportunitiesLoading}
          error={opportunitiesError}
        />

        <CatalogStockSection
          items={catalogItems}
          isLoading={catalogLoading}
          error={catalogError}
        />

        {/* Disabled the offers section due to incompatibility with the intent of the page. */}
        {/* <ActiveOffersSection */}
        {/*   offers={activeOffers} */}
        {/*   isLoading={offersLoading} */}
        {/*   error={offersError} */}
        {/* /> */}
      </div>
    </AppLayout>
  );
}

export default SupplierDashboard;
