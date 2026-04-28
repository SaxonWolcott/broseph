import { useRef, useState } from 'react';
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
  Spinner,
} from '@heroui/react';
import { GroupMember } from '../../types/groups';
import { ExtractedReceipt } from '../../types/payments';
import { useExtractReceipt } from '../../hooks/useExtractReceipt';

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
    note?: string;
    extractedReceipt?: ExtractedReceipt;
    mode: 'per_item' | 'per_person' | 'direct';
    recipientId?: string;
    items: { description: string; amountCents: number; assignedUserId?: string }[];
  }) => void;
  isLoading?: boolean;
  groupId: string;
  members: GroupMember[];
  currentUserId: string;
}

const AUTO_DISTRIBUTE_NOTE = 'Tax and tip distributed across items';

function buildItemsFromReceipt(
  receipt: ExtractedReceipt,
  distributed: boolean,
): PaymentItem[] {
  const food = receipt.items;
  const tax = receipt.taxCents ?? 0;
  const tip = receipt.tipCents ?? 0;
  const extras = tax + tip;

  if (!distributed || extras === 0 || food.length === 0) {
    const items: PaymentItem[] = food.map((i) => ({
      description: i.description,
      amountCents: i.amountCents,
    }));
    if (tax > 0) items.push({ description: 'Tax', amountCents: tax });
    if (tip > 0) items.push({ description: 'Tip', amountCents: tip });
    return items;
  }

  const foodTotal = food.reduce((sum, i) => sum + i.amountCents, 0);
  if (foodTotal === 0) {
    return food.map((i) => ({ description: i.description, amountCents: i.amountCents }));
  }

  const totalCents = foodTotal + extras;
  let remaining = totalCents;
  return food.map((i, idx) => {
    if (idx === food.length - 1) {
      return { description: i.description, amountCents: remaining };
    }
    const share = Math.round((i.amountCents / foodTotal) * totalCents);
    remaining -= share;
    return { description: i.description, amountCents: share };
  });
}

