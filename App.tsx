import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { CreatePost } from './components/CreatePost';
import { PostView } from './components/PostView';
import { getPost, savePost, generateId } from './services/storage';
import { ProcessedPost } from './types';
import { checkApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [currentId, setCurrentId] = useState<string>('');
  const [postData, setPostData] = useState<ProcessedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);

  // Initial load and hash listener
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const parts = hash.split('/');
      
      // Expected format: #/id/xyz or just #/
      
      // If we have an ID in the path
      if (parts.length >= 2 && parts[1]) {
        const id = parts[1];
        setCurrentId(id);
        const saved = getPost(id);
        setPostData(saved);
      } else {
        // No ID, redirect to a new random ID
        const newId = generateId();
        window.location.hash = `/id/${newId}`;
      }
      setIsLoading(false);
    };

    // Check API Key first
    const keyAvailable = checkApiKey();
    setHasKey(keyAvailable);

    if (keyAvailable) {
        handleHashChange(); // Run once on mount
        window.addEventListener('hashchange', handleHashChange);
    } else {
        setIsLoading(false);
    }

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const handlePostComplete = (post: ProcessedPost) => {
    savePost(post);
    setPostData(post);
    // Force a re-render or ensure state update aligns with view
  };

  if (!hasKey) {
     return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">Configuration Error</h1>
            <p className="text-gray-300">
                The Google Gemini API Key is missing. Please ensure the <code>API_KEY</code> environment variable is set in the metadata.
            </p>
        </div>
     );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30">
      <Header />
      
      <main className="max-w-md mx-auto px-4 py-8">
        {isLoading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        ) : (
            <>
                {postData ? (
                    <PostView post={postData} />
                ) : (
                    <CreatePost id={currentId} onComplete={handlePostComplete} />
                )}
            </>
        )}
      </main>

      {/* Web Service Notice */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/80 backdrop-blur-sm border-t border-gray-900 text-center z-40">
        <p className="text-[10px] text-gray-500">
            Share the URL with anyone - they can view your creation on any device! Data is stored in the web service.
        </p>
      </div>
    </div>
  );
};

export default App;