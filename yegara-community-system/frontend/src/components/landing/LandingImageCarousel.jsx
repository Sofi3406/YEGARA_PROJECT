import React, { useCallback, useEffect, useRef, useState } from 'react';

const AUTO_INTERVAL_MS = 6000;
const DESC_COLLAPSE_CHARS = 280;

const ChevronIcon = ({ direction }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden="true">
    {direction === 'left' ? (
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 18l-6-6 6-6" />
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
    )}
  </svg>
);

const SlideDescription = ({ text, theme, slideId }) => {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > DESC_COLLAPSE_CHARS;
  const showToggle = isLong && !expanded;

  return (
    <div className="landing-slide__desc-wrap">
      <p
        id={`slide-desc-${slideId}`}
        className={`landing-slide__desc ${showToggle ? 'is-collapsed' : ''}`}
      >
        {text}
      </p>
      {isLong && (
        <button
          type="button"
          className={`landing-slide__read-more landing-slide__read-more--${theme}`}
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          aria-controls={`slide-desc-${slideId}`}
        >
          {expanded ? 'Show less' : 'Read full message'}
        </button>
      )}
    </div>
  );
};

const LandingImageCarousel = ({
  items,
  theme = 'events',
  carouselId = 'carousel',
  emptyMessage = 'Nothing to show yet',
  getImageSrc,
  getTitle,
  getDescription,
  getDateLabel,
  getHref,
  getSubtitle,
  badgeLabel
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [progressKey, setProgressKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const goToIndex = useCallback((index) => {
    if (items.length === 0) return;
    const next = ((index % items.length) + items.length) % items.length;
    setActiveIndex(next);
    setProgressKey((k) => k + 1);
  }, [items.length]);

  const goNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const clearAutoplay = useCallback(() => {
    if (intervalRef.current) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoplay = useCallback(() => {
    clearAutoplay();
    if (items.length <= 1) return;

    intervalRef.current = window.setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % items.length;
        setProgressKey((k) => k + 1);
        return next;
      });
    }, AUTO_INTERVAL_MS);
  }, [clearAutoplay, items.length]);

  useEffect(() => {
    setActiveIndex(0);
    setProgressKey((k) => k + 1);
  }, [items.length, carouselId]);

  useEffect(() => {
    if (isPaused) {
      clearAutoplay();
      return undefined;
    }

    startAutoplay();
    return clearAutoplay;
  }, [isPaused, startAutoplay, clearAutoplay]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        clearAutoplay();
      } else {
        startAutoplay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [clearAutoplay, startAutoplay]);

  if (items.length === 0) {
    return <div className="landing-empty">{emptyMessage}</div>;
  }

  const typeChip = theme === 'events' ? 'Event' : 'Announcement';
  const regionLabel = theme === 'events' ? 'Events slideshow' : 'Announcements slideshow';

  return (
    <div
      className={`landing-showcase landing-showcase--${theme}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setIsPaused(false);
        }
      }}
    >
      <div className="landing-showcase__glow" aria-hidden="true" />

      <div
        className="landing-carousel"
        role="region"
        aria-roledescription="carousel"
        aria-label={regionLabel}
      >
        {items.length > 1 && (
          <>
            <button
              type="button"
              className="landing-carousel__nav landing-carousel__nav--prev"
              onClick={goPrev}
              aria-label="Previous slide"
            >
              <ChevronIcon direction="left" />
            </button>
            <button
              type="button"
              className="landing-carousel__nav landing-carousel__nav--next"
              onClick={goNext}
              aria-label="Next slide"
            >
              <ChevronIcon direction="right" />
            </button>
          </>
        )}

        <div className="landing-carousel__viewport">
          <div
            className="landing-carousel__slider"
            style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
            aria-live="polite"
          >
            {items.map((item, index) => {
              const imageSrc = getImageSrc(item);
              const isActive = index === activeIndex;
              const description = getDescription(item);
              const subtitle = getSubtitle?.(item);
              const slideId = `${carouselId}-${item._id || index}`;

              return (
                <article
                  key={slideId}
                  id={slideId}
                  className={`landing-slide ${isActive ? 'is-active' : ''}`}
                  aria-hidden={!isActive}
                >
                  <div className="landing-slide__card">
                    <div className="landing-slide__visual">
                      {imageSrc ? (
                        <>
                          <img
                            src={imageSrc}
                            alt=""
                            className="landing-slide__media"
                            loading={index === 0 ? 'eager' : 'lazy'}
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="landing-slide__visual-shade" aria-hidden="true" />
                        </>
                      ) : (
                        <div className="landing-slide__placeholder">
                          <span className="landing-slide__placeholder-icon" aria-hidden="true">
                            {theme === 'events' ? '📅' : '📢'}
                          </span>
                        </div>
                      )}

                      <div className="landing-slide__badge">
                        <span className="landing-slide__badge-dot" aria-hidden="true" />
                        {badgeLabel}
                      </div>

                      <div className="landing-slide__index" aria-hidden="true">
                        {index + 1} / {items.length}
                      </div>
                    </div>

                    <div className="landing-slide__body">
                      <div className="landing-slide__body-inner">
                        <div className="landing-slide__meta">
                          <span className="landing-slide__chip">{typeChip}</span>
                          {getDateLabel(item) && (
                            <span className="landing-slide__chip landing-slide__chip--muted">
                              {getDateLabel(item)}
                            </span>
                          )}
                        </div>

                        <a href={getHref(item)} className="landing-slide__title" tabIndex={isActive ? 0 : -1}>
                          {getTitle(item)}
                        </a>

                        {subtitle && <p className="landing-slide__subtitle">{subtitle}</p>}

                        {description && (
                          <SlideDescription text={description} theme={theme} slideId={slideId} />
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div className="landing-carousel__footer">
          <div className="landing-carousel__dots" role="tablist" aria-label={`${regionLabel} slides`}>
            {items.map((item, index) => (
              <button
                key={`${carouselId}-dot-${item._id || index}`}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-controls={`${carouselId}-${item._id || index}`}
                aria-label={`Slide ${index + 1} of ${items.length}`}
                className={`landing-carousel__dot ${index === activeIndex ? 'is-active' : ''}`}
                onClick={() => goToIndex(index)}
              />
            ))}
          </div>
          <p className="landing-carousel__timer" aria-hidden="true">
            Next in 6s
          </p>
          <div className="landing-carousel__progress" aria-hidden="true">
            <div
              key={`${carouselId}-${progressKey}`}
              className="landing-carousel__progress-bar is-animating"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingImageCarousel;
