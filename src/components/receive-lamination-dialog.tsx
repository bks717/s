import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoomSheetData } from '@/lib/schemas';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Terminal } from 'lucide-react';
import { Separator } from './ui/separator';
import LoomSheetForm from './loom-sheet-form';
import { ScrollArea } from './ui/scroll-area';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ReceiveLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onReturnToStock: (selectedIds: string[]) => void;
  onCollaborateAndCreate: (selectedIds: string[], newRollData: LoomSheetData) => void;
  onSerialNumberChange: (oldRollId: string, newSerialNumber: string) => void;
}

type ReceiveView = 'options' | 'collaborate' | 'serialNumberChange';

export function ReceiveLaminationDialog({ isOpen, onClose, selectedRolls, onReturnToStock, onCollaborateAndCreate, onSerialNumberChange }: ReceiveLaminationDialogProps) {
  const { toast } = useToast();
  const [view, setView] = useState<ReceiveView>('options');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const selectedIds = selectedRolls.map(r => r.id!);
  const isSingleSelection = selectedRolls.length === 1;

  const handleReturnToStock = () => {
    onReturnToStock(selectedIds);
    toast({
      title: 'Success',
      description: `${selectedIds.length} rolls returned to stock as laminated.`,
    });
    onClose();
  };

  const handleCollaborateSubmit = (newRollData: LoomSheetData) => {
    onCollaborateAndCreate(selectedIds, newRollData);
    toast({
        title: 'Success',
        description: `New roll ${newRollData.serialNumber} created. Original rolls marked as consumed.`,
    });
    onClose();
  }
  
  const handleSerialNumberChangeSubmit = () => {
    if (!newSerialNumber.trim()) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'New serial number cannot be empty.',
      });
      return;
    }
    onSerialNumberChange(selectedIds[0], newSerialNumber);
    toast({
      title: 'Success',
      description: `Serial number changed. Old roll consumed, new roll created.`,
    });
    onClose();
  };


  React.useEffect(() => {
    if (isOpen) {
      setView('options');
      setNewSerialNumber('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Process Received Lamination Rolls</DialogTitle>
          <DialogDescription>
            You have selected {selectedRolls.length} roll(s). Choose how to process them.
          </DialogDescription>
        </DialogHeader>
        
        {view === 'options' && (
          <div className="grid gap-6 py-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>You have 3 options</AlertTitle>
              <AlertDescription>
                <p><b>1. Return to Stock:</b> This will mark the selected rolls as laminated and return them to the 'Active Stock' pool.</p>
                <p className="mt-2"><b>2. Collaborate & Create New Roll:</b> This will consume the selected rolls to create a single new laminated roll.</p>
                <p className="mt-2"><b>3. Change Serial Number (Single Roll Only):</b> If a roll returns with a new serial number, this consumes the old roll and creates a new one with the new S/N.</p>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setView('collaborate')}>Collaborate & Create</Button>
              <Button variant="outline" onClick={() => setView('serialNumberChange')} disabled={!isSingleSelection}>Change Serial Number</Button>
              <Button onClick={handleReturnToStock}>Return to Stock</Button>
            </DialogFooter>
          </div>
        )}
        
        {view === 'serialNumberChange' && (
          <div>
            <Separator className="my-4"/>
            <DialogDescription className="mb-4">
                The original roll with serial number <b>{selectedRolls[0].serialNumber}</b> will be marked as consumed. Enter the new serial number for the roll that has returned from lamination.
            </DialogDescription>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="newSerialNumber" className="text-right">
                  New Serial Number
                </Label>
                <Input
                  id="newSerialNumber"
                  value={newSerialNumber}
                  onChange={(e) => setNewSerialNumber(e.target.value)}
                  className="col-span-3"
                  placeholder="Enter new serial number"
                />
              </div>
            </div>
            <DialogFooter>
               <Button variant="outline" onClick={() => setView('options')}>Back to Options</Button>
               <Button onClick={handleSerialNumberChangeSubmit}>Submit S/N Change</Button>
            </DialogFooter>
          </div>
        )}

        {view === 'collaborate' && (
            <div>
                <Separator className="my-4"/>
                <DialogDescription className="mb-4">
                    The {selectedRolls.length} selected rolls will be consumed, and their serial numbers will be recorded. Fill out the form below to create the new, consolidated laminated roll. It will default to 'Laminated: true'.
                </DialogDescription>
                <ScrollArea className="h-[60vh] p-4 border rounded-md">
                    <LoomSheetForm
                        onFormSubmit={handleCollaborateSubmit}
                        defaultValues={{ lamination: true }}
                    />
                </ScrollArea>
                 <Button variant="outline" onClick={() => setView('options')} className="mt-4">Back to Options</Button>
            </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
