
"use client";

import { useState } from 'react';
import LoomSheetForm from '@/components/loom-sheet-form';
import AdminSection from '@/components/admin-section';
import { LoomSheetData, BagProductionData, ConsumedByData } from '@/lib/schemas';
import { loomDataStore as initialData } from '@/lib/data';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const [allData, setAllData] = useState<LoomSheetData[]>(initialData);

  const handleAddData = (newData: LoomSheetData) => {
    setAllData(prevData => [...prevData, { ...newData, id: (Date.now()).toString(), productionDate: new Date(), status: 'Ready for Lamination' }]);
  };

  const handleImportData = (importedData: LoomSheetData[]) => {
    const newLoomData = importedData.map(d => ({ ...d, id: (Date.now() + Math.random()).toString(), productionDate: new Date(), status: d.status || 'Ready for Lamination' }));
    setAllData(prevData => [...prevData, ...newLoomData]);
  };
  
  const handleMarkAsConsumed = (selectedIds: string[], consumptionData: ConsumedByData) => {
    setAllData(prevData =>
      prevData.map(item =>
        selectedIds.includes(item.id!)
          ? { ...item, status: 'Consumed', ...consumptionData }
          : item
      )
    );
  };

  const handlePartialConsume = (originalId: string, consumedPartData: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    const originalRoll = allData.find(item => item.id === originalId);
    if (!originalRoll) return;

    const newConsumedRoll: LoomSheetData = {
      ...consumedPartData,
      id: (Date.now() + Math.random()).toString(),
      productionDate: new Date(),
      status: 'Consumed',
    };
    
    setAllData(prevData => {
      const updatedData = prevData.map(item => {
        if (item.id === originalId) {
          const remainingMtrs = (item.mtrs || 0) - (consumedPartData.mtrs || 0);
          const remainingGw = (item.gw || 0) - (consumedPartData.gw || 0);
          const remainingCw = item.cw || 0;
          const remainingNw = remainingGw - remainingCw;
          
          let remainingAverage = 0;
          let remainingVariance = 'N/A';

          if (remainingNw > 0 && remainingMtrs > 0) {
            remainingAverage = parseFloat(((remainingNw * 1000) / remainingMtrs).toFixed(2));
          }
          
          if (remainingAverage > 0 && item.width && item.gram) {
            const idealWeight = item.width * item.gram;
            const ub = idealWeight + (idealWeight * 0.05);
            const lb = idealWeight - (idealWeight * 0.05);
            remainingVariance = `UB: ${ub.toFixed(2)} / LB: ${lb.toFixed(2)}`;
          }

          const updatedRemainingRoll: LoomSheetData = {
            ...item,
            mtrs: remainingMtrs,
            gw: remainingGw,
            cw: remainingCw,
            nw: remainingNw,
            average: remainingAverage,
            variance: remainingVariance,
            status: 'Partially Consumed'
          };
          
          if (updatedRemainingRoll.mtrs <= 0 && updatedRemainingRoll.gw <= 0) {
             return { ...updatedRemainingRoll, status: 'Consumed', mtrs: 0, gw: 0, cw: 0, nw: 0, average: 0, variance: 'N/A' };
          }
          return updatedRemainingRoll;
        }
        return item;
      });
      return [...updatedData, newConsumedRoll];
    });
  };

  const handleSendForLamination = (rollsToUpdate: { id: string; callOut: string }[]) => {
    setAllData(prevData => prevData.map(item => {
      const updateInfo = rollsToUpdate.find(update => update.id === item.id);
      if (updateInfo) {
        return { ...item, status: 'Sent for Lamination', callOut: updateInfo.callOut };
      }
      return item;
    }));
  };
  
  const handleMarkAsReceived = (selectedIds: string[], newSerialNumber?: string, receivedSerialNumber?: string) => {
     if (selectedIds.length === 1 && newSerialNumber && receivedSerialNumber) {
        const oldRollId = selectedIds[0];
        const oldRoll = allData.find(item => item.id === oldRollId);
        if (!oldRoll) return;

        const newRoll: LoomSheetData = {
            ...oldRoll,
            id: (Date.now()).toString(),
            serialNumber: newSerialNumber,
            receivedSerialNumber: receivedSerialNumber,
            productionDate: new Date(),
            lamination: 'Lam active',
            status: 'Laminated'
        };

        setAllData(prevData => {
            const updatedData = prevData.map(item => {
                if (item.id === oldRollId) {
                    return { 
                        ...item, 
                        status: 'Consumed', 
                        consumedBy: `Lam:\nNew Roll No. ${newSerialNumber}\nReceived Roll No: ${receivedSerialNumber}` 
                    };
                }
                return item;
            });
            return [...updatedData, newRoll];
        });
     } else {
        setAllData(prevData => prevData.map(item => {
          if (selectedIds.includes(item.id!)) {
            return { ...item, status: 'Laminated' };
          }
          return item;
        }));
     }
  };

  const handleMarkAsLaminated = (selectedIds: string[]) => {
    setAllData(prevData => prevData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Laminated' };
      }
      return item;
    }));
  };

  const handleCollaborateAndCreate = (selectedIds: string[], newRollData: LoomSheetData) => {
    const consumedRolls = allData.filter(item => selectedIds.includes(item.id!));
    const consumedByValue = consumedRolls.map(r => r.serialNumber).join(', ');

    const newRoll: LoomSheetData = {
      ...newRollData,
      id: (Date.now()).toString(),
      productionDate: new Date(),
      lamination: 'Lam active',
      status: newRollData.status || 'Laminated',
    };
    
    setAllData(prevData => {
      const updatedData = prevData.map(item => {
        if (selectedIds.includes(item.id!)) {
          return { ...item, status: 'Consumed', consumedBy: `Collaborated into ${newRollData.serialNumber}` };
        }
        return item;
      });
      return [...updatedData, newRoll];
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
        allData={allData}
        onImport={handleImportData}
        onMarkAsConsumed={handleMarkAsConsumed}
        onPartialConsume={handlePartialConsume}
        onSendForLamination={handleSendForLamination}
        onMarkAsReceived={handleMarkAsReceived}
        onMarkAsLaminated={handleMarkAsLaminated}
        onCollaborateAndCreate={handleCollaborateAndCreate}
      />
    </main>
  );
}
