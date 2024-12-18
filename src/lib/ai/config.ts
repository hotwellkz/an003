export const AI_CONFIG = {
  openai: {
    timeout: 30000,
    maxRetries: 3,
    defaultModel: 'gpt-4-turbo-preview'
  },
  anthropic: {
    timeout: 30000,
    maxRetries: 3,
    defaultModel: 'claude-3-opus-20240229'
  },
  elevenlabs: {
    timeout: 60000,
    maxRetries: 2
  }
};