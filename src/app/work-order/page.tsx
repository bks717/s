
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoomSheetData, WorkOrderData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDialog } from '@/components/work-order-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

export default function WorkOrderPage() {
  const [allData, setAllData] = useState<LoomSheetData[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isWorkOrderDialogVisible, setIsWorkOrderDialogVisible] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rollsResponse, woResponse] = await Promise.all([
        fetch('/api/loom-data'),
        fetch('/api/work-orders'),
      ]);

      if (!rollsResponse.ok) throw new Error('Failed to fetch roll data');
      if (!woResponse.ok) throw new Error('Failed to fetch work order data');
      
      const rollsData = await rollsResponse.json();
      const woData = await woResponse.json();

      const typedRollsData = rollsData.map((d: any) => ({
        ...d,
        productionDate: new Date(d.productionDate),
      }));

      const typedWoData = woData.map((d: any) => ({
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      }));

      setAllData(typedRollsData);
      setWorkOrders(typedWoData);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load required data.',
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

  const handleWorkOrderSubmit = async (formData: Omit<WorkOrderData, 'id' | 'createdAt'>) => {
    const consumedRollIds = formData.childPids.map(child => child.rollId);
    
    // Add serial number to child pids for display purposes
    const childPidsWithRolls = formData.childPids.map(child => {
        const roll = allData.find(r => r.id === child.rollId);
        return { ...child, rollSerialNumber: roll?.serialNumber || 'N/A' };
    });

    const workOrderPayload: WorkOrderData = {
      ...formData,
      id: `wo-${Date.now()}`,
      createdAt: new Date(),
      childPids: childPidsWithRolls,
    };

    try {
      // 1. Save the new work order
      const woResponse = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workOrderPayload),
      });
      if (!woResponse.ok) throw new Error('Failed to save work order.');

      // 2. Mark rolls as consumed
      const updatedData = allData.map(item =>
        consumedRollIds.includes(item.id!)
          ? { ...item, status: 'Consumed' as const, consumedBy: `WO: ${formData.parentPid}` }
          : item
      );

      const rollsResponse = await fetch('/api/loom-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData, null, 2),
      });
      if (!rollsResponse.ok) throw new Error('Failed to update rolls status.');
      
      toast({
        title: 'Work Order Processed',
        description: `Work order ${formData.parentPid} has been created and rolls have been consumed.`,
      });

      // 3. Refresh all data
      await fetchData();
      
    } catch (error) {
      console.error('Work order submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
      });
    } finally {
        setIsWorkOrderDialogVisible(false);
        setSelectedRowIds([]);
    }
  };
  
  const workOrderRolls = allData.filter((d: LoomSheetData) => d.status === 'For Work Order');
  const selectedRolls = workOrderRolls.filter(d => selectedRowIds.includes(d.id!));
  const sortedWorkOrders = workOrders.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());


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
                These rolls are ready for processing. Select rolls to begin.
              </CardDescription>
            </div>
             <Button onClick={() => setIsWorkOrderDialogVisible(true)} disabled={selectedRowIds.length === 0}>
                Working
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable 
              data={workOrderRolls} 
              onSelectedRowIdsChange={onSetSelectedRowIds} 
              selectedRowIds={selectedRowIds}
              showCheckboxes={true}
            />
          </CardContent>
        </Card>

        <Separator />

        <div className="space-y-4">
            <div className="text-center">
                <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
                    In Progress
                </h2>
                <p className="mt-1 text-md text-muted-foreground">
                    A log of all work orders currently in progress.
                </p>
            </div>
            <Card>
                <CardContent className="p-6">
                    {sortedWorkOrders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {sortedWorkOrders.map(wo => (
                                <AccordionItem value={wo.id!} key={wo.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <span className='font-bold text-lg text-primary'>Parent PID: {wo.parentPid}</span>
                                            <span className='text-md text-muted-foreground'>Customer: {wo.customerName}</span>
                                            <span className='text-sm text-muted-foreground'>{new Date(wo.createdAt!).toLocaleDateString()}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Child PID</TableHead>
                                                    <TableHead>Consumed Roll No.</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {wo.childPids.map((child, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell>{child.pid}</TableCell>
                                                        <TableCell>{child.rollSerialNumber}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p className="text-lg">No work orders are currently in progress.</p>
                            <p className="text-sm">Select rolls and click "Working" to create a new one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
