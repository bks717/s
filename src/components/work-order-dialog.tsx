
"use client";

import React, { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { LoomSheetData } from '@/lib/schemas';
import { ScrollArea } from './ui/scroll-area';

interface WorkOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workOrderRolls: LoomSheetData[];
  selectedRolls: LoomSheetData[];
  onSubmit: (data: any) => void;
}

const childPidSchema = z.object({
  pid: z.string().min(1, "Child PID is required."),
  rollId: z.string().min(1, "Please select a roll."),
});

const workOrderSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required.'),
  parentPid: z.string().min(1, 'Parent PID is required.'),
  childPids: z.array(childPidSchema).min(1, "At least one Child PID is required."),
});

type WorkOrderFormData = z.infer<typeof workOrderSchema>;

export function WorkOrderDialog({ isOpen, onClose, workOrderRolls, selectedRolls, onSubmit }: WorkOrderDialogProps) {
  const form = useForm<WorkOrderFormData>({
    resolver: zodResolver(workOrderSchema),
    defaultValues: {
      customerName: '',
      parentPid: '',
      childPids: [{ pid: '', rollId: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'childPids',
  });

  useEffect(() => {
    if (isOpen) {
      form.reset({
        customerName: '',
        parentPid: '',
        childPids: [{ pid: '', rollId: '' }],
      });
    }
  }, [isOpen, form]);

  const availableRolls = workOrderRolls.filter(roll => selectedRolls.some(selected => selected.id === roll.id));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Process Work Order</DialogTitle>
          <DialogDescription>
            Enter the details for the work order. Selected rolls will be processed.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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

                <div>
                  <FormLabel>Child PIDs</FormLabel>
                  <div className="space-y-4 mt-2">
                    {fields.map((field, index) => (
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
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a Roll No." />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
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
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => append({ pid: '', rollId: '' })}
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
