import { useState, useEffect } from 'react';
import { Presentation as PresentationType } from '../types/slide';
import Slide from './Slide';

interface PresentationProps {
  presentation: PresentationType;
}

export default function Presentation({ presentation }: PresentationProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, presentation.slides.length - 1));
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrev();
      } else if (e.key === 'Home') {
        goToSlide(0);
      } else if (e.key === 'End') {
        goToSlide(presentation.slides.length - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentation.slides.length]);

  const currentSlide = presentation.slides[currentIndex];
  const progress = ((currentIndex + 1) / presentation.slides.length) * 100;

  return (
    <div className="presentation">
      <div className="presentation-container">
        {presentation.slides.map((slide, index) => (
          <Slide
            key={slide.id}
            slide={slide}
            isActive={index === currentIndex}
          />
        ))}
      </div>

      <div className="controls">
        <button
          onClick={goToPrev}
          disabled={currentIndex === 0}
          className="control-btn"
          aria-label="上一张"
        >
          ← 上一张
        </button>

        <div className="page-indicator">
          {currentIndex + 1} / {presentation.slides.length}
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === presentation.slides.length - 1}
          className="control-btn"
          aria-label="下一张"
        >
          下一张 →
        </button>
      </div>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      <div className="slide-thumbnails">
        {presentation.slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => goToSlide(index)}
            className={`thumbnail ${index === currentIndex ? 'active' : ''}`}
            aria-label={`跳转到第 ${index + 1} 张`}
          >
            {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
