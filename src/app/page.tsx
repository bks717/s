"use client";

import { useState } from 'react';
import LoomSheetForm from '@/components/loom-sheet-form';
import AdminSection from '@/components/admin-section';
import { LoomSheetData, BagProductionData } from '@/lib/schemas';
import { loomDataStore as initialData } from '@/lib/data';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

type View = 'rolls' | 'bags';

export default function Home() {
  const [activeView, setActiveView] = useState<View>('rolls');
  const [allData, setAllData] = useState<LoomSheetData[]>(initialData);

  const handleAddData = (newData: LoomSheetData) => {
    setAllData(prevData => [...prevData, { ...newData, id: (Date.now()).toString(), productionDate: new Date() }]);
  };

  const handleImportData = (importedData: LoomSheetData[]) => {
    const newLoomData = importedData.map(d => ({ ...d, id: (Date.now() + Math.random()).toString(), productionDate: new Date(), status: d.status || 'Active Stock' }));
    setAllData(prevData => [...prevData, ...newLoomData]);
  };
  
  const handleMarkAsConsumed = (selectedIds: string[], consumedBy: string, bagData?: BagProductionData) => {
    setAllData(prevData =>
      prevData.map(item =>
        selectedIds.includes(item.id!)
          ? { ...item, status: 'Consumed', consumedBy, ...(bagData || {}) }
          : item
      )
    );
  };

  const handlePartialConsume = (originalId: string, consumedPartData: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string, bagData?: BagProductionData) => {
    const originalRoll = allData.find(item => item.id === originalId);
    if (!originalRoll) return;

    const newConsumedRoll: LoomSheetData = {
      ...consumedPartData,
      id: (Date.now() + Math.random()).toString(),
      productionDate: new Date(),
      status: 'Consumed',
      consumedBy,
      ...(bagData || {})
    };
    
    setAllData(prevData => {
      const updatedData = prevData.map(item => {
        if (item.id === originalId) {
          const updatedRemainingRoll: LoomSheetData = {
            ...item,
            mtrs: (item.mtrs || 0) - (consumedPartData.mtrs || 0),
            gw: (item.gw || 0) - (consumedPartData.gw || 0),
            cw: (item.cw || 0) - (consumedPartData.cw || 0),
            nw: (item.nw || 0) - (consumedPartData.nw || 0),
          };
          // If the roll is fully consumed, mark it as such instead of deleting
          if (updatedRemainingRoll.mtrs <= 0 && updatedRemainingRoll.gw <= 0) {
             return { ...updatedRemainingRoll, status: 'Consumed', mtrs: 0, gw: 0, cw: 0, nw: 0 };
          }
          return updatedRemainingRoll;
        }
        return item;
      });
      return [...updatedData, newConsumedRoll];
    });
  };

  const handleSendForLamination = (selectedIds: string[]) => {
    setAllData(prevData => prevData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Sent for Lamination' };
      }
      return item;
    }));
  };
  
  const handleMarkAsReceived = (selectedIds: string[]) => {
     setAllData(prevData => prevData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Received from Lamination' };
      }
      return item;
    }));
  };

  const handleReturnToStock = (selectedIds: string[]) => {
    setAllData(prevData => prevData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Active Stock', lamination: true };
      }
      return item;
    }));
  };

  const handleCollaborateAndCreate = (selectedIds: string[], newRollData: LoomSheetData) => {
    const newRoll: LoomSheetData = {
      ...newRollData,
      id: (Date.now()).toString(),
      productionDate: new Date(),
      lamination: true,
      status: 'Active Stock'
    };
    
    setAllData(prevData => {
      const updatedData = prevData.map(item => {
        if (selectedIds.includes(item.id!)) {
          return { ...item, status: 'Consumed', consumedBy: newRoll.serialNumber };
        }
        return item;
      });
      return [...updatedData, newRoll];
    });
  };

  const remainingData = allData.filter(d => d.status !== 'Consumed');
  const consumedData = allData.filter(d => d.status === 'Consumed');
  const bagsProducedData = consumedData.filter(d => d.noOfBags && d.noOfBags > 0);

  return (
    <main className="container mx-auto p-4 md:p-8">
      <div className="flex justify-center gap-4 mb-8">
        <Button 
          variant={activeView === 'bags' ? 'default' : 'outline'} 
          onClick={() => setActiveView('bags')}
          className="px-8 py-2 text-lg"
        >
          Bags
        </Button>
        <Button 
          variant={activeView === 'rolls' ? 'default' : 'outline'} 
          onClick={() => setActiveView('rolls')}
          className="px-8 py-2 text-lg"
        >
          Rolls
        </Button>
      </div>

      {activeView === 'rolls' && (
        <>
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
              LoomSheet - Rolls
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
              Efficiently track and analyze your loom production data. Fill out the form below to log a new roll.
            </p>
          </div>

          <LoomSheetForm onFormSubmit={handleAddData} />

          <Separator className="my-12" />

          <AdminSection 
            activeView={activeView}
            allData={allData}
            onImport={handleImportData}
            onMarkAsConsumed={handleMarkAsConsumed}
            onPartialConsume={handlePartialConsume}
            onSendForLamination={handleSendForLamination}
            onMarkAsReceived={handleMarkAsReceived}
            onReturnToStock={handleReturnToStock}
            onCollaborateAndCreate={handleCollaborateAndCreate}
            bagsProducedData={bagsProducedData}
          />
        </>
      )}

      {activeView === 'bags' && (
        <>
          <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
              LoomSheet - Bags
            </h1>
            <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
              View remaining rolls and manage bag production.
            </p>
          </div>
          
          <Separator className="my-12" />

          <AdminSection 
            activeView={activeView}
            allData={allData}
            onImport={handleImportData}
            onMarkAsConsumed={handleMarkAsConsumed}
            onPartialConsume={handlePartialConsume}
            onSendForLamination={handleSendForLamination}
            onMarkAsReceived={handleMarkAsReceived}
            onReturnToStock={handleReturnToStock}
            onCollaborateAndCreate={handleCollaborateAndCreate}
            bagsProducedData={bagsProducedData}
          />
        </>
      )}
    </main>
  );
}
