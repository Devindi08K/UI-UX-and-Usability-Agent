'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ReportPage() {
  const params = useParams();
  const screenId = params?.screenId;
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!screenId) return;

    const loadReport = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/reports');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load reports.');
        }
        // Find the report for this screen
        const screenReport = data.reports?.find(r => r.screenId === screenId);
        if (!screenReport) {
          throw new Error('Report not found for this screen.');
        }
        setReport(screenReport.report);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [screenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-text-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg text-text-primary flex items-center justify-center">
        <div className="bg-red-900 text-red-200 border border-red-700 p-6 rounded-lg max-w-md">
          <h2 className="text-lg font-bold mb-2">Error</h2>
          <p>{error}</p>
          <Link href="/" className="inline-block mt-4 text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-dark-bg text-text-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary mb-4">No report available for this screen.</p>
          <Link href="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <Link href="/" className="text-primary hover:underline mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-primary">Evaluation Report: {screenId}</h1>
          <p className="text-text-secondary mt-2">Detailed usability evaluation breakdown</p>
        </div>

        {/* Overall Scores */}
        <div className="bg-dark-card border border-dark-hover rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-primary mb-4">Overall Scores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-dark-bg border border-cyan-700 rounded-lg">
              <div className="text-3xl font-bold text-cyan-400">{report.total_score || 0}</div>
              <div className="text-sm text-text-secondary">Total Score</div>
            </div>
            <div className="text-center p-4 bg-dark-bg border border-green-700 rounded-lg">
              <div className="text-3xl font-bold text-green-400">{report.iso_score || 0}</div>
              <div className="text-sm text-text-secondary">ISO 9241-11</div>
            </div>
            <div className="text-center p-4 bg-dark-bg border border-purple-700 rounded-lg">
              <div className="text-3xl font-bold text-purple-400">{report.nielsen_score || 0}</div>
              <div className="text-sm text-text-secondary">Nielsen</div>
            </div>
            <div className="text-center p-4 bg-dark-bg border border-blue-700 rounded-lg">
              <div className="text-3xl font-bold text-blue-400">{report.wcag_score || 0}</div>
              <div className="text-sm text-text-secondary">WCAG 2.2</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-dark-bg border border-yellow-700 rounded-lg">
            <p className="text-sm text-text-secondary">
              <strong className="text-text-primary">Weakest Standard:</strong> {report.weakest_standard || 'N/A'}
            </p>
          </div>
        </div>

        {/* ISO Details */}
        {report.iso_details && (
          <div className="bg-dark-card border border-dark-hover rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">ISO 9241-11 Details</h2>
            <div className="mb-4">
              <p className="text-lg font-semibold text-text-primary">Score: {report.iso_details.iso_score || 0}/100</p>
              <p className="text-sm text-text-secondary">Weakest Metric: {report.iso_details.weakest_metric || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(report.iso_details.sub_scores || {}).map(([metric, score]) => (
                <div key={metric} className="p-3 bg-dark-bg border border-green-700 rounded-lg">
                  <div className="font-medium text-text-primary capitalize">{metric.replace(/_/g, ' ')}</div>
                  <div className="text-2xl font-bold text-green-400">{score}/4</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nielsen Details */}
        {report.nielsen_details && (
          <div className="bg-dark-card border border-dark-hover rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">Nielsen Heuristics Details</h2>
            <div className="mb-4">
              <p className="text-lg font-semibold text-text-primary">Score: {report.nielsen_details.nielsen_score || 0}/100</p>
              <p className="text-sm text-text-secondary">Weakest Metric: {report.nielsen_details.weakest_metric || 'N/A'}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.nielsen_details.sub_scores || {}).map(([metric, score]) => (
                <div key={metric} className="p-3 bg-dark-bg border border-purple-700 rounded-lg">
                  <div className="font-medium text-text-primary capitalize">{metric.replace(/_/g, ' ')}</div>
                  <div className="text-2xl font-bold text-purple-400">{score}/4</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WCAG Details */}
        {report.wcag_details && (
          <div className="bg-dark-card border border-dark-hover rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-primary mb-4">WCAG 2.2 Details</h2>
            <div className="mb-4">
              <p className="text-lg font-semibold text-text-primary">Score: {report.wcag_details.wcag_score || 0}/100</p>
              <p className="text-sm text-text-secondary">
                Reliability: {report.wcag_details.reliability || 'N/A'} |
                Weakest POUR: {report.wcag_details.weakest_pour || 'N/A'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-dark-bg border border-blue-700 rounded-lg">
                <div className="font-medium text-text-primary">Alt Text</div>
                <div className="text-2xl font-bold text-blue-400">{report.wcag_details.alt_score || 0}%</div>
              </div>
              <div className="p-3 bg-dark-bg border border-blue-700 rounded-lg">
                <div className="font-medium text-text-primary">Landmarks</div>
                <div className="text-2xl font-bold text-blue-400">{report.wcag_details.landmark_score || 0}%</div>
              </div>
              <div className="p-3 bg-dark-bg border border-blue-700 rounded-lg">
                <div className="font-medium text-text-primary">Contrast</div>
                <div className="text-2xl font-bold text-blue-400">{report.wcag_details.contrast_score || 0}%</div>
              </div>
              <div className="p-3 bg-dark-bg border border-blue-700 rounded-lg">
                <div className="font-medium text-text-primary">Language</div>
                <div className="text-2xl font-bold text-blue-400">{report.wcag_details.lang_score || 0}%</div>
              </div>
            </div>
            {report.wcag_details.pour_scores && (
              <div className="mt-4">
                <h3 className="font-semibold text-text-primary mb-2">POUR Scores</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(report.wcag_details.pour_scores).map(([principle, score]) => (
                    <div key={principle} className="p-3 bg-dark-bg border border-blue-700 rounded-lg">
                      <div className="font-medium text-text-primary">{principle}</div>
                      <div className="text-xl font-bold text-blue-400">{score !== null ? score : 'N/A'}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Preview Link */}
        <div className="bg-dark-card border border-dark-hover rounded-lg shadow-sm p-6">
          <Link
            href={`/preview/${screenId}`}
            className="inline-flex items-center px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            View Screen Preview
          </Link>
        </div>
      </div>
    </div>
  );
}