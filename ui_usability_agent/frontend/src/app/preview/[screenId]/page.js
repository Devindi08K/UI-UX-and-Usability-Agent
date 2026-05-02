'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function PreviewPage() {
  const params = useParams();
  const screenId = params?.screenId;
  const [html, setHtml] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!screenId) return;

    const loadPreview = async () => {
      try {
        setError('');
        const response = await fetch(`/api/outputs?screenId=${encodeURIComponent(screenId)}`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load preview.');
        }
        setHtml(data.html || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load preview.');
      }
    };

    loadPreview();
  }, [screenId]);

  return (
    <div className="min-h-screen bg-neutral text-accent">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-primary">Preview: {screenId}</h1>
            <p className="text-gray-600">Generated HTML preview</p>
          </div>
          <a
            className="text-primary hover:underline"
            href="/"
          >
            Back to Wizard
          </a>
        </div>
        {error ? (
          <div className="bg-red-100 text-red-700 border border-red-200 p-4 rounded">
            {error}
          </div>
        ) : (
          <div className="bg-white border rounded-lg shadow-sm p-4">
            {html ? (
              <div dangerouslySetInnerHTML={{ __html: html }} />
            ) : (
              <p className="text-gray-500">Loading preview...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}