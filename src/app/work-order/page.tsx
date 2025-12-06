
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LoomSheetData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';

export default function WorkOrderPage() {
  const [workOrderData, setWorkOrderData] = useState<LoomSheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/loom-data');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const allData = await response.json();
        const workOrderItems = allData.filter((d: LoomSheetData) => d.status === 'For Work Order');
        
        const typedData = workOrderItems.map((d: any) => ({
          ...d,
          productionDate: new Date(d.productionDate),
        }));
        
        setWorkOrderData(typedData);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Error fetching data',
          description: 'Could not load work order data.',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-primary">Loading Work Orders...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Please wait while we fetch the data.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
          Work Order
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Rolls that have been designated for work orders are listed here.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Rolls for Work Order</CardTitle>
          <CardDescription>
            These rolls are ready for processing as part of a work order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable data={workOrderData} onSelectedRowIdsChange={() => {}} selectedRowIds={[]} />
        </CardContent>
      </Card>
    </div>
  );
}
