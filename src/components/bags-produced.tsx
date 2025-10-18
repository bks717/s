"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoomSheetData } from '@/lib/schemas';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface BagsProducedProps {
  data: LoomSheetData[];
}

export default function BagsProduced({ data }: BagsProducedProps) {
  const columns = [
    { key: 'productionDate', label: 'Consumption Date' },
    { key: 'rollNo', label: 'Source Roll No.' },
    { key: 'consumedBy', label: 'Consumed By' },
    { key: 'noOfBags', label: 'No. of Bags' },
    { key: 'avgBagWeight', label: 'Avg. Bag Wt.' },
    { key: 'bagSize', label: 'Bag Size' },
    { key: 'mtrs', label: 'Mtrs Consumed' },
    { key: 'nw', label: 'N.W. Consumed' },
  ];

  return (
    <section id="bags-produced">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
          Bags Produced
        </h2>
        <p className="mt-1 text-md text-muted-foreground">
          A log of all bag production details from consumed rolls.
        </p>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Production Log</CardTitle>
          <CardDescription>
            This table shows the details of bags produced from consumed fabric rolls.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map(col => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length > 0 ? (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      {columns.map(col => (
                        <TableCell key={`${item.id}-${col.key}`} className="p-2 text-xs whitespace-nowrap">
                          {col.key === 'productionDate' && item[col.key] 
                            ? format(new Date(item[col.key] as Date), 'PP') 
                            : String(item[col.key as keyof LoomSheetData] ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No bag production data available.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
