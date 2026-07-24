import * as React from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { CatalogStockSection } from "./CatalogStockSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { ActiveOffersSection } from "./ActiveOffersSection";
import { mockDashboardData } from "./mocks/fixtures";

export function SupplierDashboard() {
  const [data] = React.useState({
    catalog: mockDashboardData.catalog,
    opportunities: mockDashboardData.opportunities,
    activeOffers: mockDashboardData.activeOffers,
  });

  const [loadingStates] = React.useState({
    catalog: false,
    opportunities: false,
    activeOffers: false,
  });

  const [errors] = React.useState({
    catalog: null,
    opportunities: null,
    activeOffers: null,
  });

  return (
    <AppLayout
      title="Supplier Dashboard"
      description="View catalog, incoming opportunities, and active offers"
      portalAccent="supplier"
    >
      <div className="space-y-6">
        <OpportunitiesSection
          opportunities={data.opportunities}
          isLoading={loadingStates.opportunities}
          error={errors.opportunities}
        />

        <CatalogStockSection
          items={data.catalog}
          isLoading={loadingStates.catalog}
          error={errors.catalog}
        />

        <ActiveOffersSection
          offers={data.activeOffers}
          isLoading={loadingStates.activeOffers}
          error={errors.activeOffers}
        />
      </div>
    </AppLayout>
  );
}

export default SupplierDashboard;