"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { loomSheetSchema, type LoomSheetData, statuses } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import React from "react";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";

type HiddenField = keyof LoomSheetData;

interface LoomSheetFormProps {
  onFormSubmit: (data: Omit<LoomSheetData, 'id' | 'productionDate'>) => void;
  defaultValues?: Partial<Omit<LoomSheetData, 'id' | 'productionDate'>>;
  isSubmitting?: boolean;
  hideFields?: HiddenField[];
  onCancel?: () => void;
  formContext?: UseFormReturn<Omit<LoomSheetData, 'id' | 'productionDate'>>;
  showSubmitButton?: boolean;
}

export default function LoomSheetForm({ 
  onFormSubmit, 
  defaultValues, 
  isSubmitting: isSubmittingProp, 
  hideFields = [], 
  onCancel,
  formContext,
  showSubmitButton = true
}: LoomSheetFormProps) {
  const { toast } = useToast();

  const internalForm = useForm<Omit<LoomSheetData, 'id' | 'productionDate'>>({
    resolver: zodResolver(loomSheetSchema.omit({ id: true, productionDate: true })),
    defaultValues: {
      serialNumber: "",
      operatorName: "",
      rollNo: undefined,
      width: undefined,
      number1: undefined,
      number2: undefined,
      grSut: "",
      color: "",
      lamination: false,
      status: "Active Stock",
      mtrs: undefined,
      gw: undefined,
      cw: undefined,
      nw: undefined,
      average: undefined,
      loomNo: "",
      variance: undefined,
      ...defaultValues,
    },
  });

  const form = formContext || internalForm;

  async function onSubmit(data: Omit<LoomSheetData, 'id' | 'productionDate'>) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onFormSubmit(data);

    if (!formContext) { // Only show toast and reset for top-level forms
      toast({
        title: "Success!",
        description: "New loom data has been saved.",
      });
      form.reset();
    }
  }

  const isCard = !formContext;
  const finalIsSubmitting = isSubmittingProp !== undefined ? isSubmittingProp : form.formState.isSubmitting;
  
  const shouldShow = (fieldName: HiddenField) => !hideFields.includes(fieldName);

  const FormFields = (
    <>
      <div className="space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          {shouldShow('serialNumber') && (
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., A-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {shouldShow('operatorName') && (
            <FormField
              control={form.control}
              name="operatorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator Name</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an operator" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="a">a</SelectItem>
                      <SelectItem value="b">b</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {shouldShow('rollNo') && (
            <FormField
              control={form.control}
              name="rollNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Roll No.</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {shouldShow('loomNo') && (
            <FormField
              control={form.control}
              name="loomNo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loom No.</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., L-14" {...field} value={field.value ?? ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <Separator />
        
        <h3 className="text-lg font-medium text-foreground">Width & Specification Details</h3>
        <div className="grid md:grid-cols-3 gap-8">
           {shouldShow('width') && (
             <FormField
              control={form.control}
              name="width"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Width</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
           )}
          {shouldShow('number1') && (
            <FormField
              control={form.control}
              name="number1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number 1</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {shouldShow('number2') && (
            <FormField
              control={form.control}
              name="number2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Number 2</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {shouldShow('grSut') && (
            <FormField
              control={form.control}
              name="grSut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gr/Sut</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 120 GSM" {...field} value={field.value ?? ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          {shouldShow('color') && (
            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Royal Blue" {...field} value={field.value ?? ''}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {shouldShow('lamination') && (
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
                        disabled={defaultValues?.lamination}
                      />
                    </FormControl>
                    <Label>True</Label>
                  </div>
                </FormItem>
              )}
            />
          )}
          {shouldShow('status') && (
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-wrap items-center gap-x-6 gap-y-2"
                    >
                      {statuses.filter(s => s !== 'Consumed').map((status) => (
                        <FormItem key={status} className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={status} id={`radio-${status}`} />
                          </FormControl>
                          <Label htmlFor={`radio-${status}`} className="font-normal cursor-pointer">{status}</Label>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        
        <Separator />
        
        <h3 className="text-lg font-medium text-foreground">Measurements</h3>
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
            {shouldShow('mtrs') && (
              <FormField
                  control={form.control}
                  name="mtrs"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Meters (Mtrs)</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
            {shouldShow('gw') && (
              <FormField
                  control={form.control}
                  name="gw"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Gross Weight (G.W.)</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
            {shouldShow('cw') && (
              <FormField
                  control={form.control}
                  name="cw"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Calc. Weight (C.W.)</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
            {shouldShow('nw') && (
              <FormField
                  control={form.control}
                  name="nw"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Net Weight (N.W.)</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
            {shouldShow('average') && (
              <FormField
                  control={form.control}
                  name="average"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Average</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
            )}
             {shouldShow('variance') && (
               <FormField
                  control={form.control}
                  name="variance"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Variance</FormLabel>
                      <FormControl>
                      <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
                  )}
              />
             )}
        </div>

        {showSubmitButton && (
          <div className="flex justify-end pt-4 space-x-2">
            {onCancel && <Button variant="outline" type="button" onClick={onCancel}>Cancel</Button>}
            <Button type="submit" size="lg" disabled={finalIsSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {finalIsSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              sub-Mit
            </Button>
          </div>
        )}
      </div>
    </>
  );

  if (isCard) {
    return (
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">New Roll Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {FormFields}
            </form>
          </Form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
        {/* We don't render the <form> tag here, because it's used in a dialog that has its own form */}
        {FormFields}
    </Form>
  )
}
