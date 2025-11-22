
import React, { useState, useEffect } from 'react';
import { z } from 'zod';
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
import { LoomSheetData, loomSheetSchema, laminationTypes, fabricTypes, colors } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface PartialUseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>) => void;
  originalRoll: LoomSheetData;
}

const partialUseSchema = loomSheetSchema.omit({id: true, productionDate: true, serialNumber: true}).extend({
    consumedBy: z.string().min(1, 'Consumer name is required'),
    soNumber: z.string().optional(),
    poNumber: z.string().optional(),
});

type PartialUseFormData = z.infer<typeof partialUseSchema>;

export function PartialUseDialog({ isOpen, onClose, onConfirm, originalRoll }: PartialUseDialogProps) {
  const [isAverageOutOfRange, setIsAverageOutOfRange] = useState(false);
  const form = useForm<PartialUseFormData>({
    resolver: zodResolver(partialUseSchema),
    defaultValues: {},
  });

  const mtrs = form.watch('mtrs');
  const gw = form.watch('gw');
  const cw = form.watch('cw');
  const gram = form.watch('gram');
  const width = form.watch('width');

  useEffect(() => {
    if (isOpen) {
      form.reset({
        ...originalRoll,
        consumedBy: '',
        soNumber: '',
        poNumber: '',
        mtrs: 0,
        gw: 0,
        cw: 0,
        nw: 0,
        average: 0,
        variance: 'N/A',
        noOfBags: 0,
        avgBagWeight: 0,
        bagSize: '',
      });
      setIsAverageOutOfRange(false);
    }
  }, [isOpen, originalRoll, form]);

  useEffect(() => {
    const net = (gw || 0) - (cw || 0);
    form.setValue('nw', net > 0 ? parseFloat(net.toFixed(2)) : 0);

    if (net > 0 && mtrs > 0) {
      const avg = (net * 1000) / mtrs;
      form.setValue('average', parseFloat(avg.toFixed(2)));

      if (gram > 0 && width > 0) {
        const idealWeight = width * gram;
        const ub = idealWeight + (idealWeight * 0.05);
        const lb = idealWeight - (idealWeight * 0.05);
        form.setValue('variance', `UB: ${ub.toFixed(2)} / LB: ${lb.toFixed(2)}`);
        setIsAverageOutOfRange(avg < lb || avg > ub);
      } else {
        form.setValue('variance', 'N/A');
        setIsAverageOutOfRange(false);
      }
    } else {
      form.setValue('average', 0);
       form.setValue('variance', 'N/A');
       setIsAverageOutOfRange(false);
    }
  }, [mtrs, gw, cw, gram, width, form]);


  const onSubmit = (data: PartialUseFormData) => {
    const { noOfBags, avgBagWeight, bagSize, ...consumedPart } = data;
    
    if(consumedPart.mtrs > originalRoll.mtrs) {
        form.setError('mtrs', { type: 'manual', message: `Cannot consume more than available (${originalRoll.mtrs}).` });
        return;
    }
    if(consumedPart.gw > originalRoll.gw) {
        form.setError('gw', { type: 'manual', message: `Cannot consume more than available (${originalRoll.gw}).` });
        return;
    }
    if(consumedPart.cw > originalRoll.cw) {
        form.setError('cw', { type: 'manual', message: `Cannot consume more than available (${originalRoll.cw}).` });
        return;
    }

    const finalConsumedPart = { ...consumedPart, serialNumber: originalRoll.serialNumber };

    onConfirm(finalConsumedPart);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Partial Use of Roll No: {originalRoll.serialNumber}</DialogTitle>
          <DialogDescription>
            Enter the values for the portion of the roll being consumed. The original roll will be updated.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-8">
                 <div className="grid md:grid-cols-3 gap-8">
                    <FormField
                        control={form.control}
                        name="consumedBy"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Consumed By</FormLabel>
                            <FormControl>
                            <Input placeholder="e.g., Customer Name" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="soNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>S/O Number</FormLabel>
                            <FormControl>
                            <Input placeholder="S/O Number" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="poNumber"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>P/O Number</FormLabel>
                            <FormControl>
                            <Input placeholder="P/O Number" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 </div>

                 <Separator />
                 <h3 className="text-lg font-medium text-foreground">Measurements of Consumed Part</h3>
                 <div className="grid md:grid-cols-3 gap-8">
                    <FormField
                        control={form.control}
                        name="mtrs"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Meters</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="gw"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gross Weight</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="cw"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Core Weight</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <div className={cn("grid md:grid-cols-3 gap-8 p-4 rounded-md bg-muted/50", { "bg-destructive/20": isAverageOutOfRange })}>
                     <FormItem>
                        <FormLabel>Net Weight</FormLabel>
                        <FormControl><Input readOnly value={form.watch('nw') || 0} /></FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Average</FormLabel>
                        <FormControl><Input readOnly value={form.watch('average') || 0} /></FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Variance (UB/LB)</FormLabel>
                        <FormControl><Input readOnly value={form.watch('variance') || 'N/A'} className={cn({"text-destructive font-bold": isAverageOutOfRange})}/></FormControl>
                    </FormItem>
                </div>


                <Separator />
                <h3 className="text-lg font-medium text-foreground">Original Roll Details (Read-only)</h3>
                 <div className="grid md:grid-cols-4 gap-8">
                     <FormItem>
                        <FormLabel>Original Meters</FormLabel>
                        <FormControl><Input readOnly value={originalRoll.mtrs} /></FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original Gross</FormLabel>
                        <FormControl><Input readOnly value={originalRoll.gw} /></FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original Core</FormLabel>
                        <FormControl><Input readOnly value={originalRoll.cw} /></FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original Net</FormLabel>
                        <FormControl><Input readOnly value={originalRoll.nw} /></FormControl>
                    </FormItem>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit">Confirm Partial Use</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
