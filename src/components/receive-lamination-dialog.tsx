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
  onReturnToStock: (selectedIds: string[], newSerialNumber?: string) => void;
  onCollaborateAndCreate: (selectedIds: string[], newRollData: LoomSheetData) => void;
}

type ReceiveView = 'options' | 'collaborate' | 'return';

export function ReceiveLaminationDialog({ isOpen, onClose, selectedRolls, onReturnToStock, onCollaborateAndCreate }: ReceiveLaminationDialogProps) {
  const { toast } = useToast();
  const [view, setView] = useState<ReceiveView>('options');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const selectedIds = selectedRolls.map(r => r.id!);
  const isSingleSelection = selectedRolls.length === 1;

  const handleReturnToStock = () => {
    if (isSingleSelection && newSerialNumber.trim()) {
      onReturnToStock(selectedIds, newSerialNumber);
      toast({
        title: 'Success',
        description: `Serial number changed. Old roll consumed, new roll created and returned to stock.`,
      });
    } else {
      onReturnToStock(selectedIds);
      toast({
        title: 'Success',
        description: `${selectedIds.length} rolls returned to stock as laminated.`,
      });
    }
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
              <AlertTitle>You have 2 options</AlertTitle>
              <AlertDescription>
                <p><b>1. Return to Stock:</b> This will mark the selected rolls as laminated and return them to the 'Active Stock' pool. If you select a single roll, you'll have an option to change its serial number.</p>
                <p className="mt-2"><b>2. Collaborate & Create New Roll:</b> This will consume the selected rolls to create a single new laminated roll.</p>
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button variant="outline" onClick={() => setView('collaborate')}>Collaborate & Create</Button>
              <Button onClick={() => setView('return')}>Return to Stock</Button>
            </DialogFooter>
          </div>
        )}
        
        {view === 'return' && (
          <div>
            <Separator className="my-4"/>
            <DialogDescription className="mb-4">
                The selected rolls will be returned to active stock. If you are processing a single roll and it has a new serial number, enter it below.
            </DialogDescription>
            {isSingleSelection && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newSerialNumber" className="text-right">
                    New Serial Number (Optional)
                  </Label>
                  <Input
                    id="newSerialNumber"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    className="col-span-3"
                    placeholder="Enter new S/N if changed"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
               <Button variant="outline" onClick={() => setView('options')}>Back to Options</Button>
               <Button onClick={handleReturnToStock}>Confirm Return to Stock</Button>
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
