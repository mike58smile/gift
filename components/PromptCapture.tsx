import React, { useState, useRef } from 'react';
import { compressImage } from '../services/imageUtils';
import { generateDescription } from '../services/geminiService';
import { AppStatus, ProcessedPost } from '../types';

interface PromptCaptureProps {
  id: string;
  prompt: string;
  onComplete: (post: ProcessedPost) => void;
}

export const PromptCapture: React.FC<PromptCaptureProps> = ({ id, prompt, onComplete }) => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Decode the prompt from URL encoding
  const decodedPrompt = decodeURIComponent(prompt);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.COMPRESSING);
    setErrorMsg(null);

    try {
      const compressed = await compressImage(file);
      
      setStatus(AppStatus.GENERATING);
      
      // Generate description using the URL prompt
      const outputText = await generateDescription(compressed, decodedPrompt, 'English');
      
      const newPost: ProcessedPost = {
        id,
        originalImage: compressed,
        transformedImage: compressed,
        outputText,
        outputPrompt: decodedPrompt,
        outputLanguage: 'English',
        stylePrompt: 'Original',
        timestamp: Date.now(),
        minimalView: true
      };

      onComplete(newPost);
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong.");
      setStatus(AppStatus.ERROR);
    }
  };

  if (status === AppStatus.COMPRESSING || status === AppStatus.GENERATING) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center animate-fade-in">
        <div className="relative w-24 h-24 mb-8">
          <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-t-2 border-l-2 border-purple-500 animate-spin-reverse"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
        </div>
        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-pink-400 mb-2">
          {status === AppStatus.COMPRESSING ? 'Processing Image...' : 'Gemini is Thinking'}
        </h2>
        <p className="text-gray-400 max-w-xs">
          {status === AppStatus.GENERATING ? 'Generating your content...' : 'Please wait...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 w-full">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Quick Capture</h2>
        <p className="text-gray-400 text-sm">Take a photo to generate content</p>
      </div>

      {/* Prompt display */}
      <div className="bg-gray-900/50 rounded-2xl border border-gray-800 p-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Prompt</p>
        <p className="text-gray-200 text-sm">{decodedPrompt}</p>
      </div>

      {/* Image Capture */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-dashed border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600 transition-all cursor-pointer group"
      >
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="font-medium text-lg">Tap to take photo</span>
          <span className="text-sm text-gray-600 mt-1">Content will be generated automatically</span>
        </div>
        <input 
          ref={fileInputRef}
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          onChange={handleFileChange}
        />
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-200 text-sm">
          {errorMsg}
          <button
            onClick={() => setErrorMsg(null)}
            className="block mt-2 text-xs underline"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
};