function itemsToAmountInputs(items: PaymentItem[]): string[] {
  return items.map((i) => (i.amountCents > 0 ? (i.amountCents / 100).toFixed(2) : ''));
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
  groupId,
  members,
  currentUserId,
}: CreatePaymentModalProps) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('request');
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

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

  // Receipt extraction state
  const [extractedReceipt, setExtractedReceipt] = useState<ExtractedReceipt | null>(null);
  const [isDistributed, setIsDistributed] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const extractReceipt = useExtractReceipt();

  const otherMembers = members.filter((m) => m.userId !== currentUserId);

  const resetForm = () => {
    setPaymentMode('request');
    setTitle('');
    setNote('');
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
    setExtractedReceipt(null);
    setIsDistributed(false);
    setExtractError(null);
    extractReceipt.reset();
  };

  const handleScanClick = () => {
    receiptInputRef.current?.click();
  };

  const handleReceiptSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (e.target) e.target.value = '';
    if (!file) return;

    setExtractError(null);
    try {
      const receipt = await extractReceipt.mutateAsync({ groupId, file });
      if (receipt.parseStatus === 'not_a_receipt') {
        setExtractError("That doesn't look like a receipt. Try a clearer photo.");
        return;
      }
      if (receipt.parseStatus === 'illegible' && receipt.items.length === 0) {
        setExtractError('Could not read the receipt. Try a clearer photo.');
        return;
      }

      setPaymentMode('request');
      setRequestMode('per_item');
      setExtractedReceipt(receipt);
      setIsDistributed(false);
      setTitle(receipt.title);

      const newItems = buildItemsFromReceipt(receipt, false);
      const itemsForState = newItems.length > 0 ? newItems : [{ description: '', amountCents: 0 }];
      setItems(itemsForState);
      setItemAmountInputs(itemsToAmountInputs(itemsForState));
    } catch (err) {
      setExtractError(err instanceof Error ? err.message : 'Failed to extract receipt');
    }
  };

  const handleToggleDistribute = () => {
    if (!extractedReceipt) return;
    const next = !isDistributed;
    const newItems = buildItemsFromReceipt(extractedReceipt, next);
    setItems(newItems);
    setItemAmountInputs(itemsToAmountInputs(newItems));
    setIsDistributed(next);

    if (next) {
      if (!note.trim()) setNote(AUTO_DISTRIBUTE_NOTE);
    } else {
      if (note === AUTO_DISTRIBUTE_NOTE) setNote('');
    }
  };

  const hasTaxOrTip =
    !!extractedReceipt &&
    ((extractedReceipt.taxCents ?? 0) > 0 || (extractedReceipt.tipCents ?? 0) > 0) &&
    extractedReceipt.items.length > 0;

  const handleCollapseToTotal = () => {
    if (!extractedReceipt) return;
    const description =
      extractedReceipt.merchantName || extractedReceipt.title || 'Receipt';
    const newItems = [
      { description, amountCents: extractedReceipt.totalAmountCents },
    ];
    setItems(newItems);
    setItemAmountInputs(itemsToAmountInputs(newItems));
    setIsDistributed(false);
    if (note === AUTO_DISTRIBUTE_NOTE) setNote('');
  };

  const handleSwitchToSplitEven = () => {
    if (!extractedReceipt || otherMembers.length === 0) return;
    setRequestMode('per_person');
    setSplitEvenly(true);

    const totalCents = extractedReceipt.totalAmountCents;
    setEvenAmount((totalCents / 100).toFixed(2));

    const perPerson = Math.ceil(totalCents / otherMembers.length);
    const newSplits = otherMembers.map((m) => ({
      userId: m.userId,
      amountCents: perPerson,
    }));
    setSplits(newSplits);
    const perPersonStr = (perPerson / 100).toFixed(2);
    setSplitAmountInputs(new Array(newSplits.length).fill(perPersonStr));
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

    const trimmedNote = note.trim();
    const noteField = trimmedNote ? { note: trimmedNote } : {};

    if (paymentMode === 'pay') {
      if (!selectedRecipient || !payAmount) return;
      const cents = parseDollarsToCents(payAmount);
      if (cents < 50) return;

      onSubmit({
        title: title.trim(),
        ...noteField,
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
        ...noteField,
        ...(extractedReceipt ? { extractedReceipt } : {}),
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
        ...noteField,
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

          {/* Note */}
          <Input
            label="Note (optional)"
            placeholder="e.g., Tax and tip distributed across items"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
            classNames={{ inputWrapper: 'bg-default-200' }}
          />

          {/* Hidden receipt file input */}
          <input
            ref={receiptInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            capture="environment"
            className="hidden"
            onChange={handleReceiptSelect}
          />

          {/* Scan Receipt button (request mode only) */}
          {paymentMode === 'request' && (
            <Button
              variant="flat"
              color="primary"
              size="sm"
              onPress={handleScanClick}
              isDisabled={extractReceipt.isPending}
              startContent={
                extractReceipt.isPending ? (
                  <Spinner size="sm" color="primary" />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316ZM16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
                    />
                  </svg>
                )
              }
            >
              {extractReceipt.isPending
                ? 'Reading receipt...'
                : extractedReceipt
                  ? 'Re-scan receipt'
                  : 'Scan receipt'}
            </Button>
          )}

          {extractError && (
            <p className="text-xs text-danger">{extractError}</p>
          )}

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
                  {extractedReceipt &&
                    extractedReceipt.totalAmountCents > 0 &&
                    items.reduce((s, i) => s + i.amountCents, 0) <
                      extractedReceipt.totalAmountCents * 0.5 && (
                      <div className="rounded-lg border border-warning-200 bg-warning-50/40 p-3 space-y-2">
                        <p className="text-xs text-warning-700">
                          Items couldn't be priced individually, but the receipt total is{' '}
                          <span className="font-semibold">
                            {formatCents(extractedReceipt.totalAmountCents)}
                          </span>
                          .
                        </p>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            size="sm"
                            variant="flat"
                            color="warning"
                            onPress={handleCollapseToTotal}
                            className="flex-1"
                          >
                            Use total as one item
                          </Button>
                          {otherMembers.length > 0 && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="warning"
                              onPress={handleSwitchToSplitEven}
                              className="flex-1"
                            >
                              Split evenly across members
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
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
                  {hasTaxOrTip && (
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      onPress={handleToggleDistribute}
                      className="w-full"
                    >
                      {isDistributed
                        ? 'Keep tax & tip as separate items'
                        : 'Distribute tax & tip across items'}
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
