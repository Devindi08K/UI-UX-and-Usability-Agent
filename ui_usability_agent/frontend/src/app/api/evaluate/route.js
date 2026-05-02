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
    const screenIds = body.screenIds || [];

    await fs.access(PYTHON_PATH);
    const { stdout, stderr } = await execFileAsync(PYTHON_PATH, [MAIN_PATH, '--evaluate'], {
      cwd: AGENT_ROOT,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    });

    const reportsDir = path.join(AGENT_ROOT, 'outputs', 'score_reports');
    const files = await fs.readdir(reportsDir);
    const reports = [];

    for (const file of files) {
      if (!file.endsWith('_score_report.json')) continue;
      const screenId = file.replace('_score_report.json', '');
      if (screenIds.length > 0 && !screenIds.includes(screenId)) continue; // Filter if specific screens requested
      const reportJson = await fs.readFile(path.join(reportsDir, file), 'utf-8');
      const report = JSON.parse(reportJson);
      reports.push({ screenId, report });
    }

    return NextResponse.json({ reports, logs: { stdout, stderr } });
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Evaluation failed.', logs: { stdout, stderr } },
      { status: 500 }
    );
  }
}