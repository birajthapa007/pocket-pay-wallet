import { ArrowUpRight, ArrowDownLeft, Building, AlertTriangle } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
}

const TransactionItem = ({ transaction }: TransactionItemProps) => {
  const { type, amount, status, description, recipient, sender, createdAt } = transaction;

  const getIcon = () => {
    if (type === 'send') return ArrowUpRight;
    if (type === 'receive') return ArrowDownLeft;
    return Building;
  };

  const getIconStyle = () => {
    if (status === 'blocked') return 'bg-destructive-soft text-destructive';
    if (type === 'send') return 'bg-secondary text-foreground';
    if (type === 'receive') return 'bg-success-soft text-success';
    return 'bg-secondary text-foreground';
  };

  const getAmountStyle = () => {
    if (status === 'blocked') return 'text-destructive line-through';
    if (type === 'receive') return 'text-success';
    return 'text-foreground';
  };

  const getStatusBadge = () => {
    if (status === 'completed') return null;
    if (status === 'pending') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full status-pending font-medium">
          Pending
        </span>
      );
    }
    if (status === 'blocked') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full status-blocked font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Blocked
        </span>
      );
    }
    return null;
  };

  const Icon = getIcon();
  const personName = type === 'send' ? recipient?.name : sender?.name;

  return (
    <div className="transaction-item">
      <div className={cn('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', getIconStyle())}>
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium truncate text-foreground">
            {personName || description}
          </p>
          {getStatusBadge()}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {personName ? description : formatRelativeTime(createdAt)}
        </p>
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn('font-semibold', getAmountStyle())}>
          {type === 'receive' ? '+' : '-'}{formatCurrency(amount)}
        </p>
        {personName && (
          <p className="text-xs text-muted-foreground">
            {formatRelativeTime(createdAt)}
          </p>
        )}
      </div>
    </div>
  );
};

export default TransactionItem;
