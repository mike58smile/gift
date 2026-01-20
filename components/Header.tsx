import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-gray-950/80 border-b border-gray-800 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                Gemini Style Morph
            </h1>
            <a href="#" className="text-xs text-gray-500 hover:text-white transition-colors">
                New
            </a>
        </div>
    </header>
  );
};