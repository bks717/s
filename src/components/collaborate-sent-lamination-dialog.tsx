import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { loomSheetSchema, LoomSheetData } from '@/lib/schemas';
import LoomSheetForm from './loom-sheet-form';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Form } from './ui/form';

interface CollaborateSentLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onConfirm: (newRollData: LoomSheetData) => void;
}

export function CollaborateSentLaminationDialog({ isOpen, onClose, selectedRolls, onConfirm }: CollaborateSentLaminationDialogProps) {
  const [receivedSerialNumber, setReceivedSerialNumber] = useState('');
  const [newSerialNumber, setNewSerialNumber] = useState('');
  
  const form = useForm<Omit<LoomSheetData, 'id' | 'productionDate'>>({
    resolver: zodResolver(loomSheetSchema.omit({ id: true, productionDate: true })),
    defaultValues: {
      lamination: true,
      status: 'Received from Lamination',
      serialNumber: '',
    },
  });

  const handleSubmit = (newRollData: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    if (!newSerialNumber.trim()) {
        alert('New Serial Number is required.');
        return;
    }
    onConfirm({ ...newRollData, serialNumber: newSerialNumber, receivedSerialNumber: receivedSerialNumber });
  }

  const consumedByValue = selectedRolls.map(r => r.serialNumber).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <DialogHeader>
              <DialogTitle>Collaborate & Create New Roll</DialogTitle>
              <DialogDescription>
                The {selectedRolls.length} selected rolls will be consumed. Fill out the form below to create the new, consolidated laminated roll.
              </DialogDescription>
            </DialogHeader>
            
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
                    formContext={form}
                    hideFields={['serialNumber']}
                />
            </ScrollArea>

            <DialogFooter className="pt-4">
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                <Button
                    type="submit"
                    size="lg"
                    disabled={form.formState.isSubmitting || !newSerialNumber}
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                >
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    sub-Mit
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
