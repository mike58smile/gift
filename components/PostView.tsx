import React, { useEffect, useRef, useState } from 'react';
import { ProcessedPost } from '../types';

interface PostViewProps {
  post: ProcessedPost;
  onClear: () => void;
}

export const PostView: React.FC<PostViewProps> = ({ post, onClear }) => {
  const [isImageOpen, setIsImageOpen] = useState(false);
  const pushedStateRef = useRef(false);

  const openImage = () => {
    setIsImageOpen(true);
    if (!pushedStateRef.current) {
      window.history.pushState({ imageModal: true }, '', window.location.href);
      pushedStateRef.current = true;
    }
  };

  const closeImage = () => {
    setIsImageOpen(false);
    if (pushedStateRef.current) {
      pushedStateRef.current = false;
      window.history.back();
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      if (isImageOpen) {
        setIsImageOpen(false);
        pushedStateRef.current = false;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isImageOpen]);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-gray-300 border border-gray-800 rounded-full px-3 py-1 hover:border-gray-600 hover:text-white transition-colors"
        >
          Clear view
        </button>
      </div>

      {/* Result Card - Image Only */}
      <div className="rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
        <img 
            src={post.transformedImage} 
            alt="Transformed" 
            className="w-full h-auto object-cover min-h-[300px]"
            onClick={openImage}
        />
      </div>

      {/* Details Section - Moved outside image */}
      <div className="px-2 space-y-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-purple-300 uppercase bg-purple-900/20 rounded-full border border-purple-500/30">
            Style: {post.stylePrompt}
          </span>
          <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-indigo-200 uppercase bg-indigo-900/20 rounded-full border border-indigo-500/30">
            Output: {post.outputLanguage}
          </span>
        </div>

        <p className="text-gray-300 text-base leading-relaxed">
          {post.outputText}
        </p>

        {post.outputPrompt && post.outputPrompt.toLowerCase() !== 'manual' && (
          <p className="text-gray-500 text-xs leading-relaxed">
              Instruction: {post.outputPrompt}
          </p>
        )}
      </div>

      {/* Original Image Context */}
      <div className="px-2 pt-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 ml-1">Original Source</h3>
        <div className="rounded-xl overflow-hidden border border-gray-800 opacity-60 hover:opacity-100 transition-opacity">
            <img 
                src={post.originalImage} 
                alt="Original" 
                className="w-full h-48 object-cover"
            />
        </div>
      </div>

      {isImageOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeImage}
        >
          <img
            src={post.transformedImage}
            alt="Transformed full"
            className="max-w-full max-h-full rounded-lg"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};