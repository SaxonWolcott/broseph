import { useEffect, useRef } from 'react';

const QUICK_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '❓'];

interface QuickReactionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  onOpenFullPicker: () => void;
  isOwn: boolean;
}

export function QuickReactionMenu({
  isOpen,
  onClose,
  onSelect,
  onOpenFullPicker,
  isOwn,
}: QuickReactionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute bottom-full mb-1 z-50 flex items-center gap-0.5 bg-content1 border border-default-200 rounded-full px-1 py-0.5 shadow-lg ${
        isOwn ? 'right-0' : 'left-0'
      }`}
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-default-100 transition-colors text-base"
          onClick={() => {
            onSelect(emoji);
            onClose();
          }}
        >
          {emoji}
        </button>
      ))}
      <button
        type="button"
        className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-default-100 transition-colors text-default-400"
        onClick={() => {
          onOpenFullPicker();
          onClose();
        }}
        aria-label="Open emoji picker"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </button>
    </div>
  );
}
