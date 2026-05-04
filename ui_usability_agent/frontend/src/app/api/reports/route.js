import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const reportsDir = path.join(process.cwd(), '..', 'outputs', 'score_reports');

    // Check if directory exists
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json({ reports: [] });
    }

    // Read all JSON files in the directory
    const files = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));

    const reports = files.map(file => {
      try {
        const filePath = path.join(reportsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const report = JSON.parse(content);

        // Extract screen name from filename (remove _score_report.json)
        const screenId = file.replace('_score_report.json', '');

        return {
          screenId,
          report,
          fileName: file
        };
      } catch (error) {
        console.error(`Error reading report ${file}:`, error);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ reports });
  } catch (error) {
    console.error('Error loading reports:', error);
    return NextResponse.json(
      { error: 'Failed to load reports' },
      { status: 500 }
    );
  }
}