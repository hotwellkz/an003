import React, { useState } from 'react';
import '../../styles/lessons/LessonTest.css';

const questions = [
  {
    question: 'Какая основная роль бизнес-аналитика?',
    options: [
      'Разработка программного обеспечения',
      'Анализ и оптимизация бизнес-процессов',
      'Управление персоналом',
      'Продажи продуктов'
    ],
    correct: 1
  },
  {
    question: 'Какой навык НЕ является ключевым для бизнес-аналитика?',
    options: [
      'Аналитическое мышление',
      'Коммуникативные навыки',
      'Программирование на C++',
      'Работа с документацией'
    ],
    correct: 2
  },
  {
    question: 'Что входит в обязанности бизнес-аналитика?',
    options: [
      'Сбор и анализ требований',
      'Ремонт компьютеров',
      'Продажа услуг',
      'Найм персонала'
    ],
    correct: 0
  }
];

export default function LessonTest() {
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      if (answer === questions[index].correct) correct++;
    });
    const finalScore = Math.round((correct / questions.length) * 10);
    setScore(finalScore);
    setShowResults(true);
  };

  return (
    <div className="lesson-test">
      <h3>Тест: Понимание роли бизнес-аналитика</h3>
      
      {questions.map((q, qIndex) => (
        <div key={qIndex} className="question">
          <p>{q.question}</p>
          <div className="options">
            {q.options.map((option, oIndex) => (
              <label key={oIndex} className="option">
                <input
                  type="radio"
                  name={`question-${qIndex}`}
                  checked={answers[qIndex] === oIndex}
                  onChange={() => handleAnswer(qIndex, oIndex)}
                  disabled={showResults}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      {!showResults ? (
        <button 
          className="submit-test"
          onClick={calculateScore}
          disabled={answers.length !== questions.length}
        >
          Проверить ответы
        </button>
      ) : (
        <div className="test-results">
          <h4>Ваш результат: {score}/10</h4>
          <p>{score >= 7 ? 'Отличная работа!' : 'Попробуйте еще раз'}</p>
        </div>
      )}
    </div>
  );
}