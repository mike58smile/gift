// ElevenLabs Text-to-Speech and Sound Effects Service
// API Reference: https://elevenlabs.io/docs/api-reference/text-to-speech/convert
// Sound Effects API: https://elevenlabs.io/docs/api-reference/text-to-sound-effects/convert
// OpenAI TTS API: https://platform.openai.com/docs/guides/text-to-speech
// Inworld AI TTS API: https://docs.inworld.ai/

const ELEVENLABS_TTS_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const ELEVENLABS_SFX_URL = 'https://api.elevenlabs.io/v1/sound-generation';
const OPENAI_TTS_URL = 'https://api.openai.com/v1/audio/speech';
const INWORLD_TTS_URL = 'https://api.inworld.ai/tts/v1/voice';

// Default voice ID - "George" (a clear, narrative voice)
// You can find more voices at: https://elevenlabs.io/docs/api-reference/voices/search
const DEFAULT_VOICE_ID = 'JBFqnCBsd6RMkjVDRZzb';

// OpenAI voice options: alloy, echo, fable, onyx, nova, shimmer
const DEFAULT_OPENAI_VOICE = 'onyx';

// Inworld voice options
export type InworldVoice = 'Craig' | 'Theodore';
const INWORLD_VOICES: InworldVoice[] = ['Craig', 'Theodore'];
const DEFAULT_INWORLD_VOICE: InworldVoice = 'Craig';

// Current Inworld voice setting
let currentInworldVoice: InworldVoice = DEFAULT_INWORLD_VOICE;

// TTS Provider type
export type TTSProvider = 'elevenlabs' | 'openai' | 'inworld';

// Current TTS provider setting
let currentTTSProvider: TTSProvider = 'elevenlabs';

/**
 * Set the TTS provider to use
 */
export const setTTSProvider = (provider: TTSProvider): void => {
  currentTTSProvider = provider;
};

/**
 * Get the current TTS provider
 */
export const getTTSProvider = (): TTSProvider => currentTTSProvider;

/**
 * Set the Inworld voice to use
 */
export const setInworldVoice = (voice: InworldVoice): void => {
  currentInworldVoice = voice;
};

/**
 * Get the current Inworld voice
 */
export const getInworldVoice = (): InworldVoice => currentInworldVoice;

/**
 * Get available Inworld voices
 */
export const getInworldVoices = (): InworldVoice[] => INWORLD_VOICES;

// Get API keys from environment variables
const getElevenLabsApiKey = () => process.env.ELEVENLABS_API_KEY || '';
const getOpenAIApiKey = () => process.env.OPENAI_API_KEY || '';
const getInworldApiKey = () => process.env.INWORLD_API_KEY || '';

interface TextToSpeechOptions {
  voiceId?: string;
  modelId?: string;
  outputFormat?: string;
  // OpenAI specific
  openaiVoice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  openaiModel?: string;
  openaiInstructions?: string;
  // Inworld specific
  inworldVoice?: string;
  inworldSpeakingRate?: number;
  inworldTemperature?: number;
}

// Default OpenAI voice instructions for atmospheric narration
const DEFAULT_OPENAI_INSTRUCTIONS = "Speak in narrative tone, atmospheric, make pauses when necessary, speak storytelling. Be mysterious yet melodic.";

// Track current audio for stopping
let currentAudio: HTMLAudioElement | null = null;
let currentAudioUrl: string | null = null;

/**
 * Stop any currently playing narration
 */
export const stopNarration = (): void => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if (currentAudioUrl) {
    URL.revokeObjectURL(currentAudioUrl);
    currentAudioUrl = null;
  }
};

/**
 * Check if ElevenLabs API key is configured
 */
export const isElevenLabsConfigured = (): boolean => {
  return !!getElevenLabsApiKey();
};

/**
 * Check if OpenAI API key is configured
 */
export const isOpenAIConfigured = (): boolean => {
  return !!getOpenAIApiKey();
};

/**
 * Check if Inworld API key is configured
 */
export const isInworldConfigured = (): boolean => {
  return !!getInworldApiKey();
};

/**
 * Check if any TTS provider is configured
 */
export const isTTSConfigured = (): boolean => {
  if (currentTTSProvider === 'openai') {
    return isOpenAIConfigured();
  }
  if (currentTTSProvider === 'inworld') {
    return isInworldConfigured();
  }
  return isElevenLabsConfigured();
};

/**
 * Convert text to speech using OpenAI API
 */
const textToSpeechOpenAI = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob | null> => {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    console.error('OpenAI API key not configured. Set OPENAI_API_KEY in environment.');
    return null;
  }

  const {
    openaiVoice = DEFAULT_OPENAI_VOICE,
    openaiModel = 'gpt-4o-mini-tts-2025-03-20',
    openaiInstructions = DEFAULT_OPENAI_INSTRUCTIONS
  } = options;

  try {
    const response = await fetch(OPENAI_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: openaiModel,
        input: text,
        voice: openaiVoice,
        instructions: openaiInstructions
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS API error:', response.status, errorText);
      return null;
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('OpenAI TTS error:', error);
    return null;
  }
};

