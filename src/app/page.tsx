"use client";

import { useState } from 'react';
import LoomSheetForm from '@/components/loom-sheet-form';
import AdminSection from '@/components/admin-section';
import { LoomSheetData } from '@/lib/schemas';
import { loomDataStore as initialData } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [loomData, setLoomData] = useState<LoomSheetData[]>(initialData);
  const [consumedData, setConsumedData] = useState<LoomSheetData[]>([]);

  const handleAddData = (newData: LoomSheetData) => {
    setLoomData(prevData => [...prevData, { ...newData, id: (Date.now()).toString(), productionDate: new Date() }]);
  };

  const handleImportData = (importedData: LoomSheetData[]) => {
    const newLoomData = importedData.map(d => ({ ...d, id: (Date.now() + Math.random()).toString(), productionDate: new Date() }));
    setLoomData(prevData => [...prevData, ...newLoomData]);
  };
  
  const handleMarkAsConsumed = (selectedIds: string[], consumedBy: string) => {
    const itemsToMove = loomData.filter(item => selectedIds.includes(item.id!));
    const updatedItemsToMove = itemsToMove.map(item => ({...item, consumedBy}));
    setConsumedData(prev => [...prev, ...updatedItemsToMove]);
    setLoomData(prev => prev.filter(item => !selectedIds.includes(item.id!)));
  };

  const handlePartialConsume = (originalId: string, consumedPartData: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string) => {
    // This is the new part that goes into the "Consumed" table
    const newConsumedRoll: LoomSheetData = {
      ...consumedPartData,
      id: (Date.now() + Math.random()).toString(),
      productionDate: new Date(),
      consumedBy,
    };
    setConsumedData(prev => [...prev, newConsumedRoll]);

    // This updates the original roll in the "Remaining" table
    setLoomData(prevData => {
      const originalRoll = prevData.find(item => item.id === originalId);
      if (!originalRoll) return prevData;

      const updatedRemainingRoll: LoomSheetData = {
        ...originalRoll,
        mtrs: originalRoll.mtrs - (consumedPartData.mtrs || 0),
        gw: originalRoll.gw - (consumedPartData.gw || 0),
        cw: originalRoll.cw - (consumedPartData.cw || 0),
        nw: originalRoll.nw - (consumedPartData.nw || 0),
      };
      
      // If the roll is fully consumed, remove it from remaining data
      if (updatedRemainingRoll.mtrs <= 0 && updatedRemainingRoll.gw <=0) {
        return prevData.filter(item => item.id !== originalId);
      }

      return prevData.map(item => item.id === originalId ? updatedRemainingRoll : item);
    });
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

      <AdminSection 
        remainingData={loomData}
        consumedData={consumedData} 
        onImport={handleImportData}
        onMarkAsConsumed={handleMarkAsConsumed}
        onPartialConsume={handlePartialConsume}
      />
    </main>
  );
}
