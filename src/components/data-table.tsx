
"use client";

import React, { useState, useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { LoomSheetData } from '@/lib/schemas';
import { ArrowUpDown } from 'lucide-react';
import { Button } from './ui/button';
import { format } from 'date-fns';
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from '@/lib/utils';

interface DataTableProps {
  data: LoomSheetData[];
  selectedRowIds: string[];
  onSelectedRowIdsChange: (ids: string[]) => void;
  showCheckboxes?: boolean;
  view?: 'remaining' | 'consumed';
}

type SortConfig = {
  key: keyof LoomSheetData | null;
  direction: 'ascending' | 'descending';
};

export function DataTable({ data, selectedRowIds, onSelectedRowIdsChange, showCheckboxes = false, view = 'remaining' }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'productionDate', direction: 'descending' });

  const baseColumns: { key: keyof LoomSheetData | 'select', label: string, className?: string }[] = [
    { key: 'productionDate', label: 'Date' },
    { key: 'serialNumber', label: 'Roll No' },
    { key: 'operatorName', label: 'Operator' },
    { key: 'loomNo', label: 'Loom No.' },
    { key: 'width', label: 'Width' },
    { key: 'gram', label: 'Gram' },
    { key: 'color', label: 'Color' },
    { key: 'sizeS', label: 'Size S'},
    { key: 'fabricType', label: 'Fabric' },
    { key: 'lamination', label: 'Lamination' },
    { key: 'status', label: 'Status' },
    { key: 'mtrs', label: 'Meters' },
    { key: 'gw', label: 'Gross' },
    { key: 'cw', label: 'Core' },
    { key: 'nw', label: 'Net' },
    { key: 'average', label: 'Average' },
    { key: 'variance', label: 'Variance (UB/LB)', className: 'w-48' },
    { key: 'consumedBy', label: 'Consumed By'},
    { key: 'soNumber', label: 'S/O Number'},
    { key: 'poNumber', label: 'P/O Number'},
    { key: 'receivedSerialNumber', label: 'Received Roll No'},
    { key: 'callOut', label: 'Call Out'}
  ];
  
  let columns = [...baseColumns];

  if (showCheckboxes) {
    columns.unshift({ key: 'select', label: 'Select' });
  }

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.key !== null && sortConfig.key !== 'select') {
      sortableItems.sort((a, b) => {
        const aVal = a[sortConfig.key! as keyof LoomSheetData];
        const bVal = b[sortConfig.key! as keyof LoomSheetData];

        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        
        if (aVal < bVal) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const requestSort = (key: keyof LoomSheetData | 'select') => {
    if (key === 'select') return;
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof LoomSheetData | 'select') => {
    if (key === 'select' || sortConfig.key !== key) {
      return <ArrowUpDown className="ml-2 h-3 w-3 opacity-30" />;
    }
    return sortConfig.direction === 'ascending' ? '🔼' : '🔽';
  };
  
  const handleSelectAll = (checked: boolean) => {
    onSelectedRowIdsChange(checked ? data.map(item => item.id!) : []);
  };
  
  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      onSelectedRowIdsChange([...selectedRowIds, id]);
    } else {
      onSelectedRowIdsChange(selectedRowIds.filter(rowId => rowId !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedRowIds.length === data.length;
  
  const visibleColumns = columns.filter(col => {
    if (view === 'consumed') {
        const consumedHidden: (keyof LoomSheetData | 'select')[] = [];
        if (data.every(d => !d.callOut)) consumedHidden.push('callOut');
        return !consumedHidden.includes(col.key);
    }
    
    if (view === 'remaining') {
         const remainingHidden: (keyof LoomSheetData | 'select')[] = [
            'consumedBy',
            'soNumber',
            'poNumber'
         ];
         if (data.every(d => !d.callOut)) remainingHidden.push('callOut');
         return !remainingHidden.includes(col.key);
    }
    
    return true;
  })

  const isAverageOutOfRange = (item: LoomSheetData) => {
    if (item.gram && item.average) {
      const ub = item.gram + 3;
      const lb = item.gram - 3;
      return item.average < lb || item.average > ub;
    }
    return false;
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map(col => (
                <TableHead key={col.key} className={cn("p-0", col.className)}>
                    {col.key === 'select' ? (
                        <div className="flex items-center justify-center h-8 w-12">
                          <Checkbox
                            checked={isAllSelected}
                            onCheckedChange={handleSelectAll}
                            aria-label="Select all"
                          />
                        </div>
                    ) : (
                      <Button variant="ghost" onClick={() => requestSort(col.key)} className="px-1 text-[10px] w-full justify-start h-8 whitespace-nowrap">
                          {col.label}
                          {getSortIcon(col.key)}
                      </Button>
                    )}
                </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.length > 0 ? (
            sortedData.map((item) => (
              <TableRow key={item.id} data-state={selectedRowIds.includes(item.id!) && "selected"}>
                {visibleColumns.map(col => (
                    <TableCell key={`${item.id}-${col.key}`} className={cn("p-1 text-[10px] whitespace-nowrap", {
                      "whitespace-pre-line": ['consumedBy', 'callOut'].includes(col.key),
                      "font-bold": ['nw', 'average'].includes(col.key),
                      "bg-destructive/20": col.key === 'average' && isAverageOutOfRange(item)
                    })}>
                        {col.key === 'select' ? (
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRowIds.includes(item.id!)}
                              onCheckedChange={(checked) => handleSelectRow(item.id!, !!checked)}
                              aria-label={`Select row ${item.serialNumber}`}
                            />
                          </div>
                        ) : col.key === 'productionDate' && item[col.key] ? format(new Date(item[col.key] as Date), 'PP') 
                        : col.key === 'sizeS' ? `${item.width || ''}" ${item.gram || ''} Gms ${item.color || ''}`
                        : col.key === 'lamination' ? (item.lamination === 'Lam active' ? 'True' : 'False')
                        : String(item[col.key as keyof LoomSheetData] ?? '')}
                    </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No data available.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
