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

function parseRequirements(requirements) {
  if (!requirements) {
    throw new Error('Requirements are required.');
  }

  if (typeof requirements === 'string') {
    return JSON.parse(requirements);
  }

  return requirements;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const requirements = parseRequirements(body.requirements);
    const requirementsPath = path.join(AGENT_ROOT, 'samples', 'sample_requirements.json');

    await fs.access(PYTHON_PATH);
    await fs.writeFile(requirementsPath, JSON.stringify(requirements, null, 2), 'utf-8');

    const { stdout, stderr } = await execFileAsync(PYTHON_PATH, [MAIN_PATH, '--plan'], { cwd: AGENT_ROOT });

    const planPath = path.join(AGENT_ROOT, 'outputs', 'screen_plan.json');
    const planJson = await fs.readFile(planPath, 'utf-8');

    return NextResponse.json({ screens: JSON.parse(planJson), logs: { stdout, stderr } });
  } catch (error) {
    const stdout = typeof error?.stdout === 'string' ? error.stdout : '';
    const stderr = typeof error?.stderr === 'string' ? error.stderr : '';
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Planning failed.', logs: { stdout, stderr } },
      { status: 500 }
    );
  }
}