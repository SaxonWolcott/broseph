import { useState } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, Switch } from '@heroui/react';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    options: { text: string }[];
    settings: {
      allowMultiple?: boolean;
      showVotes?: boolean;
      allowAddOptions?: boolean;
      declareWinnerOnAllVoted?: boolean;
      closesAt?: string;
    };
  }) => void;
  isLoading?: boolean;
}

export function CreatePollModal({ isOpen, onClose, onSubmit, isLoading }: CreatePollModalProps) {
  const [screen, setScreen] = useState<'create' | 'settings'>('create');
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [showVotes, setShowVotes] = useState(true);
  const [allowAddOptions, setAllowAddOptions] = useState(false);
  const [declareWinnerOnAllVoted, setDeclareWinnerOnAllVoted] = useState(false);
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [closesAt, setClosesAt] = useState('');

  const resetForm = () => {
    setTitle('');
    setOptions(['', '']);
    setAllowMultiple(false);
    setShowVotes(true);
    setAllowAddOptions(false);
    setDeclareWinnerOnAllVoted(false);
    setHasTimeLimit(false);
    setClosesAt('');
    setScreen('create');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    const validOptions = options.filter((o) => o.trim().length > 0);
    if (!title.trim() || validOptions.length < 2) return;

    onSubmit({
      title: title.trim(),
      options: validOptions.map((text) => ({ text: text.trim() })),
      settings: {
        allowMultiple,
        showVotes,
        allowAddOptions,
        declareWinnerOnAllVoted,
        closesAt: closesAt ? new Date(closesAt).toISOString() : undefined,
      },
    });

    resetForm();
  };

  const addOption = () => {
    if (options.length >= 20) return;
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const next = [...options];
    next[index] = value;
    setOptions(next);
  };

  const moveOption = (from: number, direction: 'up' | 'down') => {
    const to = direction === 'up' ? from - 1 : from + 1;
    if (to < 0 || to >= options.length) return;
    const next = [...options];
    [next[from], next[to]] = [next[to], next[from]];
    setOptions(next);
  };

  const validOptionCount = options.filter((o) => o.trim().length > 0).length;
  const canSubmit = title.trim().length > 0 && validOptionCount >= 2;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      scrollBehavior="inside"
      size="full"
      placement="bottom"
      classNames={{
        wrapper: 'items-end',
        base: 'max-h-[80vh] rounded-t-2xl rounded-b-none m-0',
      }}
    >
      <ModalContent>
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full bg-default-300" />
        </div>

        {screen === 'create' ? (
          <>
            <ModalHeader className="flex items-center justify-between pb-2">
              <span className="text-lg font-semibold">Create Poll</span>
            </ModalHeader>

            <ModalBody className="pt-2 gap-3">
              {/* Title input */}
              <Input
                label="Question"
                placeholder="Ask a question..."
                value={title}
                onValueChange={(v) => setTitle(v.slice(0, 80))}
                maxLength={80}
                variant="bordered"
                size="sm"
                description={title.length >= 80 ? undefined : `${title.length}/80`}
                errorMessage={title.length >= 80 ? 'Max characters reached' : undefined}
                isInvalid={title.length >= 80}
              />

              {/* Options list */}
              <div className="flex flex-col gap-2">
                <span className="text-xs text-default-400 font-medium">Options</span>
                {options.map((opt, index) => (
                  <div key={index} className="flex items-center gap-1">
                    {/* Reorder buttons */}
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        type="button"
                        className="text-default-400 hover:text-default-300 disabled:opacity-30"
                        disabled={index === 0}
                        onClick={() => moveOption(index, 'up')}
                        aria-label="Move up"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="text-default-400 hover:text-default-300 disabled:opacity-30"
                        disabled={index === options.length - 1}
                        onClick={() => moveOption(index, 'down')}
                        aria-label="Move down"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>

                    <Input
                      placeholder={`Option ${index + 1}`}
                      value={opt}
                      onValueChange={(v) => updateOption(index, v.slice(0, 40))}
                      maxLength={40}
                      variant="bordered"
                      size="sm"
                      className="flex-1"
                      errorMessage={opt.length >= 40 ? 'Max characters reached' : undefined}
                      isInvalid={opt.length >= 40}
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        className="text-default-400 hover:text-danger flex-shrink-0 p-1"
                        onClick={() => removeOption(index)}
                        aria-label="Remove option"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}

                {options.length < 20 && (
                  <Button size="sm" variant="light" onPress={addOption} className="self-start">
                    + Add option
                  </Button>
                )}
              </div>
            </ModalBody>

            <ModalFooter className="pt-2 border-t border-divider justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="light"
                  onPress={handleClose}
                  isIconOnly
                  aria-label="Discard"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                </Button>
                <Button size="sm" variant="flat" onPress={() => setScreen('settings')}>
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                  Settings
                </Button>
              </div>
              <Button
                size="sm"
                color="primary"
                onPress={handleSubmit}
                isDisabled={!canSubmit}
                isLoading={isLoading}
              >
                Send Poll
              </Button>
            </ModalFooter>
          </>
        ) : (
          <>
            <ModalHeader className="pb-2">
              <button
                type="button"
                className="flex items-center gap-1 text-sm text-primary"
                onClick={() => setScreen('create')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Back
              </button>
              <span className="ml-3 text-lg font-semibold">Poll Settings</span>
            </ModalHeader>

            <ModalBody className="pt-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">See votes</p>
                  <p className="text-xs text-default-400">Show who voted for each option</p>
                </div>
                <Switch size="sm" isSelected={showVotes} onValueChange={setShowVotes} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Multiple options</p>
                  <p className="text-xs text-default-400">Allow voting for more than one option</p>
                </div>
                <Switch size="sm" isSelected={allowMultiple} onValueChange={setAllowMultiple} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Add options</p>
                  <p className="text-xs text-default-400">Let anyone add new options</p>
                </div>
                <Switch size="sm" isSelected={allowAddOptions} onValueChange={setAllowAddOptions} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm">Declare winner</p>
                  <p className="text-xs text-default-400">Auto-close when everyone has voted</p>
                </div>
                <Switch size="sm" isSelected={declareWinnerOnAllVoted} onValueChange={setDeclareWinnerOnAllVoted} />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm">Time limit</p>
                    <p className="text-xs text-default-400">Auto-close at a specific date/time</p>
                  </div>
                  <Switch
                    size="sm"
                    isSelected={hasTimeLimit}
                    onValueChange={(v) => {
                      setHasTimeLimit(v);
                      if (!v) setClosesAt('');
                    }}
                  />
                </div>
                {hasTimeLimit && (
                  <input
                    type="datetime-local"
                    className="w-full text-sm bg-default-100 rounded-lg px-3 py-2 outline-none border border-default-200 focus:border-primary mt-2"
                    value={closesAt}
                    onChange={(e) => setClosesAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                )}
              </div>
            </ModalBody>

            <ModalFooter className="pt-2 border-t border-divider">
              <Button size="sm" color="primary" variant="flat" onPress={() => setScreen('create')}>
                Done
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
