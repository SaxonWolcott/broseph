import { Spinner } from '@heroui/react';
import { usePromptFeed } from '../../hooks/usePromptFeed';
import { FeedItem } from './FeedItem';

/**
 * Section displaying the feed of prompt responses from friends.
 */
export function PromptFeed() {
  const { data, isLoading, error } = usePromptFeed();

  if (isLoading) {
    return (
      <section className="p-4 border-t border-divider">
        <h2 className="text-lg font-semibold mb-3">Feed</h2>
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-4 border-t border-divider">
        <h2 className="text-lg font-semibold mb-3">Feed</h2>
        <p className="text-danger text-sm">Failed to load feed</p>
      </section>
    );
  }

  const feedItems = data?.responses ?? [];

  return (
    <section className="p-4 border-t border-divider">
      <h2 className="text-lg font-semibold mb-3">Feed</h2>

      {feedItems.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-default-400">No responses yet</p>
          <p className="text-default-400 text-sm">
            Be the first to answer a prompt!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedItems.map((response) => (
            <FeedItem key={response.id} response={response} />
          ))}
        </div>
      )}
    </section>
  );
}
