import Voice from 'elevenlabs-node';
import { VOICE_CONFIG } from './constants';
import { formatErrorResponse } from './utils';

const voice = new Voice({
  apiKey: import.meta.env.PUBLIC_ELEVENLABS_API_KEY
});

export async function textToSpeech(text: string) {
  try {
    if (!text || typeof text !== 'string') {
      return formatErrorResponse('Invalid input: text must be a non-empty string');
    }

    const audioResponse = await voice.textToSpeech({
      text,
      ...VOICE_CONFIG
    });

    return audioResponse;
  } catch (error) {
    console.error('Error in textToSpeech:', error);
    return formatErrorResponse('Failed to generate speech');
  }
}