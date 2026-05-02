'use client';

import React, { useState } from 'react';
import Header from '../components/Header';
import InputForm from '../components/InputForm';
import UIOutput from '../components/UIOutput';
import ScoresDisplay from '../components/ScoresDisplay';

export default function Home() {
  const [generatedUI, setGeneratedUI] = useState('');
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleGenerate = async (requirements) => {
    setLoading(true);
    // TODO: Call backend API with requirements
    // For now, mock response
    setTimeout(() => {
      setGeneratedUI('<div class="p-4 bg-cyan-100 text-black">Mock Generated UI</div>');
      setScores({ iso: 85, nielsen: 90, wcag: 88, composite: 87 });
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-neutral text-accent">
      <Header />
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputForm onGenerate={handleGenerate} loading={loading} />
          <UIOutput generatedUI={generatedUI} />
        </div>
        <ScoresDisplay scores={scores} />
      </main>
    </div>
  );
}
