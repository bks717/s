
import { z } from 'zod';

export const statuses = ['Ready for Lamination', 'Sent for Lamination', 'Laminated', 'Partially Consumed', 'Consumed'] as const;
export const fabricTypes = ['Slit', 'Tube'] as const;
export const laminationTypes = ['Lam active', 'Unlammed'] as const;
export const colors = ['Natural', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Black', 'White'] as const;

export const loomSheetSchema = z.object({
  id: z.string().optional(),
  serialNumber: z.string().min(1, 'Roll No is required'),
  operatorName: z.string().min(1, 'Operator Name is required'),
  loomNo: z.string().optional(),
  
  // Width Specs
  width: z.coerce.number().positive('Width must be positive').optional(),
  gram: z.coerce.number().positive('Gram must be positive').optional(),
  fabricType: z.enum(fabricTypes),
  
  color: z.enum(colors),
  lamination: z.enum(laminationTypes),

  // Measurements
  mtrs: z.coerce.number().positive('Meters must be positive'),
  gw: z.coerce.number().positive('Gross Weight must be positive'),
  cw: z.coerce.number().positive('Core Weight must be positive'),
  nw: z.coerce.number().optional(), // Auto-calculated
  average: z.coerce.number().optional(), // Auto-calculated
  variance: z.string().optional(), // Auto-calculated as string "UB: val / LB: val"

  // System and Status fields
  productionDate: z.date(),
  status: z.enum(statuses).default('Ready for Lamination'),
  consumedBy: z.string().optional(),
  soNumber: z.string().optional(),
  poNumber: z.string().optional(),
  noOfBags: z.coerce.number().optional(),
  avgBagWeight: z.coerce.number().optional(),
  bagSize: z.string().optional(),
  receivedSerialNumber: z.string().optional(),
  callOut: z.string().optional(),
  sizeS: z.string().optional(),
  
  // Deprecated fields from old schema
  rollNo: z.coerce.number().optional(),
  number1: z.coerce.number().optional(),
  number2: z.coerce.number().optional(),
  grSut: z.string().optional(),
});

export type LoomSheetData = z.infer<typeof loomSheetSchema>;

export const bagProductionSchema = z.object({
    noOfBags: z.coerce.number().optional(),
    avgBagWeight: z.coerce.number().optional(),
    bagSize: z.string().optional(),
});

export type BagProductionData = z.infer<typeof bagProductionSchema>;

export const consumedBySchema = z.object({
    consumedBy: z.string().min(1, 'Consumer name is required'),
    soNumber: z.string().optional(),
    poNumber: z.string().optional(),
});

export type ConsumedByData = z.infer<typeof consumedBySchema>;
