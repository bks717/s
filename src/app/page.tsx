"use client";

import { useState } from 'react';
import LoomSheetForm from '@/components/loom-sheet-form';
import AdminSection from '@/components/admin-section';
import { LoomSheetData } from '@/lib/schemas';
import { loomDataStore as initialData } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [loomData, setLoomData] = useState<LoomSheetData[]>(initialData);

  const handleAddData = (newData: LoomSheetData) => {
    setLoomData(prevData => [...prevData, { ...newData, id: (Date.now()).toString() }]);
  };

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
          LoomSheet
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Efficiently track and analyze your loom production data. Fill out the form below to log a new roll.
        </p>
      </div>

      <LoomSheetForm onFormSubmit={handleAddData} />

      <Separator className="my-12" />

      <AdminSection data={loomData} />
    </main>
  );
}
