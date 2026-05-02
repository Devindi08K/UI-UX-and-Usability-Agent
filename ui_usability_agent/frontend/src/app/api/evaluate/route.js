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

export async function POST() {
  try {
    await fs.access(PYTHON_PATH);
    await execFileAsync(PYTHON_PATH, [MAIN_PATH, '--evaluate'], { cwd: AGENT_ROOT });

    const reportsDir = path.join(AGENT_ROOT, 'outputs', 'score_reports');
    const files = await fs.readdir(reportsDir);
    const reports = [];

    for (const file of files) {
      if (!file.endsWith('_score_report.json')) continue;
      const reportJson = await fs.readFile(path.join(reportsDir, file), 'utf-8');
      const report = JSON.parse(reportJson);
      const screenId = file.replace('_score_report.json', '');
      reports.push({ screenId, report });
    }

    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Evaluation failed.' },
      { status: 500 }
    );
  }
}