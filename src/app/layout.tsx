
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { DashboardLayout } from '@/components/dashboard-layout';
import { usePathname } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData, WorkOrderData } from '@/lib/schemas';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const { toast } = useToast();

  // Unified State Management
  const [allLoomData, setAllLoomData] = useState<LoomSheetData[]>([]);
  const [allWorkOrders, setAllWorkOrders] = useState<WorkOrderData[]>([]);
  const [loomHistory, setLoomHistory] = useState<LoomSheetData[][]>([]);
  const [workOrderHistory, setWorkOrderHistory] = useState<WorkOrderData[][]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rollsResponse, woResponse] = await Promise.all([
        fetch('/api/loom-data'),
        fetch('/api/work-orders'),
      ]);

      if (!rollsResponse.ok) throw new Error('Failed to fetch roll data');
      if (!woResponse.ok) throw new Error('Failed to fetch work order data');
      
      const rollsData = await rollsResponse.json();
      const woData = await woResponse.json();

      const typedRollsData = rollsData.map((d: any) => ({
        ...d,
        productionDate: new Date(d.productionDate),
      }));

      const typedWoData = woData.map((d: any) => ({
        ...d,
        createdAt: d.createdAt ? new Date(d.createdAt) : new Date(),
      }));
      
      setAllLoomData(typedRollsData);
      setAllWorkOrders(typedWoData);
      setLoomHistory([typedRollsData]);
      setWorkOrderHistory([typedWoData]);

    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error fetching data',
        description: 'Could not load required data.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const updateAllData = async (updatedLoomData: LoomSheetData[], updatedWorkOrders: WorkOrderData[]) => {
      setLoomHistory(prev => [...prev, allLoomData]);
      setWorkOrderHistory(prev => [...prev, allWorkOrders]);

      try {
        await Promise.all([
            fetch('/api/loom-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedLoomData, null, 2),
            }),
            fetch('/api/work-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedWorkOrders, null, 2),
            })
        ]);
        
        setAllLoomData(updatedLoomData);
        setAllWorkOrders(updatedWorkOrders);
      } catch (error) {
        console.error(error);
        toast({ variant: 'destructive', title: 'Error Saving Data', description: 'Could not save changes.' });
        // Rollback on failure
        setLoomHistory(prev => prev.slice(0, -1));
        setWorkOrderHistory(prev => prev.slice(0, -1));
      }
  };

  const handleUndo = () => {
    if (loomHistory.length > 1 && workOrderHistory.length > 1) {
      const prevLoomData = loomHistory[loomHistory.length - 1];
      const prevWorkOrderData = workOrderHistory[workOrderHistory.length - 1];
      const newLoomHistory = loomHistory.slice(0, loomHistory.length - 1);
      const newWorkOrderHistory = workOrderHistory.slice(0, workOrderHistory.length - 1);

      Promise.all([
        fetch('/api/loom-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prevLoomData, null, 2),
        }),
        fetch('/api/work-orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prevWorkOrderData, null, 2),
        }),
      ]).then(([loomRes, woRes]) => {
        if (loomRes.ok && woRes.ok) {
          setAllLoomData(prevLoomData);
          setAllWorkOrders(prevWorkOrderData);
          setLoomHistory(newLoomHistory);
          setWorkOrderHistory(newWorkOrderHistory);
          toast({
            title: 'Undo Successful',
            description: 'The last action has been reverted.',
          });
        } else {
          throw new Error('Failed to save one or more data types during undo.');
        }
      }).catch(error => {
        console.error("Undo error:", error);
        toast({ variant: 'destructive', title: 'Undo Failed', description: 'Could not revert the last action.' });
      });
    }
  };

  const pageProps = {
    allLoomData,
    allWorkOrders,
    updateAllData,
    fetchData,
    isLoading,
  };

  const canUndo = loomHistory.length > 1 && workOrderHistory.length > 1;

  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased h-full bg-background">
        <DashboardLayout onUndo={handleUndo} canUndo={canUndo}>
          {React.cloneElement(children as React.ReactElement, pageProps)}
        </DashboardLayout>
        <Toaster />
      </body>
    </html>
  );
}
