"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { LoomSheetData, loomSheetSchema } from '@/lib/schemas';
import { DataTable } from '@/components/data-table';
import AiSummary from '@/components/ai-summary';
import { Lock, Unlock, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { z } from 'zod';

const ADMIN_PASSWORD = "admin"; // In a real app, use environment variables

interface AdminSectionProps {
  data: LoomSheetData[];
  onImport: (data: LoomSheetData[]) => void;
}

export default function AdminSection({ data, onImport }: AdminSectionProps) {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast({
        title: "Access Granted",
        description: "Welcome to the admin dashboard.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Incorrect password.",
      });
      setPassword('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
    toast({
      title: "Logged Out",
      description: "You have successfully logged out from the admin dashboard.",
    });
  }

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(data);
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

        // Zod schema to validate and parse each row
        const importSchema = z.array(loomSheetSchema.omit({id: true}).extend({
            productionDate: z.any().transform((val, ctx) => {
                const date = new Date(val);
                if (isNaN(date.getTime())) {
                    // Excel date serial number handling
                    const excelEpoch = new Date(1899, 11, 30);
                    const excelDate = new Date(excelEpoch.getTime() + val * 86400000);
                    if(!isNaN(excelDate.getTime())) return excelDate;

                    ctx.addIssue({
                        code: z.ZodIssueCode.invalid_date,
                        message: "Invalid date"
                    });
                    return z.NEVER;
                }
                return date;
            })
        }));
        
        const parsedData = importSchema.safeParse(json);
        
        if (parsedData.success) {
            const dataWithIds = parsedData.data.map(item => ({...item, id: `imported-${Date.now()}-${Math.random()}`}))
            onImport(dataWithIds);
            toast({
              title: 'Import Successful',
              description: `${dataWithIds.length} rows have been imported.`,
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
        // Reset file input
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

  return (
    <section id="admin-dashboard">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-primary font-headline">
          Admin Dashboard
        </h2>
        <p className="mt-1 text-md text-muted-foreground">
          View all submitted data and generate AI-powered insights.
        </p>
      </div>
      
      {!isAuthenticated ? (
        <Card className="max-w-md mx-auto shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Lock /> Secure Access</CardTitle>
            <CardDescription>
              Please enter the password to access the admin dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
              <Button onClick={handleLogin}>Login</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4"/> Import Excel
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".xlsx, .xls" />
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4"/> Export Excel
                    </Button>
                </div>
                <Button variant="outline" onClick={handleLogout}><Unlock className="mr-2 h-4 w-4"/>Logout</Button>
            </div>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Loom Data Entries</CardTitle>
                <CardDescription>A complete log of all submitted rolls. You can sort by clicking on column headers.</CardDescription>
              </CardHeader>
              <CardContent>
                <DataTable data={data} />
              </CardContent>
            </Card>

            <AiSummary data={data} />
        </div>
      )}
    </section>
  );
}
