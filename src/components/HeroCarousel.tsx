import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Movie } from "@/types/movie";
import { getImageUrl } from "@/services/tmdbApi";

interface HeroCarouselProps {
  movies: Movie[];
  onMovieClick: (id: number) => void;
  onTrailerClick: (id: number) => void;
}

export function HeroCarousel({
  movies,
  onMovieClick,
  onTrailerClick,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const featuredMovies = movies.slice(0, 5);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
  }, [featuredMovies.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(
      (prev) => (prev - 1 + featuredMovies.length) % featuredMovies.length
    );
  }, [featuredMovies.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  // Auto-advance carousel
  useEffect(() => {
    if (isPaused || featuredMovies.length <= 1) return;

    const interval = setInterval(() => {
      nextSlide();
    }, 8000);

    return () => clearInterval(interval);
  }, [isPaused, nextSlide, featuredMovies.length]);

  if (featuredMovies.length === 0) return null;

  const currentMovie = featuredMovies[currentIndex];

  return (
    <div
      className='relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden'
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}>
      {/* Background Images with Crossfade */}
      <AnimatePresence mode='wait'>
        <motion.div
          key={currentMovie.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className='absolute inset-0'>
          <img
            src={getImageUrl(
              currentMovie.backdrop_path || currentMovie.poster_path,
              "w1280"
            )}
            alt={currentMovie.title}
            className='w-full h-full object-cover object-top'
          />
          {/* Gradient Overlays */}
          <div className='absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A]/60 to-transparent' />
          <div className='absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-[#0A0A0A]/30' />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <div className='absolute inset-0 flex items-end pb-24 md:pb-28'>
        <div className='container mx-auto px-8 md:px-16 lg:px-24'>
          <AnimatePresence mode='wait'>
            <motion.div
              key={currentMovie.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className='max-w-2xl'>
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className='inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6'
                style={{
                  background: "rgba(212, 175, 55, 0.9)",
                  backdropFilter: "blur(12px)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow: "0 4px 16px rgba(212, 175, 55, 0.4)",
                  color: "#000",
                }}>
                <span className='relative flex h-2 w-2'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-black/50 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-black'></span>
                </span>
                Featured
              </motion.div>

              {/* Title */}
              <h1
                className='text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight'
                style={{ color: "var(--color-text)" }}>
                {currentMovie.title}
              </h1>

              {/* Meta Info */}
              <div className='flex items-center gap-4 mb-6'>
                <div className='flex items-center gap-2'>
                  <svg
                    className='w-5 h-5'
                    fill='var(--color-accent)'
                    viewBox='0 0 20 20'>
                    <path d='M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z' />
                  </svg>
                  <span
                    className='text-lg font-bold'
                    style={{ color: "var(--color-accent)" }}>
                    {currentMovie.vote_average?.toFixed(1)}
                  </span>
                </div>
                <span
                  className='text-sm px-3 py-1 rounded-full bg-white/10'
                  style={{ color: "var(--color-text-muted)" }}>
                  {currentMovie.release_date
                    ? new Date(currentMovie.release_date).getFullYear()
                    : "N/A"}
                </span>
              </div>

              {/* Overview */}
              <p
                className='text-lg mb-8 line-clamp-3 leading-relaxed'
                style={{ color: "var(--color-text-muted)" }}>
                {currentMovie.overview}
              </p>

              {/* Buttons */}
              <div className='flex items-center gap-4'>
                <button
                  onClick={() => onMovieClick(currentMovie.id)}
                  className='modern-button px-8 py-4 inline-flex items-center gap-3 text-lg font-semibold'>
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'>
                    <path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z' />
                  </svg>
                  View Details
                </button>
                <button
                  onClick={() => onTrailerClick(currentMovie.id)}
                  className='px-8 py-4 inline-flex items-center gap-3 text-lg font-semibold rounded-xl transition-all duration-300 hover:scale-105'
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255, 255, 255, 0.2)",
                    color: "var(--color-text)",
                  }}>
                  <svg
                    className='w-5 h-5'
                    fill='currentColor'
                    viewBox='0 0 24 24'>
                    <path d='M8 5v14l11-7z' />
                  </svg>
                  Watch Trailer
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className='absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10'
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        aria-label='Previous slide'>
        <svg className='w-6 h-6' fill='none' stroke='white' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className='absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 z-10'
        style={{
          background: "rgba(255, 255, 255, 0.1)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        }}
        aria-label='Next slide'>
        <svg className='w-6 h-6' fill='none' stroke='white' viewBox='0 0 24 24'>
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5l7 7-7 7'
          />
        </svg>
      </button>

      {/* Dot Indicators */}
      <div className='absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10'>
        {featuredMovies.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentIndex ? "w-8 h-3" : "w-3 h-3 hover:bg-white/50"
            }`}
            style={{
              background:
                index === currentIndex
                  ? "var(--color-accent)"
                  : "rgba(255, 255, 255, 0.3)",
            }}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
