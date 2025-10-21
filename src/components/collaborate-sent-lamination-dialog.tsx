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

// We create a new schema for this specific form that includes the extra fields
const collaborateSchema = loomSheetSchema.omit({ id: true, productionDate: true, serialNumber: true }).extend({
    newSerialNumber: z.string().min(1, 'New Serial Number is required.'),
    receivedSerialNumber: z.string().optional(),
});

type CollaborateFormData = z.infer<typeof collaborateSchema>;


export function CollaborateSentLaminationDialog({ isOpen, onClose, selectedRolls, onConfirm }: CollaborateSentLaminationDialogProps) {
  
  const form = useForm<CollaborateFormData>({
    resolver: zodResolver(collaborateSchema),
    defaultValues: {
      lamination: true,
      status: 'Received from Lamination',
      newSerialNumber: '',
      receivedSerialNumber: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        lamination: true,
        status: 'Received from Lamination',
        newSerialNumber: '',
        receivedSerialNumber: '',
        // Reset other fields as needed
        operatorName: '',
        rollNo: undefined,
        width: undefined,
        number1: undefined,
        number2: undefined,
        grSut: '',
        color: '',
        mtrs: undefined,
        gw: undefined,
        cw: undefined,
        nw: undefined,
        average: undefined,
        loomNo: '',
        variance: undefined,
      });
    }
  }, [isOpen, form]);

  const onSubmit = (data: CollaborateFormData) => {
    const { newSerialNumber, ...rest } = data;
    const finalData = {
        ...rest,
        serialNumber: newSerialNumber,
        productionDate: new Date(),
        id: Date.now().toString(),
    };
    onConfirm(finalData);
  }

  const consumedByValue = selectedRolls.map(r => r.serialNumber).join(', ');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Collaborate &amp; Create New Roll</DialogTitle>
              <DialogDescription>
                The {selectedRolls.length} selected rolls will be consumed. Fill out the form below to create the new, consolidated laminated roll.
              </DialogDescription>
            </DialogHeader>
            
            <Separator className="my-4"/>
            <DialogDescription className="mb-4">
                The following rolls will be consumed: {consumedByValue}
            </DialogDescription>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
               <FormField
                  control={form.control}
                  name="receivedSerialNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Received S.No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter received S/N" {...field} />
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
                      <FormLabel>New S.No</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter new S/N" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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