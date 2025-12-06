
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'work-orders.json');

async function readData() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeData(data: any) {
  await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Failed to read work order data:', error);
    return NextResponse.json({ message: 'Failed to read work order data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newData = await request.json();
    const isArray = Array.isArray(newData);
    
    if (isArray) {
      // This is for updating the whole array (e.g., toggling completion)
      await writeData(newData);
      return NextResponse.json({ message: 'Work orders updated successfully' });
    } else {
      // This is for adding a single new work order
      const allWorkOrders = await readData();
      allWorkOrders.push(newData);
      await writeData(allWorkOrders);
      return NextResponse.json({ message: 'Work order saved successfully' });
    }

  } catch (error) {
    console.error('Failed to write work order data:', error);
    return NextResponse.json({ message: 'Failed to write work order data' }, { status: 500 });
  }
}
