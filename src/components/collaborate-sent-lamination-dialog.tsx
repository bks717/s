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
import LoomSheetForm from './loom-sheet-form';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface CollaborateSentLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onConfirm: (newRollData: LoomSheetData) => void;
}

export function CollaborateSentLaminationDialog({ isOpen, onClose, selectedRolls, onConfirm }: CollaborateSentLaminationDialogProps) {
  const [receivedSerialNumber, setReceivedSerialNumber] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (newRollData: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    setIsSubmitting(true);
    if (!newSerialNumber.trim()) {
        alert('New Serial Number is required.');
        setIsSubmitting(false);
        return;
    }
    onConfirm({ ...newRollData, serialNumber: newSerialNumber, receivedSerialNumber: receivedSerialNumber });
    // No need to setIsSubmitting(false) here as the dialog will close.
  }

  const consumedByValue = selectedRolls.map(r => r.serialNumber).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Collaborate & Create New Roll</DialogTitle>
          <DialogDescription>
            The {selectedRolls.length} selected rolls will be consumed. Fill out the form below to create the new, consolidated laminated roll.
          </DialogDescription>
        </DialogHeader>
        
        <div>
            <Separator className="my-4"/>
            <DialogDescription className="mb-4">
                The following rolls will be consumed: {consumedByValue}
            </DialogDescription>
             <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                    <Label htmlFor="receivedSerialNumber">Received S.No</Label>
                    <Input
                    id="receivedSerialNumber"
                    value={receivedSerialNumber}
                    onChange={(e) => setReceivedSerialNumber(e.target.value)}
                    placeholder="Enter received S/N"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="newSerialNumber">New S.No</Label>
                    <Input
                    id="newSerialNumber"
                    value={newSerialNumber}
                    onChange={(e) => setNewSerialNumber(e.target.value)}
                    placeholder="Enter new S/N"
                    />
                </div>
            </div>
            <ScrollArea className="h-[50vh] p-4 border rounded-md">
                <LoomSheetForm
                    onFormSubmit={handleSubmit}
                    defaultValues={{ lamination: true, status: 'Received from Lamination', serialNumber: '' }}
                    isSubmitting={isSubmitting || !newSerialNumber}
                    hideFields={['serialNumber']}
                />
            </ScrollArea>
             <DialogFooter className="mt-4">
                <Button variant="outline" onClick={onClose}>Cancel</Button>
            </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}
