import { useState } from 'react';
import { Button } from '@heroui/react';
import { useMe } from '../hooks/useMe';
import { usePromptsToDo } from '../hooks/usePromptsToDo';
import { usePromptFeed } from '../hooks/usePromptFeed';
import { PromptsToDo, PromptFeed } from '../components/prompts';
import { ProfileIcon, ProfileModal } from '../components/profile';
import { useRealtimePromptResponses } from '../hooks/useRealtimePromptResponses';

const RefreshIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
    />
  </svg>
);

export default function HomePage() {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: profile } = useMe();
  const { refetch: refetchToDo } = usePromptsToDo();
  const { refetch: refetchFeed } = usePromptFeed();

  // Subscribe to real-time prompt response updates
  useRealtimePromptResponses();

  const handleRefresh = async () => {
    setIsRefreshing(true);

    // Refetch both queries
    await Promise.all([refetchToDo(), refetchFeed()]);

    // Small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-divider p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Home</h1>
        <Button
          isIconOnly
          variant="light"
          onPress={handleRefresh}
          isLoading={isRefreshing}
          aria-label="Refresh"
        >
          {!isRefreshing && <RefreshIcon />}
        </Button>
      </div>

      {/* Scrollable content with bottom padding for tab bar */}
      <div className="flex-1 overflow-y-auto pb-20">
        <PromptsToDo />
        <PromptFeed />
      </div>

      {/* Profile Icon and Modal */}
      {profile && (
        <>
          <ProfileIcon
            profile={profile}
            onPress={() => setIsProfileModalOpen(true)}
          />
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            profile={profile}
          />
        </>
      )}
    </div>
  );
}
