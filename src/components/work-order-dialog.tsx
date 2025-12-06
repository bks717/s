
"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { PlusCircle, Trash2 } from 'lucide-react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { LoomSheetData, workOrderSchema, WorkOrderData, workOrderTypes } from '@/lib/schemas';
import { ScrollArea } from './ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';

interface WorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedRolls: LoomSheetData[];
  onSubmit: (data: Omit<WorkOrderData, 'id' | 'createdAt'>) => void;
}

type WorkOrderFormData = Omit<WorkOrderData, 'id' | 'createdAt'>;

export function WorkOrderDialog({ isOpen, onClose, selectedRolls, onSubmit }: WorkOrderDialogProps) {
  const { toast } = useToast();
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema.omit({ id: true, createdAt: true })),
    defaultValues: {
      customerName: '',
      parentPid: '',
      workOrderType: 'Rolls',
      childPids: [{ pid: '', rollId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'childPids',
  });
  
  const watchedChildPids = form.watch('childPids');

  useEffect(() => {
    if (isOpen) {
      form.reset({
        customerName: '',
        parentPid: '',
        workOrderType: 'Rolls',
        childPids: [{ pid: '', rollId: '' }],
      });
    }
  }, [isOpen, form]);
  
  const handleFormSubmit = (data: WorkOrderFormData) => {
    const selectedRollIds = new Set(data.childPids.map(p => p.rollId));
    if (selectedRollIds.size !== data.childPids.length) {
        toast({
            variant: 'destructive',
            title: 'Duplicate Roll Selection',
            description: 'The same roll cannot be used for multiple Child PIDs. Please select a unique roll for each entry.'
        });
        return;
    }
    onSubmit(data);
  };

  const availableRolls = selectedRolls.filter(
    roll => !watchedChildPids.some(p => p.rollId === roll.id)
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Work Order</DialogTitle>
          <DialogDescription>
            Enter the details for the work order. Selected rolls will be consumed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)}>
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter customer name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentPid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent PID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a unique parent PID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="workOrderType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex items-center space-x-4"
                        >
                          {workOrderTypes.map((type) => (
                            <FormItem key={type} className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value={type} id={`radio-wo-type-${type}`} />
                              </FormControl>
                              <Label htmlFor={`radio-wo-type-${type}`} className="font-normal cursor-pointer">{type}</Label>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Child PIDs</FormLabel>
                  <div className="space-y-4 mt-2">
                    {fields.map((field, index) => {
                      const currentRollId = watchedChildPids[index]?.rollId;
                      const currentRoll = selectedRolls.find(r => r.id === currentRollId);
                      return (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormField
                              control={form.control}
                              name={`childPids.${index}.pid`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormControl>
                                    <Input placeholder={`Child PID #${index + 1}`} {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`childPids.${index}.rollId`}
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a Roll No." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {currentRoll && <SelectItem value={currentRoll.id!}>{currentRoll.serialNumber}</SelectItem>}
                                            {availableRolls.map(roll => (
                                                <SelectItem key={roll.id} value={roll.id!}>
                                                    {roll.serialNumber}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => remove(index)}
                              disabled={fields.length <= 1}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                      );
                    })}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ pid: '', rollId: '' })}
                    disabled={fields.length >= selectedRolls.length}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Child PID
                  </Button>
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="pt-4">
              <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
              <Button type="submit">Submit</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
