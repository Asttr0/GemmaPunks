import * as React from "react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useSupplierAuth } from "./useSupplierAuth";
import { useCatalog, useProducts } from "./useFirestoreData";
import { apiPost } from "@/lib/api";

const UNIT_OPTIONS = [
  "BOTTLE",
  "BAG",
  "UNIT",
  "BOX",
  "KILOGRAM",
  "LITRE",
] as const;

interface AddItemFormData {
  product_id: string;
  supplier_sku: string;
  unit: string;
  unit_price_centimes: number;
  minimum_quantity: number;
  available_quantity: number;
  delivery_fee_centimes: number;
  delivery_days: number;
  service_areas: string[];
}

function generateCatalogDraft(
  _description: string,
): Promise<Partial<AddItemFormData>> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockDraft: Partial<AddItemFormData> = {
        product_id: "cooking-oil-1l",
        supplier_sku: "SKU-" + Math.floor(Math.random() * 10000),
        unit: "BOTTLE",
        unit_price_centimes: 1850,
        minimum_quantity: 20,
        available_quantity: 100,
        delivery_fee_centimes: 6000,
        delivery_days: 1,
        service_areas: ["Berrechid Centre"],
      };
      resolve(mockDraft);
    }, 500);
  });
}

export function CatalogPage() {
  const { organizationId, loading: authLoading } = useSupplierAuth();
  const {
    items: catalogItems,
    loading: catalogLoading,
    error: catalogError,
  } = useCatalog(organizationId);
  const { products } = useProducts();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [showAIDraft, setShowAIDraft] = React.useState(false);
  const [aiDraftDescription, setAIDraftDescription] = React.useState("");
  const [aiDraft, setAIDraft] = React.useState<Partial<AddItemFormData> | null>(
    null,
  );
  const [isGeneratingDraft, setIsGeneratingDraft] = React.useState(false);

  const [formData, setFormData] = React.useState<AddItemFormData>({
    product_id: "",
    supplier_sku: "",
    unit: "BOTTLE",
    unit_price_centimes: 0,
    minimum_quantity: 1,
    available_quantity: 0,
    delivery_fee_centimes: 0,
    delivery_days: 1,
    service_areas: [],
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const filteredItems = catalogItems.filter(
    (item) =>
      searchQuery === "" ||
      item.product_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.supplier_sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAIGenerate = async () => {
    if (!aiDraftDescription.trim()) return;
    setIsGeneratingDraft(true);
    try {
      const draft = await generateCatalogDraft(aiDraftDescription);
      setAIDraft(draft);
    } catch {
      setSubmitError("Failed to generate draft");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleConfirmDraft = () => {
    if (aiDraft) {
      setFormData((prev) => ({
        ...prev,
        ...aiDraft,
      }));
      setShowAIDraft(false);
      setShowAddForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      await apiPost("/api/v1/supplier/catalogs", formData);
      setShowAddForm(false);
      setFormData({
        product_id: "",
        supplier_sku: "",
        unit: "BOTTLE",
        unit_price_centimes: 0,
        minimum_quantity: 1,
        available_quantity: 0,
        delivery_fee_centimes: 0,
        delivery_days: 1,
        service_areas: [],
      });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const updateFormData = (
    field: keyof AddItemFormData,
    value: string | number | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <p className="text-foreground-muted">Loading...</p>
      </div>
    );
  }

  return (
    <AppLayout
      title="Catalog"
      description="Manage your product catalog"
      portalAccent="supplier"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-foreground-muted" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Dialog open={showAIDraft} onOpenChange={setShowAIDraft}>
              <DialogTrigger asChild>
                <Button variant="ai">Draft with AI</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Draft catalog item with AI</DialogTitle>
                  <DialogDescription>
                    Describe your product and let AI pre-fill the form.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <textarea
                    placeholder="e.g., 'Add cooking oil 1L bottle, wholesale price 18.50 MAD, min order 50 units, delivery in 1 day'"
                    value={aiDraftDescription}
                    onChange={(e) => setAIDraftDescription(e.target.value)}
                    className="w-full min-h-[100px] rounded-lg border border-border bg-surface p-3 text-sm"
                  />
                  {aiDraft && (
                    <div className="rounded-lg border border-ai bg-ai-subtle p-4">
                      <p className="text-sm font-medium text-ai mb-2">
                        Suggested draft:
                      </p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-foreground-muted">
                            Product:
                          </span>{" "}
                          {aiDraft.product_id}
                        </p>
                        <p>
                          <span className="text-foreground-muted">SKU:</span>{" "}
                          {aiDraft.supplier_sku}
                        </p>
                        <p>
                          <span className="text-foreground-muted">Price:</span>{" "}
                          {(aiDraft.unit_price_centimes ?? 0) / 100} MAD
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setShowAIDraft(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="ai"
                    onClick={handleAIGenerate}
                    disabled={!aiDraftDescription.trim() || isGeneratingDraft}
                  >
                    {isGeneratingDraft ? "Generating..." : "Generate draft"}
                  </Button>
                  {aiDraft && (
                    <Button onClick={handleConfirmDraft}>Use draft</Button>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4 mr-2" />
                  Add item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Add catalog item</DialogTitle>
                  <DialogDescription>
                    Add a product to your supplier catalog.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Product
                      </label>
                      <select
                        value={formData.product_id}
                        onChange={(e) =>
                          updateFormData("product_id", e.target.value)
                        }
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        required
                      >
                        <option value="">Select a product...</option>
                        {products.map((p) => (
                          <option key={p.product_id} value={p.product_id}>
                            {p.canonical_name} ({p.base_unit})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        SKU
                      </label>
                      <Input
                        value={formData.supplier_sku}
                        onChange={(e) =>
                          updateFormData("supplier_sku", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Unit
                      </label>
                      <select
                        value={formData.unit}
                        onChange={(e) => updateFormData("unit", e.target.value)}
                        className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
                        required
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Price (MAD)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(formData.unit_price_centimes / 100).toFixed(2)}
                        onChange={(e) =>
                          updateFormData(
                            "unit_price_centimes",
                            Math.round(parseFloat(e.target.value) * 100),
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Available qty
                      </label>
                      <Input
                        type="number"
                        value={formData.available_quantity}
                        onChange={(e) =>
                          updateFormData(
                            "available_quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Min quantity
                      </label>
                      <Input
                        type="number"
                        value={formData.minimum_quantity}
                        onChange={(e) =>
                          updateFormData(
                            "minimum_quantity",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Delivery fee (MAD)
                      </label>
                      <Input
                        type="number"
                        step="0.01"
                        value={(formData.delivery_fee_centimes / 100).toFixed(
                          2,
                        )}
                        onChange={(e) =>
                          updateFormData(
                            "delivery_fee_centimes",
                            Math.round(parseFloat(e.target.value) * 100),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Delivery days
                      </label>
                      <Input
                        type="number"
                        value={formData.delivery_days}
                        onChange={(e) =>
                          updateFormData(
                            "delivery_days",
                            parseInt(e.target.value) || 1,
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-1">
                        Service areas
                      </label>
                      <Input
                        placeholder="Comma-separated areas"
                        value={formData.service_areas.join(", ")}
                        onChange={(e) =>
                          updateFormData(
                            "service_areas",
                            e.target.value.split(",").map((s) => s.trim()),
                          )
                        }
                      />
                    </div>
                  </div>
                  {submitError && (
                    <p className="text-sm text-danger">{submitError}</p>
                  )}
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setShowAddForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Adding..." : "Add to catalog"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Products</CardTitle>
          </CardHeader>
          <CardContent>
            {catalogError ? (
              <div className="flex items-center gap-3 rounded-lg border border-danger-subtle bg-danger-subtle p-4">
                <AlertTriangle className="size-5 text-danger" />
                <div>
                  <p className="font-medium text-danger">
                    Failed to load catalog
                  </p>
                  <p className="text-sm text-danger">{catalogError.message}</p>
                </div>
              </div>
            ) : catalogLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-12 animate-pulse rounded bg-surface-subtle"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-base font-medium text-foreground">
                  {searchQuery
                    ? "No matching products"
                    : "No catalog items yet"}
                </p>
                <p className="text-sm text-foreground-muted mt-1">
                  {searchQuery
                    ? "Try a different search term"
                    : 'Click "Add item" to add your first product to the catalog'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead className="text-right">Min Qty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => {
                    const priceMAD = (item.unit_price_centimes / 100).toFixed(
                      2,
                    );

                    return (
                      <TableRow key={item.catalog_item_id}>
                        <TableCell className="font-medium">
                          {item.product_id}
                        </TableCell>
                        <TableCell className="text-foreground-muted">
                          {item.supplier_sku}
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {priceMAD} MAD
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {item.available_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-mono tabular-nums">
                          {item.minimum_quantity.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "ACTIVE" ? "success" : "secondary"
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

export default CatalogPage;
