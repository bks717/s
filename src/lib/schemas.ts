import { z } from 'zod';

export const statuses = ['Active Stock', 'Ready for Lamination', 'Sent for Lamination', 'Consumed'] as const;

export const loomSheetSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string().min(1, 'Serial Number is required'),
  operatorName: z.string().min(1, 'Operator Name is required'),
  rollNo: z.coerce.number().optional(),
  width: z.coerce.number().optional(),
  number1: z.coerce.number().optional(),
  number2: z.coerce.number().optional(),
  grSut: z.string().optional(),
  color: z.string().optional(),
  lamination: z.boolean().default(false),
  status: z.enum(statuses),
  mtrs: z.coerce.number().optional(),
  gw: z.coerce.number().optional(),
  cw: z.coerce.number().optional(),
  nw: z.coerce.number().optional(),
  average: z.coerce.number().optional(),
  loomNo: z.string().optional(),
  productionDate: z.date(),
  variance: z.coerce.number().optional(),
  consumedBy: z.string().optional(),
  noOfBags: z.coerce.number().optional(),
  avgBagWeight: z.coerce.number().optional(),
  bagSize: z.string().optional(),
});

export type LoomSheetData = z.infer<typeof loomSheetSchema>;

export const bagProductionSchema = z.object({
    noOfBags: z.coerce.number().optional(),
    avgBagWeight: z.coerce.number().optional(),
    bagSize: z.string().optional(),
});

export type BagProductionData = z.infer<typeof bagProductionSchema>;
