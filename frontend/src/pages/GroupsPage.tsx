import { useState } from 'react';
import { Button, Spinner } from '@heroui/react';
import { useGroups } from '../hooks/useGroups';
import { useMe } from '../hooks/useMe';
import { useAuth } from '../contexts/AuthContext';
import { GroupCard, CreateGroupModal } from '../components/groups';
import { ProfileIcon, ProfileModal } from '../components/profile';

export default function GroupsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const { data, isLoading, error } = useGroups();
  const { data: profile } = useMe();
  const { signOut } = useAuth();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-danger mb-2">Failed to load groups</p>
          <p className="text-default-400 text-sm mb-4">{error.message}</p>
          <div className="flex gap-2 justify-center">
            <Button onPress={() => window.location.reload()}>Retry</Button>
            <Button variant="light" color="danger" onPress={signOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const groups = data?.groups ?? [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-divider p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Groups</h1>
        <Button
          color="primary"
          size="sm"
          onPress={() => setIsCreateModalOpen(true)}
          startContent={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          }
        >
          New Group
        </Button>
      </div>

      {/* Group List - pb-20 for bottom tab bar spacing */}
      <div className="flex-1 overflow-y-auto p-4 pb-20">
        {groups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-default-400 mb-4">No groups yet</p>
            <Button color="primary" onPress={() => setIsCreateModalOpen(true)}>
              Create Your First Group
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

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
