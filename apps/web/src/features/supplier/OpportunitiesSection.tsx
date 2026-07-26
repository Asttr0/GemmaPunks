import * as React from "react";
import { ShoppingBag, Users, AlertTriangle, Calendar } from "lucide-react";
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
import { Timestamp } from "firebase/firestore";
import type { Opportunity } from "./mocks/fixtures";

interface OpportunitiesSectionProps {
  opportunities?: Opportunity[];
  isLoading?: boolean;
  error?: Error | null;
}

export function OpportunitiesSection({
  opportunities,
  isLoading = false,
  error = null,
}: OpportunitiesSectionProps) {
  if (isLoading) {
    return (
      <Card className="border-brand-200">
        <CardHeader>
          <CardTitle>Incoming Opportunities</CardTitle>
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
      <Card className="border-brand-200">
        <CardHeader>
          <CardTitle>Incoming Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 rounded-lg border border-danger-subtle bg-danger-subtle p-4">
            <AlertTriangle className="size-5 text-danger" />
            <div>
              <p className="font-medium text-danger">
                Failed to load opportunities
              </p>
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

  if (!opportunities || opportunities.length === 0) {
    return (
      <Card className="border-brand-200">
        <CardHeader>
          <CardTitle>Incoming Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="size-12 text-foreground-muted mb-4" />
            <p className="text-base font-medium text-foreground">
              No opportunities yet
            </p>
            <p className="text-sm text-foreground-muted mt-1">
              Demand will appear here when merchants express interest in your
              products
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-brand-200">
      <CardHeader>
        <CardTitle>Incoming Opportunities</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Merchants</TableHead>
              <TableHead>Deadline</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => {
              const deadlineDate =
                opp.needed_by instanceof Timestamp
                  ? opp.needed_by.toDate()
                  : new Date(opp.needed_by as unknown as string | number);

              return (
                <TableRow key={opp.opportunity_id}>
                  <TableCell className="font-medium">
                    {opp.product_id}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {opp.total_quantity.toLocaleString()} {opp.unit}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="size-4 text-foreground-muted" />
                      {opp.merchant_count}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="size-4 text-foreground-muted" />
                      {deadlineDate.toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={opp.status === "ACTIVE" ? "success" : "warning"}
                    >
                      {opp.status === "ACTIVE" ? "Ready to quote" : opp.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline">
                      Create offer
                    </Button>
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
