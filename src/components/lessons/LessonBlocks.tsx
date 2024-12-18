import React from 'react';
import { BookOpen, Code, Target } from 'lucide-react';
import '../../styles/lessons/LessonBlocks.css';

interface LessonBlocksProps {
  topics: string[];
}

export default function LessonBlocks({ topics }: LessonBlocksProps) {
  return (
    <div className="lesson-blocks">
      <div className="block roles">
        <div className="block-header">
          <BookOpen size={24} />
          <h3>Основные роли и обязанности</h3>
        </div>
        <div className="block-content">
          <p>{topics[0]}</p>
        </div>
      </div>

      <div className="block skills">
        <div className="block-header">
          <Code size={24} />
          <h3>Ключевые навыки и инструменты</h3>
        </div>
        <div className="block-content">
          <p>{topics[1]}</p>
        </div>
      </div>

      <div className="block examples">
        <div className="block-header">
          <Target size={24} />
          <h3>Примеры задач</h3>
        </div>
        <div className="block-content">
          <p>{topics[2]}</p>
        </div>
      </div>
    </div>
  );
}