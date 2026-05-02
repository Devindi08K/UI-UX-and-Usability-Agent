'use client';

import React from 'react';

export default function InputForm({ requirements, onRequirementsChange, onPlan, loading }) {
  const handleFileUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onRequirementsChange(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const handleSubmit = () => {
    onPlan();
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4 text-accent">Input Requirements</h2>
      <textarea
        className="w-full h-40 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Enter JSON requirements..."
        value={requirements}
        onChange={(e) => onRequirementsChange(e.target.value)}
      />
      <label className="block text-sm text-gray-600 mt-3">
        Upload requirements JSON
      </label>
      <input
        type="file"
        accept="application/json"
        onChange={handleFileUpload}
        className="mt-1 block w-full text-sm text-gray-600"
      />
      <button
        className="mt-4 bg-primary text-accent px-6 py-2 rounded-md hover:bg-cyan-dark transition"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? 'Planning...' : 'Run Planning'}
      </button>
    </div>
  );
}