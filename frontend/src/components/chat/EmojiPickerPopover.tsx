import { useEffect, useRef } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  isOwn: boolean;
}

export function EmojiPickerPopover({
  isOpen,
  onClose,
  onSelect,
  isOwn,
}: EmojiPickerPopoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    // Delay to avoid immediate close from the click that opened it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className={`absolute bottom-full mb-1 z-50 ${isOwn ? 'right-0' : 'left-0'}`}
    >
      <Picker
        data={data}
        onEmojiSelect={(emoji: { native: string }) => {
          onSelect(emoji.native);
          onClose();
        }}
        theme="dark"
        previewPosition="none"
        skinTonePosition="none"
        maxFrequentRows={1}
      />
    </div>
  );
}
