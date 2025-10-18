"use client";

import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData, loomSheetSchema } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import AiSummary from '@/components/ai-summary';
import { Upload, Download, CheckSquare, SplitSquareHorizontal } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { ConsumedByDialog } from './consumed-by-dialog';
import { PartialUseDialog } from './partial-use-dialog';

interface AdminSectionProps {
  remainingData: LoomSheetData[];
  consumedData: LoomSheetData[];
  onImport: (data: LoomSheetData[]) => void;
  onMarkAsConsumed: (selectedIds: string[], consumedBy: string) => void;
  onPartialConsume: (originalId: string, consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string) => void;
  activeView: 'rolls' | 'bags';
}

type View = 'remaining' | 'consumed';

export default function AdminSection({ remainingData, consumedData, onImport, onMarkAsConsumed, onPartialConsume, activeView }: AdminSectionProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentView, setCurrentView] = useState<View>('remaining');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [isConsumedDialogVisible, setIsConsumedDialogVisible] = useState(false);
  const [isPartialUseDialogVisible, setIsPartialUseDialogVisible] = useState(false);
  
  const data = currentView === 'remaining' ? remainingData : consumedData;
  const allData = [...remainingData, ...consumedData];

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
              description: `${parsedData.data.length} rows have been imported into the 'Remaining' table.`,
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

  const handleConfirmConsumed = (consumedBy: string) => {
    onMarkAsConsumed(selectedRowIds, consumedBy);
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

  const handleConfirmPartialUse = (consumedPart: Omit<LoomSheetData, 'id' | 'productionDate'>, consumedBy: string) => {
    const originalId = selectedRowIds[0];
    onPartialConsume(originalId, consumedPart, consumedBy);
     toast({
      title: 'Success',
      description: `Roll partially consumed by ${consumedBy}. Remaining roll updated.`,
    });
    setSelectedRowIds([]);
    setIsPartialUseDialogVisible(false);
  };

  const selectedRollForPartialUse = selectedRowIds.length === 1 ? remainingData.find(d => d.id === selectedRowIds[0]) : undefined;

  return (
    <section id="admin-dashboard">
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
                <Button variant={currentView === 'consumed' ? 'default' : 'outline'} onClick={() => setCurrentView('consumed')}>
                  Consumed ({consumedData.length})
                </Button>
              </div>
              <div className="flex gap-2">
                  <Button variant="outline" onClick={handleImportClick}>
                      <Upload className="mr-2 h-4 w-4"/> Import Excel
                  </Button>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                  <Button variant="outline" onClick={handleExport}>
                      <Download className="mr-2 h-4 w-4"/> Export Excel
                  </Button>
              </div>
          </div>
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
                    {activeView === 'bags' && (
                      <Button onClick={handleOpenPartialUseDialog} disabled={selectedRowIds.length !== 1}>
                        <SplitSquareHorizontal className="mr-2 h-4 w-4" /> Partial Use
                      </Button>
                    )}
                    <Button onClick={handleOpenConsumedDialog} disabled={selectedRowIds.length === 0}>
                      <CheckSquare className="mr-2 h-4 w-4" /> Submit Consumed
                    </Button>
                 </div>
              )}
            </CardHeader>
            <CardContent>
              <DataTable 
                data={data}
                selectedRowIds={selectedRowIds}
                onSelectedRowIdsChange={setSelectedRowIds}
                showCheckboxes={currentView === 'remaining'}
                view={currentView}
              />
            </CardContent>
          </Card>

          <AiSummary data={allData} />
      </div>
    </section>
  );
}
