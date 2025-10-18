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
import { BagProductionData } from '@/lib/schemas';
import { Separator } from './ui/separator';

interface ConsumedByDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consumedBy: string, bagData?: BagProductionData) => void;
  selectedCount: number;
  activeView: 'rolls' | 'bags';
}

export function ConsumedByDialog({ isOpen, onClose, onConfirm, selectedCount, activeView }: ConsumedByDialogProps) {
  const [consumedBy, setConsumedBy] = useState('');
  const [noOfBags, setNoOfBags] = useState<number | undefined>();
  const [avgBagWeight, setAvgBagWeight] = useState<number | undefined>();
  const [bagSize, setBagSize] = useState<string>('');


  useEffect(() => {
    if (isOpen) {
      setConsumedBy('');
      setNoOfBags(undefined);
      setAvgBagWeight(undefined);
      setBagSize('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (consumedBy.trim()) {
        if(activeView === 'bags') {
            onConfirm(consumedBy.trim(), { noOfBags, avgBagWeight, bagSize });
        } else {
            onConfirm(consumedBy.trim());
        }
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
          {activeView === 'bags' && (
            <>
                <Separator />
                <DialogDescription>
                    Optionally, enter bag production details.
                </DialogDescription>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="noOfBags" className="text-right">
                        No. of Bags
                    </Label>
                    <Input
                    id="noOfBags"
                    type="number"
                    value={noOfBags || ''}
                    onChange={(e) => setNoOfBags(e.target.value ? parseInt(e.target.value) : undefined)}
                    className="col-span-3"
                    placeholder="0"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="avgBagWeight" className="text-right">
                        Avg. Weight
                    </Label>
                    <Input
                    id="avgBagWeight"
                    type="number"
                    value={avgBagWeight || ''}
                    onChange={(e) => setAvgBagWeight(e.target.value ? parseFloat(e.target.value) : undefined)}
                    className="col-span-3"
                    placeholder="0"
                    />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="bagSize" className="text-right">
                        Bag Size
                    </Label>
                    <Input
                    id="bagSize"
                    value={bagSize}
                    onChange={(e) => setBagSize(e.target.value)}
                    className="col-span-3"
                    placeholder="e.g., 24x36"
                    />
                </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!consumedBy.trim()}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
