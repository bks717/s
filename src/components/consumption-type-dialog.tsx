
'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { LoomSheetData, WorkOrderData } from '@/lib/schemas';
import { ScrollArea } from './ui/scroll-area';
import { PartialUseDialog } from './partial-use-dialog';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Separator } from './ui/separator';

interface ConsumptionTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData & { rolls: (LoomSheetData & { childPid: string })[] };
  allRolls: LoomSheetData[];
  onSubmit: (
    workOrderToUpdate: WorkOrderData,
    consumptionStates: { [rollId: string]: 'full' | { partialData: Omit<LoomSheetData, 'id' | 'productionDate'> } },
    consumptionDetails: { soNumber?: string, poNumber?: string, kgProduced?: number, bagCount?: number }
  ) => void;
}

export function ConsumptionTypeDialog({ isOpen, onClose, workOrder, allRolls, onSubmit }: ConsumptionTypeDialogProps) {
  const [consumptionStates, setConsumptionStates] = useState<{ [rollId: string]: 'full' | { partialData: Omit<LoomSheetData, 'id' | 'productionDate'> } }>({});
  const [partialUseDialogState, setPartialUseDialogState] = useState<{ isOpen: boolean; roll: LoomSheetData | null }>({ isOpen: false, roll: null });
  const [kgProduced, setKgProduced] = useState<number | undefined>();
  const [bagCount, setBagCount] = useState<number | undefined>();
  const [soNumber, setSoNumber] = useState<string | undefined>();
  const [poNumber, setPoNumber] = useState<string | undefined>();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Initialize all rolls to 'full' consumption by default
      const initialStates = workOrder.rolls.reduce((acc, roll) => {
        acc[roll.id!] = 'full';
        return acc;
      }, {} as { [rollId: string]: 'full' });
      setConsumptionStates(initialStates);
      setKgProduced(undefined);
      setBagCount(undefined);
      setSoNumber(undefined);
      setPoNumber(undefined);
    }
  }, [isOpen, workOrder]);

  const handleStateChange = (rollId: string, value: 'full' | 'partial') => {
    if (value === 'full') {
      setConsumptionStates(prev => ({ ...prev, [rollId]: 'full' }));
    } else {
      const rollToEdit = workOrder.rolls.find(r => r.id === rollId);
      if (rollToEdit) {
        setPartialUseDialogState({ isOpen: true, roll: rollToEdit });
      }
    }
  };

  const handlePartialUseConfirm = (partialData: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    if (partialUseDialogState.roll) {
      setConsumptionStates(prev => ({
        ...prev,
        [partialUseDialogState.roll!.id!]: { partialData },
      }));
      setPartialUseDialogState({ isOpen: false, roll: null });
      toast({ title: 'Partial data saved', description: `Data for ${partialData.serialNumber} is ready.` });
    }
  };
  
  const handleSubmit = () => {
    const consumptionDetails = { 
      soNumber, 
      poNumber, 
      kgProduced, 
      bagCount 
    };
    onSubmit(workOrder, consumptionStates, consumptionDetails);
  }

  const getPartialButtonLabel = (rollId: string) => {
    const state = consumptionStates[rollId];
    if (typeof state === 'object' && state.partialData) {
        return `Edit (${state.partialData.mtrs}m, ${state.partialData.gw}kg)`;
    }
    return 'Enter Partial Data';
  }

  return (
    <>
      {partialUseDialogState.roll && (
        <PartialUseDialog
          isOpen={partialUseDialogState.isOpen}
          onClose={() => setPartialUseDialogState({ isOpen: false, roll: null })}
          onConfirm={handlePartialUseConfirm}
          originalRoll={partialUseDialogState.roll}
        />
      )}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Type of Consumption for: {workOrder.parentPid}</DialogTitle>
            <DialogDescription>
              Specify how each roll was consumed. Rolls are fully consumed by default.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] p-4">
            <div className="space-y-6">
               <div className='p-4 border rounded-md bg-muted/50'>
                    <h4 className="font-semibold mb-4 text-primary">Order Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="so-number">S/O Number</Label>
                            <Input 
                                id="so-number" 
                                type="text" 
                                placeholder="Enter S/O Number"
                                value={soNumber || ''}
                                onChange={(e) => setSoNumber(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label htmlFor="po-number">P/O Number</Label>
                            <Input 
                                id="po-number" 
                                type="text" 
                                placeholder="Enter P/O Number"
                                value={poNumber || ''}
                                onChange={(e) => setPoNumber(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

              {workOrder.workOrderType === 'Bags' && (
                <div className='p-4 border rounded-md bg-muted/50'>
                    <h4 className="font-semibold mb-4 text-primary">Bag Production Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="kg-produced">KG Produced</Label>
                            <Input 
                                id="kg-produced" 
                                type="number" 
                                placeholder="Enter total KG produced"
                                value={kgProduced || ''}
                                onChange={(e) => setKgProduced(parseFloat(e.target.value))}
                            />
                        </div>
                        <div>
                            <Label htmlFor="bag-count">Bag Count</Label>
                            <Input 
                                id="bag-count" 
                                type="number" 
                                placeholder="Enter total number of bags"
                                value={bagCount || ''}
                                onChange={(e) => setBagCount(parseInt(e.target.value))}
                            />
                        </div>
                    </div>
                </div>
              )}
              <Separator />
              {workOrder.rolls.map(roll => (
                <div key={roll.id} className="p-4 border rounded-md">
                  <h4 className="font-semibold">{roll.serialNumber} (PID: {roll.childPid})</h4>
                  <p className="text-sm text-muted-foreground">
                    {roll.mtrs}m | {roll.gw}kg Gross | {roll.nw}kg Net
                  </p>
                  <RadioGroup
                    value={typeof consumptionStates[roll.id!] === 'object' ? 'partial' : 'full'}
                    onValueChange={(value) => handleStateChange(roll.id!, value as 'full' | 'partial')}
                    className="flex items-center space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="full" id={`full-${roll.id}`} />
                      <Label htmlFor={`full-${roll.id}`}>Fully Consumed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="partial" id={`partial-${roll.id}`} />
                      <Label htmlFor={`partial-${roll.id}`}>Partially Consumed</Label>
                    </div>
                  </RadioGroup>
                </div>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

    