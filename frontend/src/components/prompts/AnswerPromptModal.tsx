import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Textarea,
} from '@heroui/react';
import { useSubmitPromptResponse } from '../../hooks/useSubmitPromptResponse';
import { PendingPrompt } from '../../types/prompts';

interface AnswerPromptModalProps {
  prompt: PendingPrompt | null;
  isOpen: boolean;
  onClose: () => void;
}

const MAX_RESPONSE_LENGTH = 500;

export function AnswerPromptModal({ prompt, isOpen, onClose }: AnswerPromptModalProps) {
  const [content, setContent] = useState('');
  const submitResponse = useSubmitPromptResponse();

  const handleClose = () => {
    setContent('');
    submitResponse.reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!prompt || !content.trim()) return;
    try {
      await submitResponse.mutateAsync({
        groupId: prompt.groupId,
        content: content.trim(),
      });
      setContent('');
      onClose();
    } catch {
      // Error displayed via submitResponse.isError
    }
  };

  const isValid = content.trim().length > 0 && content.length <= MAX_RESPONSE_LENGTH;

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalContent>
        <ModalHeader>{prompt?.groupName ?? 'Answer Prompt'}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-default-500 italic">
            &ldquo;{prompt?.prompt.text}&rdquo;
          </p>
          <Textarea
            label="Your answer"
            placeholder="Write your answer..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_RESPONSE_LENGTH}
            minRows={3}
            maxRows={6}
            description={`${content.length}/${MAX_RESPONSE_LENGTH}`}
            isInvalid={content.length > MAX_RESPONSE_LENGTH}
            errorMessage={content.length > MAX_RESPONSE_LENGTH ? 'Response too long' : undefined}
          />
          {submitResponse.isError && (
            <p className="text-sm text-danger">
              {submitResponse.error?.message || 'Failed to submit response'}
            </p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isLoading={submitResponse.isPending}
            isDisabled={!isValid}
          >
            Share
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
