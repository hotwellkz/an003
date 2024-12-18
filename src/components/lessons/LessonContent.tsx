import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Loader } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { deductTokens } from '../../utils/tokenManager';
import { formatAIResponse, formatTextForSpeech } from '../../lib/ai/utils';
import LessonPrompts from './LessonPrompts';
import LessonTest from './LessonTest';
import '../../styles/lessons/LessonContent.css';

interface LessonContentProps {
  title: string;
  topics: string[];
  test?: string;
}

export default function LessonContent({ title, topics, test }: LessonContentProps) {
  const { user, tokens, setTokens } = useAuthStore();
  const [lessonStarted, setLessonStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lessonText, setLessonText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPremiumAudio, setIsPremiumAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reminderInterval = useRef<NodeJS.Timeout>();
  
  // Load saved lesson state from localStorage
  useEffect(() => {
    const savedLesson = localStorage.getItem(`lesson_${title}`);
    if (savedLesson) {
      setLessonText(savedLesson);
      setLessonStarted(true);
    }
  }, [title]);

  useEffect(() => {
    if (!lessonStarted) {
      reminderInterval.current = setInterval(() => {
        const button = document.querySelector('.start-button');
        if (button) button.classList.add('pulse');
        setTimeout(() => {
          const button = document.querySelector('.start-button');
          if (button) button.classList.remove('pulse');
        }, 1000);
      }, 15000);
    }

    return () => {
      if (reminderInterval.current) {
        clearInterval(reminderInterval.current);
      }
    };
  }, [lessonStarted]);

  const startLesson = async () => {
    if (!user) {
      alert('Пожалуйста, войдите в систему');
      return;
    }

    if (tokens < 5) {
      alert('Недостаточно токенов (требуется 5)');
      return;
    }

    setIsLoading(true);
    try {
      // Списываем токены
      const newTokens = await deductTokens(user.uid, tokens, 5);
      setTokens(newTokens);

      const prompt = `Подготовь структурированный урок на тему "${title}". План урока:

        ${topics.map((topic, i) => `${i + 1}. ${topic}`).join('\n')}
        
        Важно:
        1. Используй четкую структуру с нумерованными разделами
        2. Каждый раздел начинай с новой строки
        3. Для списков используй цифры с точкой (1., 2., и т.д.)
        4. Разделяй смысловые части пустой строкой
        5. Пиши простым языком с конкретными примерами`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt })
      });

      if (!response.ok) throw new Error('Failed to get lesson content');
      const { response: aiResponse, error } = await response.json();
      
      if (error) throw new Error(error);
      if (!aiResponse) throw new Error('Empty response received');
      
      const formattedText = formatAIResponse(aiResponse);
      setLessonText(formattedText);
      
      // Сохраняем урок в localStorage
      localStorage.setItem(`lesson_${title}`, formattedText);
      
      setLessonStarted(true);
    } catch (error) {
      console.error('Error starting lesson:', error);
      alert('Произошла ошибка при загрузке урока');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = async (premium = false) => {
    if (!lessonText || isPlaying) return;

    setIsPlaying(true);
    setIsPremiumAudio(premium);

    try {
      if (premium && user) {
        if (tokens < 45) {
          alert('Недостаточно токенов');
          return;
        }

        const newTokens = tokens - 45;
        await updateDoc(doc(db, 'users', user.uid), {
          tokens: newTokens
        });
        setTokens(newTokens);
      }

      if (premium) {
        const response = await fetch('/api/speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: formatTextForSpeech(lessonText) })
        });

        if (!response.ok) throw new Error('Failed to get audio');
        const audioBuffer = await response.arrayBuffer();
        const audioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        audioRef.current = new Audio(audioUrl);
      } else {
        const utterance = new SpeechSynthesisUtterance(formatTextForSpeech(lessonText));
        utterance.lang = 'ru-RU';
        speechSynthesis.speak(utterance);
        utterance.onend = () => {
          setIsPlaying(false);
          setIsPremiumAudio(false);
        };
        return;
      }

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setIsPremiumAudio(false);
      };

      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Произошла ошибка при воспроизведении аудио');
      setIsPlaying(false);
      setIsPremiumAudio(false);
    }
  };

  const toggleAudio = () => {
    if (isPlaying) {
      if (isPremiumAudio && audioRef.current) {
        audioRef.current.pause();
      } else {
        speechSynthesis.cancel();
      }
      setIsPlaying(false);
    } else {
      if (isPremiumAudio && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const finishLesson = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    // Очищаем сохраненный урок при завершении
    localStorage.removeItem(`lesson_${title}`);
    window.location.href = '/program';
  };

  return (
    <div className="lesson-content">
      {!lessonStarted ? (
        <button 
          className="start-button" 
          onClick={startLesson}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader className="spin" size={20} />
              Готовлю урок...
            </>
          ) : (
            'Начать урок'
          )}
        </button>
      ) : (
        <>
          <div className="audio-controls">
            <button 
              className="audio-button"
              onClick={() => playAudio(false)}
              disabled={isPlaying}
            >
              <Volume2 size={20} />
              Озвучить бесплатно
            </button>
            <button 
              className="audio-button premium"
              onClick={() => playAudio(true)}
              disabled={isPlaying || !user || tokens < 45}
            >
              <Volume2 size={20} />
              Озвучить красивым голосом (45 🪙)
            </button>
            {isPlaying && (
              <button 
                className="pause-button"
                onClick={toggleAudio}
              >
                {isPlaying ? <Pause size={20} /> : <Play size={20} />}
              </button>
            )}
          </div>

          <div className="content">
            <div 
              className="lesson-text"
              dangerouslySetInnerHTML={{ __html: lessonText }}
            />
          </div>

          <LessonPrompts lessonTitle={title} />
          
          {test && <LessonTest />}

          <div className="lesson-footer">
            <button 
              className="finish-button"
              onClick={finishLesson}
            >
              Завершить урок
            </button>
          </div>
        </>
      )}
    </div>
  );
}