import { Slide as SlideType } from '../types/slide';

interface SlideProps {
  slide: SlideType;
  isActive: boolean;
}

export default function Slide({ slide, isActive }: SlideProps) {
  const renderLayout = () => {
    switch (slide.layout) {
      case 'title':
        return (
          <div className="slide-title">
            <h1>{slide.title}</h1>
            <p className="subtitle">{slide.content}</p>
          </div>
        );

      case 'two-column':
        const [left, right] = slide.content.split('||');
        return (
          <div className="slide-two-column">
            <h2>{slide.title}</h2>
            <div className="columns">
              <div className="column">{left}</div>
              <div className="column">{right}</div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="slide-image">
            <h2>{slide.title}</h2>
            <div className="image-container">
              <img src={slide.content} alt={slide.title} />
            </div>
          </div>
        );

      case 'code':
        return (
          <div className="slide-code">
            <h2>{slide.title}</h2>
            <pre><code>{slide.content}</code></pre>
          </div>
        );

      default:
        return (
          <div className="slide-content">
            <h2>{slide.title}</h2>
            <div dangerouslySetInnerHTML={{ __html: slide.content }} />
          </div>
        );
    }
  };

  return (
    <div
      className={`slide ${isActive ? 'active' : ''}`}
      style={{ background: slide.background }}
    >
      <div className="slide-content-wrapper">
        {renderLayout()}
      </div>
    </div>
  );
}
