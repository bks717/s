
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

interface ConsumptionTypeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrder: WorkOrderData & { rolls: (LoomSheetData & { childPid: string })[] };
  allRolls: LoomSheetData[];
  onSubmit: (
    workOrderToUpdate: WorkOrderData,
    consumptionStates: { [rollId: string]: 'full' | { partialData: Omit<LoomSheetData, 'id' | 'productionDate'> } }
  ) => void;
}

export function ConsumptionTypeDialog({ isOpen, onClose, workOrder, allRolls, onSubmit }: ConsumptionTypeDialogProps) {
  const [consumptionStates, setConsumptionStates] = useState<{ [rollId: string]: 'full' | { partialData: Omit<LoomSheetData, 'id' | 'productionDate'> } }>({});
  const [partialUseDialogState, setPartialUseDialogState] = useState<{ isOpen: boolean; roll: LoomSheetData | null }>({ isOpen: false, roll: null });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      // Initialize all rolls to 'full' consumption by default
      const initialStates = workOrder.rolls.reduce((acc, roll) => {
        acc[roll.id!] = 'full';
        return acc;
      }, {} as { [rollId: string]: 'full' });
      setConsumptionStates(initialStates);
    }
  }, [isOpen, workOrder]);

  const handleStateChange = (rollId: string, value: 'full' | 'partial') => {
    if (value === 'full') {
      setConsumptionStates(prev => ({ ...prev, [rollId]: 'full' }));
    } else {
      // Defer partial data entry, just mark it for now
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
    onSubmit(workOrder, consumptionStates);
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
                  {typeof consumptionStates[roll.id!] !== 'full' && (
                    <div className='mt-2'>
                        <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleStateChange(roll.id!, 'partial')}
                        >
                           {getPartialButtonLabel(roll.id!)}
                        </Button>
                    </div>
                  )}
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
