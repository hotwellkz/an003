import type { APIRoute } from 'astro';
import { getOpenAIResponse } from '../../lib/ai/openai';
import type { ChatRequest } from '../../lib/ai/types';
import { formatErrorResponse } from '../../lib/ai/utils';
import { AI_CONFIG } from '../../lib/ai/config';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { message } = await request.json() as ChatRequest;

    if (!message) {
      return new Response(JSON.stringify({ 
        error: 'Необходимо указать сообщение для отправки' 
      }), {
        status: 400
      });
    }
    
    if (!import.meta.env.PUBLIC_OPENAI_API_KEY) {
      return new Response(JSON.stringify({
        error: 'AI сервис не настроен. Пожалуйста, обратитесь к администратору.'
      }), {
        status: 503
      });
    }
    
    let response;
    try {
      response = await getOpenAIResponse(message);
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return new Response(JSON.stringify({ 
        error: 'Ошибка при получении ответа от AI. Пожалуйста, попробуйте позже.' 
      }), {
        status: 500
      });
    }

    if (!response) {
      return new Response(JSON.stringify({ 
        error: 'Получен пустой ответ от AI' 
      }), {
        status: 500
      });
    }

    return new Response(JSON.stringify({ response }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('AI Response Error:', error);
    return new Response(JSON.stringify({ 
      error: formatErrorResponse(error) || 
        'Произошла ошибка при обработке запроса' 
    }), {
      status: 500
    });
  }
}