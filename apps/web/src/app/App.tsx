import { Routes, Route, Navigate } from "react-router-dom";
import { CatalogPage, SupplierDashboard } from "@/features/supplier";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/supplier" replace />} />
      <Route path="/supplier" element={<SupplierDashboard />} />
      <Route path="/catalog" element={<CatalogPage />} />
    </Routes>
  );
}
