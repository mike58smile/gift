const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const generateSpeech = async (
  text: string,
  voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'alloy'
): Promise<string> => {
  const response = await fetch(`${API_BASE_URL}/api/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, voice })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`TTS generation failed: ${response.status} ${errorText}`);
  }

  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
