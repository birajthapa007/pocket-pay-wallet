import React from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Building, 
  ShieldAlert, 
  ShieldCheck, 
  Clock,
  Check,
  HandCoins,
  ChevronRight
} from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency, formatRelativeTime } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionItemProps {
  transaction: Transaction;
  onClick?: () => void;
}

const TransactionItem = React.forwardRef<HTMLDivElement, TransactionItemProps>(
  ({ transaction, onClick }, ref) => {
    const { type, amount, status, description, recipient, sender, createdAt } = transaction;

    const getIcon = () => {
      if (type === 'send') return ArrowUpRight;
      if (type === 'receive') return ArrowDownLeft;
      if (type === 'request') return HandCoins;
      return Building;
    };

    const getIconStyle = () => {
      // Status takes priority for visual treatment
      if (status === 'blocked') return 'bg-destructive-soft text-destructive';
      if (status === 'pending') return 'bg-warning-soft text-warning';
      // Then type-based styling
      if (type === 'send') return 'bg-secondary text-foreground';
      if (type === 'receive') return 'bg-success-soft text-success';
      if (type === 'request') return 'bg-info-soft text-info';
      return 'bg-secondary text-foreground';
    };

    const getAmountStyle = () => {
      if (status === 'blocked') return 'text-destructive line-through';
      if (status === 'pending') return 'text-warning';
      if (type === 'receive') return 'text-success';
      return 'text-foreground';
    };

    const getStatusIndicator = () => {
      if (status === 'completed') {
        return (
          <div className="w-4 h-4 rounded-full bg-success flex items-center justify-center">
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        );
      }
      if (status === 'pending') {
        return (
          <div className="w-4 h-4 rounded-full bg-warning flex items-center justify-center">
            <Clock className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        );
      }
      if (status === 'blocked') {
        return (
          <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
            <ShieldAlert className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </div>
        );
      }
      return null;
    };

    const getStatusBadge = () => {
      if (status === 'completed') return null;
      
      if (status === 'pending') {
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning-soft text-warning font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      }
      
      if (status === 'blocked') {
        return (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive-soft text-destructive font-medium flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            Blocked
          </span>
        );
      }
      return null;
    };

    const Icon = getIcon();
    const personName = type === 'send' ? recipient?.name : sender?.name;

    return (
      <div 
        ref={ref}
        onClick={onClick}
        className={cn(
          "transaction-item relative",
          onClick && "cursor-pointer active:scale-[0.98]",
          status === 'blocked' && "border-destructive/20",
          status === 'pending' && "border-warning/20"
        )}
      >
        {/* Icon with status indicator */}
        <div className="relative">
          <div className={cn('w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0', getIconStyle())}>
            <Icon className="w-5 h-5" />
          </div>
          {/* Status indicator positioned at bottom-right of icon */}
          <div className="absolute -bottom-0.5 -right-0.5">
            {getStatusIndicator()}
          </div>
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

        <div className="text-right flex-shrink-0 flex items-center gap-2">
          <div>
            <p className={cn('font-semibold', getAmountStyle())}>
              {type === 'receive' ? '+' : '-'}{formatCurrency(amount)}
            </p>
            {personName && (
              <p className="text-xs text-muted-foreground">
                {formatRelativeTime(createdAt)}
              </p>
            )}
          </div>
          {onClick && (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </div>
    );
  }
);

TransactionItem.displayName = 'TransactionItem';

export default TransactionItem;
