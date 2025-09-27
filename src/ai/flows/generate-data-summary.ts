'use server';

/**
 * @fileOverview Generates summaries and comparisons from loom data.
 *
 * - generateDataSummary - A function that generates summaries and comparisons from loom data.
 * - GenerateDataSummaryInput - The input type for the generateDataSummary function.
 * - GenerateDataSummaryOutput - The return type for the generateDataSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDataSummaryInputSchema = z.object({
  reportType: z
    .string()
    .describe("The type of report to generate, e.g., 'trends', 'anomalies', 'comparisons'."),
  dataFields: z
    .array(z.string())
    .describe("The specific data fields to include in the report, e.g., 'Width', 'Mtrs', 'Variance'."),
  loomData: z.string().describe('The loom data in JSON format.'),
});
export type GenerateDataSummaryInput = z.infer<typeof GenerateDataSummaryInputSchema>;

const GenerateDataSummaryOutputSchema = z.object({
  summary: z.string().describe('The generated summary or comparison of the loom data.'),
});
export type GenerateDataSummaryOutput = z.infer<typeof GenerateDataSummaryOutputSchema>;

export async function generateDataSummary(input: GenerateDataSummaryInput): Promise<GenerateDataSummaryOutput> {
  return generateDataSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDataSummaryPrompt',
  input: {
    schema: GenerateDataSummaryInputSchema,
  },
  output: {
    schema: GenerateDataSummaryOutputSchema,
  },
  prompt: `You are an expert data analyst specializing in loom production data.

You will generate a summary or comparison report based on the provided loom data, focusing on the specified data fields and report type.

Data Fields: {{dataFields}}
Report Type: {{reportType}}
Loom Data: {{{loomData}}}

Generate a concise and informative summary.
`,
});

const generateDataSummaryFlow = ai.defineFlow(
  {
    name: 'generateDataSummaryFlow',
    inputSchema: GenerateDataSummaryInputSchema,
    outputSchema: GenerateDataSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
