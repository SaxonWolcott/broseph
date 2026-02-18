import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ImageCardStackProps {
  imageUrls: string[];
  isOwn: boolean;
  onImageExpand: (urls: string[], startIndex: number) => void;
}

export function ImageCardStack({ imageUrls, isOwn: _isOwn, onImageExpand }: ImageCardStackProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Single image — simple render, no stack UI
  if (imageUrls.length === 1) {
    return (
      <img
        src={imageUrls[0]}
        alt="Image message"
        className="max-w-[240px] max-h-[320px] object-cover rounded-2xl cursor-pointer"
        loading="lazy"
        onClick={(e) => {
          e.stopPropagation();
          onImageExpand(imageUrls, 0);
        }}
      />
    );
  }

  // Multiple images — card stack
  const count = imageUrls.length;

  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => Math.min(prev + 1, count - 1));
  };

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onImageExpand(imageUrls, currentIndex);
  };

  return (
    <div className="group/stack relative w-[240px]">
      {/* Stacked back cards (decorative) */}
      {count > 1 && (
        <div
          className="absolute inset-0 rounded-2xl bg-default-200/50 border border-divider"
          style={{
            transform: 'translateY(4px) translateX(2px) rotate(1.5deg) scale(0.97)',
            zIndex: 0,
          }}
        />
      )}
      {count > 2 && (
        <div
          className="absolute inset-0 rounded-2xl bg-default-300/30 border border-divider"
          style={{
            transform: 'translateY(8px) translateX(4px) rotate(3deg) scale(0.94)',
            zIndex: -1,
          }}
        />
      )}

      {/* Front card with animation */}
      <div className="relative overflow-hidden rounded-2xl" style={{ zIndex: 1 }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.img
            key={currentIndex}
            src={imageUrls[currentIndex]}
            alt={`Image ${currentIndex + 1} of ${count}`}
            className="w-[240px] h-[320px] object-cover cursor-pointer"
            loading="lazy"
            onClick={handleImageClick}
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.2 }}
          />
        </AnimatePresence>

        {/* "N photos" badge */}
        <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
          {count} photos
        </div>

        {/* Hover arrows */}
        {currentIndex > 0 && (
          <button
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/stack:opacity-100 transition-opacity"
            onClick={goPrev}
            aria-label="Previous image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
        )}
        {currentIndex < count - 1 && (
          <button
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover/stack:opacity-100 transition-opacity"
            onClick={goNext}
            aria-label="Next image"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}

        {/* Dot indicators */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
          {imageUrls.map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${
                i === currentIndex ? 'bg-white' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
