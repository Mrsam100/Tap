import React from 'react';

const LoadingState: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-up">
    <div className="relative w-24 h-24 mb-8">
      <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
      <div className="absolute inset-0 border-4 border-t-jam-red border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
    </div>
    <h2 className="text-2xl sm:text-3xl font-serif text-ink mb-2">Generating your page...</h2>
    <p className="text-slate-500 font-light">Analyzing your business description</p>
  </div>
);

export default LoadingState;
