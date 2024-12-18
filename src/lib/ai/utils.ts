export function formatErrorResponse(error: unknown): string {
  if (error instanceof Error) {
    // Преобразуем технические сообщения об ошибках в понятные пользователю
    if (error.message.includes('API key')) {
      return 'Ошибка авторизации AI сервиса';
    }
    if (error.message.includes('timeout')) {
      return 'Превышено время ожидания ответа';
    }
    if (error.message.includes('rate limit')) {
      return 'Превышен лимит запросов. Пожалуйста, подождите немного';
    }
    return error.message;
  }
  return 'Произошла непредвиденная ошибка';
}

export function formatAIResponse(text: string): string {
  if (!text) return '';
  
  return text
    // Удаляем markdown-разметку
    .replace(/#{1,6}\s+/g, '')     // Удаляем заголовки
    .replace(/\*\*|\*/g, '')       // Удаляем жирный текст и курсив
    .replace(/`[^`]*`/g, '')       // Удаляем инлайн-код
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // Очищаем ссылки
    .split(/\n{2,}/)                // Разбиваем на параграфы
    .map(p => p.trim())             // Убираем лишние пробелы
    .filter(p => p)                 // Убираем пустые строки
    .map(p => {
      // Форматируем нумерованные списки
      if (p.match(/^\d+\.\s/m)) {
        const items = p.split(/\n/)
          .map(item => item.replace(/^\d+\.\s/, '').trim())
          .filter(item => item)
          .map(item => `<li>${item}</li>`)
          .join('');
        return `<ol>${items}</ol>`;
      }
      // Форматируем маркированные списки
      if (p.match(/^[-*]\s/m)) {
        const items = p.split(/\n/)
          .map(item => item.replace(/^[-*]\s/, '').trim())
          .filter(item => item)
          .map(item => `<li>${item}</li>`)
          .join('');
        return `<ul>${items}</ul>`;
      }
      // Обычные параграфы
      return `<p>${p}</p>`;
    })
    .join('\n');
}

export function formatTextForSpeech(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/<\/?[^>]+(>|$)/g, '')     // Удаляем HTML-теги
    .replace(/\n{2,}/g, '. ')          // Заменяем двойные переносы на точку с паузой
    .replace(/\n/g, ' ')               // Заменяем одиночные переносы на пробелы
    .replace(/\s+/g, ' ')              // Убираем множественные пробелы
    .replace(/\d+\.\s/g, '')           // Удаляем цифры с точкой в начале строк
    .replace(/[-*]\s/g, '')            // Удаляем маркеры списков
    .trim();
}