import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { compressImage } from '../services/imageUtils';
import { generateDescription, styleImage } from '../services/geminiService';
import { AppStatus, ProcessedPost } from '../types';

interface CreatePostProps {
  id: string;
  onComplete: (post: ProcessedPost) => void;
}

export const CreatePost: React.FC<CreatePostProps> = ({ id, onComplete }) => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('English');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languageOptions = [
    'English',
    'Spanish',
    'French',
    'German',
    'Portuguese',
    'Hindi',
    'Japanese'
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus(AppStatus.COMPRESSING);
    try {
      const compressed = await compressImage(file);
      setSelectedImage(compressed);
      setStatus(AppStatus.IDLE);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to process image. Try another.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleSubmit = async () => {
    if (!selectedImage || !stylePrompt.trim() || !outputPrompt.trim()) return;

    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);

    try {
      // Execute both Gemini operations in parallel
      const [descResult, styleResult] = await Promise.allSettled([
        generateDescription(selectedImage, outputPrompt, outputLanguage),
        styleImage(selectedImage, stylePrompt)
      ]);

      if (styleResult.status === 'rejected') {
        throw new Error(styleResult.reason?.message || "Image styling failed");
      }
      
      const outputText = descResult.status === 'fulfilled' ? descResult.value : "Output unavailable.";
      const transformedImage = styleResult.value;

      const newPost: ProcessedPost = {
        id,
        originalImage: selectedImage,
        transformedImage,
        outputText,
        outputPrompt,
        outputLanguage,
        stylePrompt,
        timestamp: Date.now()
      };

      onComplete(newPost);
      setStatus(AppStatus.COMPLETE);

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Something went wrong with the AI generation.");
      setStatus(AppStatus.ERROR);
    }
  };

  if (status === AppStatus.GENERATING) {
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
            Gemini is Dreaming
        </h2>
        <p className="text-gray-400 max-w-xs">
            Analyzing your photo and reimagining it in your requested style...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24">
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-white">Create Magic</h2>
        <p className="text-gray-400">Capture a moment, give it a style.</p>
      </div>

      {/* Image Preview / Selector */}
      <div 
        onClick={() => fileInputRef.current?.click()}
        className={`
            relative w-full aspect-[4/3] rounded-3xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group
            ${selectedImage ? 'border-indigo-500/50 bg-gray-900' : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800 hover:border-gray-600'}
        `}
      >
        {selectedImage ? (
            <>
                <img src={selectedImage} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-semibold">Tap to change</span>
                </div>
            </>
        ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg className="w-12 h-12 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">Tap to take photo</span>
            </div>
        )}
        <input 
            ref={fileInputRef}
            type="file" 
            accept="image/*" 
            capture="environment"
            className="hidden" 
            onChange={handleFileChange}
        />
      </div>

      {/* Prompt Input */}
      {selectedImage && (
        <div className="space-y-4 animate-fade-in">
            <div className="bg-gray-900/50 p-1 rounded-2xl border border-gray-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                <textarea
              value={stylePrompt}
              onChange={(e) => setStylePrompt(e.target.value)}
                    placeholder="Describe the style (e.g., 'Cyberpunk city', 'Oil painting by Van Gogh', 'Made of Lego')"
                    className="w-full bg-transparent border-none text-white placeholder-gray-500 p-4 focus:ring-0 resize-none min-h-[100px]"
                />
            </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Language</label>
            <div className="flex flex-wrap gap-2">
              {languageOptions.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setOutputLanguage(lang)}
                  className={
                    `px-3 py-1 rounded-full text-xs font-semibold border transition-all ` +
                    (outputLanguage === lang
                      ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
                      : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
                  }
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900/50 p-1 rounded-2xl border border-gray-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
            <textarea
              value={outputPrompt}
              onChange={(e) => setOutputPrompt(e.target.value)}
              placeholder="Tell Gemini how to write the text (e.g., 'Sarcastically describe the scene', 'Write a short plot for this scene')"
              className="w-full bg-transparent border-none text-white placeholder-gray-500 p-4 focus:ring-0 resize-none min-h-[90px]"
            />
          </div>
            
            {errorMsg && (
                <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-200 text-sm">
                    {errorMsg}
                </div>
            )}

            <Button onClick={handleSubmit} disabled={!stylePrompt.trim() || !outputPrompt.trim()}>
                Transform Reality
            </Button>
        </div>
      )}
    </div>
  );
};