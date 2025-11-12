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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SendForLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (callOut: string) => void;
  selectedCount: number;
}

export function SendForLaminationDialog({ isOpen, onClose, onConfirm, selectedCount }: SendForLaminationDialogProps) {
  const [callOut, setCallOut] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCallOut('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    onConfirm(callOut.trim());
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send for Lamination</DialogTitle>
          <DialogDescription>
            You have selected {selectedCount} roll(s). Enter a call out note to send with them.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="callOut">Call Out</Label>
            <Textarea
              id="callOut"
              value={callOut}
              onChange={(e) => setCallOut(e.target.value)}
              placeholder="Type your message here."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm & Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
