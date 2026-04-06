import { useState } from 'react';
import { Spinner } from '@heroui/react';
import { useActivePayments } from '../../hooks/useActivePayments';
import { PaymentCard } from './PaymentCard';
import { PaymentData } from '../../types/payments';

interface ActivePaymentsBannerProps {
  groupId: string;
  currentUserId: string;
  activeCount: number;
  attentionCount: number;
  onPay?: (paymentId: string, itemId: string) => void;
  onCancel?: (paymentId: string) => void;
  isCheckoutLoading?: boolean;
}

function needsAttention(payment: PaymentData, userId: string): boolean {
  return payment.items.some(
    (i) =>
      i.assignedUserId === userId &&
      (i.status === 'unpaid' || i.status === 'failed'),
  );
}

export function ActivePaymentsBanner({
  groupId,
  currentUserId,
  activeCount,
  attentionCount,
  onPay,
  onCancel,
  isCheckoutLoading,
}: ActivePaymentsBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Only fetch full details when expanded
  const { data: payments, isLoading } = useActivePayments(isExpanded ? groupId : undefined);

  if (activeCount === 0) return null;

  // Sort: needs-attention first, then by creation date descending
  const sorted = payments
    ? [...payments].sort((a, b) => {
        const aNeeds = needsAttention(a, currentUserId) ? 0 : 1;
        const bNeeds = needsAttention(b, currentUserId) ? 0 : 1;
        if (aNeeds !== bNeeds) return aNeeds - bNeeds;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
    : [];

  return (
    <div className="border-b border-divider bg-warning-50/30">
      {/* Collapsed row — uses lightweight counts */}
      <button
        type="button"
        className="w-full flex items-center gap-2 px-4 py-2 text-left"
        onClick={() => setIsExpanded((v) => !v)}
      >
        {/* Dollar icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-4 h-4 text-warning flex-shrink-0"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>

        <span className="flex-1 text-sm text-default-500 truncate">
          {activeCount} active payment{activeCount !== 1 ? 's' : ''}
        </span>

        {/* Needs attention badge */}
        {attentionCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-danger font-medium flex-shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-3.5 h-3.5"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
            Needs attention: {attentionCount}
          </span>
        )}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-4 h-4 text-default-400 flex-shrink-0 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Expanded scrollable list — full PaymentCard components */}
      {isExpanded && (
        <div className="px-4 pb-3 max-h-[70vh] overflow-y-auto space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-3">
              <Spinner size="sm" />
            </div>
          ) : sorted.length === 0 ? (
            <p className="text-xs text-default-400 text-center py-2">No active payments</p>
          ) : (
            sorted.map((payment) => (
              <PaymentCard
                key={payment.id}
                paymentData={payment}
                isCreator={payment.creatorId === currentUserId}
                currentUserId={currentUserId}
                onPay={onPay}
                onCancel={onCancel}
                isCheckoutLoading={isCheckoutLoading}
                fullWidth
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
