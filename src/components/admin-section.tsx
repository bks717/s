
"use client";

import React, { useRef, useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData, loomSheetSchema, BagProductionData, statuses } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { Upload, Download, CheckSquare, SplitSquareHorizontal, Send, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { ConsumedByDialog } from './consumed-by-dialog';
import { PartialUseDialog } from './partial-use-dialog';
import BagsProduced from './bags-produced';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ReceiveSentLaminationDialog } from './receive-sent-lamination-dialog';
import { CollaborateSentLaminationDialog } from './collaborate-sent-lamination-dialog';


interface AdminSectionProps {
  allData: LoomSheetData[];
  onImport: (data: LoomSheetData[]) => void;
  onMarkAsConsumed: (selectedIds: string[], consumedBy: string, bagData?: BagProductionData) => void;
  onPartialConsume: (originalId: string, consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string, bagData?: BagProductionData) => void;
  activeView: 'rolls' | 'bags';
  onSendForLamination: (selectedIds: string[]) => void;
  onMarkAsReceived: (selectedIds: string[], newSerialNumber?: string, receivedSerialNumber?: string) => void;
  onReturnToStock: (selectedIds: string[]) => void;
  onCollaborateAndCreate: (selectedIds: string[], newRollData: LoomSheetData) => void;
  bagsProducedData: LoomSheetData[];
}

type View = 'remaining' | 'consumed' | 'laminate';

