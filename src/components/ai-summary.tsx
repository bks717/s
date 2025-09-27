"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { LoomSheetData, loomSheetSchema } from '@/lib/schemas';
import { generateDataSummary } from '@/ai/flows/generate-data-summary';
import { useToast } from '@/hooks/use-toast';
import { Bot, Loader2, Sparkles } from 'lucide-react';

interface AiSummaryProps {
  data: LoomSheetData[];
}

const reportTypes = ['trends', 'anomalies', 'comparisons', 'overall summary'];
const availableFields = Object.keys(loomSheetSchema.shape).filter(k => k !== 'id' && k !== 'productionDate') as (keyof Omit<LoomSheetData, 'id' | 'productionDate'>)[];

export default function AiSummary({ data }: AiSummaryProps) {
  const [reportType, setReportType] = useState('trends');
  const [selectedFields, setSelectedFields] = useState<string[]>(['width', 'mtrs', 'variance']);
  const [summary, setSummary] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    if (selectedFields.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please select at least one data field to analyze.',
      });
      return;
    }
    
    setIsLoading(true);
    setSummary('');

    try {
      const result = await generateDataSummary({
        reportType,
        dataFields: selectedFields,
        loomData: JSON.stringify(data, null, 2),
      });
      setSummary(result.summary);
    } catch (error) {
      console.error('AI summary generation failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Error',
        description: 'Failed to generate summary. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary"/> AI Data Analysis
        </CardTitle>
        <CardDescription>
          Generate insights from your loom data. Select a report type and the data fields you want to analyze.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4 items-center">
            <div>
                <Label htmlFor="reportType">Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger id="reportType">
                    <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                    <SelectContent>
                    {reportTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</SelectItem>
                    ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Data Fields for Analysis</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 p-4 rounded-md border max-h-48 overflow-y-auto">
                {availableFields.map((field) => (
                    <div key={field} className="flex items-center space-x-2">
                        <Checkbox
                            id={field}
                            checked={selectedFields.includes(field)}
                            onCheckedChange={(checked) => {
                            return checked
                                ? setSelectedFields((prev) => [...prev, field])
                                : setSelectedFields((prev) => prev.filter((f) => f !== field));
                            }}
                        />
                        <Label htmlFor={field} className="text-sm font-normal cursor-pointer">{field}</Label>
                    </div>
                ))}
                </div>
            </div>
        </div>

        {summary && (
            <div className="p-4 bg-background rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2"><Bot size={20}/>Generated Report</h4>
                <p className="text-sm text-foreground/80 whitespace-pre-wrap">{summary}</p>
            </div>
        )}

      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerateSummary} disabled={isLoading} className="w-full md:w-auto bg-primary hover:bg-primary/90">
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            'Generate Summary'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
