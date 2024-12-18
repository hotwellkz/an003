import OpenAI from 'openai';
import { AI_SYSTEM_PROMPT } from './constants';
import { formatErrorResponse } from './utils';

const apiKey = import.meta.env.PUBLIC_OPENAI_API_KEY;

if (!apiKey) {
  throw new Error('OpenAI API key is not configured');
}

const openai = new OpenAI({
  apiKey: apiKey,
  timeout: 30000
});

export async function getOpenAIResponse(message: string) {
  try {
    if (!message.trim()) {
      throw new Error('Пустой запрос');
    }
    
    if (!apiKey) {
      throw new Error('OpenAI API key is not configured');
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { 
          role: 'system', 
          content: AI_SYSTEM_PROMPT
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Получен пустой ответ от OpenAI');
    }
    
    return content;
  } catch (error) {
    console.error('OpenAI Response Error:', error);
    if (error instanceof Error) {
      throw new Error(`Ошибка OpenAI: ${error.message}`);
    }
    throw new Error('Неизвестная ошибка при получении ответа от OpenAI');
  }
}