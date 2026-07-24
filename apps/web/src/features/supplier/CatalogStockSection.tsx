import * as React from "react";
import { Package, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { CatalogItem } from "./mocks/fixtures";

interface CatalogStockSectionProps {
  items?: CatalogItem[];
  isLoading?: boolean;
  error?: Error | null;
}

export function CatalogStockSection({ 
  items, 
  isLoading = false, 
  error = null 
}: CatalogStockSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catalog & Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded bg-surface-subtle" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catalog & Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-danger-subtle bg-danger-subtle p-4">
            <AlertTriangle className="size-5 text-danger" />
            <div>
              <p className="font-medium text-danger">Failed to load catalog</p>
              <p className="text-sm text-danger">{error.message}</p>
            </div>
          </div>
          <Button className="mt-4" variant="outline" size="sm">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Catalog & Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="size-12 text-foreground-muted mb-4" />
            <p className="text-base font-medium text-foreground">No catalog items yet</p>
            <p className="text-sm text-foreground-muted mt-1">
              Upload your product catalog to start receiving orders
            </p>
            <Button className="mt-4" size="sm">Upload catalog</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const outOfStockCount = items.filter(i => i.stock === 0).length;
  const lowStockCount = items.filter(i => i.stock > 0 && i.stock < i.minStock).length;
  const hasWarnings = outOfStockCount > 0 || lowStockCount > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Catalog & Stock</CardTitle>
          {hasWarnings && (
            <Badge variant="warning" className="gap-1">
              <AlertTriangle className="size-3" />
              {outOfStockCount > 0 
                ? `${outOfStockCount} out of stock` 
                : `${lowStockCount} low stock`
              }
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isOutOfStock = item.stock === 0;
              const isLowStock = item.stock > 0 && item.stock < item.minStock;
              
              return (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-foreground-muted">{item.sku}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {item.price.toFixed(2)} MAD
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {item.stock.toLocaleString()} {item.unit}
                  </TableCell>
                  <TableCell>
                    {isOutOfStock ? (
                      <Badge variant="danger">Out of stock</Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning">Low stock</Badge>
                    ) : (
                      <Badge variant="success">In stock</Badge>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}