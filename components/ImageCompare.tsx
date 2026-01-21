import React, { useState, useRef } from 'react';
import { Button } from './Button';
import { generateDescription, styleImage } from '../services/geminiService';
import { AppStatus, ProcessedPost } from '../types';

interface ImageCompareProps {
  id: string;
  originalImage: string;
  transformedImage: string;
  onComplete: (post: ProcessedPost) => void;
  onRestart: () => void;
}

export const ImageCompare: React.FC<ImageCompareProps> = ({
  id,
  originalImage,
  transformedImage,
  onComplete,
  onRestart
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [sourceImage, setSourceImage] = useState<'original' | 'transformed'>('original');
  const [currentTransformed, setCurrentTransformed] = useState(transformedImage);
  const [stylePrompt, setStylePrompt] = useState('');
  const [outputPrompt, setOutputPrompt] = useState('');
  const [outputLanguage, setOutputLanguage] = useState('English');
  const [includeText, setIncludeText] = useState(false);
  const [useTransformedForDescription, setUseTransformedForDescription] = useState(false);
  const [minimalView, setMinimalView] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const languageOptions = ['English', 'Slovak', 'Czech'];

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const position = ((clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, position)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    updateSliderPosition(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    updateSliderPosition(e.clientX);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleSubmit = async () => {
    const baseImage = sourceImage === 'original' ? originalImage : currentTransformed;
    
    // If no style prompt - use current image directly for show page
    if (!stylePrompt.trim()) {
      if (includeText && outputPrompt.trim()) {
        // Generate text only
        setStatus(AppStatus.GENERATING);
        setErrorMsg(null);
        try {
          const imageForDescription = useTransformedForDescription ? currentTransformed : originalImage;
          const outputText = await generateDescription(imageForDescription, outputPrompt, outputLanguage);
          
          const newPost: ProcessedPost = {
            id,
            originalImage,
            transformedImage: currentTransformed,
            outputText,
            outputPrompt,
            outputLanguage,
            stylePrompt: 'Original',
            timestamp: Date.now(),
            minimalView
          };
          onComplete(newPost);
        } catch (err: any) {
          setErrorMsg(err.message || "Failed to generate text.");
          setStatus(AppStatus.ERROR);
        }
      } else {
        // No style, no text - just use current images for show page
        const newPost: ProcessedPost = {
          id,
          originalImage,
          transformedImage: currentTransformed,
          outputText: '',
          outputPrompt: 'None',
          outputLanguage: 'None',
          stylePrompt: 'Original',
          timestamp: Date.now(),
          minimalView
        };
        onComplete(newPost);
      }
      return;
    }

    // Generate new styled image
    setStatus(AppStatus.GENERATING);
    setErrorMsg(null);

    try {
      const newTransformed = await styleImage(baseImage, stylePrompt);
      
      if (includeText && outputPrompt.trim()) {
        // Generate text too
        const imageForDescription = useTransformedForDescription ? newTransformed : originalImage;
        let outputText = '';
        try {
          outputText = await generateDescription(imageForDescription, outputPrompt, outputLanguage);
        } catch {
          outputText = "Output unavailable.";
        }
        
        const newPost: ProcessedPost = {
          id,
          originalImage,
          transformedImage: newTransformed,
          outputText,
          outputPrompt,
          outputLanguage,
          stylePrompt,
          timestamp: Date.now(),
          minimalView
        };
        onComplete(newPost);
      } else {
        // No text - stay on compare page with new image
        setCurrentTransformed(newTransformed);
        setStylePrompt('');
        setStatus(AppStatus.IDLE);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate image.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleFinish = () => {
    // Use current state to create post without generating anything new
    const newPost: ProcessedPost = {
      id,
      originalImage,
      transformedImage: currentTransformed,
      outputText: '',
      outputPrompt: 'None',
      outputLanguage: 'None',
      stylePrompt: 'Styled',
      timestamp: Date.now(),
      minimalView
    };
    onComplete(newPost);
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
          {includeText ? 'Generating image and text...' : 'Generating new image...'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-24 w-full">
      <div className="text-center space-y-2 mb-4">
        <h2 className="text-2xl font-bold text-white">Compare Result</h2>
        <p className="text-gray-400 text-sm">Slide to compare original and transformed</p>
      </div>

      {/* Image Comparison Slider */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden border border-gray-800 cursor-ew-resize select-none touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Original Image (background) */}
        <img
          src={originalImage}
          alt="Original"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
        
        {/* Transformed Image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={currentTransformed}
            alt="Transformed"
            className="absolute top-0 left-0 h-full object-cover"
            style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100vw', maxWidth: 'none' }}
            draggable={false}
          />
        </div>

        {/* Slider Line */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg pointer-events-none"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 rounded text-xs text-white pointer-events-none">
          Transformed
        </div>
        <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 rounded text-xs text-white pointer-events-none">
          Original
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700 transition-all"
        >
          Start Over
        </button>
        <button
          type="button"
          onClick={handleFinish}
          className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold border border-indigo-400/50 bg-indigo-500/20 text-indigo-200 hover:bg-indigo-500/30 transition-all"
        >
          Use This Image
        </button>
      </div>

      {/* Source toggle for next generation */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Source for next generation</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSourceImage('original')}
            className={
              `flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ` +
              (sourceImage === 'original'
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
            }
          >
            Original
          </button>
          <button
            type="button"
            onClick={() => setSourceImage('transformed')}
            className={
              `flex-1 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ` +
              (sourceImage === 'transformed'
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
            }
          >
            Transformed
          </button>
        </div>
      </div>

      {/* Style prompt */}
      <div className="bg-gray-900/50 p-1 rounded-2xl border border-gray-800 focus-within:border-indigo-500/50 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
        <textarea
          value={stylePrompt}
          onChange={(e) => setStylePrompt(e.target.value)}
          placeholder="Describe style for new image (leave empty to use current)"
          className="w-full bg-transparent border-none text-white placeholder-gray-500 p-4 focus:ring-0 resize-none min-h-[80px]"
        />
      </div>

      {/* Include text toggle */}
      <button
        type="button"
        onClick={() => setIncludeText(!includeText)}
        className={
          `w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ` +
          (includeText
            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
            : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
        }
      >
        Include text generation
      </button>

      {includeText && (
        <div className="space-y-4 animate-fade-in">
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
              placeholder="Tell Gemini how to write the text"
              className="w-full bg-transparent border-none text-white placeholder-gray-500 p-4 focus:ring-0 resize-none min-h-[80px]"
            />
          </div>

          <button
            type="button"
            onClick={() => setUseTransformedForDescription(!useTransformedForDescription)}
            className={
              `w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ` +
              (useTransformedForDescription
                ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
                : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
            }
          >
            Use transformed image for description
          </button>
        </div>
      )}

      {/* Minimal view option */}
      <button
        type="button"
        onClick={() => setMinimalView(!minimalView)}
        className={
          `w-full px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left ` +
          (minimalView
            ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/50'
            : 'bg-gray-900/40 text-gray-400 border-gray-800 hover:border-gray-700')
        }
      >
        Minimal view (hide extra elements)
      </button>

      {errorMsg && (
        <div className="p-4 bg-red-900/20 border border-red-500/20 rounded-xl text-red-200 text-sm">
          {errorMsg}
        </div>
      )}

      <Button onClick={handleSubmit}>
        {stylePrompt.trim() ? (includeText && outputPrompt.trim() ? 'Generate & Finish' : 'Generate New Image') : (includeText && outputPrompt.trim() ? 'Generate Text & Finish' : 'Finish')}
      </Button>
    </div>
  );
};
