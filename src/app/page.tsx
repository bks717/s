
"use client";

import { useState, useEffect, useCallback } from 'react';
import LoomSheetForm from '@/components/loom-sheet-form';
import AdminSection from '@/components/admin-section';
import { LoomSheetData, ConsumedByData } from '@/lib/schemas';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [allData, setAllData] = useState<LoomSheetData[]>([]);
  const [history, setHistory] = useState<LoomSheetData[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/api/loom-data');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      const data = await response.json();
      const typedData = data.map((d: any) => ({
        ...d,
        productionDate: new Date(d.productionDate),
      }));
      setAllData(typedData);
      setHistory([typedData]); // Initialize history
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load data from local storage.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updateData = async (updatedData: LoomSheetData[]) => {
    try {
      const response = await fetch('/api/loom-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData, null, 2),
      });
      if (!response.ok) {
        throw new Error('Failed to save data');
      }
      // Add current state to history before updating
      setHistory(prevHistory => [...prevHistory, allData]);
      setAllData(updatedData);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error saving data',
        description: 'Could not save data to local storage.',
      });
    }
  };

  const handleUndo = () => {
    if (history.length > 1) {
      const previousState = history[history.length - 1];
      updateData(previousState); // This will save the "undone" state but also push the current state to history again. Let's fix that.
      
      const lastState = history[history.length - 1];
      const newHistory = history.slice(0, history.length - 1);

      fetch('/api/loom-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lastState, null, 2),
      }).then(res => {
        if(res.ok) {
            setAllData(lastState);
            setHistory(newHistory);
            toast({
              title: 'Undo Successful',
              description: 'The last action has been reverted.',
            });
        } else {
            throw new Error('Failed to save undone data');
        }
      }).catch(error => {
         console.error(error);
          toast({
            variant: 'destructive',
            title: 'Undo Failed',
            description: 'Could not revert the last action.',
          });
      });
    }
  };

  const handleAddData = (newData: LoomSheetData) => {
    const newEntry = { ...newData, id: (Date.now()).toString(), productionDate: new Date(), status: 'Ready for Lamination' as const };
    const updatedData = [...allData, newEntry];
    updateData(updatedData);
  };

  const handleImportData = (importedData: LoomSheetData[]) => {
    const newLoomData = importedData.map(d => ({ ...d, id: (Date.now() + Math.random()).toString(), productionDate: new Date(), status: d.status || 'Ready for Lamination' as const }));
    const updatedData = [...allData, ...newLoomData];
    updateData(updatedData);
  };
  
  const handleMarkAsConsumed = (selectedIds: string[], consumptionData: ConsumedByData) => {
    const updatedData = allData.map(item =>
      selectedIds.includes(item.id!)
        ? { ...item, status: 'Consumed' as const, productionDate: new Date(), ...consumptionData }
        : item
    );
    updateData(updatedData);
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
    
    let finalData = allData;

    const updatedData = finalData.map(item => {
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
          status: 'Partially Consumed',
          productionDate: new Date(),
        };
        
        if (updatedRemainingRoll.mtrs <= 0 && updatedRemainingRoll.gw <= 0) {
           return { ...updatedRemainingRoll, status: 'Consumed' as const, productionDate: new Date(), mtrs: 0, gw: 0, cw: 0, nw: 0, average: 0, variance: 'N/A' };
        }
        return updatedRemainingRoll;
      }
      return item;
    });

    finalData = [...updatedData, newConsumedRoll];
    updateData(finalData);
  };

  const handleSendForLamination = (rollsToUpdate: { id: string; callOut: string }[]) => {
    const updatedData = allData.map(item => {
      const updateInfo = rollsToUpdate.find(update => update.id === item.id);
      if (updateInfo) {
        return { ...item, status: 'Sent for Lamination' as const, productionDate: new Date(), callOut: updateInfo.callOut };
      }
      return item;
    });
    updateData(updatedData);
  };
  
  const handleMarkAsReceived = (selectedIds: string[], newSerialNumber?: string, receivedSerialNumber?: string) => {
     let updatedData = [...allData];
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

        updatedData = allData.map(item => {
            if (item.id === oldRollId) {
                return { 
                    ...item, 
                    status: 'Consumed' as const,
                    productionDate: new Date(),
                    consumedBy: `Lam:\nNew Roll No. ${newSerialNumber}\nReceived Roll No: ${receivedSerialNumber}` 
                };
            }
            return item;
        });
        updatedData.push(newRoll);
     } else {
        updatedData = allData.map(item => {
          if (selectedIds.includes(item.id!)) {
            return { ...item, status: 'Laminated' as const, productionDate: new Date() };
          }
          return item;
        });
     }
     updateData(updatedData);
  };

  const handleMarkAsLaminated = (selectedIds: string[]) => {
    const updatedData = allData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Laminated' as const, productionDate: new Date() };
      }
      return item;
    });
    updateData(updatedData);
  };

  const handleCollaborateAndCreate = (selectedIds: string[], newRollData: LoomSheetData) => {
    const newRoll: LoomSheetData = {
      ...newRollData,
      id: (Date.now()).toString(),
      productionDate: new Date(),
      lamination: 'Lam active',
      status: newRollData.status || 'Laminated',
    };
    
    let updatedData = allData.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, status: 'Consumed' as const, productionDate: new Date(), consumedBy: `Collaborated into ${newRollData.serialNumber}` };
      }
      return item;
    });
    updatedData.push(newRoll);
    updateData(updatedData);
  };

  const handleSendForWorkOrder = (selectedIds: string[]) => {
    const updatedData = allData.map(item =>
      selectedIds.includes(item.id!)
        ? { ...item, status: 'For Work Order' as const, productionDate: new Date() }
        : item
    );
    updateData(updatedData);
  };
  
  if (isLoading) {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary font-headline">
            Loading LoomSheet Data...
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Please wait while we load your local data.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
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
        onSendForWorkOrder={handleSendForWorkOrder}
        onUndo={handleUndo}
        canUndo={history.length > 1}
      />
    </>
  );
}
