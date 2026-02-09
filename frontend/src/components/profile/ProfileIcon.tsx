import { Avatar } from '@heroui/react';
import { Profile } from '../../types/auth';

interface ProfileIconProps {
  profile: Profile;
  onPress: () => void;
}

/**
 * Floating profile icon that appears in the bottom-right corner.
 * Shows the user's avatar or first letter of display name.
 */
export function ProfileIcon({ profile, onPress }: ProfileIconProps) {
  const displayName = profile.displayName || profile.email || 'User';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={onPress}
      className="fixed bottom-20 right-4 z-50 rounded-full shadow-lg hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary"
      aria-label="Open profile settings"
    >
      <Avatar
        src={profile.avatarUrl || undefined}
        name={initial}
        size="lg"
        showFallback
        classNames={{
          base: 'w-14 h-14 cursor-pointer',
          fallback: 'text-lg font-semibold',
        }}
      />
    </button>
  );
}
