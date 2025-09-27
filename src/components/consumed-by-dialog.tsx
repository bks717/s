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

interface ConsumedByDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consumedBy: string) => void;
  selectedCount: number;
}

export function ConsumedByDialog({ isOpen, onClose, onConfirm, selectedCount }: ConsumedByDialogProps) {
  const [consumedBy, setConsumedBy] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConsumedBy('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (consumedBy.trim()) {
      onConfirm(consumedBy.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark as Consumed</DialogTitle>
          <DialogDescription>
            You have selected {selectedCount} roll(s). Enter the customer or entity that consumed these items.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="consumedBy" className="text-right">
              Consumed By
            </Label>
            <Input
              id="consumedBy"
              value={consumedBy}
              onChange={(e) => setConsumedBy(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Customer Name"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!consumedBy.trim()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
