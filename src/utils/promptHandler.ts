import type { AIResponse } from '../lib/ai/types';
import { formatAIResponse } from '../lib/ai/utils';

const formatPrompt = (prompt: string, lessonTitle: string) => {
  return `Ответь на вопрос по теме урока "${lessonTitle}": ${prompt}

  Важно:
  - Не используй маркеры форматирования (#, *, -)
  - Используй простой текст без специальных символов
  - Разделяй смысловые части пустой строкой
  - Пиши четко структурированный текст`;
};

export async function sendPrompt(prompt: string, lessonTitle: string): Promise<AIResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: formatPrompt(prompt, lessonTitle) })
  });

  if (!response.ok) {
    throw new Error('Ошибка при получении ответа от сервера');
  }

  const data = await response.json() as AIResponse;
  
  if (data.error || !data.response) {
    throw new Error(data.error || 'Не удалось получить ответ');
  }

  // Форматируем ответ перед возвратом
  data.response = formatAIResponse(data.response);

  return data;
}