export default function AdminSection({ allData, onImport, onMarkAsConsumed, onPartialConsume, activeView, onSendForLamination, onMarkAsReceived, onReturnToStock, onCollaborateAndCreate, bagsProducedData }: AdminSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentView, setCurrentView] = useState<View>('remaining');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [selectedReadyForLaminationIds, setSelectedReadyForLaminationIds] = useState<string[]>([]);
  const [selectedSentForLaminationIds, setSelectedSentForLaminationIds] = useState<string[]>([]);
  const [selectedReceivedFromLaminationIds, setSelectedReceivedFromLaminationIds] = useState<string[]>([]);
  
  const [isConsumedDialogVisible, setIsConsumedDialogVisible] = useState(false);
  const [isPartialUseDialogVisible, setIsPartialUseDialogVisible] = useState(false);
  const [isReceiveSentDialogVisible, setIsReceiveSentDialogVisible] = useState(false);
  const [isCollaborateSentDialogVisible, setIsCollaborateSentDialogVisible] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [laminationFilter, setLaminationFilter] = useState<'all' | 'true' | 'false'>('all');
  
  const remainingData = allData.filter(d => d.status !== 'Consumed');
  const consumedData = allData.filter(d => d.status === 'Consumed');
  
  const onSetSelectedRowIds = useCallback((ids: string[]) => {
    setSelectedRowIds(ids);
  }, []);

  const onSetSelectedReadyForLaminationIds = useCallback((ids: string[]) => {
    setSelectedReadyForLaminationIds(ids);
  }, []);

  const onSetSelectedSentForLaminationIds = useCallback((ids: string[]) => {
    setSelectedSentForLaminationIds(ids);
  }, []);

  const onSetSelectedReceivedFromLaminationIds = useCallback((ids: string[]) => {
    setSelectedReceivedFromLaminationIds(ids);
  }, []);


  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(allData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "LoomData");
    XLSX.writeFile(workbook, "LoomSheetData.xlsx");
    toast({
      title: "Export Successful",
      description: "Data has been exported to LoomSheetData.xlsx.",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        const workbook = XLSX.read(fileData, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);

        const importSchema = z.array(loomSheetSchema.omit({id: true}).extend({
            productionDate: z.any().transform((val, ctx) => {
                if (val instanceof Date) return val;
                const date = new Date(val);
                if (!isNaN(date.getTime())) return date;
                
                const excelEpoch = new Date(1899, 11, 30);
                const excelDate = new Date(excelEpoch.getTime() + val * 86400000);
                if(!isNaN(excelDate.getTime())) return excelDate;

                ctx.addIssue({
                    code: z.ZodIssueCode.invalid_date,
                    message: "Invalid date"
                });
                return z.NEVER;
            })
        }));
        
        const parsedData = importSchema.safeParse(json);
        
        if (parsedData.success) {
            onImport(parsedData.data as any[]);
            toast({
              title: 'Import Successful',
              description: `${parsedData.data.length} rows have been imported.`,
            });
        } else {
          console.error("Import validation error:", parsedData.error);
          toast({
            variant: 'destructive',
            title: 'Import Failed',
            description: 'The file format is incorrect or data is invalid. Check console for details.',
          });
        }
      } catch (error) {
        console.error("Import error:", error);
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: 'An error occurred while reading the file.',
        });
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.readAsBinaryString(file);
  };
  
  const handleImportClick = () => {
    fileInputRef.current?.click();
  }

  const handleOpenConsumedDialog = () => {
    if (selectedRowIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select rows to mark as consumed.',
      });
      return;
    }
    setIsConsumedDialogVisible(true);
  };

  const handleConfirmConsumed = (consumedBy: string, bagData?: BagProductionData) => {
    onMarkAsConsumed(selectedRowIds, consumedBy, bagData);
    toast({
      title: 'Success',
      description: `${selectedRowIds.length} rows marked as consumed by ${consumedBy}.`,
    });
    setSelectedRowIds([]);
    setIsConsumedDialogVisible(false);
  }

  const handleOpenPartialUseDialog = () => {
    if (selectedRowIds.length !== 1) {
      toast({
        variant: 'destructive',
        title: 'Invalid Selection',
        description: 'Please select exactly one row for partial use.',
      });
      return;
    }
    setIsPartialUseDialogVisible(true);
  };

  const handleConfirmPartialUse = (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string, bagData?: BagProductionData) => {
    const originalId = selectedRowIds[0];
    onPartialConsume(originalId, consumedPart, consumedBy, bagData);
     toast({
      title: 'Success',
      description: `Roll partially consumed by ${consumedBy}. Remaining roll updated.`,
    });
    setSelectedRowIds([]);
    setIsPartialUseDialogVisible(false);
  };

  const handleSendForLaminationClick = () => {
    if (selectedReadyForLaminationIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select rolls to send for lamination.',
      });
      return;
    }
    onSendForLamination(selectedReadyForLaminationIds);
    toast({
      title: 'Success',
      description: `${selectedReadyForLaminationIds.length} rolls have been sent for lamination.`,
    });
    setSelectedReadyForLaminationIds([]);
  };

  const handleMarkAsReceivedClick = () => {
    if (selectedSentForLaminationIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select rolls that have been received from lamination.',
      });
      return;
    }
    if (selectedSentForLaminationIds.length > 1) {
      setIsCollaborateSentDialogVisible(true);
    } else {
      setIsReceiveSentDialogVisible(true);
    }
  };

  const handleConfirmReceiveSent = (newSerialNumber: string, receivedSerialNumber: string) => {
    onMarkAsReceived(selectedSentForLaminationIds, newSerialNumber, receivedSerialNumber);
    toast({
        title: 'Success',
        description: `Roll processed and moved to 'Received from Lamination'.`,
    });
    setSelectedSentForLaminationIds([]);
    setIsReceiveSentDialogVisible(false);
  };

  const handleConfirmCollaborateSent = (newRollData: LoomSheetData) => {
    onCollaborateAndCreate(selectedSentForLaminationIds, newRollData);
     toast({
        title: 'Success',
        description: `New roll ${newRollData.serialNumber} created. Original rolls marked as consumed.`,
    });
    setSelectedSentForLaminationIds([]);
    setIsCollaborateSentDialogVisible(false);
  }

  const handleReturnToStockClick = () => {
    if (selectedReceivedFromLaminationIds.length === 0) {
       toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select received rolls to return to stock.',
      });
      return;
    }
    onReturnToStock(selectedReceivedFromLaminationIds);
    toast({
      title: 'Success',
      description: `${selectedReceivedFromLaminationIds.length} rolls returned to active stock.`,
    });
    setSelectedReceivedFromLaminationIds([]);
  };

  const selectedRollForPartialUse = selectedRowIds.length === 1 ? allData.find(d => d.id === selectedRowIds[0]) : undefined;
  
  const readyForLaminationData = allData.filter(d => d.status === 'Ready for Lamination');
  const sentForLaminationData = allData.filter(d => d.status === 'Sent for Lamination');
  const receivedFromLaminationData = allData.filter(d => d.status === 'Received from Lamination');
  
  const filteredRemainingData = remainingData.filter(d => {
    const statusMatch = statusFilter === 'all' || d.status === statusFilter;
    const laminationMatch = laminationFilter === 'all' || String(d.lamination) === laminationFilter;
    return statusMatch && laminationMatch;
  });

  const availableFilters = statuses.filter(s => s !== 'Consumed');

  return (
    <>
      <ConsumedByDialog 
        isOpen={isConsumedDialogVisible}
        onClose={() => setIsConsumedDialogVisible(false)}
        onConfirm={handleConfirmConsumed}
        selectedCount={selectedRowIds.length}
        activeView={activeView}
      />
      {selectedRollForPartialUse && (
        <PartialUseDialog
            isOpen={isPartialUseDialogVisible}
            onClose={() => setIsPartialUseDialogVisible(false)}
            onConfirm={handleConfirmPartialUse}
            originalRoll={selectedRollForPartialUse}
            activeView={activeView}
        />
      )}
      <ReceiveSentLaminationDialog
        isOpen={isReceiveSentDialogVisible}
        onClose={() => setIsReceiveSentDialogVisible(false)}
        onConfirm={handleConfirmReceiveSent}
        selectedRoll={allData.find(d => d.id === selectedSentForLaminationIds[0])}
      />
      <CollaborateSentLaminationDialog
        isOpen={isCollaborateSentDialogVisible}
        onClose={() => setIsCollaborateSentDialogVisible(false)}
        selectedRolls={allData.filter(d => selectedSentForLaminationIds.includes(d.id!))}
        onConfirm={handleConfirmCollaborateSent}
      />
      <section id="admin-dashboard">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
            Admin Dashboard
          </h2>
          <p className="mt-1 text-md text-muted-foreground">
            View all submitted data, import/export, and manage roll status.
          </p>
        </div>
        
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant={currentView === 'remaining' ? 'default' : 'outline'} onClick={() => setCurrentView('remaining')}>
                    Remaining ({remainingData.length})
                  </Button>
                  {activeView === 'rolls' && (
                    <Button variant={currentView === 'laminate' ? 'default' : 'outline'} onClick={() => setCurrentView('laminate')}>
                      Laminate
                    </Button>
                  )}
                  <Button variant={currentView === 'consumed' ? 'default' : 'outline'} onClick={() => setCurrentView('consumed')}>
                    Consumed ({consumedData.length})
                  </Button>
                </div>
                <div className="flex gap-4 items-center">
                    {currentView === 'remaining' && (
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="status-filter">Status</Label>
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger id="status-filter" className="w-48">
                              <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              {availableFilters.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                         <div className="flex items-center gap-2">
                          <Label htmlFor="lamination-filter">Lamination</Label>
                          <Select value={laminationFilter} onValueChange={(value) => setLaminationFilter(value as 'all' | 'true' | 'false')}>
                            <SelectTrigger id="lamination-filter" className="w-32">
                              <SelectValue placeholder="Filter by lamination" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="true">True</SelectItem>
                              <SelectItem value="false">False</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4"/> Import Excel
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4"/> Export Excel
                    </Button>
                </div>
            </div>
            <Separator className='my-12'/>
            {currentView === 'laminate' && activeView === 'rolls' ? (
               <div className='space-y-8'>
                  <Card className="shadow-lg">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle>Ready for Lamination</CardTitle>
                        <CardDescription>Select rolls to send for lamination.</CardDescription>
                      </div>
                      <Button onClick={handleSendForLaminationClick} disabled={selectedReadyForLaminationIds.length === 0}>
                        <Send className="mr-2 h-4 w-4" /> Send
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable
                        data={readyForLaminationData}
                        selectedRowIds={selectedReadyForLaminationIds}
                        onSelectedRowIdsChange={onSetSelectedReadyForLaminationIds}
                        showCheckboxes={true}
                      />
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg">
                     <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle>Rolls Sent for Lamination</CardTitle>
                        <CardDescription>A log of all rolls sent for lamination.</CardDescription>
                      </div>
                      <Button onClick={handleMarkAsReceivedClick} disabled={selectedSentForLaminationIds.length === 0}>
                        <CheckSquare className="mr-2 h-4 w-4" /> Received
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable 
                        data={sentForLaminationData}
                        selectedRowIds={selectedSentForLaminationIds}
                        onSelectedRowIdsChange={onSetSelectedSentForLaminationIds}
                        showCheckboxes={true}
                      />
                    </CardContent>
                  </Card>
                  <Card className="shadow-lg">
                     <CardHeader className="flex flex-row justify-between items-center">
                      <div>
                        <CardTitle>Rolls Received from Lamination</CardTitle>
                        <CardDescription>Process rolls that have been received from lamination.</CardDescription>
                      </div>
                      <Button onClick={handleReturnToStockClick} disabled={selectedReceivedFromLaminationIds.length === 0}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Return to Stock
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <DataTable 
                        data={receivedFromLaminationData}
                        selectedRowIds={selectedReceivedFromLaminationIds}
                        onSelectedRowIdsChange={onSetSelectedReceivedFromLaminationIds}
                        showCheckboxes={true}
                      />
                    </CardContent>
                  </Card>
               </div>
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>
                      {currentView === 'remaining' ? 'Remaining Rolls' : 'Consumed Rolls'}
                    </CardTitle>
                    <CardDescription>A log of all {currentView} rolls. You can sort by clicking on column headers.</CardDescription>
                  </div>
                  {currentView === 'remaining' && (
                     <div className="flex gap-2">
                        <Button onClick={handleOpenPartialUseDialog} disabled={selectedRowIds.length !== 1}>
                          <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Partial Use
                        </Button>
                        <Button onClick={handleOpenConsumedDialog} disabled={selectedRowIds.length === 0}>
                          <CheckSquare className="mr-2 h-4 w-4" /> Submit Consumed
                        </Button>
                     </div>
                  )}
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={currentView === 'remaining' ? filteredRemainingData : consumedData}
                    selectedRowIds={selectedRowIds}
                    onSelectedRowIdsChange={onSetSelectedRowIds}
                    showCheckboxes={currentView === 'remaining'}
                    view={currentView}
                  />
                </CardContent>
              </Card>
            )}

            {activeView === 'bags' && (
              <>
                <Separator className="my-12" />
                <BagsProduced data={bagsProducedData} />
              </>
            )}

        </div>
      </section>
    </>
  );
}
