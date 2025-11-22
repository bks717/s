
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'src', 'lib', 'data.json');

async function readData() {
  try {
    const fileContent = await fs.readFile(dataFilePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error) {
    // If the file doesn't exist, return an empty array
    if (error.code === 'ENOENT') {
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
    console.error('Failed to read data:', error);
    return NextResponse.json({ message: 'Failed to read data' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    await writeData(data);
    return NextResponse.json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error('Failed to write data:', error);
    return NextResponse.json({ message: 'Failed to write data' }, { status: 500 });
  }
}
