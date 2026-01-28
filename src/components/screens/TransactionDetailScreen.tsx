import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Hand, Clock, Check, X } from 'lucide-react';
import { Transaction } from '@/types/wallet';
import { formatCurrency } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface TransactionDetailScreenProps {
  transaction: Transaction;
  onBack: () => void;
}

const TransactionDetailScreen = ({ transaction, onBack }: TransactionDetailScreenProps) => {
  const { type, amount, status, description, recipient, sender, createdAt } = transaction;
  
  const person = type === 'send' || type === 'request' ? recipient : sender;
  
  const getIcon = () => {
    if (type === 'send') return ArrowUpRight;
    if (type === 'request') return Hand;
    return ArrowDownLeft;
  };

  const getStatusConfig = () => {
    switch (status) {
      case 'COMPLETED':
        return { icon: Check, label: 'Completed', color: 'text-primary', bg: 'bg-primary/20' };
      case 'PENDING_CONFIRMATION':
        return { icon: Clock, label: 'Pending', color: 'text-warning', bg: 'bg-warning/20' };
      case 'BLOCKED':
        return { icon: X, label: 'Blocked', color: 'text-muted-foreground', bg: 'bg-muted' };
      default:
        return { icon: Check, label: 'Unknown', color: 'text-muted-foreground', bg: 'bg-muted' };
    }
  };

  const TypeIcon = getIcon();
  const statusConfig = getStatusConfig();
  const StatusIcon = statusConfig.icon;
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('');

  return (
    <div className="screen-container animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Details</h1>
      </div>

      {/* Transaction Info */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
          {person ? (
            <span className="text-xl font-bold">{getInitials(person.name)}</span>
          ) : (
            <TypeIcon className="w-7 h-7" />
          )}
        </div>
        
        <p className="text-muted-foreground text-sm mb-1">
          {type === 'send' ? 'To' : type === 'receive' ? 'From' : 'Request from'}
        </p>
        <p className="text-xl font-semibold mb-6">{person?.name || 'Unknown'}</p>

        <p className={cn(
          'text-4xl font-bold mb-4',
          type === 'receive' && status === 'COMPLETED' ? 'text-primary' : ''
        )}>
          {type === 'receive' ? '+' : type === 'send' ? '-' : ''}{formatCurrency(amount)}
        </p>

        {/* Status Badge */}
        <div className={cn('inline-flex items-center gap-2 px-4 py-2 rounded-full', statusConfig.bg)}>
          <StatusIcon className={cn('w-4 h-4', statusConfig.color)} />
          <span className={cn('text-sm font-medium', statusConfig.color)}>
            {statusConfig.label}
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="card-subtle space-y-4">
        {description && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Note</span>
            <span className="font-medium">{description}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium">
            {createdAt.toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric',
              year: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Transaction ID</span>
          <span className="font-medium font-mono text-sm">{transaction.id}</span>
        </div>
      </div>

      {/* Blocked message */}
      {status === 'BLOCKED' && (
        <div className="mt-6 card-subtle bg-secondary/50">
          <p className="text-sm text-muted-foreground">
            This transfer was paused for your protection. Your money is safe. If you have questions, contact support.
          </p>
        </div>
      )}
    </div>
  );
};

export default TransactionDetailScreen;
