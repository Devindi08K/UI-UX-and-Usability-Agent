import { NextResponse } from 'next/server';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import fs from 'node:fs/promises';
import path from 'node:path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);

const FRONTEND_DIR = process.cwd();
const AGENT_ROOT = path.resolve(FRONTEND_DIR, '..');
const WORKSPACE_ROOT = path.resolve(AGENT_ROOT, '..');
const PYTHON_PATH = path.join(WORKSPACE_ROOT, '.venv', 'Scripts', 'python.exe');
const MAIN_PATH = path.join(AGENT_ROOT, 'main.py');

export async function POST(request) {
  try {
    const body = await request.json();
    const screenId = body.screenId?.trim();

    if (!screenId) {
      return NextResponse.json({ error: 'screenId is required.' }, { status: 400 });
    }

    await fs.access(PYTHON_PATH);
    const { stdout, stderr } = await execFileAsync(PYTHON_PATH, [MAIN_PATH, '--generate', screenId], { cwd: AGENT_ROOT });

    const htmlPath = path.join(AGENT_ROOT, 'outputs', 'generated_screens', `${screenId}.html`);
    const html = await fs.readFile(htmlPath, 'utf-8');

    return NextResponse.json({ screenId, html, logs: { stdout, stderr } });
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed.', logs: { stdout, stderr } },
      { status: 500 }
    );
  }
}