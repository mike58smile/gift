import React, { useEffect, useState } from 'react';
import { CreatePost } from './components/CreatePost';
import { PostView } from './components/PostView';
import { PromptCapture } from './components/PromptCapture';
import { getPost, savePost, generateId } from './services/storage';
import { ProcessedPost } from './types';
import { checkApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [currentId, setCurrentId] = useState<string>('');
  const [postData, setPostData] = useState<ProcessedPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasKey, setHasKey] = useState(false);
  const [urlPrompt, setUrlPrompt] = useState<string | null>(null);

  // Initial load and history listener
  useEffect(() => {
    let isActive = true;

    const handlePathChange = async () => {
      setIsLoading(true);
      setUrlPrompt(null);
      const path = window.location.pathname;
      const parts = path.split('/').filter(Boolean);
      
      // Check for /:prompt/id/:id format (3 parts: prompt, "id", actualId)
      if (parts.length >= 3 && parts[1] === 'id' && parts[2]) {
        const prompt = decodeURIComponent(parts[0]);
        const id = parts[2];
        setCurrentId(id);
        setUrlPrompt(prompt);
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
      }
      // Check for /id/:id format (2 parts)
      else if (parts.length >= 2 && parts[0] === 'id' && parts[1]) {
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
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans selection:bg-purple-500/30 flex flex-col">
      <main className="max-w-md mx-auto px-4 py-8 flex-1">
        {isLoading ? (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        ) : (
            <>
                {postData ? (
                  <PostView post={postData} onClear={() => setPostData(null)} autoNarrate={true} />
                ) : urlPrompt ? (
                    <PromptCapture id={currentId} prompt={urlPrompt} onComplete={handlePostComplete} />
                ) : (
                    <CreatePost id={currentId} onComplete={handlePostComplete} />
                )}
            </>
        )}
      </main>

      {/* Footer */}
      <div className="p-4 bg-gray-950/80 border-t border-gray-900 text-center">
        <a
          href="https://mike58smile.github.io/surprise/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-base text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors"
        >
          {postData?.outputLanguage === 'Slovak' ? 'Otázky? Klikni sem!' : postData?.outputLanguage === 'Czech' ? 'Otázky? Klikni sem!' : 'Questions? Click here!'}
        </a>
      </div>
    </div>
  );
};

export default App;