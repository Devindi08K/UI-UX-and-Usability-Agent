import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FRONTEND_DIR = process.cwd();
const AGENT_ROOT = path.resolve(FRONTEND_DIR, '..');

export async function GET() {
  try {
    const planPath = path.join(AGENT_ROOT, 'outputs', 'screen_plan.json');
    const planJson = await fs.readFile(planPath, 'utf-8');
    const screens = JSON.parse(planJson);
    return NextResponse.json({ screens });
  } catch {
    return NextResponse.json({ screens: [] });
  }
}
