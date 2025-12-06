
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LoomSheetData, WorkOrderData, ConsumedByData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { useToast } from '@/hooks/use-toast';
import { WorkOrderDialog } from '@/components/work-order-dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { PartialUseDialog } from '@/components/partial-use-dialog';
import { ConsumedByDialog } from '@/components/consumed-by-dialog';
import { SplitSquareHorizontal, CheckSquare } from 'lucide-react';

export default function WorkOrderPage() {
  const [allData, setAllData] = useState<LoomSheetData[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isWorkOrderDialogVisible, setIsWorkOrderDialogVisible] = useState(false);
  const [isConsumedDialogVisible, setIsConsumedDialogVisible] = useState(false);
  const [isPartialUseDialogVisible, setIsPartialUseDialogVisible] = useState(false);
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

  const updateData = async (updatedData: LoomSheetData[]) => {
    try {
      const response = await fetch('/api/loom-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData, null, 2),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      setAllData(updatedData);
      // After updating data, we should refetch to ensure consistency
      await fetchData();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error saving data',
        description: 'Could not save data.',
      });
    }
  };

  const handlePartialConsume = (originalId: string, consumedPartData: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    const originalRoll = allData.find(item => item.id === originalId);
    if (!originalRoll) return;

    const newConsumedRoll: LoomSheetData = {
      ...consumedPartData,
      id: (Date.now() + Math.random()).toString(),
      productionDate: new Date(),
      status: 'Consumed',
    };
    
    const updatedData = allData.map(item => {
      if (item.id === originalId) {
        const remainingMtrs = (item.mtrs || 0) - (consumedPartData.mtrs || 0);
        const remainingGw = (item.gw || 0) - (consumedPartData.gw || 0);
        
        const remainingNw = remainingGw - (item.cw || 0);
        
        let remainingAverage = 0;
        if (remainingNw > 0 && remainingMtrs > 0) {
          remainingAverage = parseFloat(((remainingNw * 1000) / remainingMtrs).toFixed(2));
        }
        
        const updatedRemainingRoll: LoomSheetData = {
          ...item,
          mtrs: remainingMtrs,
          gw: remainingGw,
          nw: remainingNw,
          average: remainingAverage,
          status: 'Partially Consumed',
          productionDate: new Date(),
        };
        
        if (updatedRemainingRoll.mtrs <= 0 && updatedRemainingRoll.gw <= 0) {
           return { ...updatedRemainingRoll, status: 'Consumed' as const, productionDate: new Date(), mtrs: 0, gw: 0, cw: 0, nw: 0, average: 0 };
        }
        return updatedRemainingRoll;
      }
      return item;
    });

    const finalData = [...updatedData, newConsumedRoll];
    updateData(finalData);
  };
  
  const handleMarkAsConsumed = (ids: string[], consumptionData: ConsumedByData) => {
    const updatedData = allData.map(item =>
      ids.includes(item.id!)
        ? { ...item, status: 'Consumed' as const, productionDate: new Date(), ...consumptionData }
        : item
    );
    updateData(updatedData);
  };


  const handleWorkOrderSubmit = async (formData: Omit<WorkOrderData, 'id' | 'createdAt'>) => {
    const consumedRollIds = formData.childPids.map(child => child.rollId);
    
    const childPidsWithRolls = formData.childPids.map(child => {
        const roll = allData.find(r => r.id === child.rollId);
        return { ...child, rollSerialNumber: roll?.serialNumber || 'N/A', completed: false };
    });

    const workOrderPayload: WorkOrderData = {
      ...formData,
      id: `wo-${Date.now()}`,
      createdAt: new Date(),
      childPids: childPidsWithRolls,
    };

    try {
      const currentWorkOrders = await (await fetch('/api/work-orders')).json();
      const updatedWorkOrders = [...currentWorkOrders, workOrderPayload];

      const woResponse = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkOrders),
      });
      if (!woResponse.ok) throw new Error('Failed to save work order.');
      
      const updatedRollsData = allData.map(item =>
        consumedRollIds.includes(item.id!)
          ? { ...item, status: 'Consumed' as const, consumedBy: `WO: ${formData.parentPid}`, productionDate: new Date() }
          : item
      );
      await updateData(updatedRollsData);
      
      toast({
        title: 'Work Order Created',
        description: `Work order ${formData.parentPid} has been created and is now in progress.`,
      });
      
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

  const handleToggleChildPidCompletion = async (workOrderId: string, childPid: string) => {
    const updatedWorkOrders = workOrders.map(wo => {
      if (wo.id === workOrderId) {
        return {
          ...wo,
          childPids: wo.childPids.map(child => 
            child.pid === childPid ? { ...child, completed: !child.completed } : child
          ),
        };
      }
      return wo;
    });

    setWorkOrders(updatedWorkOrders);

    try {
      const response = await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkOrders, null, 2),
      });
      if (!response.ok) throw new Error('Failed to update work order status.');
      
      toast({
        title: 'Status Updated',
        description: `Child PID ${childPid} status has been toggled.`,
      });

    } catch (error) {
       console.error('Work order update error:', error);
       toast({
         variant: 'destructive',
         title: 'Update Failed',
         description: 'Could not save the updated status. Please try again.',
       });
       // Revert optimistic update on failure
       fetchData();
    }
  };
  
  const handleOpenConsumedDialog = () => {
    if (selectedRowIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rolls Selected',
        description: 'Please select rolls from a work order to mark as consumed.',
      });
      return;
    }
    setIsConsumedDialogVisible(true);
  };

  const handleConfirmConsumed = (consumptionData: ConsumedByData) => {
    handleMarkAsConsumed(selectedRowIds, consumptionData);
    toast({
      title: 'Success',
      description: `${selectedRowIds.length} rolls marked as consumed.`,
    });
    setSelectedRowIds([]);
    setIsConsumedDialogVisible(false);
  }

  const handleOpenPartialUseDialog = () => {
    if (selectedRowIds.length !== 1) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Please select exactly one roll from a work order for partial use.',
      });
      return;
    }
    setIsPartialUseDialogVisible(true);
  };

  const handleConfirmPartialUse = (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    const originalId = selectedRowIds[0];
    handlePartialConsume(originalId, consumedPart);
     toast({
      title: 'Success',
      description: `Roll partially consumed by ${consumedPart.consumedBy}. Remaining roll updated.`,
    });
    setSelectedRowIds([]);
    setIsPartialUseDialogVisible(false);
  };
  
  const workOrderRolls = allData.filter((d: LoomSheetData) => d.status === 'For Work Order');
  const selectedRollsForWoCreation = workOrderRolls.filter(d => selectedRowIds.includes(d.id!));
  const selectedRollForPartialUse = selectedRowIds.length === 1 ? allData.find(d => d.id === selectedRowIds[0]) : undefined;

  const workOrdersWithRolls = useMemo(() => {
    const consumedRollIdsInWo = new Set(workOrders.flatMap(wo => wo.childPids.map(p => p.rollId)));
    
    return workOrders.map(wo => {
      const rolls = wo.childPids.map(child => {
        const roll = allData.find(r => r.id === child.rollId);
        // If roll is not found, it might have been fully consumed and its status changed
        if (roll) return roll;
        // Let's find it in the consumed data
        const consumedRoll = allData.find(r => r.id === child.rollId && r.status === 'Consumed');
        return consumedRoll;
      }).filter((roll): roll is LoomSheetData => !!roll);
      return { ...wo, rolls };
    }).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }, [workOrders, allData]);


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
        selectedRolls={selectedRollsForWoCreation}
        onSubmit={handleWorkOrderSubmit}
      />
      <ConsumedByDialog
        isOpen={isConsumedDialogVisible}
        onClose={() => setIsConsumedDialogVisible(false)}
        onConfirm={handleConfirmConsumed}
        selectedCount={selectedRowIds.length}
      />
      {selectedRollForPartialUse && (
        <PartialUseDialog
          isOpen={isPartialUseDialogVisible}
          onClose={() => setIsPartialUseDialogVisible(false)}
          onConfirm={handleConfirmPartialUse}
          originalRoll={selectedRollForPartialUse}
        />
      )}
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
            <div className="flex gap-2">
              <Button onClick={() => setIsWorkOrderDialogVisible(true)} disabled={selectedRowIds.length === 0}>
                  Working
              </Button>
            </div>
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
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
                            In Progress
                        </h2>
                        <p className="mt-1 text-md text-muted-foreground">
                            A log of all work orders currently in progress. Select rolls to consume them.
                        </p>
                    </div>
                     <div className="flex gap-2">
                        <Button onClick={handleOpenPartialUseDialog} variant="outline" size="sm" disabled={selectedRowIds.length !== 1}>
                            <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Partial Use
                        </Button>
                        <Button onClick={handleOpenConsumedDialog} variant="outline" size="sm" disabled={selectedRowIds.length === 0}>
                            <CheckSquare className="mr-2 h-4 w-4" /> Mark Consumed
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {workOrdersWithRolls.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {workOrdersWithRolls.map(wo => (
                                <AccordionItem value={wo.id!} key={wo.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <span className='font-bold text-lg text-primary'>Parent PID: {wo.parentPid}</span>
                                            <span className='text-md text-muted-foreground'>Customer: {wo.customerName}</span>
                                            <span className='text-sm text-muted-foreground'>{new Date(wo.createdAt!).toLocaleDateString()}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <DataTable 
                                        data={wo.rolls} 
                                        onSelectedRowIdsChange={onSetSelectedRowIds}
                                        selectedRowIds={selectedRowIds}
                                        showCheckboxes={true}
                                      />
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground py-12">
                            <p className="text-lg">No work orders are currently in progress.</p>
                            <p className="text-sm">Select rolls from the top table and click "Working" to create one.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}

    