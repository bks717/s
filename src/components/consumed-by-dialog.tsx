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
import { BagProductionData, ConsumedByData } from '@/lib/schemas';
import { Separator } from './ui/separator';

interface ConsumedByDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consumptionData: ConsumedByData, bagData?: BagProductionData) => void;
  selectedCount: number;
  activeView: 'rolls' | 'bags';
}

export function ConsumedByDialog({ isOpen, onClose, onConfirm, selectedCount, activeView }: ConsumedByDialogProps) {
  const [consumedBy, setConsumedBy] = useState('');
  const [soNumber, setSoNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [noOfBags, setNoOfBags] = useState<number | ''>('');
  const [avgBagWeight, setAvgBagWeight] = useState<number | ''>('');
  const [bagSize, setBagSize] = useState<string>('');


  useEffect(() => {
    if (isOpen) {
      setConsumedBy('');
      setSoNumber('');
      setPoNumber('');
      setNoOfBags('');
      setAvgBagWeight('');
      setBagSize('');
    }
  }, [isOpen]);
  
  const handleConfirm = () => {
    if (consumedBy.trim()) {
        const consumptionData: ConsumedByData = {
            consumedBy: consumedBy.trim(),
            soNumber: soNumber.trim(),
            poNumber: poNumber.trim(),
        };
        if(activeView === 'bags') {
            onConfirm(consumptionData, { noOfBags: noOfBags || undefined, avgBagWeight: avgBagWeight || undefined, bagSize });
        } else {
            onConfirm(consumptionData);
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="soNumber" className="text-right">
              S/O Number
            </Label>
            <Input
              id="soNumber"
              value={soNumber}
              onChange={(e) => setSoNumber(e.target.value)}
              className="col-span-3"
              placeholder="S/O Number"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="poNumber" className="text-right">
              P/O Number
            </Label>
            <Input
              id="poNumber"
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="col-span-3"
              placeholder="P/O Number"
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
                    value={noOfBags}
                    onChange={(e) => setNoOfBags(e.target.value ? parseInt(e.target.value) : '')}
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
                    value={avgBagWeight}
                    onChange={(e) => setAvgBagWeight(e.target.value ? parseFloat(e.target.value) : '')}
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
