import { Avatar, Button, Chip, Spinner } from '@heroui/react';
import { PaymentData, PaymentItem } from '../../types/payments';

interface PaymentCardProps {
  paymentData: PaymentData;
  isCreator: boolean;
  currentUserId: string;
  onPay?: (paymentId: string, itemId: string) => void;
  onCancel?: (paymentId: string) => void;
  isCheckoutLoading?: boolean;
  fullWidth?: boolean;
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ItemRow({
  item,
  paymentData,
  currentUserId,
  onPay,
  isCheckoutLoading,
}: {
  item: PaymentItem;
  paymentData: PaymentData;
  currentUserId: string;
  onPay?: (paymentId: string, itemId: string) => void;
  isCheckoutLoading?: boolean;
}) {
  const isPaid = item.status === 'paid';
  const isProcessing = item.status === 'processing';
  const isUnpaid = item.status === 'unpaid';
  const isActive = paymentData.status === 'active';

  // Determine if current user can pay this item
  const canPay =
    isUnpaid &&
    isActive &&
    (paymentData.mode === 'per_item' ||
      (paymentData.mode === 'per_person' && item.assignedUserId === currentUserId) ||
      (paymentData.mode === 'direct' && item.assignedUserId === currentUserId));

  return (
    <div
      className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
        isPaid ? 'bg-success-50/50' : isProcessing ? 'bg-warning-50/50' : 'bg-default-50'
      }`}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {isPaid ? (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 text-success">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : isProcessing ? (
          <Spinner size="sm" color="warning" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-default-300" />
        )}
      </div>

      {/* Description and assigned user */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${isPaid ? 'line-through text-default-400' : ''}`}>
          {paymentData.mode === 'per_person' && item.assignedUserName
            ? item.assignedUserName
            : item.description}
        </p>
        {isPaid && item.paidByName && (
          <div className="flex items-center gap-1 mt-0.5">
            <Avatar
              name={item.paidByName.charAt(0).toUpperCase()}
              src={item.paidByAvatarUrl || undefined}
              className="w-4 h-4 text-[8px]"
            />
            <span className="text-[10px] text-success">
              Paid by {item.paidBy === currentUserId ? 'you' : item.paidByName}
              {item.paidAt && ` · ${formatDate(item.paidAt)}`}
            </span>
          </div>
        )}
        {isProcessing && (
          <span className="text-[10px] text-warning">Payment in progress...</span>
        )}
      </div>

      {/* Amount */}
      <span
        className={`text-sm font-semibold flex-shrink-0 ${
          isPaid ? 'text-success' : 'text-default-600'
        }`}
      >
        {formatCents(item.amountCents)}
      </span>

      {/* Pay button */}
      {canPay && onPay && (
        <Button
          size="sm"
          color="success"
          variant="flat"
          onPress={() => onPay(paymentData.id, item.id)}
          isLoading={isCheckoutLoading}
          className="flex-shrink-0"
        >
          Pay
        </Button>
      )}
    </div>
  );
}

export function PaymentCard({
  paymentData,
  isCreator,
  currentUserId,
  onPay,
  onCancel,
  isCheckoutLoading,
  fullWidth,
}: PaymentCardProps) {
  const paidCount = paymentData.items.filter((i) => i.status === 'paid').length;
  const totalCount = paymentData.items.length;
  const paidAmountCents = paymentData.items
    .filter((i) => i.status === 'paid')
    .reduce((sum, i) => sum + i.amountCents, 0);

  const isCancelled = paymentData.status === 'cancelled';
  const isCompleted = paymentData.status === 'completed';

  const modeLabel =
    paymentData.mode === 'direct'
      ? 'Direct Payment'
      : paymentData.mode === 'per_person'
        ? 'Split Request'
        : 'Payment Request';

  const chipColor = isCancelled
    ? 'danger'
    : isCompleted
      ? 'success'
      : 'warning';

  return (
    <div className={fullWidth ? 'w-full' : 'max-w-sm'}>
      <div className="bg-default-100 rounded-2xl overflow-hidden border border-default-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-default-200">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold truncate flex-1">
              {paymentData.title}
            </h3>
            <Chip size="sm" variant="flat" color={chipColor} className="ml-2">
              {modeLabel}
            </Chip>
          </div>

          {paymentData.mode === 'direct' && paymentData.recipientName && (
            <p className="text-xs text-default-400">
              To: {paymentData.recipientName}
            </p>
          )}

          {/* Progress bar */}
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-default-400 mb-1">
              <span>
                {paidCount}/{totalCount} paid
              </span>
              <span>
                {formatCents(paidAmountCents)} / {formatCents(paymentData.totalAmountCents)}
              </span>
            </div>
            <div className="h-1.5 bg-default-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{
                  width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Items list */}
        <div className="px-3 py-2 space-y-1.5">
          {paymentData.items.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              paymentData={paymentData}
              currentUserId={currentUserId}
              onPay={onPay}
              isCheckoutLoading={isCheckoutLoading}
            />
          ))}
        </div>

        {/* Footer */}
        {(isCancelled || isCompleted || (isCreator && paymentData.status === 'active')) && (
          <div className="px-4 py-2.5 border-t border-default-200">
            {isCancelled && (
              <p className="text-xs text-danger text-center">This request was cancelled</p>
            )}
            {isCompleted && (
              <p className="text-xs text-success text-center">All payments completed</p>
            )}
            {isCreator && paymentData.status === 'active' && onCancel && (
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="w-full"
                onPress={() => onCancel(paymentData.id)}
              >
                Cancel Request
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
