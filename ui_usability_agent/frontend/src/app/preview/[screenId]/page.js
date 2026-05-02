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
        )}
      </main>
    </div>
  );
}