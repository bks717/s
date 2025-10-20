import { z } from 'zod';

export const lamStatuses = ['Laminated', 'Unlaminated', 'Ready for Lamination', 'Sent for Lamination', 'Received from Lamination'] as const;

export const loomSheetSchema = z.object({
  id: z.string().optional(),
  primaryColumn: z.string().min(1, 'Primary Column is required'),
  operatorName: z.string().min(1, 'Operator Name is required'),
  rollNo: z.coerce.number().positive('Roll No. must be a positive number'),
  width: z.coerce.number().positive('Width must be a positive number'),
  number1: z.coerce.number().min(0, 'Cannot be negative'),
  number2: z.coerce.number().min(0, 'Cannot be negative'),
  grSut: z.string().min(1, 'Gr/Sut is required'),
  color: z.string().min(1, 'Color is required'),
  lamUnlam: z.enum(lamStatuses),
  mtrs: z.coerce.number().positive('Mtrs must be a positive number'),
  gw: z.coerce.number().positive('G.W. must be a positive number'),
  cw: z.coerce.number().positive('C.W. must be a positive number'),
  nw: z.coerce.number().positive('N.W. must be a positive number'),
  average: z.coerce.number().min(0, 'Average cannot be negative'),
  loomNo: z.string().min(1, 'Loom No. is required'),
  productionDate: z.date(),
  variance: z.coerce.number(),
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
