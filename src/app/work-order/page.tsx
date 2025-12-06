
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoomSheetData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDialog } from '@/components/work-order-dialog';

export default function WorkOrderPage() {
  const [allData, setAllData] = useState<LoomSheetData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isWorkOrderDialogVisible, setIsWorkOrderDialogVisible] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/loom-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      const typedData = data.map((d: any) => ({
        ...d,
        productionDate: new Date(d.productionDate),
      }));
      setAllData(typedData);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load data.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const onSetSelectedRowIds = useCallback((ids: string[]) => {
    setSelectedRowIds(ids);
  }, []);

  const handleWorkOrderSubmit = (data: any) => {
    console.log('Work Order Data:', data);
    // Logic to update rolls will be added here
    toast({
      title: 'Work in Progress',
      description: 'Work order submitted. Logic will be updated soon.',
    });
    setIsWorkOrderDialogVisible(false);
  };
  
  const workOrderData = allData.filter((d: LoomSheetData) => d.status === 'For Work Order');
  const selectedRolls = allData.filter(d => selectedRowIds.includes(d.id!));

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
    <>
      <WorkOrderDialog
        isOpen={isWorkOrderDialogVisible}
        onClose={() => setIsWorkOrderDialogVisible(false)}
        workOrderRolls={workOrderData}
        selectedRolls={selectedRolls}
        onSubmit={handleWorkOrderSubmit}
      />
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
          <CardHeader className='flex flex-row justify-between items-center'>
            <div>
              <CardTitle>Rolls for Work Order</CardTitle>
              <CardDescription>
                These rolls are ready for processing as part of a work order.
              </CardDescription>
            </div>
             <Button onClick={() => setIsWorkOrderDialogVisible(true)} disabled={selectedRowIds.length === 0}>
                Working
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={workOrderData} 
              onSelectedRowIdsChange={onSetSelectedRowIds} 
              selectedRowIds={selectedRowIds}
              showCheckboxes={true}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}

