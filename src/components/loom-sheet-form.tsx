"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { loomSheetSchema, type LoomSheetData } from "@/lib/schemas";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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

interface LoomSheetFormProps {
  onFormSubmit: (data: LoomSheetData) => void;
}

export default function LoomSheetForm({ onFormSubmit }: LoomSheetFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<LoomSheetData>({
    resolver: zodResolver(loomSheetSchema),
    defaultValues: {
      primaryColumn: "",
      operatorName: "",
      rollNo: undefined,
      width: undefined,
      number1: undefined,
      number2: undefined,
      grSut: "",
      color: "",
      lamUnlam: "Laminated",
      mtrs: undefined,
      gw: undefined,
      cw: undefined,
      nw: undefined,
      average: undefined,
      loomNo: "",
      productionDate: new Date(),
      variance: undefined,
    },
  });

  async function onSubmit(data: LoomSheetData) {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onFormSubmit(data);
    toast({
      title: "Success!",
      description: "New loom data has been saved.",
    });
    form.reset();
    setIsSubmitting(false);
  }

  return (
    <Card className="max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-headline text-primary">New Roll Entry</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid md:grid-cols-2 gap-8">
              <FormField
                control={form.control}
                name="primaryColumn"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Column</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fabric Type A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="operatorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operator Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FormField
                control={form.control}
                name="rollNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll No.</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="loomNo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loom No.</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., L-14" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <h3 className="text-lg font-medium text-foreground">Width & Specification Details</h3>
            <div className="grid md:grid-cols-3 gap-8">
               <FormField
                control={form.control}
                name="width"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Width</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 150" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number 1</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="number2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number 2</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="grSut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gr/Sut</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 120 GSM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Royal Blue" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lamUnlam"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lamination</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select lamination status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Laminated">Laminated</SelectItem>
                        <SelectItem value="Unlaminated">Unlaminated</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
            
            <h3 className="text-lg font-medium text-foreground">Measurements</h3>
            <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-8">
                <FormField
                    control={form.control}
                    name="mtrs"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Meters (Mtrs)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="e.g., 500" {...field} />
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
                        <Input type="number" placeholder="e.g., 550" {...field} />
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
                        <Input type="number" placeholder="e.g., 540" {...field} />
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
                        <Input type="number" placeholder="e.g., 520" {...field} />
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
                        <Input type="number" placeholder="e.g., 480" {...field} />
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
                        <Input type="number" placeholder="e.g., -1.5" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isSubmitting} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit Data
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
