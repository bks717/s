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
import { LoomSheetData, loomSheetSchema, BagProductionData } from '@/lib/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';

interface PartialUseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string, bagData?: BagProductionData) => void;
  originalRoll: LoomSheetData;
  activeView: 'rolls' | 'bags';
}

const partialUseSchema = loomSheetSchema.omit({id: true, productionDate: true}).extend({
    consumedBy: z.string().min(1, 'Consumer name is required'),
});

type PartialUseFormData = Omit<LoomSheetData, 'id' | 'productionDate'> & { consumedBy: string };

export function PartialUseDialog({ isOpen, onClose, onConfirm, originalRoll, activeView }: PartialUseDialogProps) {
  const form = useForm<PartialUseFormData>({
    resolver: zodResolver(partialUseSchema),
    defaultValues: {
      ...originalRoll,
      mtrs: 0,
      gw: 0,
      cw: 0,
      nw: 0,
      average: 0,
      variance: 0,
      consumedBy: '',
      noOfBags: 0,
      avgBagWeight: 0,
      bagSize: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        ...originalRoll,
        mtrs: 0,
        gw: 0,
        cw: 0,
        nw: 0,
        average: 0,
        variance: 0,
        consumedBy: '',
        noOfBags: 0,
        avgBagWeight: 0,
        bagSize: '',
      });
    }
  }, [isOpen, originalRoll, form]);

  const onSubmit = (data: PartialUseFormData) => {
    const { consumedBy, noOfBags, avgBagWeight, bagSize, ...consumedPart } = data;
    
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
    if(consumedPart.nw > originalRoll.nw) {
        form.setError('nw', { type: 'manual', message: `Cannot consume more than available (${originalRoll.nw}).` });
        return;
    }

    if (activeView === 'bags') {
        onConfirm(consumedPart, consumedBy, { noOfBags, avgBagWeight, bagSize });
    } else {
        onConfirm(consumedPart, consumedBy);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Partial Use of Roll No: {originalRoll.rollNo}</DialogTitle>
          <DialogDescription>
            Enter the values for the portion of the roll being consumed. The original roll will be updated with the remaining values.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
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
                      name="lamination"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">
                              Lamination
                            </FormLabel>
                            <FormMessage />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Label>False</Label>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                disabled
                              />
                            </FormControl>
                            <Label>True</Label>
                          </div>
                        </FormItem>
                      )}
                    />
                 </div>
                 {activeView === 'bags' && (
                    <>
                        <Separator />
                        <DialogDescription>
                            Optionally, enter bag production details.
                        </DialogDescription>
                        <div className="grid md:grid-cols-3 gap-8">
                             <FormField
                                control={form.control}
                                name="noOfBags"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. of Bags</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : 0)} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="avgBagWeight"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Avg. Bag Weight</FormLabel>
                                    <FormControl>
                                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)} value={field.value ?? ''}/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="bagSize"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bag Size</FormLabel>
                                    <FormControl>
                                    <Input placeholder="e.g., 24x36" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                        </div>
                    </>
                 )}
                 <Separator />
                 <h3 className="text-lg font-medium text-foreground">Measurements of Consumed Part</h3>
                 <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                    <FormField
                        control={form.control}
                        name="mtrs"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Meters (Mtrs)</FormLabel>
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
                            <FormLabel>Gross Weight (G.W.)</FormLabel>
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
                            <FormLabel>Calc. Weight (C.W.)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="nw"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Net Weight (N.W.)</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="average"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Average</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="variance"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Variance</FormLabel>
                            <FormControl>
                            <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>

                <Separator />
                <h3 className="text-lg font-medium text-foreground">Original Roll Details (Read-only)</h3>
                 <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                     <FormItem>
                        <FormLabel>Original Meters</FormLabel>
                        <FormControl>
                            <Input readOnly value={originalRoll.mtrs} />
                        </FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original G.W.</FormLabel>
                        <FormControl>
                            <Input readOnly value={originalRoll.gw} />
                        </FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original C.W.</FormLabel>
                        <FormControl>
                            <Input readOnly value={originalRoll.cw} />
                        </FormControl>
                    </FormItem>
                     <FormItem>
                        <FormLabel>Original N.W.</FormLabel>
                        <FormControl>
                            <Input readOnly value={originalRoll.nw} />
                        </FormControl>
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
