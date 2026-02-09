import { useState } from 'react';
import { Spinner } from '@heroui/react';
import { usePromptsToDo } from '../../hooks/usePromptsToDo';
import { PendingPrompt } from '../../types/prompts';
import { PromptCard } from './PromptCard';
import { AnswerPromptModal } from './AnswerPromptModal';

/**
 * Section displaying prompts that the user needs to respond to.
 */
export function PromptsToDo() {
  const { data, isLoading, error } = usePromptsToDo();
  const [selectedPrompt, setSelectedPrompt] = useState<PendingPrompt | null>(null);

  if (isLoading) {
    return (
      <section className="p-4">
        <h2 className="text-lg font-semibold mb-3">Prompts To Do</h2>
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-4">
        <h2 className="text-lg font-semibold mb-3">Prompts To Do</h2>
        <p className="text-danger text-sm">Failed to load prompts</p>
      </section>
    );
  }

  const pendingPrompts = data?.prompts ?? [];
  const allComplete = data?.allComplete ?? false;

  return (
    <section className="p-4">
      <h2 className="text-lg font-semibold mb-3">
        Prompts To Do
        {pendingPrompts.length > 0 && (
          <span className="ml-2 text-sm font-normal text-default-400">
            ({pendingPrompts.length})
          </span>
        )}
      </h2>

      {pendingPrompts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-default-400">
            {allComplete ? "You're all caught up!" : 'No prompts waiting for you right now.'}
          </p>
          {allComplete && (
            <p className="text-default-400 text-sm">
              Check back tomorrow for new prompts.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {pendingPrompts.map((pending) => (
            <PromptCard
              key={pending.groupId}
              pendingPrompt={pending}
              onPress={() => setSelectedPrompt(pending)}
            />
          ))}
        </div>
      )}

      <AnswerPromptModal
        prompt={selectedPrompt}
        isOpen={!!selectedPrompt}
        onClose={() => setSelectedPrompt(null)}
      />
    </section>
  );
}
