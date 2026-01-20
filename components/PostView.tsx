import React from 'react';
import { ProcessedPost } from '../types';

interface PostViewProps {
  post: ProcessedPost;
}

export const PostView: React.FC<PostViewProps> = ({ post }) => {
  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Result Card - Image Only */}
      <div className="rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl">
        <img 
            src={post.transformedImage} 
            alt="Transformed" 
            className="w-full h-auto object-cover min-h-[300px]"
        />
      </div>

      {/* Details Section - Moved outside image */}
      <div className="px-2 space-y-4">
        <div>
            <span className="inline-block px-3 py-1 text-xs font-bold tracking-wider text-purple-300 uppercase bg-purple-900/20 rounded-full border border-purple-500/30">
                Start: {post.stylePrompt}
            </span>
        </div>
        
        <p className="text-gray-300 text-base leading-relaxed">
            {post.description}
        </p>
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
    </div>
  );
};