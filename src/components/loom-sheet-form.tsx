"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import React, { useEffect } from "react";

import { loomSheetSchema, type LoomSheetData, fabricTypes, laminationTypes, colors } from "@/lib/schemas";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Label } from "./ui/label";

type HiddenField = keyof LoomSheetData;

interface LoomSheetFormProps {
  onFormSubmit?: (data: Omit<LoomSheetData, 'id' | 'productionDate'>) => void;
  defaultValues?: Partial<Omit<LoomSheetData, 'id' | 'productionDate'>>;
  hideFields?: HiddenField[];
  formContext?: UseFormReturn<any>;
}

export default function LoomSheetForm({ 
  onFormSubmit, 
  defaultValues, 
  hideFields = [], 
  formContext,
}: LoomSheetFormProps) {
  const { toast } = useToast();

  const internalForm = useForm<Omit<LoomSheetData, 'id' | 'productionDate'>>({
    resolver: zodResolver(loomSheetSchema.omit({ id: true, productionDate: true })),
    defaultValues: {
      serialNumber: "",
      operatorName: "",
      loomNo: "",
      width: undefined,
      gram: undefined,
      fabricType: "Slit",
      color: "Natural",
      lamination: "Unlammed",
      mtrs: undefined,
      gw: undefined,
      cw: undefined,
      ...defaultValues,
    },
  });

  const form = formContext || internalForm;

  const mtrs = form.watch('mtrs');
  const gw = form.watch('gw');
  const cw = form.watch('cw');
  const gram = form.watch('gram');
  const width = form.watch('width');
  const average = form.watch('average');

  useEffect(() => {
    const net = (gw || 0) - (cw || 0);
    form.setValue('nw', net > 0 ? parseFloat(net.toFixed(2)) : 0);

    if (net > 0 && mtrs > 0) {
      const avg = (net * 1000) / mtrs;
      form.setValue('average', parseFloat(avg.toFixed(2)));
      
       if(gram > 0 && width > 0) {
        const idealWeight = width * gram;
        const ub = idealWeight + (idealWeight * 0.05);
        const lb = idealWeight - (idealWeight * 0.05);
        form.setValue('variance', `UB: ${ub.toFixed(2)} / LB: ${lb.toFixed(2)}`);
      } else {
        form.setValue('variance', 'N/A');
      }

    } else {
      form.setValue('average', 0);
      form.setValue('variance', 'N/A');
    }
  }, [mtrs, gw, cw, gram, width, form]);


  const handleLocalSubmit = async (data: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    if (onFormSubmit) {
      onFormSubmit(data);
    }

    if (!formContext) { 
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Success!",
        description: "New loom data has been saved.",
      });
      form.reset();
    }
  };

  const isCard = !formContext;
  
  const shouldShow = (fieldName: HiddenField) => !hideFields.includes(fieldName);

  const FormFields = (
    <div className="space-y-8">
      {/* Top Fields */}
      <div className="grid md:grid-cols-3 gap-8">
        {shouldShow('serialNumber') && (
          <FormField
            control={form.control}
            name="serialNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Roll No</FormLabel>
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
      
      {/* Width Specs */}
      <h3 className="text-lg font-medium text-foreground">Width Specs</h3>
      <div className="grid md:grid-cols-3 gap-8 items-start">
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
        {shouldShow('gram') && (
          <FormField
            control={form.control}
            name="gram"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gram</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {shouldShow('fabricType') && (
          <FormField
            control={form.control}
            name="fabricType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Fabric Type</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                  >
                    {fabricTypes.map((type) => (
                      <FormItem key={type} className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value={type} id={`radio-fabric-${type}`} />
                        </FormControl>
                        <Label htmlFor={`radio-fabric-${type}`} className="font-normal cursor-pointer">{type}</Label>
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

      {/* Color and Lamination */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {shouldShow('color') && (
          <FormField
            control={form.control}
            name="color"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Color</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a color" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {colors.map(color => (
                        <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
      
      <Separator />
      
      {/* Measurements */}
      <h3 className="text-lg font-medium text-foreground">Measurements</h3>
      <div className="grid md:grid-cols-3 lg:grid-cols-3 gap-8">
          {shouldShow('mtrs') && (
            <FormField
                control={form.control}
                name="mtrs"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Meters</FormLabel>
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
                    <FormLabel>Gross Weight</FormLabel>
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
                    <FormLabel>Core Weight</FormLabel>
                    <FormControl>
                    <Input type="number" placeholder="0" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
          )}
      </div>

      {/* Auto-calculated fields */}
      <Card className="bg-muted/50">
        <CardHeader>
            <CardTitle className="text-xl">Calculated Values</CardTitle>
            <CardDescription>These values are calculated automatically based on your input.</CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-8">
            <FormItem>
                <FormLabel>Net Weight</FormLabel>
                <FormControl>
                <Input type="number" readOnly value={form.watch('nw') || 0} className="font-bold text-primary bg-background"/>
                </FormControl>
            </FormItem>
            <FormItem>
                <FormLabel>Average</FormLabel>
                <FormControl>
                <Input type="number" readOnly value={form.watch('average') || 0} className="font-bold text-primary bg-background"/>
                </FormControl>
            </FormItem>
            <FormItem>
                <FormLabel>Variance (UB/LB)</FormLabel>
                <FormControl>
                <Input readOnly value={form.watch('variance') || 'N/A'} className={cn("font-bold bg-background text-primary")} />
                </FormControl>
            </FormItem>
        </CardContent>
      </Card>
    </div>
  );

  const mainForm = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLocalSubmit)} className="space-y-8">
        {FormFields}
        {!formContext && (
          <div className="flex justify-end pt-4 space-x-2">
            <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
              {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              sub-Mit
            </Button>
          </div>
        )}
      </form>
    </Form>
  );

  if (isCard) {
    return (
      <Card className="max-w-4xl mx-auto shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-primary">New Roll Entry</CardTitle>
        </CardHeader>
        <CardContent>
          {mainForm}
        </CardContent>
      </Card>
    )
  }
  
  if (formContext) {
    return FormFields;
  }

  return mainForm;
}
