
"use client";

import React, { useRef, useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData, loomSheetSchema, statuses, ConsumedByData } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import { Upload, Download, CheckSquare, SplitSquareHorizontal, Send, RefreshCw, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { ConsumedByDialog } from './consumed-by-dialog';
import { PartialUseDialog } from './partial-use-dialog';
import { Separator } from './ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { ReceiveSentLaminationDialog } from './receive-sent-lamination-dialog';
import { CollaborateSentLaminationDialog } from './collaborate-sent-lamination-dialog';
import { SendForLaminationDialog } from './send-for-lamination-dialog';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';


interface AdminSectionProps {
  allData: LoomSheetData[];
  onImport: (data: LoomSheetData[]) => void;
  onMarkAsConsumed: (selectedIds: string[], consumptionData: ConsumedByData) => void;
  onPartialConsume: (originalId: string, consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>) => void;
  onSendForLamination: (rollsToUpdate: { id: string; callOut: string }[]) => void;
  onMarkAsReceived: (selectedIds: string[], newSerialNumber?: string, receivedSerialNumber?: string) => void;
  onMarkAsLaminated: (selectedIds: string[]) => void;
  onCollaborateAndCreate: (selectedIds: string[], newRollData: LoomSheetData) => void;
  onSendForWorkOrder: (selectedIds: string[]) => void;
}

type View = 'remaining' | 'consumed' | 'laminate';

// Extend the window interface for jsPDF
declare global {
  interface Window {
    jsPDF: typeof jsPDF;
  }
}

export default function AdminSection({ allData, onImport, onMarkAsConsumed, onPartialConsume, onSendForLamination, onMarkAsReceived, onMarkAsLaminated, onCollaborateAndCreate, onSendForWorkOrder }: AdminSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentView, setCurrentView] = useState<View>('remaining');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [selectedReadyForLaminationIds, setSelectedReadyForLaminationIds] = useState<string[]>([]);
  const [selectedSentForLaminationIds, setSelectedSentForLaminationIds] = useState<string[]>([]);
  const [selectedLaminatedIds, setSelectedLaminatedIds] = useState<string[]>([]);
  
  const [isConsumedDialogVisible, setIsConsumedDialogVisible] = useState(false);
  const [isPartialUseDialogVisible, setIsPartialUseDialogVisible] = useState(false);
  const [isReceiveSentDialogVisible, setIsReceiveSentDialogVisible] = useState(false);
  const [isCollaborateSentDialogVisible, setIsCollaborateSentDialogVisible] = useState(false);
  const [isSendForLaminationDialogVisible, setIsSendForLaminationDialogVisible] = useState(false);
  
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [laminationFilter, setLaminationFilter] = useState<'all' | 'true' | 'false'>('all');
  
  const remainingData = allData.filter(d => d.status !== 'Consumed' && d.status !== 'For Work Order');
  const consumedData = allData.filter(d => d.status === 'Consumed');

  const groupedConsumedData = useMemo(() => {
    const groups: Record<string, LoomSheetData[]> = {};
    consumedData.forEach(roll => {
        const key = roll.soNumber || roll.consumedBy || 'Uncategorized';
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(roll);
    });
    return Object.entries(groups).sort(([, a], [, b]) => b.length - a.length);
  }, [consumedData]);
  
  const onSetSelectedRowIds = useCallback((ids: string[]) => {
    setSelectedRowIds(ids);
  }, []);

  const onSetSelectedReadyForLaminationIds = useCallback((ids: string[]) => {
    setSelectedReadyForLaminationIds(ids);
  }, []);

  const onSetSelectedSentForLaminationIds = useCallback((ids: string[]) => {
    setSelectedSentForLaminationIds(ids);
  }, []);

  const onSetSelectedLaminatedIds = useCallback((ids: string[]) => {
    setSelectedLaminatedIds(ids);
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

  const handleConfirmConsumed = (consumptionData: ConsumedByData) => {
    onMarkAsConsumed(selectedRowIds, consumptionData);
    toast({
      title: 'Success',
      description: `${selectedRowIds.length} rows marked as consumed by ${consumptionData.consumedBy}.`,
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

  const handleConfirmPartialUse = (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>) => {
    const originalId = selectedRowIds[0];
    onPartialConsume(originalId, consumedPart);
     toast({
      title: 'Success',
      description: `Roll partially consumed by ${consumedPart.consumedBy}. Remaining roll updated.`,
    });
    setSelectedRowIds([]);
    setIsPartialUseDialogVisible(false);
  };

  const generateLaminationPdf = (rollsToUpdate: { id: string; callOut: string }[]) => {
    const selectedRolls = allData.filter(roll => rollsToUpdate.some(update => update.id === roll.id));
    
    const doc = new jsPDF();
    const tableColumns = ["Sl.No", "Date", "Size S", "Roll No", "Meters", "Gross Weight", "Core Weight", "Net Weight", "Avg", "Call Out"];
    const tableRows = selectedRolls.map((roll, index) => {
      const updateInfo = rollsToUpdate.find(update => update.id === roll.id);
      return [
        index + 1,
        roll.productionDate ? new Date(roll.productionDate).toLocaleDateString() : '',
        `${roll.width || ''}" ${roll.gram || ''} Gms ${roll.color || ''}`,
        roll.serialNumber,
        roll.mtrs,
        roll.gw,
        roll.cw,
        roll.nw,
        roll.average,
        updateInfo?.callOut || ''
      ]
    });

    doc.text("Lamination Dispatch Note", 14, 15);
    doc.setFontSize(12);
    
    (doc as any).autoTable({
      startY: 22,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.1, halign: 'center' },
      headStyles: { fillColor: false, textColor: [0, 0, 0], fontStyle: 'bold', halign: 'center' },
    });

    doc.save(`lamination-dispatch-${new Date().toISOString().split('T')[0]}.pdf`);
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
    setIsSendForLaminationDialogVisible(true);
  };
  
  const handleConfirmSendForLamination = (rollsToUpdate: { id: string; callOut: string }[]) => {
    generateLaminationPdf(rollsToUpdate);
    
    onSendForLamination(rollsToUpdate);
    toast({
      title: 'Success',
      description: `${rollsToUpdate.length} rolls have been sent for lamination. PDF downloading.`,
    });
    setSelectedReadyForLaminationIds([]);
    setIsSendForLaminationDialogVisible(false);
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
        description: `Roll processed and moved to 'Laminated'.`,
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

  const handleMarkAsLaminatedClick = () => {
    if (selectedLaminatedIds.length === 0) {
       toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select laminated rolls to mark them.',
      });
      return;
    }
    onMarkAsLaminated(selectedLaminatedIds);
    toast({
      title: 'Success',
      description: `${selectedLaminatedIds.length} rolls marked as laminated.`,
    });
    setSelectedLaminatedIds([]);
  };

  const handleSendForWorkOrderClick = () => {
    if (selectedRowIds.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Rows Selected',
        description: 'Please select rows to send for work order.',
      });
      return;
    }
    onSendForWorkOrder(selectedRowIds);
    toast({
      title: 'Success',
      description: `${selectedRowIds.length} rows sent for work order.`,
    });
    setSelectedRowIds([]);
  };

  const selectedRollForPartialUse = selectedRowIds.length === 1 ? allData.find(d => d.id === selectedRowIds[0]) : undefined;
  
  const readyForLaminationData = allData.filter(d => d.status === 'Ready for Lamination');
  const sentForLaminationData = allData.filter(d => d.status === 'Sent for Lamination');
  const laminatedData = allData.filter(d => d.status === 'Laminated');
  
  const filteredRemainingData = remainingData.filter(d => {
    const laminationMatch = laminationFilter === 'all' || (d.lamination === 'Lam active' ? 'true' : 'false') === laminationFilter;
    
    let statusMatch = false;
    if (statusFilter === 'all') {
      statusMatch = true;
    } else {
      statusMatch = d.status === statusFilter;
    }

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
      />
      {selectedRollForPartialUse && (
        <PartialUseDialog
            isOpen={isPartialUseDialogVisible}
            onClose={() => setIsPartialUseDialogVisible(false)}
            onConfirm={handleConfirmPartialUse}
            originalRoll={selectedRollForPartialUse}
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
       <SendForLaminationDialog
        isOpen={isSendForLaminationDialogVisible}
        onClose={() => setIsSendForLaminationDialogVisible(false)}
        onConfirm={handleConfirmSendForLamination}
        selectedRolls={allData.filter(d => selectedReadyForLaminationIds.includes(d.id!))}
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
        
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  <Button variant={(currentView === 'remaining' && statusFilter === 'all') ? 'default' : 'outline'} onClick={() => { setCurrentView('remaining'); setStatusFilter('all')}}>
                    Inventory ({remainingData.length})
                  </Button>
                  
                  <Button variant={currentView === 'laminate' ? 'default' : 'outline'} onClick={() => setCurrentView('laminate')}>
                    Laminate
                  </Button>
                  
                  <Button variant={currentView === 'consumed' ? 'default' : 'outline'} onClick={() => setCurrentView('consumed')}>
                    Consumed ({consumedData.length})
                  </Button>
                </div>
                <div className="flex gap-4 items-center">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4"/> Import Excel
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4"/> Export Excel
                    </Button>
                </div>
            </div>
            {currentView === 'remaining' && (
              <div className="flex justify-start items-center gap-4 pt-2">
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
            <Separator className='my-12'/>
            {currentView === 'laminate' ? (
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
                        <CardTitle>Laminated Rolls</CardTitle>
                        <CardDescription>Process rolls that have been received from lamination.</CardDescription>
                      </div>
                       <div className="flex gap-2">
                        <Button onClick={handleSendForWorkOrderClick} disabled={selectedLaminatedIds.length === 0}>
                            <FileText className="mr-2 h-4 w-4" /> Work Order
                        </Button>
                        <Button onClick={handleOpenConsumedDialog} disabled={selectedLaminatedIds.length === 0}>
                            <CheckSquare className="mr-2 h-4 w-4" /> Mark Consumed
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <DataTable 
                        data={laminatedData}
                        selectedRowIds={selectedLaminatedIds}
                        onSelectedRowIdsChange={onSetSelectedLaminatedIds}
                        showCheckboxes={true}
                      />
                    </CardContent>
                  </Card>
               </div>
            ) : currentView === 'consumed' ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Consumed Rolls</CardTitle>
                        <CardDescription>A log of all consumed rolls, grouped by S/O number or consumer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groupedConsumedData.length > 0 ? (
                             <Accordion type="single" collapsible className="w-full">
                                {groupedConsumedData.map(([groupName, rolls]) => (
                                    <AccordionItem value={groupName} key={groupName}>
                                        <AccordionTrigger>
                                            <div className="flex justify-between w-full pr-4 items-center">
                                                <span className='font-bold text-lg text-primary'>{groupName}</span>
                                                <span className='text-md text-muted-foreground'>{rolls.length} roll(s)</span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <DataTable 
                                                data={rolls} 
                                                view="consumed" 
                                                selectedRowIds={[]}
                                                onSelectedRowIdsChange={() => {}} 
                                            />
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center text-muted-foreground py-12">
                                <p className="text-lg">No rolls have been marked as consumed.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ) : (
              <Card className="shadow-lg">
                <CardHeader className="flex flex-row justify-between items-center">
                  <div>
                    <CardTitle>
                      Inventory
                    </CardTitle>
                    <CardDescription>A log of all inventory rolls. You can sort by clicking on column headers.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSendForWorkOrderClick} disabled={selectedRowIds.length === 0}>
                      <FileText className="mr-2 h-4 w-4" /> Work Order
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <DataTable 
                    data={filteredRemainingData}
                    selectedRowIds={selectedRowIds}
                    onSelectedRowIdsChange={onSetSelectedRowIds}
                    showCheckboxes={true}
                    view={currentView}
                  />
                </CardContent>
              </Card>
            )}
        </div>
      </section>
    </>
  );
}
