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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoomSheetData } from '@/lib/schemas';

interface ReceiveSentLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newSerialNumber: string, receivedSerialNumber: string) => void;
  selectedRoll?: LoomSheetData;
}

export function ReceiveSentLaminationDialog({ isOpen, onClose, onConfirm, selectedRoll }: ReceiveSentLaminationDialogProps) {
  const [newSerialNumber, setNewSerialNumber] = useState('');
  const [receivedSerialNumber, setReceivedSerialNumber] = useState('');

  useEffect(() => {
    if (isOpen) {
      setNewSerialNumber('');
      setReceivedSerialNumber('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (newSerialNumber.trim() && receivedSerialNumber.trim()) {
      onConfirm(newSerialNumber, receivedSerialNumber);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Receive Laminated Roll</DialogTitle>
          <DialogDescription>
            Selected Roll S/N: {selectedRoll?.serialNumber}. Enter the new serial numbers for the received roll.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="receivedSerialNumber" className="text-right">
              Received S.No
            </Label>
            <Input
              id="receivedSerialNumber"
              value={receivedSerialNumber}
              onChange={(e) => setReceivedSerialNumber(e.target.value)}
              className="col-span-3"
              placeholder="Enter received S/N"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="newSerialNumber" className="text-right">
              New S.No
            </Label>
            <Input
              id="newSerialNumber"
              value={newSerialNumber}
              onChange={(e) => setNewSerialNumber(e.target.value)}
              className="col-span-3"
              placeholder="Enter new S/N"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!newSerialNumber.trim() || !receivedSerialNumber.trim()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
