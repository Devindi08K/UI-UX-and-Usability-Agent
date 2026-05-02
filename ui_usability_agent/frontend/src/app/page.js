'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import InputForm from '../components/InputForm';
import UIOutput from '../components/UIOutput';

export default function Home() {
  const [activeStep, setActiveStep] = useState('plan');
  const [requirements, setRequirements] = useState('');
  const [planScreens, setPlanScreens] = useState([]);
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [generatedUI, setGeneratedUI] = useState('');
  const [evaluationReports, setEvaluationReports] = useState([]);
  const [loading, setLoading] = useState({ plan: false, generate: false, evaluate: false });
  const [error, setError] = useState('');
  const [logs, setLogs] = useState('');
  const [outputScreens, setOutputScreens] = useState([]);
  const [outputsLoading, setOutputsLoading] = useState(false);

  const formatLogs = (logData) => {
    if (!logData) return '';
    const stdout = logData.stdout ? `STDOUT:\n${logData.stdout}` : '';
    const stderr = logData.stderr ? `STDERR:\n${logData.stderr}` : '';
    return [stdout, stderr].filter(Boolean).join('\n\n');
  };

  const loadOutputs = async () => {
    try {
      setOutputsLoading(true);
      const response = await fetch('/api/outputs');
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load outputs.');
      }
      setOutputScreens(data.screens || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load outputs.');
    } finally {
      setOutputsLoading(false);
    }
  };

  const previewOutput = async (screenId) => {
    try {
      setError('');
      const response = await fetch(`/api/outputs?screenId=${encodeURIComponent(screenId)}`);
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load output.');
      }
      setGeneratedUI(data.html || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load output.');
    }
  };

  const handlePlan = async () => {
    try {
      setError('');
      setLoading((prev) => ({ ...prev, plan: true }));
      if (!requirements.trim()) {
        throw new Error('Please provide requirements JSON or upload a file.');
      }

      let parsedRequirements;
      try {
        parsedRequirements = JSON.parse(requirements);
      } catch (parseError) {
        throw new Error('Requirements must be valid JSON.');
      }

      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requirements: parsedRequirements }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Planning failed.');
      }

      setPlanScreens(data.screens || []);
      setSelectedScreenId(data.screens?.[0]?.screen_id || '');
      setLogs(formatLogs(data.logs));
      setActiveStep('generate');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Planning failed.');
    } finally {
      setLoading((prev) => ({ ...prev, plan: false }));
    }
  };

  const handleGenerate = async () => {
    try {
      setError('');
      if (!selectedScreenId) {
        setError('Select a screen to generate.');
        return;
      }

      setLoading((prev) => ({ ...prev, generate: true }));
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenId: selectedScreenId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Generation failed.');
      }

      setGeneratedUI(data.html || '');
      setLogs(formatLogs(data.logs));
      setActiveStep('evaluate');
      loadOutputs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setLoading((prev) => ({ ...prev, generate: false }));
    }
  };

  const handleEvaluate = async () => {
    try {
      setError('');
      setLoading((prev) => ({ ...prev, evaluate: true }));

      const response = await fetch('/api/evaluate', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Evaluation failed.');
      }

      setEvaluationReports(data.reports || []);
      setLogs(formatLogs(data.logs));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed.');
    } finally {
      setLoading((prev) => ({ ...prev, evaluate: false }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral text-accent">
      <Header />
      <main className="container mx-auto p-6">
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            className={`px-4 py-2 rounded-full border ${activeStep === 'plan' ? 'bg-primary text-accent' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveStep('plan')}
          >
            1. Planning
          </button>
          <button
            className={`px-4 py-2 rounded-full border ${activeStep === 'generate' ? 'bg-primary text-accent' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveStep('generate')}
          >
            2. Generation
          </button>
          <button
            className={`px-4 py-2 rounded-full border ${activeStep === 'evaluate' ? 'bg-primary text-accent' : 'bg-white text-gray-700'}`}
            onClick={() => setActiveStep('evaluate')}
          >
            3. Evaluation
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 text-red-700 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}

        {activeStep === 'plan' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <InputForm
              requirements={requirements}
              onRequirementsChange={setRequirements}
              onPlan={handlePlan}
              loading={loading.plan}
            />
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-accent">Planned Screens</h2>
              {planScreens.length === 0 ? (
                <p className="text-gray-500">No screen plan yet.</p>
              ) : (
                <ul className="space-y-3">
                  {planScreens.map((screen) => (
                    <li key={screen.screen_id} className="border rounded-md p-3">
                      <div className="font-semibold text-primary">{screen.screen_name}</div>
                      <div className="text-sm text-gray-600">{screen.screen_id} · {screen.screen_type}</div>
                      <div className="text-sm text-gray-500 mt-1">{screen.purpose}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {activeStep === 'generate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-accent">Generate UI</h2>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select screen</label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={selectedScreenId}
                onChange={(e) => setSelectedScreenId(e.target.value)}
              >
                <option value="">Choose a screen</option>
                {planScreens.map((screen) => (
                  <option key={screen.screen_id} value={screen.screen_id}>
                    {screen.screen_name} ({screen.screen_id})
                  </option>
                ))}
              </select>
              <button
                className="mt-4 bg-primary text-accent px-6 py-2 rounded-md hover:bg-cyan-dark transition"
                onClick={handleGenerate}
                disabled={loading.generate}
              >
                {loading.generate ? 'Generating...' : 'Generate Screen'}
              </button>
              <div className="mt-6 border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-accent">Generated Files</h3>
                  <button
                    className="text-sm text-primary hover:underline"
                    onClick={loadOutputs}
                    disabled={outputsLoading}
                  >
                    {outputsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {outputScreens.length === 0 ? (
                  <p className="text-gray-500">No generated files yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {outputScreens.map((screenId) => (
                      <li key={screenId} className="flex items-center justify-between border rounded-md px-3 py-2">
                        <span className="text-sm text-gray-700">{screenId}</span>
                        <div className="flex gap-3">
                          <button
                            className="text-sm text-primary hover:underline"
                            onClick={() => previewOutput(screenId)}
                          >
                            Preview
                          </button>
                          <button
                            className="text-sm text-primary hover:underline"
                            onClick={() => window.open(`/preview/${screenId}`, '_blank')}
                          >
                            Open
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <UIOutput generatedUI={generatedUI} />
          </div>
        )}

        {activeStep === 'evaluate' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-accent">Evaluate Screens</h2>
              <p className="text-gray-600 mb-4">Runs the evaluation pipeline on all generated screens.</p>
              <button
                className="bg-primary text-accent px-6 py-2 rounded-md hover:bg-cyan-dark transition"
                onClick={handleEvaluate}
                disabled={loading.evaluate}
              >
                {loading.evaluate ? 'Evaluating...' : 'Run Evaluation'}
              </button>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 text-accent">Score Reports</h2>
              {evaluationReports.length === 0 ? (
                <p className="text-gray-500">No reports yet.</p>
              ) : (
                <div className="space-y-4">
                  {evaluationReports.map(({ screenId, report }) => (
                    <div key={screenId} className="border rounded-md p-3">
                      <div className="font-semibold text-primary">{screenId}</div>
                      <div className="text-sm text-gray-600">Total: {report.total_score} · ISO: {report.iso_score} · Nielsen: {report.nielsen_score} · WCAG: {report.wcag_score}</div>
                      <div className="text-sm text-gray-500">Weakest: {report.weakest_standard} / {report.weakest_metric}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-lg shadow-md mt-6">
          <h2 className="text-xl font-semibold mb-4 text-accent">Pipeline Logs</h2>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap bg-gray-50 border rounded-md p-3 min-h-[120px]">
            {logs || 'No logs yet.'}
          </pre>
        </div>
      </main>
    </div>
  );
}
