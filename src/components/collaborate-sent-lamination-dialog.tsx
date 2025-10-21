import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LoomSheetData } from '@/lib/schemas';
import LoomSheetForm from './loom-sheet-form';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface CollaborateSentLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onConfirm: (newRollData: LoomSheetData) => void;
}

export function CollaborateSentLaminationDialog({ isOpen, onClose, selectedRolls, onConfirm }: CollaborateSentLaminationDialogProps) {
  
  const handleSubmit = (newRollData: LoomSheetData) => {
    onConfirm(newRollData);
  }

  const consumedByValue = selectedRolls.map(r => r.serialNumber).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Collaborate & Create New Roll</DialogTitle>
          <DialogDescription>
            The {selectedRolls.length} selected rolls will be consumed. Fill out the form below to create the new, consolidated laminated roll. It will default to 'Laminated: true' and 'Active Stock'.
          </DialogDescription>
        </DialogHeader>
        
        <div>
            <Separator className="my-4"/>
            <DialogDescription className="mb-4">
                The following rolls will be consumed: {consumedByValue}
            </DialogDescription>
            <ScrollArea className="h-[60vh] p-4 border rounded-md">
                <LoomSheetForm
                    onFormSubmit={handleSubmit}
                    defaultValues={{ lamination: true, status: 'Active Stock' }}
                />
            </ScrollArea>
             <Button variant="outline" onClick={onClose} className="mt-4">Cancel</Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
