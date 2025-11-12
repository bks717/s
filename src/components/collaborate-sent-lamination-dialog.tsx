import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from './ui/form';
import LoomSheetForm from './loom-sheet-form';

interface CollaborateSentLaminationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onConfirm: (newRollData: LoomSheetData) => void;
}

const collaborateSchema = loomSheetSchema.omit({ id: true, productionDate: true, serialNumber: true, status: true }).extend({
    newSerialNumber: z.string().min(1, 'New Roll No is required.'),
    receivedSerialNumber: z.string().optional(),
});

type CollaborateFormData = z.infer<typeof collaborateSchema>;


export function CollaborateSentLaminationDialog({ isOpen, onClose, selectedRolls, onConfirm }: CollaborateSentLaminationDialogProps) {
  
  const form = useForm<CollaborateFormData>({
    resolver: zodResolver(collaborateSchema),
    defaultValues: {
      lamination: 'Lam active',
      newSerialNumber: '',
      receivedSerialNumber: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        lamination: 'Lam active',
        newSerialNumber: '',
        receivedSerialNumber: '',
        operatorName: '',
        loomNo: '',
        width: undefined,
        gram: undefined,
        fabricType: 'Slit',
        color: 'Natural',
        mtrs: undefined,
        gw: undefined,
        cw: undefined,
      });
    }
  }, [isOpen, form]);

  const onSubmit = (data: CollaborateFormData) => {
    const { newSerialNumber, ...rest } = data;
    const finalData: LoomSheetData = {
        ...rest,
        serialNumber: newSerialNumber,
        productionDate: new Date(),
        id: Date.now().toString(),
        status: 'Received from Lamination', 
    };
    onConfirm(finalData);
  }

  const consumedByValue = selectedRolls.map(r => r.serialNumber).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>Collaborate &amp; Create New Roll</DialogTitle>
              <DialogDescription>
                The {selectedRolls.length} selected rolls will be consumed. Fill out the form below to create the new, consolidated laminated roll.
              </DialogDescription>
            </DialogHeader>
            
            <Separator/>
            <DialogDescription>
                The following rolls will be consumed: {consumedByValue}
            </DialogDescription>
            
            <div className="grid grid-cols-2 gap-4">
               <FormField
                  control={form.control}
                  name="receivedSerialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received Roll No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter received Roll No" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="newSerialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Roll No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter new Roll No" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
            </div>
            
            <ScrollArea className="h-[50vh] p-4 border rounded-md">
                <LoomSheetForm
                    formContext={form}
                    hideFields={['serialNumber', 'status']}
                />
            </ScrollArea>

            <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
                <Button
                    type="submit"
                    size="lg"
                    disabled={form.formState.isSubmitting}
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
