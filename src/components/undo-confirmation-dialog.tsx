
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UndoConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function UndoConfirmationDialog({ isOpen, onClose, onConfirm }: UndoConfirmationDialogProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const canConfirm = confirmationText.toLowerCase() === 'undo';

  useEffect(() => {
    if (isOpen) {
      setConfirmationText('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undo Last Action</DialogTitle>
          <DialogDescription>
            This action cannot be reversed. To confirm, please type{' '}
            <span className="font-bold text-destructive">undo</span> below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirmation" className="text-right sr-only">
              Confirmation
            </Label>
            <Input
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className="col-span-4"
              placeholder='Type "undo" to confirm'
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            Undo Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
