'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default function WorkOrderPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Work Order</CardTitle>
          <CardDescription>
            This section is under construction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Functionality for the Work Order page will be implemented here in the future.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
