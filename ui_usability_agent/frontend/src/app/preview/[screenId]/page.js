'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PreviewPage() {
  const params = useParams();
  const screenId = params?.screenId;
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  const loadReport = async () => {
    try {
      setReportLoading(true);
      const response = await fetch('/api/reports');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load reports.');
      }
      // Find the report for this screen
      const screenReport = data.reports?.find(r => r.screenId === screenId);
      setReport(screenReport || null);
    } catch (err) {
      console.error('Failed to load report:', err);
      // Don't set error state for missing reports, just leave report as null
    } finally {
      setReportLoading(false);
    }
  };

  const loadScreens = async () => {
    try {
      const response = await fetch('/api/outputs');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load screens.');
      }
      setScreens(data.screens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screens.');
    }
  };

  useEffect(() => {
    if (!screenId) return;

    const loadPreview = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch(`/api/outputs?screenId=${encodeURIComponent(screenId)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load preview.');
        }
        setHtml(data.html || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview.');
      } finally {
        setLoading(false);
      }
    };

    loadScreens();
    loadPreview();
    loadReport();
  }, [screenId]);

  return (
    <div className="min-h-screen bg-neutral text-accent flex">
      <aside className="w-full max-w-xs bg-white border-r border-gray-200 p-6 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-primary">Generated Screens</h1>
          <p className="text-sm text-gray-600">Pick a screen to preview</p>
        </div>
        <div className="space-y-2">
          {screens.length === 0 ? (
            <p className="text-gray-500 text-sm">No generated screens yet.</p>
          ) : (
            screens.map((id) => (
              <a
                key={id}
                href={`/preview/${id}`}
                className={`block rounded-md border px-3 py-2 text-sm ${id === screenId ? 'border-primary bg-cyan-50 text-primary' : 'border-gray-200 text-gray-700 hover:border-primary'}`}
              >
                {id}
              </a>
            ))
          )}
        </div>
        <a className="mt-6 inline-flex text-sm text-primary hover:underline" href="/">
          Back to Wizard
        </a>
      </aside>
      <main className="flex-1 p-6 overflow-auto">
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-primary">Preview: {screenId}</h2>
          <p className="text-sm text-gray-600">Full-screen render of the generated HTML</p>
        </div>
        {error ? (
          <div className="bg-red-100 text-red-700 border border-red-200 p-4 rounded">
            {error}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white border rounded-lg shadow-sm p-0 min-h-[70vh] overflow-hidden">
              {loading ? (
                <p className="text-gray-500 p-4">Loading preview...</p>
              ) : html ? (
                <iframe
                  title={`Preview ${screenId}`}
                  className="w-full h-[70vh]"
                  srcDoc={html}
                  sandbox="allow-scripts allow-same-origin"
                />
              ) : (
                <p className="text-gray-500 p-4">No HTML available for this screen.</p>
              )}
            </div>

            {/* Evaluation Report Section */}
            {report && (
              <div className="bg-white border rounded-lg shadow-sm p-6">
                <h3 className="text-xl font-bold text-primary mb-4">Usability Evaluation Report</h3>

                {/* Overall Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{report.iso_score || 0}</div>
                    <div className="text-sm text-gray-600">ISO 9241-11</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{report.nielsen_score || 0}</div>
                    <div className="text-sm text-gray-600">Nielsen</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{report.wcag_score || 0}</div>
                    <div className="text-sm text-gray-600">WCAG 2.2</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-700">{report.total_score || 0}</div>
                    <div className="text-sm text-gray-600">Composite</div>
                  </div>
                </div>

                {/* Detailed Scores */}
                <div className="grid md:grid-cols-3 gap-6">
                  {/* ISO Details */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">ISO 9241-11 Details</h4>
                    <div className="space-y-2">
                      {report.details?.iso && Object.entries(report.details.iso).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{value}/4</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Nielsen Details */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Nielsen Heuristics Details</h4>
                    <div className="space-y-2">
                      {report.details?.nielsen && Object.entries(report.details.nielsen).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{value}/4</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* WCAG Details */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">WCAG 2.2 Details</h4>
                    <div className="space-y-2">
                      {report.details?.wcag && Object.entries(report.details.wcag).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600">{key.replace(/_/g, ' ')}</span>
                          <span className="font-medium">{value ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status */}
                {report.status && (
                  <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center">
                      <span className="text-green-600 font-medium">✓ PASSED</span>
                      <span className="ml-2 text-sm text-green-700">
                        Score: {report.scores?.composite || 0} / Threshold: {report.threshold || 65}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {reportLoading && (
              <div className="bg-white border rounded-lg shadow-sm p-6">
                <p className="text-gray-500">Loading evaluation report...</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}