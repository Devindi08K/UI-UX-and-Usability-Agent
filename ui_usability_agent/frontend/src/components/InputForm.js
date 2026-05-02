'use client';

import React from 'react';

export default function InputForm({ requirements, onRequirementsChange, onPlan, loading }) {
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