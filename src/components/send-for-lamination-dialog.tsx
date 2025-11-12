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
import { LoomSheetData } from '@/lib/schemas';
import { ScrollArea } from './ui/scroll-area';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface SendForLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (rollsToUpdate: { id: string; callOut: string }[]) => void;
  selectedRolls: LoomSheetData[];
}

export function SendForLaminationDialog({ isOpen, onClose, onConfirm, selectedRolls }: SendForLaminationDialogProps) {
  const [callOuts, setCallOuts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      // Initialize callOuts for selected rolls
      const initialCallouts = selectedRolls.reduce((acc, roll) => {
        acc[roll.id!] = roll.callOut || '';
        return acc;
      }, {} as Record<string, string>);
      setCallOuts(initialCallouts);
    }
  }, [isOpen, selectedRolls]);

  const handleCallOutChange = (id: string, value: string) => {
    setCallOuts(prev => ({ ...prev, [id]: value }));
  };
  
  const handleConfirm = () => {
    const rollsToUpdate = Object.entries(callOuts).map(([id, callOut]) => ({ id, callOut }));
    onConfirm(rollsToUpdate);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-7xl">
        <DialogHeader>
          <DialogTitle>Send for Lamination</DialogTitle>
          <DialogDescription>
            You have selected {selectedRolls.length} roll(s). Enter a call out note for each roll below.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] p-4 border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sl.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size S</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Meters</TableHead>
                <TableHead>Gross Weight</TableHead>
                <TableHead>Core Weight</TableHead>
                <TableHead>Net Weight</TableHead>
                <TableHead>Avg</TableHead>
                <TableHead className="w-[30%]">Call Out</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedRolls.map((roll, index) => (
                <TableRow key={roll.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{roll.productionDate ? format(new Date(roll.productionDate), 'PP') : ''}</TableCell>
                  <TableCell>{`${roll.width || ''}" ${roll.gram || ''} Gms ${roll.color || ''}`}</TableCell>
                  <TableCell>{roll.serialNumber}</TableCell>
                  <TableCell>{roll.mtrs}</TableCell>
                  <TableCell>{roll.gw}</TableCell>
                  <TableCell>{roll.cw}</TableCell>
                  <TableCell>{roll.nw}</TableCell>
                  <TableCell>{roll.average}</TableCell>
                  <TableCell>
                    <Textarea
                      id={`callOut-${roll.id}`}
                      value={callOuts[roll.id!] || ''}
                      onChange={(e) => handleCallOutChange(roll.id!, e.target.value)}
                      placeholder="Type your message here."
                      className="w-full"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm}>Confirm & Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
