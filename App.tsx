import React, { useEffect, useState } from 'react';
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

  // Initial load and history listener
  useEffect(() => {
    let isActive = true;

    const handlePathChange = async () => {
      setIsLoading(true);
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      
      // Expected format: /id/xyz
      
      // If we have an ID in the path
      if (parts.length >= 2 && parts[0] === 'id' && parts[1]) {
        const id = parts[1];
        setCurrentId(id);
        try {
          const saved = await getPost(id);
          if (isActive) {
            setPostData(saved);
          }
        } catch (error) {
          console.error('Failed to load post from service', error);
          if (isActive) {
            setPostData(null);
          }
        }
      } else {
        // No ID, redirect to a new random ID
        const newId = generateId();
        setCurrentId(newId);
        setPostData(null);
        window.history.replaceState(null, '', `/id/${newId}`);
      }

      if (isActive) {
        setIsLoading(false);
      }
    };

    // Check API Key first
    const keyAvailable = checkApiKey();
    setHasKey(keyAvailable);

    if (keyAvailable) {
        handlePathChange(); // Run once on mount
        window.addEventListener('popstate', handlePathChange);
    } else {
        setIsLoading(false);
    }

    return () => {
      isActive = false;
      window.removeEventListener('popstate', handlePathChange);
    };
  }, []);

  const handlePostComplete = async (post: ProcessedPost) => {
    try {
      await savePost(post);
      setPostData(post);
    } catch (error) {
      console.error('Failed to save post to service', error);
      alert('Failed to save. Please try again.');
    }
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
      <main className="max-w-md mx-auto px-4 py-8">
        {isLoading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        ) : (
            <>
                {postData ? (
                  <PostView post={postData} onClear={() => setPostData(null)} />
                ) : (
                    <CreatePost id={currentId} onComplete={handlePostComplete} />
                )}
            </>
        )}
      </main>

      {/* Web Service Notice */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-950/80 backdrop-blur-sm border-t border-gray-900 text-center z-40">
        <p className="text-[10px] text-gray-500">
        Share the URL with anyone - they can view your creation on any device. Data is stored in the web service.
        </p>
      </div>
    </div>
  );
};

export default App;