/**
 * Convert text to speech using ElevenLabs API
 */
const textToSpeechElevenLabs = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob | null> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    console.error('ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in environment.');
    return null;
  }

  const {
    voiceId = DEFAULT_VOICE_ID,
    modelId = 'eleven_multilingual_v2',
    outputFormat = 'mp3_44100_128'
  } = options;

  try {
    const response = await fetch(
      `${ELEVENLABS_TTS_URL}/${voiceId}?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          model_id: modelId
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', response.status, errorText);
      return null;
    }

    const audioBlob = await response.blob();
    return audioBlob;
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return null;
  }
};

/**
 * Convert text to speech using Inworld AI API
 */
const textToSpeechInworld = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob | null> => {
  const apiKey = getInworldApiKey();
  if (!apiKey) {
    console.error('Inworld API key not configured. Set INWORLD_API_KEY in environment.');
    return null;
  }

  const {
    inworldVoice = DEFAULT_INWORLD_VOICE,
    inworldSpeakingRate = 0.87,
    inworldTemperature = 0.84
  } = options;

  try {
    const response = await fetch(INWORLD_TTS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice_id: inworldVoice,
        audio_config: {
          audio_encoding: 'MP3',
          speaking_rate: inworldSpeakingRate
        },
        temperature: inworldTemperature,
        model_id: 'inworld-tts-1'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Inworld TTS API error:', response.status, errorText);
      return null;
    }

    const result = await response.json();
    const audioContent = result.audioContent;
    
    // Convert base64 to Blob
    const binaryString = atob(audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBlob = new Blob([bytes], { type: 'audio/mp3' });
    
    return audioBlob;
  } catch (error) {
    console.error('Inworld TTS error:', error);
    return null;
  }
};

/**
 * Convert text to speech using the current provider
 * @param text - The text to convert to speech
 * @param options - Optional configuration
 * @returns Audio blob or null if failed
 */
export const textToSpeech = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<Blob | null> => {
  if (currentTTSProvider === 'openai') {
    return textToSpeechOpenAI(text, options);
  }
  if (currentTTSProvider === 'inworld') {
    return textToSpeechInworld(text, options);
  }
  return textToSpeechElevenLabs(text, options);
};

/**
 * Play text as speech using the current TTS provider
 * @param text - The text to speak
 * @param options - Optional configuration
 * @returns Promise that resolves when audio starts playing
 */
export const speakText = async (
  text: string,
  options: TextToSpeechOptions = {}
): Promise<void> => {
  // Stop any current narration first
  stopNarration();

  // Use current Inworld voice if not specified
  if (currentTTSProvider === 'inworld' && !options.inworldVoice) {
    options = { ...options, inworldVoice: currentInworldVoice };
  }

  const audioBlob = await textToSpeech(text, options);
  
  if (!audioBlob) {
    console.error('Failed to generate speech');
    return;
  }

  currentAudioUrl = URL.createObjectURL(audioBlob);
  currentAudio = new Audio(currentAudioUrl);
  
  currentAudio.onended = () => {
    if (currentAudioUrl) {
      URL.revokeObjectURL(currentAudioUrl);
      currentAudioUrl = null;
    }
    currentAudio = null;
  };

  await currentAudio.play();
};

/**
 * Narrate game text - cleans up the text and speaks it
 * @param text - The game text to narrate
 */
export const narrateGameText = async (text: string): Promise<void> => {
  if (!isTTSConfigured()) {
    console.log('TTS not configured, skipping narration');
    return;
  }

  // Clean up text for narration (remove system messages in brackets, etc.)
  let cleanText = text
    .replace(/\[.*?\]/g, '') // Remove text in square brackets
    .replace(/\n{2,}/g, '. ') // Replace multiple newlines with period
    .replace(/\n/g, ' ') // Replace single newlines with space
    .replace(/GOAL:/g, 'Your goal is:') // Make GOAL more natural
    .trim();

  if (cleanText) {
    await speakText(cleanText);
  }
};

/**
 * Test the current TTS provider
 * @returns true if test passed, false otherwise
 */
export const testTTS = async (): Promise<boolean> => {
  const provider = currentTTSProvider;
  console.log(`Testing ${provider} Text-to-Speech API...`);
  
  if (!isTTSConfigured()) {
    console.error(`${provider} API key not configured`);
    return false;
  }
  
  const providerName = provider === 'openai' ? 'OpenAI' : provider === 'inworld' ? 'Inworld' : 'ElevenLabs';
  const testText = `Hello! This is a test of the ${providerName} text to speech system. If you can hear this, the integration is working correctly.`;
  
  try {
    await speakText(testText);
    console.log(`${provider} TTS test successful!`);
    return true;
  } catch (error) {
    console.error(`${provider} TTS test failed:`, error);
    return false;
  }
};

/**
 * Simple test function to verify ElevenLabs API is working
 * @returns true if test passed, false otherwise
 */
export const testElevenLabs = async (): Promise<boolean> => {
  const prevProvider = currentTTSProvider;
  setTTSProvider('elevenlabs');
  const result = await testTTS();
  setTTSProvider(prevProvider);
  return result;
};

/**
 * Simple test function to verify OpenAI TTS API is working
 * @returns true if test passed, false otherwise
 */
export const testOpenAI = async (): Promise<boolean> => {
  const prevProvider = currentTTSProvider;
  setTTSProvider('openai');
  const result = await testTTS();
  setTTSProvider(prevProvider);
  return result;
};

/**
 * Simple test function to verify Inworld TTS API is working
 * @returns true if test passed, false otherwise
 */
export const testInworld = async (): Promise<boolean> => {
  const prevProvider = currentTTSProvider;
  setTTSProvider('inworld');
  const result = await testTTS();
  setTTSProvider(prevProvider);
  return result;
};

// ============================================
// SOUND EFFECTS API
// ============================================

interface SoundEffectOptions {
  durationSeconds?: number;
  promptInfluence?: number;
  outputFormat?: string;
}

// Cache for generated sound effects to avoid re-generating
const soundEffectCache: Map<string, Blob> = new Map();

/**
 * Generate a sound effect from text description
 * @param text - Description of the sound effect to generate
 * @param options - Optional configuration
 * @returns Audio blob or null if failed
 */
export const generateSoundEffect = async (
  text: string,
  options: SoundEffectOptions = {}
): Promise<Blob | null> => {
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) {
    console.error('ElevenLabs API key not configured. Set ELEVENLABS_API_KEY in environment.');
    return null;
  }

  // Check cache first
  const cacheKey = `${text}-${JSON.stringify(options)}`;
  if (soundEffectCache.has(cacheKey)) {
    return soundEffectCache.get(cacheKey)!;
  }

  const {
    durationSeconds,
    promptInfluence = 0.3,
    outputFormat = 'mp3_44100_128'
  } = options;

  try {
    const response = await fetch(
      `${ELEVENLABS_SFX_URL}?output_format=${outputFormat}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text,
          duration_seconds: durationSeconds,
          prompt_influence: promptInfluence
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs SFX API error:', response.status, errorText);
      return null;
    }

    const audioBlob = await response.blob();
    
    // Cache the result
    soundEffectCache.set(cacheKey, audioBlob);
    
    return audioBlob;
  } catch (error) {
    console.error('ElevenLabs SFX error:', error);
    return null;
  }
};

