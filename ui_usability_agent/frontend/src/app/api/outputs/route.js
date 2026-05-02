import { NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const FRONTEND_DIR = process.cwd();
const AGENT_ROOT = path.resolve(FRONTEND_DIR, '..');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const screenId = searchParams.get('screenId');

    const outputsDir = path.join(AGENT_ROOT, 'outputs', 'generated_screens');

    if (screenId) {
      const htmlPath = path.join(outputsDir, `${screenId}.html`);
      const html = await fs.readFile(htmlPath, 'utf-8');
      return NextResponse.json({ screenId, html });
    }

    const files = await fs.readdir(outputsDir);
    const htmlFiles = files.filter((file) => file.endsWith('.html'));
    const screens = htmlFiles.map((file) => file.replace('.html', ''));

    return NextResponse.json({ screens });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Output lookup failed.' },
      { status: 500 }
    );
  }
}