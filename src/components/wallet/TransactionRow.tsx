import { ArrowUpRight, ArrowDownLeft, Hand } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionRowProps {
  transaction: Transaction;
  onClick: () => void;
}

const TransactionRow = ({ transaction, onClick }: TransactionRowProps) => {
  const { type, amount, status, recipient, sender, createdAt } = transaction;

  const person = type === 'send' || type === 'request' ? recipient : sender;
  
  const getIcon = () => {
    if (type === 'send') return ArrowUpRight;
    if (type === 'request') return Hand;
    return ArrowDownLeft;
  };

  const getAmountPrefix = () => {
    if (type === 'receive') return '+';
    if (type === 'send') return '-';
    return '';
  };

  const getAmountColor = () => {
    if (status === 'BLOCKED') return 'text-muted-foreground line-through';
    if (type === 'receive') return 'text-primary';
    return 'text-foreground';
  };

  const getStatusLabel = () => {
    if (status === 'PENDING_CONFIRMATION') return 'Pending';
    if (status === 'BLOCKED') return 'Blocked';
    return null;
  };

  const Icon = getIcon();

  return (
    <button onClick={onClick} className="transaction-item w-full text-left">
      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{person?.name || 'Unknown'}</p>
        <p className="text-sm text-muted-foreground">
          {formatRelativeTime(createdAt)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn('font-semibold', getAmountColor())}>
          {getAmountPrefix()}{formatCurrency(amount)}
        </p>
        {getStatusLabel() && (
          <span className={cn(
            'status-pill',
            status === 'PENDING_CONFIRMATION' && 'status-pending',
            status === 'BLOCKED' && 'status-blocked'
          )}>
            {getStatusLabel()}
          </span>
        )}
      </div>
    </button>
  );
};

export default TransactionRow;
