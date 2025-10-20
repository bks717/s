"use client";

import React, { useState, useMemo, useEffect } from 'react';
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

  // Reset selection when the component is re-purposed for different data sets
  useEffect(() => {
    onSelectedRowIdsChange([]);
  }, [onSelectedRowIdsChange]);

  const baseColumns: { key: keyof LoomSheetData | 'select', label: string }[] = [
    // The 'select' column is conditionally added later
    { key: 'productionDate', label: 'Prod. Date' },
    { key: 'rollNo', label: 'Roll No.' },
    { key: 'operatorName', label: 'Operator' },
    { key: 'loomNo', label: 'Loom No.' },
    { key: 'serialNumber', label: 'Serial Number' },
    { key: 'width', label: 'Width' },
    { key: 'number1', label: 'Num 1' },
    { key: 'number2', label: 'Num 2' },
    { key: 'grSut', label: 'Gr/Sut' },
    { key: 'color', label: 'Color' },
    { key: 'lamUnlam', label: 'Lam Status' },
    { key: 'mtrs', label: 'Mtrs' },
    { key: 'gw', label: 'G.W.' },
    { key: 'cw', label: 'C.W.' },
    { key: 'nw', label: 'N.W.' },
    { key: 'average', label: 'Average' },
    { key: 'variance', label: 'Variance' },
  ];
  
  let columns = [...baseColumns];

  if (view === 'consumed') {
    columns.push({ key: 'consumedBy', label: 'Consumed By'});
    columns.push({ key: 'noOfBags', label: 'No. of Bags'});
    columns.push({ key: 'avgBagWeight', label: 'Avg. Bag Wt.'});
    columns.push({ key: 'bagSize', label: 'Bag Size'});
  }

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

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map(col => (
                <TableHead key={col.key} className="p-0">
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
                {columns.map(col => (
                    <TableCell key={`${item.id}-${col.key}`} className="p-1 text-[10px] whitespace-nowrap">
                        {col.key === 'select' ? (
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRowIds.includes(item.id!)}
                              onCheckedChange={(checked) => handleSelectRow(item.id!, !!checked)}
                              aria-label={`Select row ${item.rollNo}`}
                            />
                          </div>
                        ) : col.key === 'productionDate' && item[col.key] ? format(new Date(item[col.key] as Date), 'PP') : String(item[col.key as keyof LoomSheetData] ?? '')}
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
