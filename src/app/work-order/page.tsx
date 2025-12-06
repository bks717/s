
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { ConsumptionTypeDialog } from '@/components/consumption-type-dialog';
import { PartialUseDialog } from '@/components/partial-use-dialog';
import { ConsumedByDialog } from '@/components/consumed-by-dialog';

export default function WorkOrderPage() {
  const [allData, setAllData] = useState<LoomSheetData[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isWorkOrderDialogVisible, setIsWorkOrderDialogVisible] = useState(false);
  const [consumptionDialogState, setConsumptionDialogState] = useState<{isOpen: boolean, workOrder: WorkOrderData | null}>({isOpen: false, workOrder: null});
  const [isConsumedDialogVisible, setIsConsumedDialogVisible] = useState(false);
  const [isPartialUseDialogVisible, setIsPartialUseDialogVisible] = useState(false);
  const { toast } = useToast();
  
  // State for history tracking
  const [dataHistory, setDataHistory] = useState<LoomSheetData[][]>([]);
  const [workOrderHistory, setWorkOrderHistory] = useState<WorkOrderData[][]>([]);


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

      setDataHistory([typedRollsData]);
      setWorkOrderHistory([typedWoData]);

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

  const updateAllData = async (updatedLoomData: LoomSheetData[], updatedWorkOrders: WorkOrderData[]) => {
    try {
        setDataHistory(prev => [...prev, allData]);
        setWorkOrderHistory(prev => [...prev, workOrders]);

        await Promise.all([
            fetch('/api/loom-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLoomData, null, 2),
            }),
            fetch('/api/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedWorkOrders, null, 2),
            })
        ]);
        
        setAllData(updatedLoomData);
        setWorkOrders(updatedWorkOrders);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error saving data',
        description: 'Could not save data.',
      });
    }
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

    const updatedWorkOrders = [...workOrders, workOrderPayload];
    const updatedRollsData = allData.map(item =>
      consumedRollIds.includes(item.id!)
        ? { ...item, status: 'In Progress' as const, productionDate: new Date() }
        : item
    );

    await updateAllData(updatedRollsData, updatedWorkOrders);
    
    toast({
      title: 'Work Order Created',
      description: `Work order ${formData.parentPid} has been created and is now in progress.`,
    });
      
    setIsWorkOrderDialogVisible(false);
    setSelectedRowIds([]);
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

    await updateAllData(allData, updatedWorkOrders);
      
    toast({
      title: 'Status Updated',
      description: `Child PID ${childPid} status has been toggled.`,
    });
  };

  const handleConsumptionSubmit = (
    workOrderToUpdate: WorkOrderData,
    consumptionStates: { [rollId: string]: 'full' | { partialData: Omit<LoomSheetData, 'id' | 'productionDate'> } },
    consumptionDetails: { soNumber?: string, poNumber?: string, kgProduced?: number, bagCount?: number }
  ) => {
    let updatedLoomData = [...allData];
    const consumedBy = `WO: ${workOrderToUpdate.parentPid}`;
  
    Object.entries(consumptionStates).forEach(([rollId, state]) => {
      const originalRoll = allData.find(r => r.id === rollId);
      if (!originalRoll) return;

      const consumptionInfo: Partial<LoomSheetData> = {
          consumedBy,
          soNumber: consumptionDetails.soNumber,
          poNumber: consumptionDetails.poNumber,
          ...(consumptionDetails.kgProduced && { kgProduced: consumptionDetails.kgProduced }),
          ...(consumptionDetails.bagCount && { bagCount: consumptionDetails.bagCount }),
      };

      if (state === 'full') {
        updatedLoomData = updatedLoomData.map(roll =>
          roll.id === rollId
            ? { ...roll, status: 'Consumed', productionDate: new Date(), ...consumptionInfo }
            : roll
        );
      } else if (typeof state === 'object' && state.partialData) {
        const { partialData } = state;
        const newConsumedRoll: LoomSheetData = {
          ...partialData,
          id: (Date.now() + Math.random()).toString(),
          productionDate: new Date(),
          status: 'Consumed',
          serialNumber: originalRoll.serialNumber, // Keep original serial number for consumed part
          ...consumptionInfo
        };

        updatedLoomData = updatedLoomData.map(item => {
          if (item.id === rollId) {
            const remainingMtrs = (item.mtrs || 0) - (partialData.mtrs || 0);
            const remainingGw = (item.gw || 0) - (partialData.gw || 0);
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
              status: remainingMtrs <= 0 ? 'Consumed' : 'Partially Consumed',
              productionDate: new Date(),
            };
            
            if (updatedRemainingRoll.mtrs <=0) {
              return { ...updatedRemainingRoll, status: 'Consumed', consumedBy };
            }
            
            return updatedRemainingRoll;
          }
          return item;
        });
        updatedLoomData.push(newConsumedRoll);
      }
    });

    const updatedWorkOrders = workOrders.filter(wo => wo.id !== workOrderToUpdate.id);
    
    updateAllData(updatedLoomData, updatedWorkOrders).then(() => {
        toast({ title: 'Success', description: `Work Order ${workOrderToUpdate.parentPid} has been processed.` });
        fetchData(); // Refresh all data
    });

    setConsumptionDialogState({isOpen: false, workOrder: null});
  };
  
  const workOrderRolls = allData.filter((d: LoomSheetData) => d.status === 'For Work Order');
  const selectedRollsForWoCreation = workOrderRolls.filter(d => selectedRowIds.includes(d.id!));
  const selectedRollForPartialUse = allData.find(d => d.id === selectedRowIds[0]);

  const inProgressWorkOrders = useMemo(() => {
    const inProgressRollIds = new Set(allData.filter(r => r.status === 'In Progress').map(r => r.id));
    return workOrders
        .map(wo => {
            const rolls = wo.childPids.map(child => {
                const roll = allData.find(r => r.id === child.rollId);
                return roll ? { ...roll, completed: child.completed, childPid: child.pid } : null;
            }).filter((roll): roll is (LoomSheetData & { completed: boolean; childPid: string }) => !!roll && inProgressRollIds.has(roll.id!));
            
            return rolls.length > 0 ? { ...wo, rolls } : null;
        })
        .filter((wo): wo is (WorkOrderData & { rolls: (LoomSheetData & { completed: boolean; childPid: string })[] }) => !!wo)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
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
      {consumptionDialogState.workOrder && (
         <ConsumptionTypeDialog
            isOpen={consumptionDialogState.isOpen}
            onClose={() => setConsumptionDialogState({isOpen: false, workOrder: null})}
            workOrder={consumptionDialogState.workOrder as any}
            allRolls={allData}
            onSubmit={handleConsumptionSubmit}
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
                <CardHeader>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
                            In Progress
                        </h2>
                        <p className="mt-1 text-md text-muted-foreground">
                            A log of all work orders currently in progress.
                        </p>
                    </div>
                </CardHeader>
                <CardContent className="p-6">
                    {inProgressWorkOrders.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                            {inProgressWorkOrders.map(wo => (
                                <AccordionItem value={wo.id!} key={wo.id}>
                                    <AccordionTrigger>
                                        <div className="flex justify-between w-full pr-4 items-center">
                                            <span className='font-bold text-lg text-primary'>Parent PID: {wo.parentPid}</span>
                                            <span className='text-md text-muted-foreground'>Customer: {wo.customerName}</span>
                                            <span className='text-sm font-bold'>{wo.workOrderType}</span>
                                            <span className='text-sm text-muted-foreground'>{new Date(wo.createdAt!).toLocaleDateString()}</span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <div className='flex justify-end mb-4'>
                                        <Button onClick={() => setConsumptionDialogState({isOpen: true, workOrder: wo})}>
                                            Type of Consumption
                                        </Button>
                                      </div>
                                      <Table>
                                        <TableHeader>
                                          <TableRow>
                                            <TableHead>Child PID</TableHead>
                                            <TableHead>Roll No</TableHead>
                                            <TableHead>Meters</TableHead>
                                            <TableHead>Net Weight</TableHead>
                                            <TableHead>Completed</TableHead>
                                          </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                          {wo.rolls.map(roll => (
                                            <TableRow key={roll.id}>
                                              <TableCell>{roll.childPid}</TableCell>
                                              <TableCell>{roll.serialNumber}</TableCell>
                                              <TableCell>{roll.mtrs}</TableCell>
                                              <TableCell>{roll.nw}</TableCell>
                                              <TableCell>
                                                <Checkbox
                                                  checked={roll.completed}
                                                  onCheckedChange={() => handleToggleChildPidCompletion(wo.id!, roll.childPid)}
                                                />
                                              </TableCell>
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

    