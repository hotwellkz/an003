import React, { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { deductTokens } from '../../utils/tokenManager';
import { sendPrompt } from '../../utils/promptHandler';
import '../../styles/lessons/TextGenerationDemo.css';

export default function TextGenerationDemo() {
  const { user, tokens, setTokens } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!user) {
      setError('Пожалуйста, войдите в систему');
      return;
    }

    if (tokens < 10) {
      setError('Недостаточно токенов (требуется 10)');
      return;
    }

    if (!prompt.trim()) {
      setError('Введите текст промпта');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const newTokens = await deductTokens(user.uid, tokens, 10);
      setTokens(newTokens);

      const response = await sendPrompt(prompt, 'Генерация текста');
      
      // Добавляем стилизацию для абзацев
      const formattedText = response.response
        .split('\n\n')
        .map(paragraph => `<p>${paragraph}</p>`)
        .join('');
        
      setGeneratedText(formattedText);
    } catch (error) {
      console.error('Error generating text:', error);
      setError('Произошла ошибка при генерации текста');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="text-generation-demo">
      <h3>Практическое задание</h3>
      
      <div className="demo-container">
        <div className="input-section">
          <label htmlFor="prompt">Ваш промпт:</label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Введите текст промпта..."
            disabled={isLoading}
          />
          
          <div className="controls">
            <span className="token-info">Стоимость: 10 🪙</span>
            <button
              onClick={handleGenerate}
              disabled={isLoading || !user || tokens < 10}
              className="generate-button"
            >
              {isLoading ? 'Генерация...' : 'Сгенерировать текст'}
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {generatedText && (
          <div className="output-section">
            <h4>Сгенерированный текст:</h4>
            <div 
              className="generated-content"
              dangerouslySetInnerHTML={{ __html: generatedText }}
            />
          </div>
        )}
      </div>
    </div>
  );
}