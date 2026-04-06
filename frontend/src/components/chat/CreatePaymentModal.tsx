import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
  Avatar,
  Chip,
} from '@heroui/react';
import { GroupMember } from '../../types/groups';

type PaymentMode = 'request' | 'pay';
type RequestMode = 'per_item' | 'per_person';

interface PaymentItem {
  description: string;
  amountCents: number;
}

interface PerPersonSplit {
  userId: string;
  amountCents: number;
}

interface CreatePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    mode: 'per_item' | 'per_person' | 'direct';
    recipientId?: string;
    items: { description: string; amountCents: number; assignedUserId?: string }[];
  }) => void;
  isLoading?: boolean;
  members: GroupMember[];
  currentUserId: string;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function parseDollarsToCents(value: string): number {
  const num = parseFloat(value);
  if (isNaN(num) || num <= 0) return 0;
  return Math.round(num * 100);
}

export function CreatePaymentModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  members,
  currentUserId,
}: CreatePaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('request');
  const [title, setTitle] = useState('');

  // Request mode state
  const [requestMode, setRequestMode] = useState<RequestMode>('per_item');
  const [items, setItems] = useState<PaymentItem[]>([{ description: '', amountCents: 0 }]);
  const [itemAmountInputs, setItemAmountInputs] = useState<string[]>(['']);

  // Per-person state
  const [splits, setSplits] = useState<PerPersonSplit[]>([]);
  const [splitAmountInputs, setSplitAmountInputs] = useState<string[]>([]);
  const [splitEvenly, setSplitEvenly] = useState(false);
  const [evenAmount, setEvenAmount] = useState('');

  // Pay mode state
  const [selectedRecipient, setSelectedRecipient] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payDescription, setPayDescription] = useState('');

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const resetForm = () => {
    setPaymentMode('request');
    setTitle('');
    setRequestMode('per_item');
    setItems([{ description: '', amountCents: 0 }]);
    setItemAmountInputs(['']);
    setSplits([]);
    setSplitAmountInputs([]);
    setSplitEvenly(false);
    setEvenAmount('');
    setSelectedRecipient(null);
    setPayAmount('');
    setPayDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSwitchToPerPerson = () => {
    setRequestMode('per_person');
    // Initialize splits from other members
    const newSplits = otherMembers.map((m) => ({
      userId: m.userId,
      amountCents: 0,
    }));
    setSplits(newSplits);
    setSplitAmountInputs(new Array(newSplits.length).fill(''));
  };

  const handleSubmit = () => {
    if (!title.trim()) return;

    if (paymentMode === 'pay') {
      if (!selectedRecipient || !payAmount) return;
      const cents = parseDollarsToCents(payAmount);
      if (cents < 50) return;

      onSubmit({
        title: title.trim(),
        mode: 'direct',
        recipientId: selectedRecipient,
        items: [
          {
            description: payDescription.trim() || title.trim(),
            amountCents: cents,
            assignedUserId: currentUserId,
          },
        ],
      });
    } else if (requestMode === 'per_item') {
      const validItems = items.filter(
        (item) => item.description.trim() && item.amountCents >= 50,
      );
      if (validItems.length === 0) return;

      onSubmit({
        title: title.trim(),
        mode: 'per_item',
        items: validItems.map((item) => ({
          description: item.description.trim(),
          amountCents: item.amountCents,
        })),
      });
    } else {
      // per_person
      const validSplits = splits.filter((s) => s.amountCents >= 50);
      if (validSplits.length === 0) return;

      onSubmit({
        title: title.trim(),
        mode: 'per_person',
        items: validSplits.map((s) => {
          const member = otherMembers.find((m) => m.userId === s.userId);
          return {
            description: member?.displayName || 'Member',
            amountCents: s.amountCents,
            assignedUserId: s.userId,
          };
        }),
      });
    }

    resetForm();
  };

  const addItem = () => {
    if (items.length >= 20) return;
    setItems([...items, { description: '', amountCents: 0 }]);
    setItemAmountInputs([...itemAmountInputs, '']);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
    setItemAmountInputs(itemAmountInputs.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: 'description' | 'amount', value: string) => {
    if (field === 'description') {
      const next = [...items];
      next[index] = { ...next[index], description: value };
      setItems(next);
    } else {
      const nextInputs = [...itemAmountInputs];
      nextInputs[index] = value;
      setItemAmountInputs(nextInputs);
      const next = [...items];
      next[index] = { ...next[index], amountCents: parseDollarsToCents(value) };
      setItems(next);
    }
  };

  const updateSplitAmount = (index: number, value: string) => {
    const nextInputs = [...splitAmountInputs];
    nextInputs[index] = value;
    setSplitAmountInputs(nextInputs);
    const next = [...splits];
    next[index] = { ...next[index], amountCents: parseDollarsToCents(value) };
    setSplits(next);
  };

  const handleEvenSplit = () => {
    if (!evenAmount) return;
    const totalCents = parseDollarsToCents(evenAmount);
    if (totalCents < 50) return;
    const perPerson = Math.ceil(totalCents / otherMembers.length);
    const newSplits = otherMembers.map((m) => ({
      userId: m.userId,
      amountCents: perPerson,
    }));
    setSplits(newSplits);
    const perPersonStr = (perPerson / 100).toFixed(2);
    setSplitAmountInputs(new Array(newSplits.length).fill(perPersonStr));
  };

  const totalCents =
    paymentMode === 'pay'
      ? parseDollarsToCents(payAmount)
      : requestMode === 'per_item'
        ? items.reduce((sum, i) => sum + i.amountCents, 0)
        : splits.reduce((sum, s) => sum + s.amountCents, 0);

  const canSubmit =
    title.trim().length > 0 &&
    totalCents >= 50 &&
    (paymentMode === 'pay'
      ? !!selectedRecipient
      : requestMode === 'per_item'
        ? items.some((i) => i.description.trim() && i.amountCents >= 50)
        : splits.some((s) => s.amountCents >= 50));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="full"
      placement="bottom"
      classNames={{
        base: 'max-h-[85vh] !rounded-b-none !mb-0',
        wrapper: 'items-end',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2">
          <div className="w-10 h-1 bg-default-300 rounded-full mx-auto" />
          <div className="flex items-center justify-between">
            <span className="text-lg">
              {paymentMode === 'request' ? 'Request Payment' : 'Send Payment'}
            </span>
            <div className="flex items-center gap-2 text-sm">
              <span
                className={paymentMode === 'request' ? 'text-primary font-medium' : 'text-default-400'}
              >
                Request
              </span>
              <Switch
                size="sm"
                isSelected={paymentMode === 'pay'}
                onValueChange={(v) => setPaymentMode(v ? 'pay' : 'request')}
              />
              <span
                className={paymentMode === 'pay' ? 'text-success font-medium' : 'text-default-400'}
              >
                Pay
              </span>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="overflow-y-auto pb-4">
          {/* Title */}
          <Input
            label="Title"
            placeholder={paymentMode === 'request' ? 'e.g., Dinner at Olive Garden' : 'e.g., Gas money for Jake'}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            classNames={{ inputWrapper: 'bg-default-200' }}
          />

          {paymentMode === 'pay' ? (
            /* ── Pay Mode ── */
            <div className="space-y-3">
              <p className="text-sm text-default-500">Select who to pay:</p>
              <div className="space-y-2">
                {otherMembers.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      selectedRecipient === member.userId
                        ? 'bg-success-50 border-2 border-success'
                        : 'bg-default-100 border-2 border-transparent'
                    }`}
                    onClick={() => setSelectedRecipient(member.userId)}
                  >
                    <Avatar
                      name={member.displayName?.charAt(0).toUpperCase() || '?'}
                      src={member.avatarUrl || undefined}
                      size="sm"
                    />
                    <span className="text-sm font-medium">
                      {member.displayName || 'Unknown'}
                    </span>
                    {selectedRecipient === member.userId && (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-success ml-auto">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              <Input
                label="Amount"
                placeholder="0.00"
                startContent={<span className="text-default-400">$</span>}
                type="number"
                min="0.50"
                step="0.01"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                classNames={{ inputWrapper: 'bg-default-200' }}
              />

              <Input
                label="Description (optional)"
                placeholder="e.g., For gas"
                value={payDescription}
                onChange={(e) => setPayDescription(e.target.value)}
                maxLength={200}
                classNames={{ inputWrapper: 'bg-default-200' }}
              />
            </div>
          ) : (
            /* ── Request Mode ── */
            <div className="space-y-3">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <Chip
                  variant={requestMode === 'per_item' ? 'solid' : 'bordered'}
                  color={requestMode === 'per_item' ? 'primary' : 'default'}
                  className="cursor-pointer"
                  onClick={() => setRequestMode('per_item')}
                >
                  Per Item
                </Chip>
                <Chip
                  variant={requestMode === 'per_person' ? 'solid' : 'bordered'}
                  color={requestMode === 'per_person' ? 'primary' : 'default'}
                  className="cursor-pointer"
                  onClick={() => {
                    if (requestMode !== 'per_person') handleSwitchToPerPerson();
                  }}
                >
                  Per Person
                </Chip>
              </div>

              {requestMode === 'per_item' ? (
                /* Per-item list */
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        maxLength={200}
                        size="sm"
                        classNames={{ inputWrapper: 'bg-default-200', base: 'flex-1' }}
                      />
                      <Input
                        placeholder="0.00"
                        startContent={<span className="text-default-400 text-xs">$</span>}
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={itemAmountInputs[i]}
                        onChange={(e) => updateItem(i, 'amount', e.target.value)}
                        size="sm"
                        classNames={{ inputWrapper: 'bg-default-200', base: 'w-24' }}
                      />
                      {items.length > 1 && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => removeItem(i)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  ))}
                  {items.length < 20 && (
                    <Button size="sm" variant="flat" onPress={addItem} className="w-full">
                      + Add item
                    </Button>
                  )}
                </div>
              ) : (
                /* Per-person splits */
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      size="sm"
                      isSelected={splitEvenly}
                      onValueChange={setSplitEvenly}
                    />
                    <span className="text-sm">Split evenly</span>
                  </div>

                  {splitEvenly && (
                    <div className="flex gap-2 items-end">
                      <Input
                        label="Total amount to split"
                        placeholder="0.00"
                        startContent={<span className="text-default-400">$</span>}
                        type="number"
                        min="0.50"
                        step="0.01"
                        value={evenAmount}
                        onChange={(e) => setEvenAmount(e.target.value)}
                        size="sm"
                        classNames={{ inputWrapper: 'bg-default-200', base: 'flex-1' }}
                      />
                      <Button size="sm" color="primary" variant="flat" onPress={handleEvenSplit}>
                        Split
                      </Button>
                    </div>
                  )}

                  <div className="space-y-2">
                    {otherMembers.map((member, i) => (
                      <div key={member.userId} className="flex items-center gap-3">
                        <Avatar
                          name={member.displayName?.charAt(0).toUpperCase() || '?'}
                          src={member.avatarUrl || undefined}
                          size="sm"
                          className="flex-shrink-0"
                        />
                        <span className="text-sm flex-1 truncate">
                          {member.displayName || 'Unknown'}
                        </span>
                        <Input
                          placeholder="0.00"
                          startContent={<span className="text-default-400 text-xs">$</span>}
                          type="number"
                          min="0.50"
                          step="0.01"
                          value={splitAmountInputs[i] || ''}
                          onChange={(e) => updateSplitAmount(i, e.target.value)}
                          size="sm"
                          classNames={{ inputWrapper: 'bg-default-200', base: 'w-24' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex-col gap-2">
          {totalCents > 0 && (
            <p className="text-sm text-default-500 text-center">
              Total: {formatCents(totalCents)}
            </p>
          )}
          <div className="flex gap-2 w-full">
            <Button variant="flat" onPress={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button
              color={paymentMode === 'pay' ? 'success' : 'primary'}
              onPress={handleSubmit}
              isLoading={isLoading}
              isDisabled={!canSubmit}
              className="flex-1"
            >
              {paymentMode === 'pay' ? 'Send Payment' : 'Request Payment'}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
