import * as React from "react";
import { FileText, Calendar, AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import type { ActiveOffer } from "./mocks/fixtures";

interface ActiveOffersSectionProps {
  offers?: ActiveOffer[];
  isLoading?: boolean;
  error?: Error | null;
}

export function ActiveOffersSection({
  offers,
  isLoading = false,
  error = null,
}: ActiveOffersSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-12 animate-pulse rounded bg-surface-subtle"
              />
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
          <CardTitle>Active Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-danger-subtle bg-danger-subtle p-4">
            <AlertTriangle className="size-5 text-danger" />
            <div>
              <p className="font-medium text-danger">Failed to load offers</p>
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

  if (!offers || offers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Offers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="size-12 text-foreground-muted mb-4" />
            <p className="text-base font-medium text-foreground">
              No active offers
            </p>
            <p className="text-sm text-foreground-muted mt-1">
              Offers you create will appear here, and merchants can join
              collective orders
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Offers</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Offer Price</TableHead>
              <TableHead>MOQ</TableHead>
              <TableHead>Merchants Joined</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {offers.map((offer) => (
              <TableRow key={offer.id}>
                <TableCell className="font-medium">
                  {offer.productName}
                </TableCell>
                <TableCell className="font-mono tabular-nums">
                  {offer.offerPrice.toFixed(2)} MAD
                </TableCell>
                <TableCell>{offer.moq}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Eye className="size-4 text-foreground-muted" />
                    {offer.totalRaised}/{offer.moq} units
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Calendar className="size-4 text-foreground-muted" />
                    {new Date(offer.expiresAt).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      offer.status === "accepted"
                        ? "success"
                        : offer.status === "expired"
                          ? "danger"
                          : "info"
                    }
                  >
                    {offer.status === "accepted"
                      ? "Accepted"
                      : offer.status === "expired"
                        ? "Expired"
                        : "Active"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="ghost">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
