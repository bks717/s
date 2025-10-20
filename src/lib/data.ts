import type { LoomSheetData } from '@/lib/schemas';

// This is a mock database. In a real application, you would use a database like Firestore.
export const loomDataStore: LoomSheetData[] = [
    {
        id: '1',
        serialNumber: 'Initial Data',
        operatorName: 'John Doe',
        rollNo: 101,
        width: 150,
        number1: 10,
        number2: 20,
        grSut: '120 GSM',
        color: 'Blue',
        lamUnlam: 'Laminated',
        mtrs: 500,
        gw: 550,
        cw: 540,
        nw: 520,
        average: 480,
        loomNo: 'L-05',
        productionDate: new Date('2023-10-26T00:00:00.000Z'),
        variance: -1.5
    },
    {
        id: '2',
        serialNumber: 'Sample Roll',
        operatorName: 'Jane Smith',
        rollNo: 102,
        width: 155,
        number1: 12,
        number2: 22,
        grSut: '125 GSM',
        color: 'Red',
        lamUnlam: 'Unlaminated',
        mtrs: 480,
        gw: 530,
        cw: 520,
        nw: 500,
        average: 470,
        loomNo: 'L-08',
        productionDate: new Date('2023-10-27T00:00:00.000Z'),
        variance: 0.5
    }
];