/**
 * Play a sound effect from text description
 * @param text - Description of the sound effect
 * @param options - Optional configuration
 * @param volume - Volume level (0-1), defaults to 0.5
 */
export const playSoundEffect = async (
  text: string,
  options: SoundEffectOptions = {},
  volume: number = 0.5
): Promise<void> => {
  const audioBlob = await generateSoundEffect(text, options);
  
  if (!audioBlob) {
    console.error('Failed to generate sound effect');
    return;
  }

  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.volume = volume;
  
  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
  };

  await audio.play();
};

// Predefined sound effects for common game events
export const GameSoundEffects = {
  // UI sounds
  typewriter: "Mechanical typewriter key press, single click",
  submit: "Digital interface confirmation beep, sci-fi",
  error: "Error buzz, low digital glitch sound",
  
  // Atmosphere
  ambientVoid: "Dark ambient space drone, eerie cosmic void",
  whispers: "Distant ethereal whispers, ghostly voices",
  heartbeat: "Slow tense heartbeat, suspenseful",
  
  // Events
  doorCreak: "Old wooden door creaking open slowly",
  footsteps: "Careful footsteps on stone floor, echoing",
  windHowl: "Cold wind howling through empty corridor",
  clockTicking: "Ominous clock ticking, time running out",
  
  // Outcomes
  victory: "Triumphant ethereal chime, magical success",
  defeat: "Dark ominous drone fading out, loss and despair",
  discovery: "Mysterious discovery sound, magical reveal",
  danger: "Tense danger warning, low rumble building"
};

/**
 * Play a predefined game sound effect
 * @param effectName - Name of the predefined effect from GameSoundEffects
 * @param volume - Volume level (0-1)
 */
export const playGameSoundEffect = async (
  effectName: keyof typeof GameSoundEffects,
  volume: number = 0.5
): Promise<void> => {
  const description = GameSoundEffects[effectName];
  if (!description) {
    console.error(`Unknown sound effect: ${effectName}`);
    return;
  }
  
  await playSoundEffect(description, { durationSeconds: 3 }, volume);
};

/**
 * Test sound effects generation
 */
export const testSoundEffects = async (): Promise<boolean> => {
  console.log('Testing ElevenLabs Sound Effects API...');
  
  if (!isElevenLabsConfigured()) {
    console.error('ElevenLabs API key not configured');
    return false;
  }
  
  try {
    await playSoundEffect("Short magical chime, success notification", { durationSeconds: 2 }, 0.5);
    console.log('ElevenLabs sound effects test successful!');
    return true;
  } catch (error) {
    console.error('ElevenLabs sound effects test failed:', error);
    return false;
  }
};
