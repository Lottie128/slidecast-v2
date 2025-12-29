// ============================================
// SlideCast V2 - Preloader Component
// IQ Didactic inspired design
// ============================================

import React from 'react';

const Preloader: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <h2 className="text-3xl font-bold gradient-text mb-2">SlideCast</h2>
        <p className="text-slate-400 text-sm">Loading your workspace...</p>
      </div>
    </div>
  );
};

export default Preloader;
